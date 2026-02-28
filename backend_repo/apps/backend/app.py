# app.py
import os
import re
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
CONTEXT_BUDGET = 10000

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

QUERY_EXPANSION_MAP = {
        r"\bship\b": "Ship API createShipment shipment",
        r"\bshipping\b": "Ship API createShipment shipment",
        r"\bground\b": "FEDEX_GROUND serviceType ground shipping",
        r"\bexpress\b": "FEDEX_EXPRESS serviceType express",
        r"\bovernight\b": "STANDARD_OVERNIGHT PRIORITY_OVERNIGHT serviceType",
        r"\b2\s*day\b": "FEDEX_2_DAY serviceType",
        r"\btrack\b": "Track API tracking trackByTrackingNumber",
        r"\btracking\b": "Track API tracking trackByTrackingNumber",
        r"\brate\b": "Rate API getRates rateRequest",
        r"\brates\b": "Rate API getRates rateRequest",
        r"\bquote\b": "Rate API getRates rateRequest quote",
        r"\blabel\b": "Ship API label createShipment labelSpecification",
        r"\bauth\b": "OAuth authentication client_credentials token",
        r"\boauth\b": "OAuth authentication client_credentials token",
        r"\baddress\b": "Address Validation API validateAddress",
        r"\bvalidat\w*\b": "Address Validation API validateAddress",
        r"\bwebhook\b": "Shipment Visibility Webhook notification",
        r"\bpickup\b": "pickup schedulePickup CONTACT_FEDEX_TO_SCHEDULE",
        r"\bweight\b": "weight units LB KG packageWeight",
        r"\bdimension\b": "dimensions length width height IN CM",
        r"\bpackage\b": "packageLineItems packageCount YOUR_PACKAGING",
        r"\brecipient\b": "recipient recipientAddress contact",
        r"\bshipper\b": "shipper shipperAddress contact accountNumber",
        r"\baccount\b": "accountNumber shippingChargesPayment",
        r"\brequired\b": "required mandatory fields parameters",
        r"\bparameter\b": "parameters request body fields schema",
        r"\bendpoint\b": "endpoint URL POST request path",
}

def expand_query(question: str) -> str:
        lower_q = question.lower()
        expansions = []
        for pattern, terms in QUERY_EXPANSION_MAP.items():
                if re.search(pattern, lower_q):
                        expansions.append(terms)
        if expansions:
                expanded = question + " " + " ".join(expansions)
                logger.info(f"[expand] original: {question}")
                logger.info(f"[expand] expanded: {expanded[:200]}...")
                return expanded
        return question

SYSTEM_PROMPT = (
        "You are a FedEx Developer API assistant. Your job is to answer questions "
        "using the documentation context provided below.\n\n"
        "RULES:\n"
        "1. Use ONLY information from the provided context. Do NOT invent or fabricate "
        "any API endpoints, URLs, method names, or parameter names.\n"
        "2. If the context contains API schemas, endpoint URLs, request/response structures, "
        "or field definitions, you SHOULD write example code that uses the EXACT field names, "
        "endpoint paths, and values from the context. Never invent field names.\n"
        "3. When writing code examples, use the exact JSON structure and field names from the "
        "documentation context. Include the actual API endpoint URL and HTTP method if available.\n"
        "4. ONLY cite source URLs that appear in the [Source] tags below. Never invent URLs.\n"
        "5. When listing parameters or fields, only list ones explicitly mentioned in the context.\n"
        "6. If the context does not contain enough information to answer, say so clearly and "
        "suggest checking the FedEx Developer Portal.\n"
        "7. Be thorough — include all relevant fields, parameters, and details from the context.\n\n"
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
        expanded = expand_query(question)
        logger.info(f"[retrieve] query: {expanded[:150]}")

        try:
                scored_hits = db.similarity_search_with_relevance_scores(expanded, k=k)
        except Exception as e:
                logger.warning(f"[retrieve] scored search failed ({e}), falling back to basic search")
                hits = db.similarity_search(expanded, k=k)
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
                mmr_hits = db.max_marginal_relevance_search(expanded, k=min(k, len(filtered)), fetch_k=k * 2)
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
        expanded = expand_query(req.message)
        logger.info(f"[debug] query: {expanded[:150]}")
        try:
                scored_hits = db.similarity_search_with_relevance_scores(expanded, k=req.k)
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
                        "expanded_query": expanded,
                        "total_results": len(results),
                        "threshold": RELEVANCE_THRESHOLD,
                        "results": results,
                }
        except Exception as e:
                hits = db.similarity_search(expanded, k=req.k)
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
                        "expanded_query": expanded,
                        "total_results": len(results),
                        "note": f"Scored search unavailable ({e}), used basic search",
                        "results": results,
                }

@app.get("/healthz")
def health():
        return {"ok": True}
