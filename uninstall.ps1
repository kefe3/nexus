# ==============================================================================
# 🗑️ Nexus AI Studio — Windows PowerShell Kaldırma Betiği (Uninstaller v1.0)
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
Write-Host "      ⚠️ Nexus AI Studio Windows Kaldırma Sihirbazı`n" -ForegroundColor Yellow

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if (-not $Yes) {
    $confirm = Read-Host "Nexus AI Studio konteynerleri durdurulup kaldırılsın mı? [E/h]"
    if ($confirm -and $confirm -notmatch "^[eEyY]") {
        Write-Host "Kaldırma işlemi iptal edildi." -ForegroundColor Cyan
        exit 0
    }

    if (-not $PurgeData -and -not $KeepData) {
        Write-Host "`n📁 Kullanıcı Verileri:" -ForegroundColor Yellow
        Write-Host "Sohbet geçmişleri ve ayarlar 'data\' klasöründe saklanmaktadır."
        $confirmData = Read-Host "Bu verileri de tamamen silmek istiyor musunuz? [e/H]"
        if ($confirmData -match "^[eEyY]") {
            $PurgeData = $true
        }
    }
}

Write-Host "`n🛑 1/4 Nexus Konteynerleri durduruluyor..." -ForegroundColor Cyan
docker compose down --remove-orphans 2>$null
docker rm -f nexus-frontend nexus-backend nexus-ollama 2>$null
Write-Host "  ✓ Konteynerler kaldırıldı!" -ForegroundColor Green

Write-Host "`n🧹 2/4 Nexus Docker İmajları temizleniyor..." -ForegroundColor Cyan
docker rmi -f nexus-ai-frontend nexus-ai-backend 2>$null
Write-Host "  ✓ İmajlar temizlendi!" -ForegroundColor Green

Write-Host "`n📁 3/4 Veri Temizliği..." -ForegroundColor Cyan
if ($PurgeData) {
    if (Test-Path "data") {
        Remove-Item -Recurse -Force "data"
        Write-Host "  ✓ Kullanıcı verileri silindi." -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ️ 'data\' klasörü korundu." -ForegroundColor Cyan
}

Write-Host "`n════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 Nexus AI Studio başarıyla kaldırıldı!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════════════════`n" -ForegroundColor Green
