#!/usr/bin/env bash
# ==============================================================================
# 🍎 Nexus AI Studio — macOS Updater
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
echo "🔄 Updating Nexus AI Studio on macOS..."
echo "=============================================================================="

git pull origin main

VENV_ACTIVATE="$ROOT_DIR/nexus/backend/venv/bin/activate"
if [ ! -f "$VENV_ACTIVATE" ]; then
    VENV_ACTIVATE="$ROOT_DIR/backend/venv/bin/activate"
fi

if [ -f "$VENV_ACTIVATE" ]; then
    source "$VENV_ACTIVATE"
fi

if [ -f "$ROOT_DIR/nexus/backend/requirements.txt" ]; then
    pip install -r "$ROOT_DIR/nexus/backend/requirements.txt"
elif [ -f "$ROOT_DIR/backend/requirements.txt" ]; then
    pip install -r "$ROOT_DIR/backend/requirements.txt"
fi

echo "✓ Update completed successfully!"
read -p "Press Enter to exit..."
