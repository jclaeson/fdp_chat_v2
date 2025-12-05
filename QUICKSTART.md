# Quick Start Guide

Get your local development environment up and running in 5 steps.

## Prerequisites

- **Python 3.9+**: `python3 --version`
- **Node.js 20+**: `node --version`
- **Ollama**: Download from [ollama.com](https://ollama.com/download)
- **Git**: `git --version`

## 5-Minute Setup

```bash
# Step 1: Clone repository
git clone <your-repo-url>
cd fedex-dev-assistant

# Step 2: Run setup script
./scripts/setup-local.sh

# Step 3: Update .env file with your database URL
nano .env  # or use your preferred editor

# Step 4: Build vector database (5-15 min)
./scripts/build-vector-db.sh

# Step 5: Start development
./scripts/start-dev.sh
```

**Done!** Open http://localhost:5000

## Script Cheat Sheet

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `setup-local.sh` | Install dependencies | First time only |
| `build-vector-db.sh` | Scrape & build database | Initial setup, doc updates |
| `test-vector-db.sh` | Validate RAG system | After building DB |
| `push-vector-db.sh` | Deploy to repo/cloud | Before deployment |
| `start-dev.sh` | Start all services | Daily development |
| `stop-dev.sh` | Stop all services | End of day |

## What Gets Installed

### Python Dependencies
- **Scraper**: BeautifulSoup4, LangChain, Requests
- **Backend**: FastAPI, Uvicorn, ChromaDB, Ollama SDK

### Node.js Dependencies
- Already defined in `package.json`
- Installed automatically by `setup-local.sh`

### Ollama Models
- **llama3**: Text generation (RAG responses)
- **nomic-embed-text**: Vector embeddings

## Typical Workflow

### First Time
```bash
./scripts/setup-local.sh      # Install everything
./scripts/build-vector-db.sh  # Build index (once)
./scripts/test-vector-db.sh   # Verify it works
./scripts/start-dev.sh        # Start coding!
```

### Daily Development
```bash
./scripts/start-dev.sh        # Start services
# ... code, test, repeat ...
# Press Ctrl+C to stop
```

### Update Documentation
```bash
./scripts/build-vector-db.sh  # Rebuild index
./scripts/test-vector-db.sh   # Test changes
./scripts/push-vector-db.sh   # Deploy
```

## Troubleshooting

### Ollama Not Running
```bash
# Start Ollama server
ollama serve

# In another terminal, verify
curl http://localhost:11434/api/tags
```

### Port Already in Use
```bash
./scripts/stop-dev.sh
# Or manually kill:
kill $(lsof -ti:8000)
kill $(lsof -ti:5000)
```

### Vector Store Empty
```bash
# Delete and rebuild
rm -rf vector_store/chroma_fedex
./scripts/build-vector-db.sh
```

### Python Dependencies Issue
```bash
source venv/bin/activate
pip install --upgrade pip
./scripts/setup-local.sh  # Re-run setup
```

## Directory Structure

```
.
├── scripts/              # Automation scripts
├── backend_repo/
│   └── apps/
│       ├── ingest/       # Web scraper
│       └── backend/      # FastAPI server
├── vector_store/         # ChromaDB data
├── client/               # React frontend
└── server/               # Express API
```

## Environment Variables

Edit `.env` file:
```env
# PostgreSQL connection
DATABASE_URL=postgresql://localhost:5432/fedex_assistant

# Python backend URL
PYTHON_BACKEND_URL=http://localhost:8000

# Vector store location
PERSIST_DIR=./vector_store/chroma_fedex

# OpenAI (optional)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
```

## Services Running

When you run `./scripts/start-dev.sh`:

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api/health
- **Python Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Next Steps

1. Read `scripts/README.md` for detailed script documentation
2. Check `README.md` for architecture overview
3. Visit http://localhost:5000/dashboard to manage scraper
4. Test chat at http://localhost:5000/chat

## Deployment

### Push Vector DB to Git
```bash
./scripts/push-vector-db.sh  # Choose option 1 or 2
```

### Deploy to Azure Blob Storage
```bash
./scripts/push-vector-db.sh  # Choose option 3
# Follow prompts for storage account
```

## Support

- **Script Issues**: See `scripts/README.md`
- **Architecture**: See main `README.md`
- **Logs**: Check `logs/` directory
  - `logs/python-backend.log`
  - `logs/nodejs-frontend.log`

---

**Pro Tip**: Bookmark this page for quick reference!
