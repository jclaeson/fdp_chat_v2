# ingest.py
import os
import re
import time
from typing import Optional
from datetime import datetime
from urllib.parse import urljoin, urldefrag, urlparse
from urllib import robotparser

import requests
from bs4 import BeautifulSoup

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document

PERSIST_DIR = os.getenv("PERSIST_DIR", "./vector_store/chroma_fedex")
EMBED_MODEL = "nomic-embed-text"

DOC_URLS = [
        "https://developer.fedex.com/api/en-us/home.html",
        "https://developer.fedex.com/api/en-us/catalog.html",
        "https://developer.fedex.com/api/en-us/catalog/address-validation.html",
        "https://developer.fedex.com/api/en-us/catalog/address-validation/v1/docs.html#operation/Validate%20Address",
        "https://developer.fedex.com/api/en-us/catalog/address-validation/v1/docs.html",
        "https://developer.fedex.com/api/en-us/guides/authentication.html",
        "https://developer.fedex.com/api/en-us/catalog/track.html",
        "https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html",
        "https://developer.fedex.com/api/en-us/catalog/rate.html",
        "https://developer.fedex.com/api/en-us/catalog/rate/v1/docs.html",
        "https://developer.fedex.com/api/en-us/catalog/ship.html",
        "https://developer.fedex.com/api/en-us/catalog/ship/v1/docs.html",
        "https://developer.fedex.com/api/en-us/catalog/shipment-visibility-webhook.html",
        "https://developer.fedex.com/api/en-us/catalog/shipment-visibility-webhook/v1/docs.html",
        "https://developer.fedex.com/api/en-us/Api-recipes/us-domestic-e-commerce.html",
        "https://developer.fedex.com/api/en-us/Api-recipes/expedite-custom-clearance.html",
        "https://developer.fedex.com/api/en-us/guides.html",
        "https://www.fedex.com/en-us/compatible.html",
        "https://developer.fedex.com/api/en-us/project.html",
        "https://developer.fedex.com/api/en-us/certification.html",
        "https://developer.fedex.com/api/en-us/support.html",
        "https://developer.fedex.com/api/en-us/guides.html"
]

USER_AGENT = "Mozilla/5.0 (FedEx RAG dev; macOS)"
MAX_PAGES = 1000
PATH_MUST_CONTAIN = "/*/en-us/"
SKIP_EXT = re.compile(r"\.(png|jpg|jpeg|gif|svg|pdf|zip|css|js|ico|mp4|mp3|woff2?)$", re.I)

STRIP_SELECTORS = [
        "header", "nav", "footer", "aside",
        "script", "style", "noscript", "iframe", "svg",
        "[role='navigation']", "[role='banner']", "[role='contentinfo']",
        ".breadcrumbs", ".cookie", ".banner", ".sidebar",
        ".menu", ".nav", ".navbar", ".navigation",
        ".sign-up", ".signup", ".login", ".log-in", ".signin", ".sign-in",
        ".modal", ".overlay", ".popup",
        ".header", ".footer", ".topbar", ".top-bar",
        "form[action*='login']", "form[action*='signup']",
        "[class*='menu']", "[class*='Menu']",
        "[class*='nav-']", "[class*='Nav-']",
        "[class*='cookie']", "[class*='Cookie']",
        "[class*='sign-up']", "[class*='SignUp']",
        "[class*='login']", "[class*='Login']",
        "[class*='modal']", "[class*='Modal']",
        "[class*='dropdown']", "[class*='Dropdown']",
        "[id*='menu']", "[id*='nav']", "[id*='login']", "[id*='signup']",
]

JUNK_PATTERNS = re.compile(
        r"^("
        r"true|false|null|undefined"
        r"|sign\s*up|log\s*in|log\s*out|sign\s*in|sign\s*out"
        r"|sign\s*up\s+or\s+log\s*in"
        r"|forgot\s*password.*"
        r"|main\s*menu"
        r"|menu"
        r"|×|✕|close"
        r"|home"
        r"|get\s+access\s+to\s+fedex.*"
        r"|united\s+states\s+engli.*"
        r"|developer\s+portal\s*$"
        r"|skip\s+to\s+.*"
        r"|back\s+to\s+top"
        r"|toggle\s+.*"
        r"|expand\s+all|collapse\s+all"
        r"|loading\.{0,3}"
        r"|please\s+wait.*"
        r"|copyright\s*©.*"
        r"|all\s+rights\s+reserved.*"
        r"|terms\s+(of\s+use|&\s+conditions).*"
        r"|privacy\s+(policy|notice).*"
        r"|cookie\s+(policy|preferences).*"
        r")$",
        re.I
)

MIN_LINE_LENGTH = 3
MIN_DOC_LENGTH = 100


def clean_url(u: str) -> str:
        u, _ = urldefrag(u or "")
        return u.strip()

def same_site(u: str, root_netloc: str) -> bool:
        return urlparse(u).netloc == root_netloc

def allowed_by_robots(url: str, ua: str = USER_AGENT) -> bool:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        rp = robotparser.RobotFileParser()
        try:
                rp.set_url(robots_url)
                rp.read()
                return rp.can_fetch(ua, url)
        except Exception:
                return True

def get_one_hop_links(seed: str) -> set[str]:
        links: set[str] = set()
        root = urlparse(seed)
        headers = {"User-Agent": USER_AGENT}
        try:
                r = requests.get(seed, headers=headers, timeout=15)
                r.raise_for_status()
        except Exception as e:
                print(f"[WARN] Fetch failed: {seed} -> {e}")
                return links

        soup = BeautifulSoup(r.text, "lxml")
        for a in soup.find_all("a", href=True):
                href = a["href"]
                abs_url = clean_url(urljoin(seed, href))
                if not abs_url:
                        continue
                if SKIP_EXT.search(abs_url):
                        continue
                if not same_site(abs_url, root.netloc):
                        continue
                if PATH_MUST_CONTAIN and PATH_MUST_CONTAIN not in urlparse(abs_url).path:
                        continue
                links.add(abs_url)
        return links

def crawl_one_level(seeds: list[str]) -> list[str]:
        seeds = [clean_url(s) for s in seeds if s]
        seeds = [s for s in seeds if allowed_by_robots(s)]
        seen: set[str] = set(seeds)

        for s in seeds:
                if len(seen) >= MAX_PAGES:
                        break
                if not allowed_by_robots(s):
                        continue
                for u in get_one_hop_links(s):
                        if len(seen) >= MAX_PAGES:
                                break
                        if allowed_by_robots(u):
                                seen.add(u)
                time.sleep(0.4)
        return sorted(seen)

def strip_boilerplate(html: str) -> str:
        soup = BeautifulSoup(html, "lxml")
        for sel in STRIP_SELECTORS:
                for el in soup.select(sel):
                        el.decompose()
        text = soup.get_text("\n", strip=True)
        lines = []
        for ln in text.splitlines():
                ln = ln.strip()
                if not ln:
                        continue
                if len(ln) < MIN_LINE_LENGTH:
                        continue
                if JUNK_PATTERNS.match(ln):
                        continue
                lines.append(ln)
        return "\n".join(lines)

def fetch_and_clean(url: str) -> Optional[str]:
        headers = {"User-Agent": USER_AGENT}
        try:
                r = requests.get(url, headers=headers, timeout=20)
                r.raise_for_status()
        except Exception as e:
                print(f"[WARN] Fetch failed: {url} -> {e}")
                return None
        return strip_boilerplate(r.text)

def load_docs_one_level(seeds: list[str]):
        urls = crawl_one_level(seeds)
        print(f"[crawl] total URLs (seeds + 1-hop): {len(urls)}")

        ts = datetime.utcnow().isoformat()
        docs = []
        for i, url in enumerate(urls):
                print(f"[fetch {i+1}/{len(urls)}] {url}")
                cleaned = fetch_and_clean(url)
                if not cleaned or len(cleaned) < MIN_DOC_LENGTH:
                        print(f"  -> skipped (too short or empty)")
                        continue
                doc = Document(
                        page_content=cleaned,
                        metadata={
                                "source": url,
                                "ingested_at": ts,
                        }
                )
                docs.append(doc)
                time.sleep(0.3)
        return docs

def clean_and_chunk(docs, chunk_size=1200, chunk_overlap=200):
        splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", " ", ""],
        )
        return splitter.split_documents(docs)

def build_embeddings():
        return OllamaEmbeddings(model=EMBED_MODEL)

def build_or_update_vectorstore(chunks, persist_dir=PERSIST_DIR):
        embeddings = build_embeddings()
        if os.path.exists(persist_dir) and os.listdir(persist_dir):
                db = Chroma(persist_directory=persist_dir, embedding_function=embeddings)
                db.add_documents(chunks)
                db.persist()
        else:
                db = Chroma.from_documents(
                        documents=chunks,
                        embedding=embeddings,
                        persist_directory=persist_dir
                )
                db.persist()
        return db

def sanity_check(db):
        q = "How do I get an OAuth token?"
        hits = db.similarity_search(q, k=3)
        print("\n=== Sanity check results for:", q, "===\n")
        for i, h in enumerate(hits, 1):
                src = h.metadata.get("source", "unknown")
                print(f"[{i}] source: {src}\n{h.page_content[:400]}...\n")

def main():
        print("Crawling & loading docs (one level deep)...")
        docs = load_docs_one_level(DOC_URLS)
        print(f"Loaded {len(docs)} pages")

        print("Chunking...")
        chunks = clean_and_chunk(docs)
        print(f"Created {len(chunks)} chunks")

        print("Building vector store (this can take a minute on first run)...")
        db = build_or_update_vectorstore(chunks)

        print(f"Persisted to {PERSIST_DIR}")
        sanity_check(db)

if __name__ == "__main__":
        main()
