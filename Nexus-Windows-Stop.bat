@echo off
chcp 65001 >nul
title Nexus AI Studio — Stop Processes
color 0c

cd /d "%~dp0"

echo.
echo [*] Nexus AI Studio Windows süreçleri sonlandırılıyor...

:: Port 3050 ve 8500'ü dinleyen python/uvicorn süreçlerini bul ve sonlandır
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3050 "') do (
    if "%%a" neq "0" taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8500 "') do (
    if "%%a" neq "0" taskkill /F /PID %%a >nul 2>nul
)

:: Docker çalışıyorsa onu da durdur
where docker >nul 2>nul
if %errorlevel% equ 0 (
    docker compose -f docker-compose.windows.yml down >nul 2>nul
    docker compose down >nul 2>nul
)

echo [+] Nexus AI Studio başarıyla durduruldu.
timeout /t 2 /nobreak >nul
exit /b 0
