#!/usr/bin/env bash
# ==============================================================================
# 🍎 Nexus AI Studio — macOS Stopper
# ==============================================================================

echo "=============================================================================="
echo "🛑 Stopping Nexus AI Studio on macOS..."
echo "=============================================================================="

# Stop port 3050 & 8500
lsof -ti:3050 | xargs kill -9 2>/dev/null || true
lsof -ti:8500 | xargs kill -9 2>/dev/null || true

# Stop Docker containers if running
if command -v docker >/dev/null 2>&1; then
    docker stop nexus-backend nexus-frontend 2>/dev/null || true
fi

echo "✓ All Nexus AI Studio services stopped."
sleep 1
