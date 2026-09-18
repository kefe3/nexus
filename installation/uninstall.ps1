# ==============================================================================
# 🗑️ Nexus AI Studio — Windows PowerShell Uninstaller v3.2.0
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host
Write-Host "🗑️ Nexus AI Studio — Windows Uninstaller" -ForegroundColor Red

# 1. Stop background processes
Write-Host "`n🛑 Stopping active Nexus AI Studio processes..." -ForegroundColor Yellow
$ports = @(3050, 8500)
foreach ($port in $ports) {
    try {
        $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -and $p -ne 0) {
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                Write-Host "  ✓ Stopped process PID: $p (Port $port)" -ForegroundColor Green
            }
        }
    } catch {}
}

# 2. Stop Docker if running
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker stop nexus-backend nexus-frontend 2>$null
    docker rm nexus-backend nexus-frontend 2>$null
}

# 3. Remove Desktop shortcut
$shortcutPath = "$HOME\Desktop\Nexus AI Studio.url"
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Desktop shortcut removed." -ForegroundColor Green
}

# 4. Remove installation files
$nexusDir = "$HOME\nexus"
if (Test-Path $nexusDir) {
    $confirm = Read-Host "Do you want to delete all Nexus AI Studio files ($nexusDir)? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Remove-Item -Recurse -Force $nexusDir -ErrorAction SilentlyContinue
        Write-Host "  ✓ Nexus directory deleted." -ForegroundColor Green
    }
}

Write-Host "`n✅ Nexus AI Studio has been cleanly uninstalled from Windows." -ForegroundColor Green
