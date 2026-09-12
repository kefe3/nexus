# ==============================================================================
# ⚡ Nexus AI Studio — Windows PowerShell Otomatik Kurulum Betiği
# ==============================================================================

Write-Host "⚡ Nexus AI Studio Windows Kurulumu Başlatılıyor..." -ForegroundColor Cyan

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
        exit 0
    }
    Write-Host "🔄 Mevcut kurulum güncelleniyor ve servisler yenileniyor...`n" -ForegroundColor Cyan
}

# 2. Git Kontrolü
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Git bulunamadı, winget ile yükleniyor..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget
}

# 3. Docker Kontrolü
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "🐳 Docker Desktop bulunamadı. Lütfen https://www.docker.com/products/docker-desktop/ adresinden Docker Desktop indirip kurun." -ForegroundColor Red
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

# 4. İndirme ve Çalıştırma
$targetDir = "$HOME\nexus"
if (Test-Path "$targetDir\.git") {
    Write-Host "📥 Nexus AI güncelleniyor..." -ForegroundColor Yellow
    Set-Location $targetDir
    git pull origin main -q 2>$null
} else {
    Write-Host "📥 Nexus AI kuruluyor ($targetDir)..." -ForegroundColor Yellow
    git clone -q https://github.com/kefe3/nexus.git $targetDir 2>$null
    Set-Location $targetDir
}

# 4. Bağımlılıklar ve Servisler
Write-Host "⚙️ Gereken eksik kütüphane ve bağımlılıklar kuruluyor..." -ForegroundColor Yellow
docker compose build -q 2>$null

Write-Host "⚡ Nexus AI servisleri başlatılıyor..." -ForegroundColor Yellow
docker compose up -d 2>$null

Write-Host "`n🎉 NEXUS AI STUDIO BAŞARIYLA ÇALIŞIYOR!" -ForegroundColor Green
Write-Host "👉 AI Studio:        http://localhost:3050" -ForegroundColor Cyan
Write-Host "👉 Kontrol Paneli:   http://localhost:3050/admin.html" -ForegroundColor Cyan

