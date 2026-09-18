@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Native Installer

echo ===================================================
echo ⚡ Nexus AI Studio - Windows Native Installer v3.0
echo ===================================================
echo.

set "NEXUS_DIR=%USERPROFILE%\nexus"
cd /d "%NEXUS_DIR%"

echo [1/4] Checking Python 3.11+ installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Installing Python via winget...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    echo Please restart this installer after Python installation completes.
    pause
    exit /b
)

echo [2/4] Setting up Python Virtual Environment (venv)...
if not exist "backend\venv" (
    python -m venv backend\venv
)

call backend\venv\Scripts\activate.bat
echo Installing Python dependencies...
python -m pip install --upgrade pip >nul
if exist "nexus\backend\requirements.txt" (
    pip install -r nexus\backend\requirements.txt
) else (
    pip install -r backend\requirements.txt
)

echo [3/4] Checking Ollama AI Engine...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama not found. Installing Ollama via winget...
    winget install Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
)

echo [4/4] Creating Desktop Shortcut...
set "SHORTCUT=%USERPROFILE%\Desktop\Nexus AI Studio.url"
echo [InternetShortcut] > "%SHORTCUT%"
echo URL=http://localhost:3050 >> "%SHORTCUT%"
echo IconIndex=0 >> "%SHORTCUT%"

echo.
echo ===================================================
echo SUCCESS! Nexus AI Studio Native Windows Edition is installed!
echo To launch anytime: Double-click Nexus-Windows-Start.bat
echo ===================================================
pause
