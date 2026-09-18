#!/usr/bin/env bash
# ==============================================================================
# 🗑️ Nexus AI Studio — macOS Uninstaller v3.2.0
# ==============================================================================

echo "=============================================================================="
echo "🗑️ Nexus AI Studio — macOS Uninstaller"
echo "=============================================================================="

# 1. Stop background processes
lsof -ti:3050 | xargs kill -9 2>/dev/null || true
lsof -ti:8500 | xargs kill -9 2>/dev/null || true

# 2. Stop Docker containers
if command -v docker >/dev/null 2>&1; then
    docker stop nexus-backend nexus-frontend 2>/dev/null || true
    docker rm nexus-backend nexus-frontend 2>/dev/null || true
fi

# 3. Remove Desktop Launcher
rm -f "$HOME/Desktop/Nexus AI Studio.command" 2>/dev/null || true

# 4. Remove installation files if requested
INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"
if [ -d "$INSTALL_DIR" ]; then
    read -p "Do you want to delete all Nexus AI Studio files ($INSTALL_DIR)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        echo "✓ Nexus directory deleted."
    fi
fi

echo "✅ Nexus AI Studio has been cleanly uninstalled from macOS."
