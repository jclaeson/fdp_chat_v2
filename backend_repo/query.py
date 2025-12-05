# query.py
import argparse
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

# Must match your ingest settings
PERSIST_DIR = "./chroma_fedex"
EMBED_MODEL = "nomic-embed-text"   # e.g., `ollama pull nomic-embed-text`

def get_db():
    embeddings = OllamaEmbeddings(model=EMBED_MODEL)
    return Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)

def show(query: str, k: int = 4, use_mmr: bool = True, fetch_k: int = 20, lambda_mult: float = 0.5):
    """
    Retrieve and print top-k chunks. MMR is ON by default for better diversity.
    """
    db = get_db()
    if use_mmr:
        hits = db.max_marginal_relevance_search(query, k=k, fetch_k=fetch_k, lambda_mult=lambda_mult)
    else:
        hits = db.similarity_search(query, k=k)

    print(f"\n=== Top {k} results (MMR={use_mmr}, fetch_k={fetch_k}, lambda={lambda_mult}) ===")
    for i, h in enumerate(hits, 1):
        src = h.metadata.get("source", "unknown")
        preview = (h.page_content or "")[:500].replace("\n", " ")
        print(f"\n[{i}] {src}\n{preview} ...")

def main():
    ap = argparse.ArgumentParser(description="Query Chroma with optional MMR (default ON).")
    ap.add_argument("-k", type=int, default=4, help="Number of results to return")
    ap.add_argument("--no-mmr", action="store_true", help="Disable Maximal Marginal Relevance")
    ap.add_argument("--fetch_k", type=int, default=20, help="Candidate pool size for MMR")
    ap.add_argument("--lambda_mult", type=float, default=0.5, help="MMR relevance/diversity balance (0..1)")
    args = ap.parse_args()

    while True:
        q = input("\nAsk a question (or 'quit'): ").strip()
        if q.lower() in {"quit", "exit", "q"}:
            break
        show(q, k=args.k, use_mmr=not args.no_mmr, fetch_k=args.fetch_k, lambda_mult=args.lambda_mult)

if __name__ == "__main__":
    main()
