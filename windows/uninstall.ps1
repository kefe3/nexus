# ==============================================================================
# ⚡ Nexus AI Studio — Windows Uninstaller
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host
Write-Host "🗑️ Nexus AI Studio Windows Uninstaller" -ForegroundColor Red

$targetDir = "$HOME\nexus"

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Docker konteynerleri durduruluyor..." -ForegroundColor Yellow
    docker stop nexus-frontend nexus-backend 2>$null
    docker rm nexus-frontend nexus-backend 2>$null
}

# Kill native python / uvicorn / ollama processes on port 3050 & 8500
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*main.py*" } | Stop-Process -Force

if (Test-Path $targetDir) {
    Remove-Item -Recurse -Force $targetDir
    Write-Host "✓ $targetDir temizlendi." -ForegroundColor Green
}

Write-Host "`n✓ Nexus AI Studio sisteminizden başarıyla kaldırıldı." -ForegroundColor Green
