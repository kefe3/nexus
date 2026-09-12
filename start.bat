@echo off
chcp 65001 >nul
title Nexus AI Studio - Baslatici

cd /d "%~dp0"
echo ⚡ Nexus AI Studio baslatiliyor...
docker compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Nexus AI basariyla baslatildi!
    echo 👉 http://localhost:3050
    start http://localhost:3050
) else (
    echo.
    echo ❌ Baslatma hatasi! Docker Desktop'in acik oldugundan emin olun.
    pause
)
