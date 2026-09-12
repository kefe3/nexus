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
    Write-Host "🔄 Nexus güncelleniyor..." -ForegroundColor Yellow
    Set-Location $targetDir
    git pull origin main
} else {
    Write-Host "📥 Nexus indiriliyor..." -ForegroundColor Yellow
    git clone https://github.com/kefe3/nexus.git $targetDir
    Set-Location $targetDir
}

# 4. Docker Compose Başlatma
Write-Host "🚀 Nexus servisleri Docker ile başlatılıyor..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host "`n🎉 NEXUS AI STUDIO BAŞARIYLA ÇALIŞIYOR!" -ForegroundColor Green
Write-Host "👉 AI Studio:        http://localhost:3050" -ForegroundColor Cyan
Write-Host "👉 Kontrol Paneli:   http://localhost:3050/admin.html" -ForegroundColor Cyan
