#!/bin/bash
# Stop all development services

echo "🛑 Stopping all services..."

# Kill processes from PID files
if [ -f "logs/python.pid" ]; then
    kill $(cat logs/python.pid) 2>/dev/null && echo "✅ Stopped Python backend"
    rm logs/python.pid
fi

if [ -f "logs/nodejs.pid" ]; then
    kill $(cat logs/nodejs.pid) 2>/dev/null && echo "✅ Stopped Node.js frontend"
    rm logs/nodejs.pid
fi

# Fallback: kill by port
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Cleaned up port 8000"
lsof -ti:5000 | xargs kill -9 2>/dev/null && echo "✅ Cleaned up port 5000"

echo "✨ All services stopped"
