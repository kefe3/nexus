@echo off
cd /d "%~dp0\.."
if exist "windows\Nexus-Windows-Installer.bat" (
    call windows\Nexus-Windows-Installer.bat
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
)
