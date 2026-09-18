#!/usr/bin/env bash
# Nexus AI Studio — macOS Universal Uninstaller
cd "$(dirname "$0")"
if [ -f "macos/uninstall.sh" ]; then
    bash macos/uninstall.sh "$@"
else
    bash uninstall.sh "$@"
fi
