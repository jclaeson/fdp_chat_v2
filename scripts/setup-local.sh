#!/bin/bash
# Setup script for local development environment

set -e  # Exit on error

echo "🚀 FedEx Developer Portal Assistant - Local Setup"
echo "=================================================="

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed."
    echo "Install from: https://ollama.com/download"
    read -p "Continue without Ollama? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Ollama found"
fi

echo "✅ Python 3 found: $(python3 --version)"
echo "✅ Node.js found: $(node --version)"

# Create Python virtual environment
echo ""
echo "🐍 Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install --upgrade pip > /dev/null 2>&1

echo "  - Installing scraper dependencies..."
pip install -q beautifulsoup4 langchain-community langchain-text-splitters requests lxml chromadb langchain-ollama

echo "  - Installing backend dependencies..."
pip install -q fastapi uvicorn

echo "✅ Python dependencies installed"

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install --silent

echo "✅ Node.js dependencies installed"

# Pull Ollama models
if command -v ollama &> /dev/null; then
    echo ""
    echo "🤖 Pulling Ollama models..."
    
    if ollama list | grep -q "llama3"; then
        echo "✅ llama3 already installed"
    else
        echo "  - Pulling llama3..."
        ollama pull llama3
    fi
    
    if ollama list | grep -q "nomic-embed-text"; then
        echo "✅ nomic-embed-text already installed"
    else
        echo "  - Pulling nomic-embed-text..."
        ollama pull nomic-embed-text
    fi
fi

# Create vector store directory
echo ""
echo "📁 Creating vector store directory..."
mkdir -p vector_store/chroma_fedex
echo "✅ Vector store directory created"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://localhost:5432/fedex_assistant

# Python Backend
PYTHON_BACKEND_URL=http://localhost:8000

# Vector Store
VECTOR_STORE_PATH=./vector_store/chroma_fedex
PERSIST_DIR=./vector_store/chroma_fedex

# OpenAI (optional - leave empty to use Replit integration)
AI_INTEGRATIONS_OPENAI_API_KEY=

# Python Path
PYTHON_PATH=python3
EOF
    echo "✅ .env file created - please update with your settings"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Update .env with your database credentials"
echo "  3. Run scraper: ./scripts/build-vector-db.sh"
echo "  4. Start development: npm run dev"
