#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  ⚡ Nexus AI Studio v3.1.0 — macOS Installer"
echo "==================================================="
echo ""

ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo "[+] Apple Silicon (M1/M2/M3/M4) Metal GPU Algılandı."
else
    echo "[+] Intel x86_64 İşlemci Algılandı."
fi

if ! command -v docker &> /dev/null; then
    echo "[!] Docker Desktop bulunamadı: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    git clone https://github.com/kefe3/nexus.git nexus-app
    cd nexus-app
fi

docker compose up -d

echo ""
echo "==================================================="
echo "✅ Nexus AI Studio v3.1.0 macOS Kurulumu Tamamlandı!"
echo "👉 Adres: http://localhost:3050"
echo "==================================================="
open http://localhost:3050 || true
