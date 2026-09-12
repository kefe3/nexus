@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Kurulum

echo ⚡ Nexus AI Studio Windows Kurulumu Baslatiliyor...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Kurulum sirasinda bir hata olustu.
    pause
)
