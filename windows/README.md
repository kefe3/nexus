# 🪟 Nexus AI Studio — Windows Edition

Dedicated Windows Edition supporting both **Native Setup (No Docker required)** and **Docker Desktop Setup**.

## 🚀 Quickstart (PowerShell 1-Line Setup)

```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/install.ps1 | iex
```

## ⚡ Option 1: 1-Click Native Batch Launchers (No Docker Needed!)
1. Clone repo: `git clone https://github.com/kefe3/nexus.git`
2. Double-click **`Nexus-Windows-Installer.bat`** to setup Python venv & desktop shortcut.
3. Double-click **`Nexus-Windows-Start.bat`** to launch anytime!
4. Double-click **`Nexus-Windows-Stop.bat`** to stop.

## 🐳 Option 2: Docker Desktop Setup
```cmd
git clone https://github.com/kefe3/nexus.git
cd nexus
docker compose up -d
```

## 🌐 Endpoints
- **AI Studio:** [http://localhost:3050](http://localhost:3050)
- **Control Panel & Store:** [http://localhost:3050/admin.html](http://localhost:3050/admin.html)
- **OpenAI Compatible Gateway:** `http://localhost:3050/v1`

## 🗑️ Uninstall
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.ps1 | iex
```
