# app.py
import os
import requests
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

PERSIST_DIR = os.getenv("PERSIST_DIR", "./vector_store/chroma_fedex")
#PERSIST_DIR = "./chroma_fedex"
EMBED_MODEL = "nomic-embed-text"   # make sure you pulled this
OLLAMA_URL = "http://localhost:11434/api/generate"

# ---- Why: load the vector DB once at startup for speed
embeddings = OllamaEmbeddings(model=EMBED_MODEL)
db = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)

app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],               # dev-friendly; restrict later if you want
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)

class ChatRequest(BaseModel):
        message: str
        page_url: Optional[str] = None
        page_text: Optional[str] = None

def build_prompt(question: str, contexts: List[Dict[str, Any]], page_url: Optional[str], page_text: Optional[str]) -> str:
        # ---- Why: give the model grounded context + simple instructions
        header = (
                "You are a helpful FedEx Developer API assistant.\n"
                "Answer using the provided context. If unsure, say you don't know.\n"
                "Cite sources by URL at the end.\n\n"
        )
        # Use at most ~3000 chars of context to keep prompt small
        ctx_blocks = []
        total = 0
        for c in contexts:
                url = c.metadata.get("source", "unknown")
                txt = c.page_content.strip()
                if total + len(txt) > 3000:
                        txt = txt[:3000 - total]
                ctx_blocks.append(f"[Source] {url}\n{txt}")
                total += len(txt)
                if total >= 3000: break

        # Optional: include current page text as a hint (trim hard)
        page_hint = ""
        if page_text:
                trimmed = page_text.strip().replace("\r", "").replace("\t", " ")
                page_hint = f"\n[CurrentPage: {page_url}]\n{trimmed[:1500]}"

        context = "\n\n---\n".join(ctx_blocks)
        return f"{header}Context:\n{context}{page_hint}\n\nQuestion: {question}\nAnswer:"

def retrieve(question: str, page_url: Optional[str], k: int = 4):
        # ---- Why: basic retrieval first; you can switch to MMR later
        hits = db.similarity_search(question, k=k)
        # Optional: light re-rank boost for same-URL matches
        if page_url:
                for h in hits:
                        if page_url in (h.metadata.get("source") or ""):
                                h.score = (h.metadata.get("score") or 0) + 0.05
        return hits

def call_ollama(prompt: str, model: str = "llama3", temperature: float = 0.2) -> str:
        # ---- Why: use /api/generate for simple single-shot responses
        # (You can swap to /api/chat for multi-turn later)
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
        hits = retrieve(req.message, req.page_url, k=5)
        prompt = build_prompt(req.message, hits, req.page_url, req.page_text)
        answer = call_ollama(prompt)
        sources = list({h.metadata.get("source","unknown") for h in hits})
        return {"answer": answer, "sources": sources}

@app.get("/healthz")
def health():
        return {"ok": True}
