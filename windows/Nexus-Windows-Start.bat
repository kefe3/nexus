@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Launcher

set "NEXUS_DIR=%USERPROFILE%\nexus"
cd /d "%NEXUS_DIR%"

echo 🚀 Starting Nexus AI Studio (Windows Native Edition)...

start /b ollama serve >nul 2>&1

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)
set HOST=0.0.0.0
set PORT=3050

set "APP_DIR=nexus\backend"
if not exist "%APP_DIR%" set "APP_DIR=backend"

start "Nexus AI Server" /b python -m uvicorn app.main:app --host 0.0.0.0 --port 3050 --app-dir %APP_DIR%

timeout /t 3 >nul
start http://localhost:3050
echo ✓ Nexus AI Studio is running at http://localhost:3050
