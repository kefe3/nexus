@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Stopper

echo ==============================================================================
echo 🛑 Stopping Nexus AI Studio processes...
echo ==============================================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3050 "') do (
    if not "%%a"=="0" (
        echo Stopping PID: %%a on port 3050...
        taskkill /f /pid %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8500 "') do (
    if not "%%a"=="0" (
        echo Stopping PID: %%a on port 8500...
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo.
echo [✓] All Nexus AI Studio services have been stopped.
timeout /t 2 >nul
