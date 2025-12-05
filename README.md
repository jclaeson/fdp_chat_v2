# FedEx Developer Portal Assistant

A cloud-ready RAG-powered chatbot for the FedEx Developer Portal with hybrid AI routing (Ollama + OpenAI).

## Architecture Overview

### Components

1. **Frontend (React/TypeScript)** - `client/`
   - Landing page with feature showcase
   - Real-time chat interface with AI assistant
   - System dashboard for monitoring and configuration
   - Chrome extension overlay for developer.fedex.com

2. **Backend API (Node.js/Express)** - `server/`
   - Hybrid chat routing (intelligent model selection)
   - Scraper management endpoints
   - Settings and configuration API
   - PostgreSQL database for conversation history

3. **Python RAG Backend** - `backend_repo/`
   - Web scraper for FedEx documentation (`apps/ingest/ingest.py`)
   - FastAPI server with Ollama + ChromaDB (`apps/backend/app.py`)
   - Vector embeddings using `nomic-embed-text`

4. **Chrome Extension** - `client/public/extension/`
   - Content script overlay on developer.fedex.com
   - Context menu integration
   - Iframe to hosted chat UI

## Hybrid AI Strategy

The system intelligently routes queries between two AI backends:

### OpenAI (GPT-4o-mini)
- **Used for**: General programming questions, code syntax, architecture advice
- **Triggers**: Questions without FedEx-specific keywords
- **Benefits**: Fast, reliable, low-latency responses

### Ollama + RAG (llama3 + ChromaDB)
- **Used for**: FedEx API documentation, endpoint details, integration guides
- **Triggers**: Keywords like "fedex", "shipment", "tracking", "api", "oauth"
- **Benefits**: Grounded in scraped documentation, provides source citations

## Getting Started

### Quick Start (Automated)

**For local development:**
```bash
# One-command setup (interactive)
./scripts/all-in-one.sh

# Or step-by-step:
./scripts/setup-local.sh       # Install dependencies
./scripts/build-vector-db.sh   # Build RAG index (5-15 min)
./scripts/test-vector-db.sh    # Validate system
./scripts/start-dev.sh         # Start development
```

See [`QUICKSTART.md`](QUICKSTART.md) for detailed instructions.

### Manual Setup

<details>
<summary>Click to expand manual installation steps</summary>

#### Prerequisites

- Node.js 20+
- Python 3.9+
- PostgreSQL (automatically configured on Replit)
- Ollama (for local RAG inference)

#### Installation

1. **Install Node dependencies**
```bash
npm install
```

2. **Install Python dependencies**
```bash
cd backend_repo/apps/backend
pip install fastapi langchain-community langchain-ollama chromadb uvicorn requests

cd ../ingest
pip install beautifulsoup4 langchain-community langchain-text-splitters requests lxml
```

3. **Pull Ollama models** (if running locally)
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

4. **Set up database**
```bash
npm run db:push
```

</details>

### Running Locally

#### 1. Start the Python RAG Backend (Terminal 1)
```bash
cd backend_repo/apps/backend
uvicorn app:app --host 0.0.0.0 --port 8000
```

#### 2. Run the Web Scraper (One-time setup)
```bash
cd backend_repo/apps/ingest
python ingest.py
```
This creates the vector store at `./vector_store/chroma_fedex`

#### 3. Start the Node.js Frontend + API (Terminal 2)
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Deploying to Azure

#### Option 1: App Service (Recommended)

**For Node.js Backend + Frontend:**
```bash
# Deploy as Node.js app
az webapp up --name fdp-assistant-frontend --runtime "NODE:20-lts"
```

**For Python FastAPI Backend:**
```bash
cd backend_repo/apps/backend
# Upload vector_store/ directory to Azure File Share or Blob Storage
az webapp up --name fdp-assistant-rag --runtime "PYTHON:3.11"
```

Set environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Your OpenAI key
- `PYTHON_BACKEND_URL`: URL of Python FastAPI service
- `VECTOR_STORE_PATH`: Path to mounted vector store

#### Option 2: VM Deployment

1. Provision Ubuntu 22.04 VM
2. Install Node.js, Python, PostgreSQL, Ollama
3. Clone repository and install dependencies
4. Run with PM2 or systemd

```bash
# Node backend
pm2 start npm --name "fdp-api" -- run dev

# Python backend
pm2 start "uvicorn app:app --host 0.0.0.0 --port 8000" --name "rag-backend"
```

### Chrome Extension Installation

1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `client/public/extension` directory
5. Visit `https://developer.fedex.com` to see the assistant overlay

**Update Extension API URL:**
Edit `client/public/extension/content.js`:
```javascript
const API_URL = "https://your-azure-domain.azurewebsites.net";
```

## API Endpoints

### Chat
- `POST /api/chat` - Send message, get AI response
  ```json
  {
    "message": "How do I authenticate with FedEx API?",
    "conversationId": "optional-uuid",
    "pageUrl": "https://developer.fedex.com/...",
    "pageText": "optional context from current page"
  }
  ```

### Scraper
- `POST /api/scraper/run` - Trigger documentation scrape
- `GET /api/scraper/status` - Get latest scraper run status
- `GET /api/scraper/runs` - Get scraper history

### Settings
- `GET /api/settings/:key` - Get system setting
- `POST /api/settings` - Update system setting

## Database Schema

- `conversations` - Chat session metadata
- `messages` - Individual chat messages with sources
- `scraper_runs` - Scraper execution history
- `system_settings` - Key-value configuration store

## Environment Variables

```env
# Database (auto-configured on Replit)
DATABASE_URL=postgresql://...

# OpenAI (auto-configured via integration)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...

# Python Backend URL
PYTHON_BACKEND_URL=http://localhost:8000

# Vector Store Path
VECTOR_STORE_PATH=./vector_store/chroma_fedex

# Python Executable (optional)
PYTHON_PATH=python3
```

## Development Workflow

1. **Update Documentation**: Run scraper from dashboard or CLI
2. **Test RAG**: Use `/chat` page to ask FedEx-specific questions
3. **Configure Models**: Adjust temperature, prompts in `/dashboard` settings tab
4. **Monitor**: View scraper logs, vector store stats in dashboard

## Production Checklist

- [ ] Run scraper to build production vector index
- [ ] Upload vector store to cloud storage (Azure Blob/File Share)
- [ ] Configure environment variables in Azure App Service
- [ ] Set up PostgreSQL database (Azure Database for PostgreSQL)
- [ ] Update extension `API_URL` to production domain
- [ ] Package extension as `.crx` for distribution
- [ ] Enable CORS restrictions in backend
- [ ] Set up monitoring and logging

## Tech Stack

**Frontend:**
- React 19, TypeScript, Vite
- TailwindCSS 4, shadcn/ui components
- TanStack Query, Wouter routing
- Framer Motion animations

**Backend:**
- Node.js, Express, PostgreSQL
- Drizzle ORM, OpenAI SDK
- Python FastAPI, LangChain, ChromaDB
- Ollama embeddings

## License

MIT

## Support

For issues or questions, open an issue on GitHub or contact the development team.
