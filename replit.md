# FedEx Developer Portal Assistant

## Overview

This is a RAG-powered AI chatbot designed to help developers integrate with the FedEx API. The system uses a hybrid AI routing strategy that intelligently switches between OpenAI's GPT-4o-mini for general programming questions and a local Ollama + ChromaDB RAG system for FedEx-specific API documentation queries. The application includes a web interface, REST API backend, Python-based document ingestion pipeline, and a Chrome extension overlay for the developer.fedex.com portal.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (React + TypeScript)

The frontend is built with React and TypeScript using Vite as the build tool. It consists of three main pages:

1. **Landing Page** - Marketing page with feature showcase and product overview
2. **Chat Interface** - Real-time messaging UI with streaming support for AI responses
3. **Dashboard** - System monitoring and configuration panel for managing scraper runs and settings

The UI leverages shadcn/ui components with Radix UI primitives for accessibility. Styling is handled through Tailwind CSS with a custom dark theme inspired by FedEx brand colors (purple #4D148C and orange #FF6200).

**Routing**: The application uses `wouter` for client-side routing instead of React Router for a lighter bundle size.

**State Management**: TanStack Query (React Query) handles server state, API caching, and data synchronization. No global state management library is used for client state.

**Form Handling**: React Hook Form with Zod validation via `@hookform/resolvers` provides type-safe form validation.

### Backend Architecture (Node.js + Express)

The Express server acts as a middleware layer that orchestrates requests between the frontend and AI backends:

**Hybrid AI Router**: The `/api/chat` endpoint examines incoming messages for FedEx-specific keywords (fedex, api, shipment, tracking, oauth, etc.) to determine routing:
- **OpenAI Path**: General programming questions bypass the RAG system and go directly to OpenAI's GPT-4o-mini for fast, reliable responses
- **RAG Path**: FedEx-specific queries are forwarded to the Python FastAPI backend which performs vector similarity search against scraped documentation

**Database Layer**: Uses Drizzle ORM with PostgreSQL to store:
- Conversation history and messages
- Scraper run metadata (status, documents found, timestamps)
- System settings as JSON blobs

**Storage Interface**: The `IStorage` interface in `server/storage.ts` provides an abstraction layer for data operations, making it easy to swap implementations.

### Python RAG Backend (FastAPI + LangChain)

Located in `backend_repo/`, this component handles document ingestion and retrieval-augmented generation:

**Document Scraper** (`apps/ingest/ingest.py`):
- Crawls developer.fedex.com starting from seed URLs
- Respects robots.txt and implements rate limiting
- Extracts text content using BeautifulSoup
- Chunks documents with `RecursiveCharacterTextSplitter`
- Generates embeddings using Ollama's `nomic-embed-text` model
- Stores vector embeddings in ChromaDB with metadata (source URLs)

**Query API** (`apps/backend/app.py`):
- FastAPI server exposing `/chat` endpoint
- Performs vector similarity search with MMR (Maximal Marginal Relevance) for diversity
- Constructs context-aware prompts with retrieved chunks
- Calls Ollama's llama3 model for generation
- Returns answer with source citations

**Why ChromaDB**: Chosen for its simplicity, persistence to disk, and native LangChain integration. No separate database server required.

**Why Ollama**: Enables local LLM execution without API costs or rate limits. Models run on the same server as the application.

### Database Schema

The PostgreSQL schema (defined in `shared/schema.ts`) uses Drizzle ORM:

- **conversations**: Tracks chat sessions with optional user IDs
- **messages**: Stores individual messages with role (user/assistant), content, sources, and model used
- **scraperRuns**: Records metadata about documentation ingestion runs
- **systemSettings**: Key-value store for application configuration with JSON values

UUIDs are generated server-side using PostgreSQL's `gen_random_uuid()` function.

### Chrome Extension

The browser extension (`client/public/extension/`) overlays a chat interface directly on developer.fedex.com:

**Architecture**:
- **Manifest V3** service worker architecture for modern Chrome compatibility
- **Content Script** (`content.js`) injects a floating action button and chat window iframe
- **Iframe Embedding**: The chat UI loads from the hosted application (`/chat?embed=true`) to reuse existing components
- **Context Menu Integration**: Right-click selected text to ask questions about API parameters

**Why Iframe**: Avoids duplicating chat UI code and ensures consistent behavior between web and extension interfaces.

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o-mini model for general programming assistance (requires `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Ollama**: Local LLM runtime for llama3 text generation and nomic-embed-text embeddings (self-hosted on `localhost:11434`)

### Databases
- **PostgreSQL**: Primary data store for conversations, messages, and settings (configured via `DATABASE_URL` environment variable)
- **ChromaDB**: Vector database for semantic search over FedEx documentation (persisted to `./vector_store/chroma_fedex`)

### Third-Party Libraries
- **LangChain**: Document loading, text splitting, and vector store abstractions
- **Drizzle ORM**: Type-safe PostgreSQL queries with schema migrations
- **TanStack Query**: Async state management and API caching
- **Axios**: HTTP client for Python backend communication
- **shadcn/ui + Radix UI**: Component library built on accessible primitives
- **Tailwind CSS**: Utility-first styling framework
- **Vite**: Frontend build tool and dev server

### Python Dependencies (backend_repo)
- **FastAPI**: Async web framework for the RAG API
- **LangChain Community**: Vector store and embedding integrations
- **BeautifulSoup4**: HTML parsing for web scraping
- **Requests**: HTTP client for document fetching

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (required)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: Optional OpenAI-compatible endpoint override
- `PYTHON_BACKEND_URL`: FastAPI server URL (defaults to `http://localhost:8000`)
- `PERSIST_DIR`: ChromaDB storage path (defaults to `./vector_store/chroma_fedex`)

## Development Scripts

Automated bash scripts in `scripts/` directory streamline local development workflow:

### Setup & Installation
- **`setup-local.sh`**: One-time environment setup
  - Creates Python venv
  - Installs Node.js and Python dependencies
  - Pulls Ollama models (llama3, nomic-embed-text)
  - Generates `.env` template

### Vector Database Management
- **`build-vector-db.sh`**: Scrape FedEx docs and build ChromaDB index
  - Runs `backend_repo/apps/ingest/ingest.py`
  - Creates embeddings with nomic-embed-text
  - Outputs to `./vector_store/chroma_fedex/`
  
- **`test-vector-db.sh`**: Validate RAG system with sample queries
  - Starts FastAPI backend temporarily
  - Tests 3 FedEx-specific queries
  - Verifies source citations

- **`push-vector-db.sh`**: Deploy vector store to repo/cloud
  - Option 1: Git commit (small datasets)
  - Option 2: Git LFS (medium datasets)
  - Option 3: Azure Blob Storage (production)
  - Option 4: Skip (local only)

### Development Workflow
- **`start-dev.sh`**: Start all services (Python backend + Node.js frontend)
  - Checks for Ollama and vector store
  - Launches FastAPI on :8000
  - Launches Vite+Express on :5000
  - Saves logs to `logs/` directory

- **`stop-dev.sh`**: Stop all running services cleanly

- **`all-in-one.sh`**: Interactive setup wizard (runs all steps sequentially)

See `scripts/README.md` and `QUICKSTART.md` for detailed usage.