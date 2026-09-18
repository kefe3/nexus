@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Updater

:: Detect root directory
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%..\nexus\backend\requirements.txt" (
    cd /d "%SCRIPT_DIR%.."
) else if exist "%SCRIPT_DIR%nexus\backend\requirements.txt" (
    cd /d "%SCRIPT_DIR%"
) else (
    cd /d "%SCRIPT_DIR%"
)
set "ROOT_DIR=%CD%"

echo ==============================================================================
echo 🔄 Updating Nexus AI Studio from GitHub...
echo ==============================================================================
git pull origin main

set "VENV_ACTIVATE=%ROOT_DIR%\nexus\backend\venv\Scripts\activate.bat"
if not exist "%VENV_ACTIVATE%" set "VENV_ACTIVATE=%ROOT_DIR%\backend\venv\Scripts\activate.bat"
if not exist "%VENV_ACTIVATE%" set "VENV_ACTIVATE=%ROOT_DIR%\venv\Scripts\activate.bat"

if exist "%VENV_ACTIVATE%" (
    call "%VENV_ACTIVATE%"
)

if exist "%ROOT_DIR%\nexus\backend\requirements.txt" (
    pip install -r "%ROOT_DIR%\nexus\backend\requirements.txt"
) else if exist "%ROOT_DIR%\backend\requirements.txt" (
    pip install -r "%ROOT_DIR%\backend\requirements.txt"
)

echo.
echo [✓] Update completed successfully!
pause
