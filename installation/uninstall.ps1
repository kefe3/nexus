# ==============================================================================
# 🗑️ Nexus AI Studio — Windows PowerShell Akıllı Kaldırma Betiği (Uninstaller v2.0)
# ==============================================================================

param(
    [switch]$Yes,
    [switch]$PurgeData,
    [switch]$KeepData
)

Clear-Host
Write-Host "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗" -ForegroundColor Red
Write-Host "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝" -ForegroundColor Red
Write-Host "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗" -ForegroundColor Red
Write-Host "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║" -ForegroundColor Red
Write-Host "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║" -ForegroundColor Red
Write-Host "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor Red
Write-Host "      🗑️ Nexus AI Studio Windows Kaldırma ve Temizlik Sihirbazı`n" -ForegroundColor Yellow

# 1. Nexus Dizin Tespiti
$foundDir = ""
$candidates = @(
    $env:NEXUS_DIR,
    (Get-Location).Path,
    "$HOME\nexus",
    "$HOME\.nexus"
)

foreach ($dir in $candidates) {
    if ($dir -and (Test-Path "$dir\docker-compose.yml")) {
        $foundDir = $dir
        break
    }
}

# 2. Çalışan Konteyner Tespiti
$containersFound = @()
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $existingContainers = docker ps -a --format '{{.Names}}' 2>$null
    foreach ($c in @("nexus-frontend", "nexus-backend", "nexus-ollama", "nexus-ai-frontend", "nexus-ai-backend")) {
        if ($existingContainers -match "^$c$") {
            $containersFound += $c
        }
    }
}

if (-not $foundDir -and $containersFound.Count -eq 0) {
    Write-Host "✓ Sisteminizde herhangi bir Nexus AI konteyneri veya kurulum kalıntısı bulunmuyor (Sistem temiz).`n" -ForegroundColor Green
    exit 0
}

# 3. Kullanıcı Onayı
if (-not $Yes) {
    Write-Host "Nexus AI Studio sisteminizden tamamen kaldırılacaktır." -ForegroundColor Yellow
    if ($foundDir) { Write-Host "📁 Dizin: $foundDir" -ForegroundColor Cyan }
    if ($containersFound.Count -gt 0) { Write-Host "🐳 Konteynerler: $($containersFound -join ', ')" -ForegroundColor Cyan }
    Write-Host ""
    $confirm = Read-Host "Kaldırma işlemine devam etmek istiyor musunuz? [E/h]"
    if ($confirm -and $confirm -notmatch "^[eEyY]") {
        Write-Host "`nKaldırma işlemi iptal edildi." -ForegroundColor Cyan
        exit 0
    }

    if (-not $PurgeData -and -not $KeepData) {
        Write-Host "`n📁 Kullanıcı Verileri:" -ForegroundColor Yellow
        Write-Host "Sohbet geçmişleri ve ayarlar 'data\' klasöründe saklanmaktadır."
        $confirmData = Read-Host "Bu verileri de TAMAMEN silmek istiyor musunuz? [e/H]"
        if ($confirmData -match "^[eEyY]") {
            $PurgeData = $true
        }
    }
}

# 4. Konteynerleri Durdur
Write-Host "`n🛑 1/4 Nexus Konteynerleri durduruluyor..." -ForegroundColor Cyan
if (Get-Command docker -ErrorAction SilentlyContinue) {
    if ($foundDir -and (Test-Path "$foundDir\docker-compose.yml")) {
        Set-Location $foundDir
        docker compose down --remove-orphans 2>$null
    }
    docker rm -f nexus-frontend nexus-backend nexus-ollama nexus-ai-frontend nexus-ai-backend 2>$null
    Write-Host "  ✓ Konteynerler kaldırıldı!" -ForegroundColor Green
}

# 5. İmajları Temizle
Write-Host "`n🧹 2/4 Nexus Docker İmajları temizleniyor..." -ForegroundColor Cyan
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker rmi -f nexus-frontend nexus-backend nexus-ai-frontend nexus-ai-backend nexus-self-hosted-frontend nexus-self-hosted-backend 2>$null
    Write-Host "  ✓ İmajlar temizlendi!" -ForegroundColor Green
}

# 6. Dosya ve Dizin Temizliği
Write-Host "`n📁 3/4 Dosya Temizliği..." -ForegroundColor Cyan
if ($foundDir -and (Test-Path $foundDir)) {
    if ($PurgeData) {
        Remove-Item -Recurse -Force $foundDir -ErrorAction SilentlyContinue
        Write-Host "  ✓ Tüm dosyalar ve kullanıcı verileri tamamen silindi." -ForegroundColor Green
    } else {
        Get-ChildItem -Path $foundDir -Exclude "data" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ℹ️ 'data\' klasörü korundu ($foundDir\data)." -ForegroundColor Cyan
    }
}

Write-Host "`n════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 NEXUS AI STUDIO BAŞARIYLA VE TAMAMEN KALDIRILDI!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Green
