@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Launcher v3.2.1

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
echo ⚡ Starting Nexus AI Studio (Windows Native Edition v3.2.1)...
echo ==============================================================================
echo.

:: 1. Ensure Ollama service is running
echo [*] Checking Ollama AI background service...
tasklist /fi "imagename eq ollama.exe" 2>nul | findstr /i "ollama.exe" >nul
if %errorlevel% neq 0 (
    echo [*] Launching Ollama background engine...
    start "Ollama Engine" /b ollama serve >nul 2>&1
)

:: 2. Activate Python Virtual Environment
set "VENV_ACTIVATE=%ROOT_DIR%\nexus\backend\venv\Scripts\activate.bat"
if not exist "%VENV_ACTIVATE%" set "VENV_ACTIVATE=%ROOT_DIR%\backend\venv\Scripts\activate.bat"
if not exist "%VENV_ACTIVATE%" set "VENV_ACTIVATE=%ROOT_DIR%\venv\Scripts\activate.bat"

if exist "%VENV_ACTIVATE%" (
    call "%VENV_ACTIVATE%"
)

set "APP_DIR=%ROOT_DIR%\nexus\backend"
if not exist "%APP_DIR%" set "APP_DIR=%ROOT_DIR%\backend"
if not exist "%APP_DIR%" set "APP_DIR=%ROOT_DIR%"

set HOST=0.0.0.0
set PORT=3050

echo [*] Launching Nexus AI Studio backend on port 3050...
start "Nexus AI Studio Server" /b python -m uvicorn app.main:app --host 0.0.0.0 --port 3050 --app-dir "%APP_DIR%"

timeout /t 2 >nul
echo [✓] Opening browser at http://localhost:3050...
start http://localhost:3050

echo.
echo ==============================================================================
echo [✓] Nexus AI Studio is now running!
echo  • Web UI:        http://localhost:3050
echo  • Control Panel: http://localhost:3050/admin.html
echo  • To Stop:       Double-click windows\Nexus-Windows-Stop.bat
echo ==============================================================================
echo.
pause
