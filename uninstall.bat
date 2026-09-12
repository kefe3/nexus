@echo off
chcp 65001 >nul
title Nexus AI Studio - Kaldirici

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
if %ERRORLEVEL% NEQ 0 (
    pause
)
