@echo off
chcp 65001 >nul
title Nexus AI Studio - Durdurucu

cd /d "%~dp0"
echo 🛑 Nexus AI Studio durduruluyor...
docker compose down
echo ✓ Servisler durduruldu.
