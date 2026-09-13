@echo off
chcp 65001 >nul
title Nexus AI Studio - Windows Stopper

echo 🛑 Stopping Nexus AI Studio processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3050 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8500 "') do taskkill /f /pid %%a >nul 2>&1
echo ✓ Nexus AI Studio stopped.
timeout /t 2 >nul
