#!/usr/bin/env bash
# Nexus AI Studio — macOS Universal Installer
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$ROOT_DIR/macos/install.sh" ]; then
    bash "$ROOT_DIR/macos/install.sh" "$@"
else
    bash "$SCRIPT_DIR/install.sh" "$@"
fi
