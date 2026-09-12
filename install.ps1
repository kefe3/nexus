# ==============================================================================
# ⚡ Nexus AI Studio — Windows PowerShell Otomatik Kurulum Betiği
# ==============================================================================

Write-Host "⚡ Nexus AI Studio Windows Kurulumu Başlatılıyor..." -ForegroundColor Cyan

# 1. Git Kontrolü
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Git bulunamadı, winget ile yükleniyor..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget
}

# 2. Docker Kontrolü
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "🐳 Docker Desktop bulunamadı. Lütfen https://www.docker.com/products/docker-desktop/ adresinden Docker Desktop indirip kurun." -ForegroundColor Red
    Start-Process "https://www.docker.com/products/docker-desktop/"
    exit 1
}

# 3. İndirme ve Çalıştırma
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

