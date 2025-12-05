#!/bin/bash
# All-in-one script: Setup, build, test, and deploy

set -e

echo "🚀 FedEx Developer Portal Assistant - Complete Setup"
echo "====================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Setup
echo -e "${GREEN}Step 1/4: Setting up local environment${NC}"
echo ""
./scripts/setup-local.sh

# Step 2: Build vector database
echo ""
echo -e "${GREEN}Step 2/4: Building vector database${NC}"
echo ""
read -p "Build vector database now? This will take 5-15 minutes. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./scripts/build-vector-db.sh
else
    echo -e "${YELLOW}⚠️  Skipping vector database build${NC}"
    echo "You can build it later with: ./scripts/build-vector-db.sh"
fi

# Step 3: Test
if [ -d "vector_store/chroma_fedex" ] && [ "$(ls -A vector_store/chroma_fedex)" ]; then
    echo ""
    echo -e "${GREEN}Step 3/4: Testing RAG system${NC}"
    echo ""
    read -p "Run tests now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/test-vector-db.sh
    else
        echo -e "${YELLOW}⚠️  Skipping tests${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}Step 3/4: Skipping tests (no vector database found)${NC}"
fi

# Step 4: Deploy
if [ -d "vector_store/chroma_fedex" ] && [ "$(ls -A vector_store/chroma_fedex)" ]; then
    echo ""
    echo -e "${GREEN}Step 4/4: Deploy vector database${NC}"
    echo ""
    read -p "Push vector database to repository/cloud? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/push-vector-db.sh
    else
        echo -e "${YELLOW}⚠️  Skipping deployment${NC}"
        echo "You can deploy later with: ./scripts/push-vector-db.sh"
    fi
else
    echo ""
    echo -e "${YELLOW}Step 4/4: Skipping deployment (no vector database found)${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "✨ Setup complete!"
echo ""
echo "📋 Quick commands:"
echo "   Start development:  ./scripts/start-dev.sh"
echo "   Stop services:      ./scripts/stop-dev.sh"
echo "   Rebuild database:   ./scripts/build-vector-db.sh"
echo "   Run tests:          ./scripts/test-vector-db.sh"
echo ""
echo "📖 For more information:"
echo "   Quick start:  cat QUICKSTART.md"
echo "   Scripts:      cat scripts/README.md"
echo "   Full docs:    cat README.md"
echo ""
