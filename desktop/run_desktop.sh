#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "⚡ Starting Nexus AI Studio Native Desktop Client..."
if [ -d "$SCRIPT_DIR/venv" ]; then
    "$SCRIPT_DIR/venv/bin/python" "$SCRIPT_DIR/main_desktop.py" "$@"
else
    python3 "$SCRIPT_DIR/main_desktop.py" "$@"
fi
