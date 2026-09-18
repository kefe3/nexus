#!/usr/bin/env bash
# ==============================================================================
# 🍎 Nexus AI Studio — macOS Native Launcher v3.2.0
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/../nexus/backend/requirements.txt" ]; then
    ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [ -f "$SCRIPT_DIR/nexus/backend/requirements.txt" ]; then
    ROOT_DIR="$SCRIPT_DIR"
else
    ROOT_DIR="${NEXUS_DIR:-$HOME/nexus}"
fi

cd "$ROOT_DIR"

echo "=============================================================================="
echo "⚡ Starting Nexus AI Studio (macOS Native Edition v3.2.0)..."
echo "=============================================================================="

# 1. Ensure Ollama is running
if command -v ollama >/dev/null 2>&1; then
    if ! pgrep -x "ollama" >/dev/null 2>&1; then
        echo "🦙 Starting Ollama AI engine in background..."
        ollama serve >/dev/null 2>&1 &
        sleep 1
    fi
fi

# 2. Activate Virtualenv
VENV_ACTIVATE="$ROOT_DIR/nexus/backend/venv/bin/activate"
if [ ! -f "$VENV_ACTIVATE" ]; then
    VENV_ACTIVATE="$ROOT_DIR/backend/venv/bin/activate"
fi

if [ -f "$VENV_ACTIVATE" ]; then
    source "$VENV_ACTIVATE"
fi

APP_DIR="$ROOT_DIR/nexus/backend"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="$ROOT_DIR/backend"
fi

export HOST=0.0.0.0
export PORT=3050

echo "🚀 Launching Nexus AI Studio server on port 3050..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3050 --app-dir "$APP_DIR" &
SERVER_PID=$!

sleep 2
echo "🌐 Opening browser at http://localhost:3050..."
open "http://localhost:3050" || true

echo ""
echo "=============================================================================="
echo "✓ Nexus AI Studio is running (PID: $SERVER_PID)"
echo "  • Web UI:        http://localhost:3050"
echo "  • Control Panel: http://localhost:3050/admin.html"
echo "  • To stop:       Double click macos/Nexus-Mac-Stop.command or press Ctrl+C"
echo "=============================================================================="
echo ""

wait $SERVER_PID
