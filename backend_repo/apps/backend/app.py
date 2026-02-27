# app.py
import os
import logging
import requests
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag")

PERSIST_DIR = os.getenv("PERSIST_DIR", "./vector_store/chroma_fedex")
EMBED_MODEL = "nomic-embed-text"
OLLAMA_URL = "http://localhost:11434/api/generate"
RELEVANCE_THRESHOLD = 0.3
CONTEXT_BUDGET = 6000

embeddings = OllamaEmbeddings(model=EMBED_MODEL)
db = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)

app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)

class ChatRequest(BaseModel):
        message: str
        page_url: Optional[str] = None
        page_text: Optional[str] = None

class RetrieveRequest(BaseModel):
        message: str
        k: int = 8

SYSTEM_PROMPT = (
        "You are a FedEx Developer API assistant. Your ONLY job is to answer questions "
        "using the documentation context provided below.\n\n"
        "STRICT RULES:\n"
        "1. ONLY use information from the provided context. Do NOT invent or fabricate "
        "any API endpoints, URLs, method names, parameter names, or code examples.\n"
        "2. If the context does not contain enough information to fully answer the question, "
        "say: \"Based on the available documentation, I don't have complete information about this. "
        "Please check the FedEx Developer Portal for the most up-to-date details.\"\n"
        "3. ONLY cite source URLs that appear in the [Source] tags below. Never invent URLs.\n"
        "4. When listing parameters or fields, only list ones explicitly mentioned in the context.\n"
        "5. Do NOT generate sample code unless the context contains code examples. "
        "Instead, describe the API structure and point to the documentation.\n"
        "6. Be precise and concise. If you're unsure about any detail, say so.\n\n"
)

def build_prompt(question: str, contexts: list, page_url: Optional[str], page_text: Optional[str]) -> str:
        ctx_blocks = []
        total = 0
        for c in contexts:
                url = c.metadata.get("source", "unknown")
                txt = c.page_content.strip()
                if total + len(txt) > CONTEXT_BUDGET:
                        txt = txt[:CONTEXT_BUDGET - total]
                ctx_blocks.append(f"[Source: {url}]\n{txt}")
                total += len(txt)
                if total >= CONTEXT_BUDGET:
                        break

        page_hint = ""
        if page_text:
                trimmed = page_text.strip().replace("\r", "").replace("\t", " ")
                page_hint = f"\n[CurrentPage: {page_url}]\n{trimmed[:1500]}"

        context = "\n\n---\n".join(ctx_blocks)

        if not ctx_blocks:
                context = "(No relevant documentation was found for this query.)"

        return (
                f"{SYSTEM_PROMPT}"
                f"DOCUMENTATION CONTEXT:\n{context}{page_hint}\n\n"
                f"USER QUESTION: {question}\n\n"
                f"ANSWER (using only the context above):"
        )

def retrieve(question: str, page_url: Optional[str], k: int = 8) -> list:
        logger.info(f"[retrieve] query: {question}")

        try:
                scored_hits = db.similarity_search_with_relevance_scores(question, k=k)
        except Exception as e:
                logger.warning(f"[retrieve] scored search failed ({e}), falling back to basic search")
                hits = db.similarity_search(question, k=k)
                for h in hits:
                        logger.info(f"  chunk: score=N/A src={h.metadata.get('source', '?')[:80]} text={h.page_content[:80]}...")
                return hits

        logger.info(f"[retrieve] got {len(scored_hits)} results")
        filtered = []
        for doc, score in scored_hits:
                src = doc.metadata.get("source", "?")
                logger.info(f"  chunk: score={score:.3f} src={src[:80]} text={doc.page_content[:80]}...")
                if score >= RELEVANCE_THRESHOLD:
                        filtered.append(doc)
                else:
                        logger.info(f"  -> filtered out (below threshold {RELEVANCE_THRESHOLD})")

        if not filtered:
                logger.warning("[retrieve] all chunks below threshold, returning top 3 anyway")
                filtered = [doc for doc, _ in scored_hits[:3]]

        try:
                mmr_hits = db.max_marginal_relevance_search(question, k=min(k, len(filtered)), fetch_k=k * 2)
                logger.info(f"[retrieve] MMR returned {len(mmr_hits)} diverse results")

                mmr_sources = {h.page_content[:100] for h in mmr_hits}
                for f in filtered:
                        if f.page_content[:100] not in mmr_sources:
                                mmr_hits.append(f)

                if page_url:
                        for h in mmr_hits:
                                if page_url in (h.metadata.get("source") or ""):
                                        mmr_hits.remove(h)
                                        mmr_hits.insert(0, h)
                                        break

                return mmr_hits
        except Exception as e:
                logger.warning(f"[retrieve] MMR failed ({e}), using filtered results")
                return filtered

def call_ollama(prompt: str, model: str = "llama3", temperature: float = 0.1) -> str:
        payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": temperature}
        }
        r = requests.post(OLLAMA_URL, json=payload, timeout=120)
        r.raise_for_status()
        data = r.json()
        return data.get("response", "")

@app.post("/chat")
def chat(req: ChatRequest):
        logger.info(f"[chat] question: {req.message[:100]}")
        hits = retrieve(req.message, req.page_url, k=8)
        prompt = build_prompt(req.message, hits, req.page_url, req.page_text)
        logger.info(f"[chat] prompt length: {len(prompt)} chars, context chunks: {len(hits)}")
        answer = call_ollama(prompt)
        sources = list({h.metadata.get("source", "unknown") for h in hits})
        logger.info(f"[chat] answer length: {len(answer)}, sources: {sources}")
        return {"answer": answer, "sources": sources}

@app.post("/debug/retrieve")
def debug_retrieve(req: RetrieveRequest):
        logger.info(f"[debug] query: {req.message}")
        try:
                scored_hits = db.similarity_search_with_relevance_scores(req.message, k=req.k)
                results = []
                for doc, score in scored_hits:
                        results.append({
                                "score": round(score, 4),
                                "source": doc.metadata.get("source", "unknown"),
                                "content_preview": doc.page_content[:500],
                                "content_length": len(doc.page_content),
                        })
                return {
                        "query": req.message,
                        "total_results": len(results),
                        "threshold": RELEVANCE_THRESHOLD,
                        "results": results,
                }
        except Exception as e:
                hits = db.similarity_search(req.message, k=req.k)
                results = []
                for doc in hits:
                        results.append({
                                "score": None,
                                "source": doc.metadata.get("source", "unknown"),
                                "content_preview": doc.page_content[:500],
                                "content_length": len(doc.page_content),
                        })
                return {
                        "query": req.message,
                        "total_results": len(results),
                        "note": f"Scored search unavailable ({e}), used basic search",
                        "results": results,
                }

@app.get("/healthz")
def health():
        return {"ok": True}
