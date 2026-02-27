import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertScraperRunSchema, insertSystemSettingSchema } from "@shared/schema";
import OpenAI from "openai";
import { spawn } from "child_process";
import path from "path";
import axios from "axios";
import { log } from "./index";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

const RAG_KEYWORDS = [
  'fedex', 'api', 'shipment', 'tracking', 'label', 'rate', 'oauth',
  'endpoint', 'shipping', 'address validation', 'webhook', 'authentication'
];

function shouldUseRAG(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const matched = RAG_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
  if (matched.length > 0) {
    log(`[router] RAG path — matched keywords: ${matched.join(', ')}`, 'chat');
  } else {
    log(`[router] OpenAI path — no RAG keywords found`, 'chat');
  }
  return matched.length > 0;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Chat endpoint with hybrid routing
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversationId, pageUrl, pageText } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Determine which model to use
      const useRAG = shouldUseRAG(message);
      let answer: string;
      let sources: string[] = [];
      let modelUsed: string;

      if (useRAG) {
        log(`[rag] Sending to Python backend at ${PYTHON_BACKEND_URL}/chat`, 'chat');
        try {
          const response = await axios.post(`${PYTHON_BACKEND_URL}/chat`, {
            message,
            page_url: pageUrl,
            page_text: pageText,
          }, { timeout: 120000 });
          
          answer = response.data.answer;
          sources = response.data.sources || [];
          modelUsed = 'ollama-rag';
          log(`[rag] Success — answer length: ${answer.length}, sources: ${sources.length}`, 'chat');
        } catch (ragError: any) {
          const ragReason = ragError?.code || ragError?.message || 'unknown';
          log(`[rag] FAILED — reason: ${ragReason}`, 'chat');
          console.error('RAG backend error details:', {
            code: ragError?.code,
            message: ragError?.message,
            status: ragError?.response?.status,
            data: ragError?.response?.data,
          });
          throw new Error(`RAG backend unavailable (${ragReason}). Make sure the Python backend and Ollama are running.`);
        }
      } else {
        log(`[openai] Sending to OpenAI GPT-4o-mini`, 'chat');
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful coding assistant. Be concise and professional." },
            { role: "user", content: message }
          ],
          temperature: 0.7,
        });
        answer = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
        modelUsed = 'openai';
        log(`[openai] Success — answer length: ${answer.length}`, 'chat');
      }

      // Store conversation
      let convId = conversationId;
      if (!convId) {
        const conv = await storage.createConversation({ userId: null });
        convId = conv.id;
      }

      await storage.createMessage({
        conversationId: convId,
        role: 'user',
        content: message,
        sources: null,
        modelUsed: null,
      });

      await storage.createMessage({
        conversationId: convId,
        role: 'assistant',
        content: answer,
        sources: sources.length > 0 ? sources : null,
        modelUsed,
      });

      res.json({
        answer,
        sources,
        conversationId: convId,
        modelUsed,
      });
    } catch (error: any) {
      console.error('Chat error:', error);

      let errorMessage = "Something went wrong. Please try again.";
      let errorType = "unknown";
      let statusCode = 500;

      if (error?.message?.includes('RAG backend unavailable')) {
        errorMessage = error.message;
        errorType = "rag_unavailable";
        statusCode = 503;
      } else if (error?.code === 'insufficient_quota' || error?.error?.code === 'insufficient_quota') {
        errorMessage = "The OpenAI API quota has been exceeded. Try asking a FedEx-specific question instead, which uses the local AI.";
        errorType = "quota_exceeded";
        statusCode = 503;
      } else if (error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREFUSED') {
        errorMessage = "Unable to connect to the AI backend. Please make sure all services are running.";
        errorType = "rag_unavailable";
        statusCode = 503;
      } else if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') {
        errorMessage = "The request timed out. The AI service may be overloaded — please try again in a moment.";
        errorType = "timeout";
        statusCode = 504;
      } else if (error?.status === 401 || error?.error?.code === 'invalid_api_key') {
        errorMessage = "The OpenAI API key is invalid or missing. Please check your configuration.";
        errorType = "auth_error";
        statusCode = 401;
      } else if (error?.status === 429 || error?.error?.type === 'rate_limit_exceeded') {
        errorMessage = "Too many requests. Please wait a moment before sending another message.";
        errorType = "rate_limited";
        statusCode = 429;
      } else if (error?.routine === 'parserOpenTable' || error?.code === '42P01') {
        errorMessage = "Database tables have not been set up yet. Run 'npm run db:push' to create them.";
        errorType = "database_error";
        statusCode = 500;
      }

      res.status(statusCode).json({ error: errorMessage, errorType });
    }
  });

  // Get conversation history
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const messages = await storage.getMessagesByConversation(req.params.id);
      res.json({ messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Scraper: Run
  app.post("/api/scraper/run", async (req, res) => {
    try {
      const run = await storage.createScraperRun({ status: 'running' });
      
      const pythonPath = process.env.PYTHON_PATH || 'python3';
      const scriptPath = path.join(process.cwd(), 'backend_repo', 'apps', 'ingest', 'ingest.py');
      
      const scraperProcess = spawn(pythonPath, [scriptPath], {
        env: { ...process.env, PERSIST_DIR: process.env.VECTOR_STORE_PATH || './vector_store/chroma_fedex' }
      });

      let stdout = '';
      let stderr = '';

      scraperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('[Scraper]', data.toString());
      });

      scraperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('[Scraper Error]', data.toString());
      });

      scraperProcess.on('close', async (code) => {
        if (code === 0) {
          const docsMatch = stdout.match(/Loaded (\d+) pages/);
          const chunksMatch = stdout.match(/Created (\d+) chunks/);
          
          await storage.updateScraperRun(run.id, {
            status: 'completed',
            documentsFound: docsMatch ? parseInt(docsMatch[1]) : null,
            chunksCreated: chunksMatch ? parseInt(chunksMatch[1]) : null,
            completedAt: new Date(),
          });
        } else {
          await storage.updateScraperRun(run.id, {
            status: 'failed',
            errorMessage: stderr || 'Process exited with non-zero code',
            completedAt: new Date(),
          });
        }
      });

      res.json({ runId: run.id, status: 'running' });
    } catch (error) {
      console.error('Scraper run error:', error);
      res.status(500).json({ error: "Failed to start scraper" });
    }
  });

  // Scraper: Get status
  app.get("/api/scraper/status", async (req, res) => {
    try {
      const latestRun = await storage.getLatestScraperRun();
      res.json(latestRun || { status: 'never_run' });
    } catch (error) {
      console.error('Get scraper status error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Scraper: Get history
  app.get("/api/scraper/runs", async (req, res) => {
    try {
      const runs = await storage.getScraperRuns(20);
      res.json({ runs });
    } catch (error) {
      console.error('Get scraper runs error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Settings: Get
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json(setting || { key: req.params.key, value: null });
    } catch (error) {
      console.error('Get setting error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Settings: Set
  app.post("/api/settings", async (req, res) => {
    try {
      const validated = insertSystemSettingSchema.parse(req.body);
      const setting = await storage.setSetting(validated);
      res.json(setting);
    } catch (error) {
      console.error('Set setting error:', error);
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
