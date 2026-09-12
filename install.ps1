# ==============================================================================
# ⚡ Nexus AI Studio — Windows PowerShell Otomatik Kurulum Betiği v2.5
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host
Write-Host "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗" -ForegroundColor Cyan
Write-Host "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝" -ForegroundColor Cyan
Write-Host "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗" -ForegroundColor Cyan
Write-Host "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║" -ForegroundColor Cyan
Write-Host "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║" -ForegroundColor Cyan
Write-Host "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host "      ⚡ Self-Hosted AI Studio & Cluster Control Platform`n" -ForegroundColor Yellow

# 1. Önceden Kurulu Olma Durumu Kontrolü
$targetDir = "$HOME\nexus"
$isInstalled = Test-Path "$targetDir\docker-compose.yml"
$isRunning = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $runningContainers = docker ps --format '{{.Names}}' 2>$null
    if ($runningContainers -match "nexus-frontend") {
        $isRunning = $true
        $isInstalled = $true
    }
}

if ($isInstalled) {
    Write-Host "ℹ️ Nexus AI Studio sisteminizde zaten kurulu bulunmaktadır!" -ForegroundColor Yellow
    if ($isRunning) {
        Write-Host "✓ Servisler şu anda aktif olarak çalışıyor: http://localhost:3050" -ForegroundColor Green
    }
    $confirm = Read-Host "Mevcut kurulumu güncellemek ve yeniden başlatmak istiyor musunuz? [E/h]"
    if ($confirm -and $confirm -notmatch "^[eEyY]") {
        Write-Host "`nKurulum sonlandırıldı. Mevcut sisteminiz çalışmaya devam ediyor." -ForegroundColor Cyan
        Write-Host "👉 AI Studio:        http://localhost:3050" -ForegroundColor Cyan
        Write-Host "👉 Kontrol Paneli:   http://localhost:3050/admin.html" -ForegroundColor Cyan
        Start-Process "http://localhost:3050"
        exit 0
    }
    Write-Host "🔄 Mevcut kurulum güncelleniyor ve servisler yenileniyor...`n" -ForegroundColor Cyan
}

# 2. Git Kontrolü
Write-Host "📦 1/4 Sistem araçları denetleniyor..." -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ⏳ Git bulunamadı, winget ile otomatik yükleniyor..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
} else {
    Write-Host "  ✓ Git hazır!" -ForegroundColor Green
}

# 3. Docker Kontrolü
Write-Host "`n🐳 2/4 Docker Altyapısı denetleniyor..." -ForegroundColor Cyan
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "  ❌ Docker Desktop bulunamadı!" -ForegroundColor Red
    Write-Host "  👉 Nexus AI Studio'yu çalıştırmak için Docker Desktop gereklidir." -ForegroundColor Yellow
    Write-Host "  İndirme sayfası açılıyor: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

# Docker Daemon Çalışıyor mu?
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️ Docker Desktop kurulu ancak şu an çalışmıyor!" -ForegroundColor Yellow
    Write-Host "  ⏳ Docker Desktop başlatılıyor, lütfen bekleyin..." -ForegroundColor Cyan
    $dockerPath = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    }
    $retry = 0
    while ($retry -lt 30) {
        Start-Sleep -Seconds 3
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            break
        }
        $retry++
        Write-Host "  ⏳ Docker motorunun hazır olması bekleniyor ($($retry * 3)s)..." -ForegroundColor DarkGray
    }
}
Write-Host "  ✓ Docker motoru aktif ve hazır!" -ForegroundColor Green

# 4. İndirme ve Kod Tabanı
Write-Host "`n📥 3/4 Nexus AI dosyaları hazırlanıyor ($targetDir)..." -ForegroundColor Cyan
if (Test-Path "$targetDir\.git") {
    Set-Location $targetDir
    git pull origin main -q 2>$null
    Write-Host "  ✓ Kod tabanı en güncel sürüme güncellendi!" -ForegroundColor Green
} else {
    git clone -q https://github.com/kefe3/nexus.git $targetDir 2>$null
    Set-Location $targetDir
    Write-Host "  ✓ Nexus AI dosyaları indirildi!" -ForegroundColor Green
}

# 5. Başlatma
Write-Host "`n⚡ 4/4 Konteynerler derleniyor ve başlatılıyor..." -ForegroundColor Cyan
if (Test-Path "$targetDir\docker-compose.windows.yml") {
    Copy-Item -Force "$targetDir\docker-compose.windows.yml" "$targetDir\docker-compose.yml"
}
docker compose up -d --build

Write-Host "`n════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 NEXUS AI STUDIO WINDOWS ÜZERİNDE BAŞARIYLA BAŞLATILDI!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  👉 Web Arayüzü:     http://localhost:3050" -ForegroundColor Cyan
Write-Host "  👉 Kontrol Paneli:  http://localhost:3050/admin.html" -ForegroundColor Cyan
Write-Host "  👉 API Portu:       http://localhost:8500" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Green

Start-Process "http://localhost:3050"


