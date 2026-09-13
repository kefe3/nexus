@echo off
TITLE Nexus AI Studio v3.1.0 - Windows Installer
COLOR 0A
echo ===================================================
echo   ⚡ Nexus AI Studio v3.1.0 - Windows Installation
echo ===================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Docker Desktop bulunamadi. Lutfen Docker Desktop yukleyin:
    echo     https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [+] Docker tespit edildi. Nexus AI Studio kuruluyor...
if not exist "docker-compose.yml" (
    git clone https://github.com/kefe3/nexus.git nexus-app
    cd nexus-app
)

docker compose up -d

echo.
echo ===================================================
echo [V] Nexus AI Studio basariyla kuruldu!
echo [V] Adres: http://localhost:3050
echo ===================================================
start http://localhost:3050
pause
