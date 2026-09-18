@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Updater

set "NEXUS_DIR=%USERPROFILE%\nexus"
cd /d "%NEXUS_DIR%"

echo 🔄 Updating Nexus AI Studio from GitHub...
git pull origin main

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
)

if exist "nexus\backend\requirements.txt" (
    pip install -r nexus\backend\requirements.txt
) else if exist "backend\requirements.txt" (
    pip install -r backend\requirements.txt
)

echo ✓ Update completed successfully!
pause
