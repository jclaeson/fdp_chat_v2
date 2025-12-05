#!/bin/bash
# Push vector database to repository

set -e

echo "📤 Push Vector Database to Repository"
echo "====================================="

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

# Check size
SIZE=$(du -sh "$PERSIST_DIR" | cut -f1)
echo "📊 Vector store size: $SIZE"

# Ask user which method to use
echo ""
echo "Choose deployment method:"
echo "  1) Git commit (for small datasets <50MB)"
echo "  2) Git LFS (for large datasets 50MB-2GB)"
echo "  3) Azure Blob Storage (recommended for production)"
echo "  4) Skip push (just verify locally)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📦 Committing to Git..."
        git add vector_store/
        git commit -m "Update vector embeddings - $(date +%Y-%m-%d)"
        
        read -p "Push to remote? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ Pushed to remote repository"
        fi
        ;;
        
    2)
        echo ""
        echo "📦 Setting up Git LFS..."
        
        if ! command -v git-lfs &> /dev/null; then
            echo "❌ Git LFS not installed"
            echo "Install from: https://git-lfs.github.com"
            exit 1
        fi
        
        git lfs install
        git lfs track "vector_store/**/*.bin"
        git lfs track "vector_store/**/*.parquet"
        git lfs track "vector_store/**/*.sqlite3"
        
        git add .gitattributes
        git add vector_store/
        git commit -m "Update vector embeddings with LFS - $(date +%Y-%m-%d)"
        
        read -p "Push to remote? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ Pushed to remote repository with LFS"
        fi
        ;;
        
    3)
        echo ""
        echo "☁️  Azure Blob Storage Upload"
        echo ""
        
        read -p "Storage account name: " STORAGE_ACCOUNT
        read -p "Container name (default: fedex-vectors): " CONTAINER
        CONTAINER=${CONTAINER:-fedex-vectors}
        
        echo ""
        echo "Uploading to Azure..."
        
        if ! command -v az &> /dev/null; then
            echo "❌ Azure CLI not installed"
            echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            exit 1
        fi
        
        # Create container if it doesn't exist
        az storage container create \
            --account-name "$STORAGE_ACCOUNT" \
            --name "$CONTAINER" \
            --auth-mode login 2>/dev/null || true
        
        # Upload files
        az storage blob upload-batch \
            --account-name "$STORAGE_ACCOUNT" \
            --destination "$CONTAINER" \
            --source "$PERSIST_DIR" \
            --auth-mode login \
            --overwrite
        
        echo ""
        echo "✅ Uploaded to Azure Blob Storage"
        echo ""
        echo "📝 Set these environment variables in your deployment:"
        echo "   PERSIST_DIR=/mnt/vectors"
        echo ""
        echo "📝 Mount command for Azure App Service:"
        echo "   az webapp config storage-account add \\"
        echo "     --resource-group <your-rg> \\"
        echo "     --name <your-app> \\"
        echo "     --custom-id vectors \\"
        echo "     --storage-type AzureBlob \\"
        echo "     --account-name $STORAGE_ACCOUNT \\"
        echo "     --share-name $CONTAINER \\"
        echo "     --mount-path /mnt/vectors"
        ;;
        
    4)
        echo ""
        echo "✅ Skipping push - vector store ready for local testing"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Vector database deployment complete!"
