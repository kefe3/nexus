#!/usr/bin/env bash
# Nexus AI Studio — macOS Universal Uninstaller
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$ROOT_DIR/macos/uninstall.sh" ]; then
    bash "$ROOT_DIR/macos/uninstall.sh" "$@"
else
    bash "$SCRIPT_DIR/uninstall.sh" "$@"
fi
