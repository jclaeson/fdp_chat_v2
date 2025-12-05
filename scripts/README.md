# Development Scripts

Automation scripts for local development, vector database management, and deployment.

## Quick Start

```bash
# 1. Initial setup (run once)
chmod +x scripts/*.sh
./scripts/setup-local.sh

# 2. Build vector database
./scripts/build-vector-db.sh

# 3. Test the RAG system
./scripts/test-vector-db.sh

# 4. Start development environment
./scripts/start-dev.sh
```

## Scripts Overview

### `setup-local.sh`
**Purpose:** Initial environment setup for local development

**What it does:**
- Checks for Python 3, Node.js, and Ollama
- Creates Python virtual environment
- Installs all Python dependencies (scraper + backend)
- Installs Node.js dependencies
- Pulls Ollama models (llama3, nomic-embed-text)
- Creates vector store directory
- Generates `.env` file template

**Usage:**
```bash
./scripts/setup-local.sh
```

**First-time setup only.** Re-run if you need to reinstall dependencies.

---

### `build-vector-db.sh`
**Purpose:** Scrape FedEx documentation and build vector embeddings

**What it does:**
- Activates Python virtual environment
- Runs the web scraper (`backend_repo/apps/ingest/ingest.py`)
- Creates ChromaDB vector store with embeddings
- Saves to `./vector_store/chroma_fedex/`

**Usage:**
```bash
./scripts/build-vector-db.sh
```

**Options:**
- Will prompt to delete existing database if found
- Takes 5-15 minutes depending on site size
- Outputs document count and chunk count

**When to use:**
- Initial setup
- After FedEx updates their documentation
- If vector database becomes corrupted

---

### `test-vector-db.sh`
**Purpose:** Validate vector database with sample queries

**What it does:**
- Starts Python FastAPI backend temporarily
- Sends 3 test queries about FedEx API
- Validates responses and source citations
- Shuts down test server

**Usage:**
```bash
./scripts/test-vector-db.sh
```

**Test queries:**
1. Authentication methods
2. Shipment creation
3. Rate shopping

**Expected output:**
- ✅ Response received for each query
- Source count (should be >0 for FedEx questions)

---

### `push-vector-db.sh`
**Purpose:** Deploy vector database to repository or cloud storage

**What it does:**
- Checks vector store size
- Offers 4 deployment methods:
  1. **Git commit** - For small datasets (<50MB)
  2. **Git LFS** - For large datasets (50MB-2GB)
  3. **Azure Blob Storage** - Production deployment
  4. **Skip** - Local testing only

**Usage:**
```bash
./scripts/push-vector-db.sh
```

**Deployment Methods:**

#### Option 1: Git Commit
```bash
# Best for: Small datasets, quick prototypes
# Pros: Simple, no extra tools needed
# Cons: Large files can bloat repository
```

#### Option 2: Git LFS
```bash
# Best for: Medium datasets, team collaboration
# Pros: Efficient storage, version control
# Cons: Requires Git LFS installation
# Install: https://git-lfs.github.com
```

#### Option 3: Azure Blob Storage
```bash
# Best for: Production deployments
# Pros: Scales infinitely, faster deployments
# Cons: Requires Azure account and setup

# Prerequisites:
pip install azure-cli
az login

# Script will upload and provide mount commands
```

#### Option 4: Skip
```bash
# Best for: Local development only
# Just verifies database is ready
```

---

### `start-dev.sh`
**Purpose:** Start all services for full-stack development

**What it does:**
- Activates Python virtual environment
- Checks for vector database (offers to build if missing)
- Starts Ollama if not running
- Starts Python FastAPI backend on `:8000`
- Starts Node.js frontend + API on `:5000`
- Creates log files in `logs/` directory
- Waits for Ctrl+C to stop

**Usage:**
```bash
./scripts/start-dev.sh
```

**Services started:**
- 🐍 Python Backend: `http://localhost:8000`
- 🌐 Node.js Frontend: `http://localhost:5000`
- 📚 API Docs: `http://localhost:8000/docs`

**Logs:**
- `logs/python-backend.log` - FastAPI logs
- `logs/nodejs-frontend.log` - Vite + Express logs

**To stop:**
- Press `Ctrl+C` (graceful shutdown)
- Or run `./scripts/stop-dev.sh`

---

### `stop-dev.sh`
**Purpose:** Stop all development services

**What it does:**
- Kills Python backend process
- Kills Node.js frontend process
- Cleans up ports 8000 and 5000
- Removes PID files

**Usage:**
```bash
./scripts/stop-dev.sh
```

---

## Workflow Examples

### New Developer Setup
```bash
# Clone repository
git clone <repo-url>
cd <repo-name>

# Run setup
./scripts/setup-local.sh

# Update .env with database credentials
nano .env

# Build vector database
./scripts/build-vector-db.sh

# Test everything works
./scripts/test-vector-db.sh

# Start development
./scripts/start-dev.sh
```

### Update Documentation
```bash
# Rebuild vector database
./scripts/build-vector-db.sh

# Test new content
./scripts/test-vector-db.sh

# Push to repository
./scripts/push-vector-db.sh  # Choose option 2 or 3
```

### Daily Development
```bash
# Start all services
./scripts/start-dev.sh

# Work on code...

# Stop when done
# Press Ctrl+C or run:
./scripts/stop-dev.sh
```

## Troubleshooting

### "Ollama not found"
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Or download from: https://ollama.com
```

### "Python backend failed to start"
```bash
# Check logs
cat logs/python-backend.log

# Common fixes:
source venv/bin/activate
pip install -r requirements.txt
```

### "Vector store not found"
```bash
# Build it
./scripts/build-vector-db.sh
```

### "Port already in use"
```bash
# Kill existing processes
./scripts/stop-dev.sh

# Or manually:
kill $(lsof -ti:8000)
kill $(lsof -ti:5000)
```

## Environment Variables

Create a `.env` file (auto-generated by `setup-local.sh`):

```env
# Required
DATABASE_URL=postgresql://localhost:5432/fedex_assistant
PYTHON_BACKEND_URL=http://localhost:8000
PERSIST_DIR=./vector_store/chroma_fedex

# Optional
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
PYTHON_PATH=python3
```

## Production Deployment

See main `README.md` for Azure deployment instructions.

Quick reference:
```bash
# Build vector DB locally
./scripts/build-vector-db.sh

# Push to Azure Blob Storage
./scripts/push-vector-db.sh  # Choose option 3
```
