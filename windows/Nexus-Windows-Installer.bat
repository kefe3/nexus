@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Native Installer v3.2.1

echo ==============================================================================
echo   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
echo   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
echo   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
echo   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
echo   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
echo   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo       ⚡ Nexus AI Studio - Windows Native Installer v3.2.1
echo ==============================================================================
echo.

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
echo [Info] Working Directory: %ROOT_DIR%

:: 1. Check Python
echo [1/4] Checking Python 3.10+ installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [!] Python not found. Installing Python 3.11 via winget...
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
        echo Please restart this installer after Python installation completes.
        pause
        exit /b 1
    )
)
echo [✓] Python is available!

:: 2. Setup Virtual Environment
echo [2/4] Setting up Python Virtual Environment (venv)...
if not exist "nexus\backend\venv" (
    if not exist "backend\venv" (
        python -m venv "%ROOT_DIR%\nexus\backend\venv" 2>nul || py -m venv "%ROOT_DIR%\nexus\backend\venv"
    )
)

set "VENV_ACTIVATE=%ROOT_DIR%\nexus\backend\venv\Scripts\activate.bat"
if not exist "%VENV_ACTIVATE%" set "VENV_ACTIVATE=%ROOT_DIR%\backend\venv\Scripts\activate.bat"
if not exist "%VENV_ACTIVATE%" set "VENV_ACTIVATE=%ROOT_DIR%\venv\Scripts\activate.bat"

if exist "%VENV_ACTIVATE%" (
    call "%VENV_ACTIVATE%"
    echo [✓] Virtual environment activated.
) else (
    echo [!] Warning: Virtual environment could not be created automatically. Proceeding with system Python...
)

echo [*] Installing Python backend dependencies...
python -m pip install --upgrade pip >nul 2>&1
if exist "%ROOT_DIR%\nexus\backend\requirements.txt" (
    pip install -r "%ROOT_DIR%\nexus\backend\requirements.txt"
) else if exist "%ROOT_DIR%\backend\requirements.txt" (
    pip install -r "%ROOT_DIR%\backend\requirements.txt"
)

:: 3. Check Ollama AI Engine
echo [3/4] Checking Ollama AI Engine...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Ollama not found. Installing Ollama via winget...
    winget install Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
) else (
    echo [✓] Ollama AI Engine is ready!
)

:: 4. Create Desktop Shortcuts
echo [4/4] Creating Desktop Launcher & Shortcuts...
set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\Nexus AI Studio.url"
echo [InternetShortcut] > "%DESKTOP_SHORTCUT%"
echo URL=http://localhost:3050 >> "%DESKTOP_SHORTCUT%"
echo IconIndex=0 >> "%DESKTOP_SHORTCUT%"

echo.
echo ==============================================================================
echo [SUCCESS] Nexus AI Studio Native Windows Edition is installed!
echo.
echo  • To launch anytime: Double-click windows\Nexus-Windows-Start.bat
echo  • To stop anytime:   Double-click windows\Nexus-Windows-Stop.bat
echo  • Web UI Address:    http://localhost:3050
echo  • Control Panel:     http://localhost:3050/admin.html
echo ==============================================================================
echo.
set /p START_NOW="Would you like to start Nexus AI Studio now? (Y/N) [Y]: "
if /i "%START_NOW%"=="" set START_NOW=Y
if /i "%START_NOW%"=="Y" (
    if exist "%ROOT_DIR%\windows\Nexus-Windows-Start.bat" (
        call "%ROOT_DIR%\windows\Nexus-Windows-Start.bat"
    ) else if exist "%ROOT_DIR%\Nexus-Windows-Start.bat" (
        call "%ROOT_DIR%\Nexus-Windows-Start.bat"
    )
)
