#!/bin/bash
# Build vector database by scraping FedEx documentation

set -e

echo "🔍 FedEx Documentation Scraper"
echo "=============================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set environment variables
export PERSIST_DIR="${PERSIST_DIR:-./vector_store/chroma_fedex}"

echo ""
echo "📁 Vector store location: $PERSIST_DIR"

# Ask for confirmation to rebuild
if [ -d "$PERSIST_DIR" ] && [ "$(ls -A $PERSIST_DIR)" ]; then
    echo ""
    echo "⚠️  Vector store already exists with data."
    read -p "Delete and rebuild? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing old vector store..."
        rm -rf "$PERSIST_DIR"
        mkdir -p "$PERSIST_DIR"
    else
        echo "ℹ️  Keeping existing data. New content will be merged."
    fi
else
    mkdir -p "$PERSIST_DIR"
fi

# Run the scraper
echo ""
echo "🕷️  Starting web scraper..."
echo "This may take 5-15 minutes depending on the site size."
echo ""

cd backend_repo/apps/ingest
python ingest.py

cd ../../..

echo ""
echo "✅ Vector database built successfully!"
echo ""
echo "📊 Vector store location: $PERSIST_DIR"
echo ""
echo "Next steps:"
echo "  1. Test the database: ./scripts/test-vector-db.sh"
echo "  2. Push to repo: ./scripts/push-vector-db.sh"
