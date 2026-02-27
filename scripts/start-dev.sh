#!/bin/bash
# Start the full development environment

set -e

echo "🚀 Starting FedEx Developer Portal Assistant"
echo "============================================"

# Load .env file if present (for local development)
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo "✅ Loaded .env file"
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set environment variables
export PERSIST_DIR="${PERSIST_DIR:-./vector_store/chroma_fedex}"
export PYTHON_BACKEND_URL="${PYTHON_BACKEND_URL:-http://localhost:8000}"

# Check if vector store exists
if [ ! -d "$PERSIST_DIR" ] || [ ! "$(ls -A $PERSIST_DIR)" ]; then
    echo "⚠️  Vector store not found at $PERSIST_DIR"
    read -p "Build it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/build-vector-db.sh
    else
        echo "⚠️  RAG features will not work without vector store"
    fi
fi

# Check if Ollama is running
if command -v ollama &> /dev/null; then
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "⚠️  Ollama is not running"
        echo "Starting Ollama in background..."
        ollama serve > /tmp/ollama.log 2>&1 &
        sleep 2
    fi
    echo "✅ Ollama is running"
else
    echo "⚠️  Ollama not found - RAG features will not work"
fi

# Create log directory
mkdir -p logs

echo ""
echo "Starting services..."
echo ""

# Start Python backend
echo "🐍 Starting Python FastAPI backend on :8000..."
cd backend_repo/apps/backend
uvicorn app:app --host 0.0.0.0 --port 8000 > ../../../logs/python-backend.log 2>&1 &
PYTHON_PID=$!
cd ../../..

# Wait for Python backend to start
sleep 3

if ! ps -p $PYTHON_PID > /dev/null; then
    echo "❌ Python backend failed to start"
    echo "Check logs/python-backend.log for details"
    exit 1
fi

echo "✅ Python backend running (PID: $PYTHON_PID)"

# Start Node.js frontend + API
echo "🌐 Starting Node.js frontend + API on :5000..."
npm run dev > logs/nodejs-frontend.log 2>&1 &
NODEJS_PID=$!

# Wait for Node.js to start
sleep 5

if ! ps -p $NODEJS_PID > /dev/null; then
    echo "❌ Node.js frontend failed to start"
    echo "Check logs/nodejs-frontend.log for details"
    kill $PYTHON_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Node.js frontend running (PID: $NODEJS_PID)"

echo ""
echo "✨ All services started!"
echo ""
echo "📱 Application: http://localhost:5000"
echo "🔌 API: http://localhost:5000/api/health"
echo "🐍 Python Backend: http://localhost:8000/docs"
echo ""
echo "📋 Logs:"
echo "   - Python: logs/python-backend.log"
echo "   - Node.js: logs/nodejs-frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Save PIDs to file for cleanup
echo "$PYTHON_PID" > logs/python.pid
echo "$NODEJS_PID" > logs/nodejs.pid

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $PYTHON_PID $NODEJS_PID 2>/dev/null || true; rm -f logs/*.pid; echo '✅ All services stopped'; exit 0" SIGINT SIGTERM

# Keep script running
wait
