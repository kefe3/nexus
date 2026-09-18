@echo off
chcp 65001 >nul
title Nexus AI Studio — Running (Port 3050)
color 0a

cd /d "%~dp0"

:: 1. Ollama Kontrolü & Arka Planda Başlatma
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 1).StatusCode } catch { exit 1 }" >nul 2>nul
    if %errorlevel% neq 0 (
        echo [*] Yerel Ollama motoru arka planda başlatılıyor...
        start /b "" ollama serve >nul 2>nul
        timeout /t 2 /nobreak >nul
    )
)

:: 2. Venv Kontrolü
if not exist "venv\Scripts\activate.bat" (
    echo [!] 'venv' bulunamadı. Önce Nexus-Windows-Installer.bat çalıştırılıyor...
    call Nexus-Windows-Installer.bat
    exit /b 0
)

call venv\Scripts\activate.bat

:: 3. Tarayıcıyı 2 saniye sonra otomatik aç
start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3050"

echo.
echo  ===================================================================
echo    ⚡ Nexus AI Studio (Windows Native Sürümü) Çalışıyor!
echo  ===================================================================
echo    🌐 Web Studio:     http://localhost:3050
echo    ⚙️  Kontrol Paneli: http://localhost:3050/admin.html
echo    📡 Backend API:    http://localhost:3050/api
echo  ===================================================================
echo    Durdurmak için bu pencereyi kapatabilir veya 'Nexus-Windows-Stop.bat'
echo    çalıştırabilirsiniz.
echo  ===================================================================
echo.

if exist "nexus\backend" (
    cd nexus\backend
) else if exist "backend" (
    cd backend
)
python -m uvicorn app.main:app --host 0.0.0.0 --port 3050 --log-level info
pause
