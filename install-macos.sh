#!/usr/bin/env bash
# Nexus AI Studio — macOS Universal Installer
cd "$(dirname "$0")"
if [ -f "macos/install.sh" ]; then
    bash macos/install.sh "$@"
else
    bash install.sh "$@"
fi
