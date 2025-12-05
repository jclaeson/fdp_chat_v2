#!/bin/bash
# Display help and available commands

cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║        FedEx Developer Portal Assistant - Scripts Help        ║
╚═══════════════════════════════════════════════════════════════╝

QUICK COMMANDS:
───────────────────────────────────────────────────────────────

  ./scripts/all-in-one.sh       🎯 Complete setup (first time)
  ./scripts/start-dev.sh        🚀 Start all services
  ./scripts/stop-dev.sh         🛑 Stop all services

INDIVIDUAL SCRIPTS:
───────────────────────────────────────────────────────────────

📦 Setup & Installation
  ./scripts/setup-local.sh
    └─ Install dependencies, create venv, pull Ollama models
    └─ Run once on first setup

🔍 Vector Database
  ./scripts/build-vector-db.sh
    └─ Scrape FedEx docs and build ChromaDB index
    └─ Takes 5-15 minutes
  
  ./scripts/test-vector-db.sh
    └─ Validate RAG system with sample queries
    └─ Quick health check
  
  ./scripts/push-vector-db.sh
    └─ Deploy vector store (Git/LFS/Azure)
    └─ Choose deployment method interactively

🚀 Development
  ./scripts/start-dev.sh
    └─ Start Python backend + Node.js frontend
    └─ Services: :8000 (Python) and :5000 (Node)
  
  ./scripts/stop-dev.sh
    └─ Stop all running services
    └─ Clean up ports

📚 Documentation
  cat QUICKSTART.md
    └─ 5-minute quick start guide
  
  cat scripts/README.md
    └─ Detailed script documentation
  
  cat README.md
    └─ Full project documentation

───────────────────────────────────────────────────────────────

TYPICAL WORKFLOWS:
───────────────────────────────────────────────────────────────

🆕 First Time Setup (30 min)
   1. ./scripts/all-in-one.sh
   2. Visit http://localhost:5000

💻 Daily Development
   1. ./scripts/start-dev.sh
   2. Code, test, repeat
   3. Press Ctrl+C when done

🔄 Update Documentation
   1. ./scripts/build-vector-db.sh
   2. ./scripts/test-vector-db.sh
   3. ./scripts/push-vector-db.sh

───────────────────────────────────────────────────────────────

SERVICES & PORTS:
───────────────────────────────────────────────────────────────

  http://localhost:5000         → Web Interface
  http://localhost:5000/api     → Express API
  http://localhost:8000         → Python Backend
  http://localhost:8000/docs    → FastAPI Docs
  http://localhost:11434        → Ollama Server

───────────────────────────────────────────────────────────────

TROUBLESHOOTING:
───────────────────────────────────────────────────────────────

❌ Ollama not running
   → ollama serve

❌ Port already in use
   → ./scripts/stop-dev.sh

❌ Vector store empty
   → ./scripts/build-vector-db.sh

❌ Python dependencies issue
   → source venv/bin/activate
   → pip install --upgrade pip
   → ./scripts/setup-local.sh

───────────────────────────────────────────────────────────────

LOGS:
───────────────────────────────────────────────────────────────

  logs/python-backend.log       FastAPI logs
  logs/nodejs-frontend.log      Vite + Express logs

───────────────────────────────────────────────────────────────

For more information:
  • Read QUICKSTART.md for step-by-step guide
  • Read scripts/README.md for detailed documentation
  • Read README.md for architecture overview

EOF
