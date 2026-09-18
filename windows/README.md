# 🪟 Nexus AI Studio — Windows Edition v3.2.0

Dedicated Windows Edition supporting both **Native Setup (No Docker required, direct GPU acceleration)** and **Docker Desktop Setup**.

---

## 🚀 Quickstart (PowerShell 1-Line Setup)

Open PowerShell and paste:
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/installation/install.ps1 | iex
```

---

## ⚡ Option 1: 1-Click Native Batch Launchers (Recommended — No Docker Needed!)
1. Double-click **`Nexus-Windows-Installer.bat`** (or `windows\Nexus-Windows-Installer.bat`) to install Python venv, dependencies, and create a Desktop shortcut.
2. Double-click **`Nexus-Windows-Start.bat`** (or `windows\start.bat`) to launch anytime!
3. Double-click **`Nexus-Windows-Stop.bat`** (or `windows\stop.bat`) to stop.
4. Double-click **`Nexus-Windows-Update.bat`** to pull latest updates from GitHub.

---

## 🐳 Option 2: Docker Desktop Setup
```cmd
docker compose -f docker\docker-compose.windows.yml up -d --build
```

---

## 🗑️ Uninstallation
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/installation/uninstall.ps1 | iex
```
