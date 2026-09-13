@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Updater

set "NEXUS_DIR=%USERPROFILE%\nexus"
cd /d "%NEXUS_DIR%"

echo 🔄 Updating Nexus AI Studio from GitHub...
git pull origin main

call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt

echo ✓ Update completed successfully!
pause
