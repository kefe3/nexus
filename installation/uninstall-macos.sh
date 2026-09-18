#!/usr/bin/env bash
# ==============================================================================
# 🗑️ Nexus AI Studio — macOS 1-Line Quick Uninstaller
# ==============================================================================

INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"
if [ -f "$INSTALL_DIR/macos/uninstall.sh" ]; then
    bash "$INSTALL_DIR/macos/uninstall.sh" "$@"
else
    lsof -ti:3050 | xargs kill -9 2>/dev/null || true
    lsof -ti:8500 | xargs kill -9 2>/dev/null || true
    rm -f "$HOME/Desktop/Nexus AI Studio.command" 2>/dev/null || true
    echo "✓ Stopped processes and removed desktop launcher."
fi
