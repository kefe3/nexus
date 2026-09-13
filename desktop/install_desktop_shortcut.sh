#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.local/share/applications"

mkdir -p "$TARGET_DIR"
cp "$SCRIPT_DIR/nexus.desktop" "$TARGET_DIR/nexus.desktop"
chmod +x "$TARGET_DIR/nexus.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$TARGET_DIR"
fi

echo "✅ Nexus AI Studio Masaüstü Kısayolu Başarıyla Yüklendi!"
echo "📍 Konum: $TARGET_DIR/nexus.desktop"
