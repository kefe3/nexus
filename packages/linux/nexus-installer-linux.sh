#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  ⚡ Nexus AI Studio v3.1.0 — Linux Installer"
echo "==================================================="
echo ""

if command -v nvidia-smi &> /dev/null; then
    echo "[+] NVIDIA CUDA GPU Algılandı."
elif [ -d "/sys/class/drm" ]; then
    echo "[+] AMD Radeon ROCm / DRM Algılandı."
fi

if ! command -v docker &> /dev/null; then
    echo "[!] Docker bulunamadı: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    git clone https://github.com/kefe3/nexus.git nexus-app
    cd nexus-app
fi

docker compose up -d

echo ""
echo "==================================================="
echo "✅ Nexus AI Studio v3.1.0 Linux Kurulumu Tamamlandı!"
echo "👉 Adres: http://localhost:3050"
echo "==================================================="
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3050 || true
fi
