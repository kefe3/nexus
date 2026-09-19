# ==============================================================================
# ⚡ Nexus AI Studio — Windows PowerShell Universal Installer v3.2.1 (Native & Docker)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host
Write-Host "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗" -ForegroundColor Cyan
Write-Host "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝" -ForegroundColor Cyan
Write-Host "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗" -ForegroundColor Cyan
Write-Host "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║" -ForegroundColor Cyan
Write-Host "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║" -ForegroundColor Cyan
Write-Host "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host "      ⚡ Windows AI Studio & Local LLM Platform v3.2.1`n" -ForegroundColor Yellow

$targetDir = "$HOME\nexus"

# 1. Git Check
Write-Host "📦 [1/4] Checking Git..." -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ⏳ Git not found. Installing via winget..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
} else {
    Write-Host "  ✓ Git is ready!" -ForegroundColor Green
}

# 2. Repository Download / Update
Write-Host "`n📥 [2/4] Preparing Nexus AI Studio files ($targetDir)..." -ForegroundColor Cyan
if (Test-Path "$targetDir\.git") {
    Set-Location $targetDir
    git pull origin main -q 2>$null
    Write-Host "  ✓ Repository updated to latest version!" -ForegroundColor Green
} else {
    git clone -q https://github.com/kefe3/nexus.git $targetDir 2>$null
    Set-Location $targetDir
    Write-Host "  ✓ Nexus AI Studio repository cloned!" -ForegroundColor Green
}

# Function to run Native Mode
function Run-Native-Install {
    Write-Host "`n🚀 Windows Native Yerel Kurulum başlatılıyor..." -ForegroundColor Green
    
    # Python Check
    if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue)) {
        Write-Host "  ⏳ Python bulunamadı. Python 3.11 winget ile kuruluyor..." -ForegroundColor Yellow
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    }

    # Ollama Check
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Host "  ⏳ Ollama motoru winget ile kuruluyor..." -ForegroundColor Yellow
        winget install Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
    }

    # Run Native Installer Batch
    $batchInstaller = "$targetDir\windows\Nexus-Windows-Installer.bat"
    if (-not (Test-Path $batchInstaller)) {
        $batchInstaller = "$targetDir\installation\install.bat"
    }
    if (Test-Path $batchInstaller) {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$batchInstaller`"" -Wait
    }
}

# 3. Installation Mode Selection
Write-Host "`n⚙️  [3/4] Kurulum Modunu Seçin:" -ForegroundColor Yellow
Write-Host "  [1] ⚡ Windows Native Mod (ÖNERİLEN — Docker Gerektirmez, Doğrudan GPU Hızlandırma & Ultra Hızlı)" -ForegroundColor Green
Write-Host "  [2] 🐳 Docker Desktop Konteyner Modu" -ForegroundColor Cyan

$modeChoice = Read-Host "Seçiminiz (1 veya 2) [Varsayılan: 1]"
if (-not $modeChoice -or $modeChoice -eq "1") {
    Run-Native-Install
} else {
    # DOCKER INSTALLATION
    Write-Host "`n🐳 Docker Desktop Modu yapılandırılıyor..." -ForegroundColor Cyan
    
    # 1. Docker CLI Kontrolü
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "  ❌ Docker CLI bulunamadı!" -ForegroundColor Red
        Write-Host "  İndirme sayfası açılıyor: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        Start-Process "https://www.docker.com/products/docker-desktop/"
        
        $fallback = Read-Host "`nDocker yerine doğrudan Windows Native Mod (Seçenek 1) ile devam edilsin mi? (E/h) [E]"
        if (-not $fallback -or $fallback -eq "E" -or $fallback -eq "e" -or $fallback -eq "Y" -or $fallback -eq "y") {
            Run-Native-Install
            exit 0
        }
        exit 1
    }

    # 2. Docker Daemon / Engine Çalışma Kontrolü
    $dockerRunning = $false
    try {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
        }
    } catch {}

    if (-not $dockerRunning) {
        Write-Host "  ⚠️ Docker Desktop kurulu ancak arka plan motoru (daemon) çalışmıyor!" -ForegroundColor Yellow
        Write-Host "  ⏳ Docker Desktop otomatik başlatılmaya çalışılıyor..." -ForegroundColor Cyan
        
        $dockerPaths = @(
            "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
            "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
            "$env:LOCALAPPDATA\Programs\Docker\Docker Desktop.exe"
        )
        $dockerExe = $dockerPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

        if ($dockerExe) {
            Start-Process -FilePath $dockerExe
            Write-Host "  ⏳ Docker Desktop başlatıldı, motorun hazır olması bekleniyor..." -ForegroundColor Yellow
            
            $retries = 25
            while ($retries -gt 0) {
                Start-Sleep -Seconds 2
                try {
                    $null = docker info 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        $dockerRunning = $true
                        Write-Host "`n  ✓ Docker Desktop motoru hazır!" -ForegroundColor Green
                        break
                    }
                } catch {}
                Write-Host -NoNewline "."
                $retries--
            }
            Write-Host ""
        }
    }

    if (-not $dockerRunning) {
        Write-Host "`n  ❌ Docker Desktop motoru henüz aktif değil veya arka planda kilitli." -ForegroundColor Red
        Write-Host "  (Hata: Docker Desktop uygulamasının 'Engine Running' yeşil durumuna geçmesi gerekir)" -ForegroundColor Yellow
        Write-Host "  💡 Tavsiye: Docker ile uğraşmak istemiyorsanız doğrudan yerel çalışan Native Mod (Seçenek 1) hemen başlatılabilir." -ForegroundColor Green
        
        $fallback = Read-Host "`nDocker yerine Windows Native Mod (Seçenek 1) ile devam edilsin mi? (E/h) [E]"
        if (-not $fallback -or $fallback -eq "E" -or $fallback -eq "e" -or $fallback -eq "Y" -or $fallback -eq "y") {
            Run-Native-Install
            exit 0
        } else {
            Write-Host "Lütfen Docker Desktop uygulamasını açın ve motor başlayınca bu komutu tekrar çalıştırın." -ForegroundColor Yellow
            exit 1
        }
    }
    
    # 3. Docker Compose Başlatma
    Write-Host "`n🚀 Docker konteynerleri derlenip başlatılıyor..." -ForegroundColor Green
    if (Test-Path "$targetDir\docker\docker-compose.windows.yml") {
        docker compose -f "$targetDir\docker\docker-compose.windows.yml" up -d --build
    } elseif (Test-Path "$targetDir\windows\docker-compose.yml") {
        Set-Location "$targetDir\windows"
        docker compose up -d --build
    } else {
        docker compose up -d --build
    }
    
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3050"
    Write-Host "`n✓ Nexus AI Studio Docker üzerinde çalışıyor: http://localhost:3050" -ForegroundColor Green
}
