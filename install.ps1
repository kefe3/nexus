# ==============================================================================
# ⚡ Nexus AI Studio — Windows PowerShell Evrensel Kurulumcu v3.0 (Native Edition)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host
Write-Host "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗" -ForegroundColor Cyan
Write-Host "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝" -ForegroundColor Cyan
Write-Host "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗" -ForegroundColor Cyan
Write-Host "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║" -ForegroundColor Cyan
Write-Host "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║" -ForegroundColor Cyan
Write-Host "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host "      ⚡ Windows Dedicated AI Studio & Cluster Platform`n" -ForegroundColor Yellow

$targetDir = "$HOME\nexus"

# 1. Git Denetimi
Write-Host "📦 1/4 Git denetleniyor..." -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ⏳ Git bulunamadı, winget ile yükleniyor..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
} else {
    Write-Host "  ✓ Git hazır!" -ForegroundColor Green
}

# 2. Kod İndirme / Güncelleme
Write-Host "`n📥 2/4 Nexus AI dosyaları hazırlanıyor ($targetDir)..." -ForegroundColor Cyan
if (Test-Path "$targetDir\.git") {
    Set-Location $targetDir
    git pull origin main -q 2>$null
    Write-Host "  ✓ Kod tabanı en güncel sürüme güncellendi!" -ForegroundColor Green
} else {
    git clone -q https://github.com/kefe3/nexus.git $targetDir 2>$null
    Set-Location $targetDir
    Write-Host "  ✓ Nexus AI dosyaları indirildi!" -ForegroundColor Green
}

# 3. Kurulum Modu Tercihi
Write-Host "`n⚙️  3/4 Kurulum Modunu Seçin:" -ForegroundColor Yellow
Write-Host "  [1] ⚡ Windows Native Yerel Kurulum (ÖNERİLEN — Docker Gerektirmez, Ultra Hızlı)" -ForegroundColor Green
Write-Host "  [2] 🐳 Docker Desktop Konteyner Kurulumu" -ForegroundColor Cyan

$modeChoice = Read-Host "Seçiminiz (1 veya 2) [Varsayılan: 1]"
if (-not $modeChoice -or $modeChoice -eq "1") {
    # NATIVE WINDOWS KURULUMU
    Write-Host "`n🚀 Windows Native Yerel Kurulum başlatılıyor..." -ForegroundColor Green
    
    # Python Kontrolü
    if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue)) {
        Write-Host "  ⏳ Python bulunamadı, winget ile otomatik kuruluyor..." -ForegroundColor Yellow
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    }

    # Ollama Kontrolü
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Host "  ⏳ Ollama motoru winget ile kuruluyor..." -ForegroundColor Yellow
        winget install Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
    }

    # Installer BAT Çalıştır
    if (Test-Path "$targetDir\windows\Nexus-Windows-Installer.bat") {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$targetDir\windows\Nexus-Windows-Installer.bat`"" -Wait
    } elseif (Test-Path "$targetDir\Nexus-Windows-Installer.bat") {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$targetDir\Nexus-Windows-Installer.bat`"" -Wait
    }
} else {
    # DOCKER KURULUMU
    Write-Host "`n🐳 Docker Desktop Kurulumu başlatılıyor..." -ForegroundColor Cyan
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "  ❌ Docker Desktop bulunamadı!" -ForegroundColor Red
        Write-Host "  İndirme sayfası açılıyor: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        Start-Process "https://www.docker.com/products/docker-desktop/"
        exit 1
    }
    
    # Compose dosyası çalıştırma
    if (Test-Path "$targetDir\docker\docker-compose.windows.yml") {
        docker compose -f "$targetDir\docker\docker-compose.windows.yml" up -d --build
    } elseif (Test-Path "$targetDir\windows\docker-compose.yml") {
        Set-Location "$targetDir\windows"
        docker compose up -d --build
    } else {
        docker compose up -d --build
    }
    Start-Process "http://localhost:3050"
}
