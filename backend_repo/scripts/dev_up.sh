#!/usr/bin/env bash
set -e
SESSION=fedex_dev
PROJ=$(cd "$(dirname "$0")/.." && pwd)

tmux has-session -t $SESSION 2>/dev/null && { tmux attach -t $SESSION; exit 0; }

tmux new-session -d -s $SESSION -c "$PROJ"
tmux send-keys -t $SESSION:0.0 'ollama serve' C-m

tmux split-window -v -t $SESSION:0 -c "$PROJ"
tmux send-keys -t $SESSION:0.1 'source .venv/bin/activate 2>/dev/null || true; uvicorn apps.backend.app:app --reload --port 8000' C-m

tmux split-window -h -t $SESSION:0.1 -c "$PROJ"
tmux send-keys -t $SESSION:0.2 'source .venv/bin/activate 2>/dev/null || true; echo "Run: python apps/ingest/ingest.py && python query.py"' C-m

tmux select-pane -t $SESSION:0.2
tmux attach -t $SESSION
