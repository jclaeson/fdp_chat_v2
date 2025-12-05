#!/bin/bash
# Test the vector database with sample queries

set -e

echo "🧪 Vector Database Test Suite"
echo "=============================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set environment variables
export PERSIST_DIR="${PERSIST_DIR:-./vector_store/chroma_fedex}"

# Check if vector store exists
if [ ! -d "$PERSIST_DIR" ] || [ ! "$(ls -A $PERSIST_DIR)" ]; then
    echo "❌ Vector store not found at $PERSIST_DIR"
    echo "Run ./scripts/build-vector-db.sh first"
    exit 1
fi

echo ""
echo "✅ Vector store found at: $PERSIST_DIR"

# Start the Python backend in background
echo ""
echo "🚀 Starting Python FastAPI backend..."

cd backend_repo/apps/backend

# Start server in background
uvicorn app:app --host 0.0.0.0 --port 8000 > /tmp/fastapi.log 2>&1 &
FASTAPI_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if ! ps -p $FASTAPI_PID > /dev/null; then
    echo "❌ FastAPI server failed to start"
    cat /tmp/fastapi.log
    exit 1
fi

echo "✅ Server running on http://localhost:8000"

cd ../../..

# Run test queries
echo ""
echo "📝 Running test queries..."
echo ""

# Test 1: FedEx authentication
echo "Test 1: FedEx API Authentication"
echo "---------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I authenticate with FedEx API?"}')

if echo "$RESPONSE" | grep -q "answer"; then
    ANSWER=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['answer'][:150])")
    echo "✅ Response received: $ANSWER..."
else
    echo "❌ No answer in response"
    echo "$RESPONSE"
fi

echo ""
sleep 2

# Test 2: Shipment creation
echo "Test 2: Creating a shipment"
echo "---------------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create a shipment using FedEx API?"}')

if echo "$RESPONSE" | grep -q "answer"; then
    ANSWER=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['answer'][:150])")
    echo "✅ Response received: $ANSWER..."
    
    # Check for sources
    SOURCES=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('sources', [])))")
    echo "📚 Sources cited: $SOURCES"
else
    echo "❌ No answer in response"
fi

echo ""
sleep 2

# Test 3: General query (should work but may not have sources)
echo "Test 3: Rate shopping"
echo "--------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is rate shopping in FedEx?"}')

if echo "$RESPONSE" | grep -q "answer"; then
    ANSWER=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['answer'][:150])")
    echo "✅ Response received: $ANSWER..."
else
    echo "❌ No answer in response"
fi

echo ""
echo "=============================="

# Clean up
echo ""
echo "🧹 Shutting down test server..."
kill $FASTAPI_PID 2>/dev/null || true
sleep 1

echo "✅ Tests complete!"
echo ""
echo "Next steps:"
echo "  - If tests passed, push vector DB: ./scripts/push-vector-db.sh"
echo "  - Start full app: npm run dev"
