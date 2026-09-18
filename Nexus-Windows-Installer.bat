@echo off
chcp 65001 >nul
title Nexus AI Studio — Windows Native Installer & Setup
color 0b

echo.
echo  ===================================================================
echo    ⚡ Nexus AI Studio — Windows Native Edition (Yerel Sürüm)
echo  ===================================================================
echo    Docker gerektirmez! Doğrudan Windows üzerinde NVIDIA GPU hızlandırma
echo    ve bağımsız Python mimarisiyle tek tıkla kurulum yapar.
echo  ===================================================================
echo.

cd /d "%~dp0"

:: 1. Python Kontrolü
echo [1/5] Python çalışma ortamı denetleniyor...
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [!] Python bulunamadı. Winget ile Python 3.11 otomatik kuruluyor...
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
        if %errorlevel% neq 0 (
            echo [X] Python otomatik kurulamadı. Lütfen https://www.python.org/downloads/ adresinden Python kurup 'Add to PATH' seçeneğini işaretleyin.
            pause
            exit /b 1
        )
        echo [+] Python kuruldu. PATH güncelleniyor...
        set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
    )
)

:: Python komutunu belirle
set "PY_CMD=python"
python --version >nul 2>nul || set "PY_CMD=py -3"

for /f "tokens=*" %%v in ('%PY_CMD% --version 2^>^&1') do set "PY_VER=%%v"
echo [+] Bulunan Python: %PY_VER%

:: 2. Sanal Ortam (venv) Kurulumu
echo.
echo [2/5] Bağımsız sanal çalışma ortamı (venv) hazırlanıyor...
if not exist "venv" (
    %PY_CMD% -m venv venv
    if %errorlevel% neq 0 (
        echo [X] Sanal ortam oluşturulamadı!
        pause
        exit /b 1
    )
    echo [+] 'venv' klasörü oluşturuldu.
) else (
    echo [+] 'venv' mevcut.
)

:: 3. Python Bağımlılıklarının Kurulumu
echo.
echo [3/5] Nexus AI kütüphaneleri (FastAPI, Uvicorn, Psutil, HTTPX) kuruluyor...
call venv\Scripts\activate.bat
if exist "nexus\backend\requirements.txt" (
    python -m pip install -r nexus\backend\requirements.txt
) else (
    python -m pip install -r backend\requirements.txt
)
if %errorlevel% neq 0 (
    echo [X] Kütüphane kurulumunda hata oluştu!
    pause
    exit /b 1
)
echo [+] Tüm bağımlılıklar başarıyla yüklendi.

:: 4. Ollama Kontrolü & Kurulumu
echo.
echo [4/5] Ollama Yapay Zeka Motoru kontrol ediliyor...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Ollama Windows üzerinde kurulu değil.
    echo     Ollama'yı şimdi kurmak ister misiniz? (E/H)
    set /p INSTALL_OLLAMA="Seçiminiz (E/H) [Varsayılan: E]: "
    if /i "%INSTALL_OLLAMA%" neq "h" (
        echo [*] Winget ile Ollama kuruluyor...
        winget install Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
        echo [+] Ollama kuruldu!
    )
) else (
    echo [+] Ollama tespit edildi.
)

:: 5. Masaüstü Kısayolu Oluşturma
echo.
echo [5/5] Masaüstü kısayolu oluşturuluyor...
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Nexus AI Studio.lnk"
set "TARGET_BAT=%~dp0Nexus-Windows-Start.bat"
set "VBS_SCRIPT=%TEMP%\CreateShortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%TARGET_BAT%" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%VBS_SCRIPT%"
echo oLink.Description = "Nexus AI Studio — Yerel Yapay Zeka ve Kontrol Paneli" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"
cscript //nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%" >nul 2>nul
echo [+] Masaüstüne 'Nexus AI Studio' kısayolu eklendi!

echo.
echo  ===================================================================
echo    🎉 TEBRİKLER! Nexus AI Windows Sürümü Kurulumu Tamamlandı!
echo  ===================================================================
echo    Nexus AI Studio'yu başlatmak için:
echo    - Masaüstündeki 'Nexus AI Studio' kısayoluna çift tıklayın, veya
echo    - Bu klasördeki 'Nexus-Windows-Start.bat' dosyasını çalıştırın.
echo  ===================================================================
echo.

set /p RUN_NOW="Nexus AI Studio şimdi başlatılsın mı? (E/H) [E]: "
if /i "%RUN_NOW%" neq "h" (
    start "" "%~dp0Nexus-Windows-Start.bat"
)
exit /b 0
