@echo off
chcp 65001 >nul
title Nexus AI Studio — Windows Updater
color 0e

cd /d "%~dp0"

echo.
echo  ===================================================================
echo    🔄 Nexus AI Studio — Windows Güncelleyici
echo  ===================================================================
echo.

echo [*] En güncel sürüm GitHub'dan çekiliyor...
git pull origin main

if exist "venv\Scripts\activate.bat" (
    echo [*] Kütüphaneler güncelleniyor...
    call venv\Scripts\activate.bat
    python -m pip install -r backend\requirements.txt --quiet
)

echo.
echo [+] Güncelleme başarıyla tamamlandı!
echo.
set /p RESTART_NOW="Nexus AI Studio şimdi yeniden başlatılsın mı? (E/H) [E]: "
if /i "%RESTART_NOW%" neq "h" (
    call Nexus-Windows-Stop.bat
    start "" "%~dp0Nexus-Windows-Start.bat"
)
exit /b 0
