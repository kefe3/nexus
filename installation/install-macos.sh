#!/usr/bin/env bash
# ==============================================================================
# 🍎 Nexus AI Studio — macOS 1-Line Quick Installer
# ==============================================================================
set -e

INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"

if [ ! -d "$INSTALL_DIR/.git" ]; then
    echo "📥 Cloning Nexus AI Studio to $INSTALL_DIR..."
    git clone https://github.com/kefe3/nexus.git "$INSTALL_DIR"
else
    cd "$INSTALL_DIR" && git pull origin main || true
fi

cd "$INSTALL_DIR"
chmod +x macos/*.sh macos/*.command installation/*.sh 2>/dev/null || true
bash "$INSTALL_DIR/macos/install.sh" "$@"
