# ==============================================================================
# ⚡ Nexus AI Studio — Windows PowerShell Universal Installer v3.2.0 (Native & Docker)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host
Write-Host "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗" -ForegroundColor Cyan
Write-Host "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝" -ForegroundColor Cyan
Write-Host "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗" -ForegroundColor Cyan
Write-Host "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║" -ForegroundColor Cyan
Write-Host "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║" -ForegroundColor Cyan
Write-Host "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host "      ⚡ Windows AI Studio & Local LLM Platform v3.2.0`n" -ForegroundColor Yellow

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

# 3. Installation Mode Selection
Write-Host "`n⚙️  [3/4] Select Installation Mode:" -ForegroundColor Yellow
Write-Host "  [1] ⚡ Windows Native Mode (RECOMMENDED — No Docker Needed, Direct GPU & Ultra Fast)" -ForegroundColor Green
Write-Host "  [2] 🐳 Docker Desktop Container Mode" -ForegroundColor Cyan

$modeChoice = Read-Host "Choice (1 or 2) [Default: 1]"
if (-not $modeChoice -or $modeChoice -eq "1") {
    # NATIVE WINDOWS INSTALLATION
    Write-Host "`n🚀 Setting up Windows Native Edition..." -ForegroundColor Green
    
    # Python Check
    if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue)) {
        Write-Host "  ⏳ Python not found. Installing Python 3.11 via winget..." -ForegroundColor Yellow
        winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    }

    # Ollama Check
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Host "  ⏳ Installing Ollama AI engine via winget..." -ForegroundColor Yellow
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
} else {
    # DOCKER INSTALLATION
    Write-Host "`n🐳 Setting up Docker Desktop Mode..." -ForegroundColor Cyan
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "  ❌ Docker Desktop not found!" -ForegroundColor Red
        Write-Host "  Opening download page: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        Start-Process "https://www.docker.com/products/docker-desktop/"
        exit 1
    }
    
    # Run Docker Compose
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
