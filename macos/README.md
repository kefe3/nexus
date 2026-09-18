# 🍎 Nexus AI Studio — macOS Edition v3.2.0

Dedicated macOS Edition with native **Apple Silicon Metal GPU** acceleration and **Intel Mac** support.

---

## 🚀 Quickstart (Terminal 1-Line Setup)

Open Terminal and paste:
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/installation/install-macos.sh | bash
```

---

## ⚡ Native macOS Launchers (Apple Silicon & Intel)
1. **Kurulum**: `bash macos/install.sh` veya `bash installation/install-macos.sh`
2. **Başlatma**: 
   - Masaüstünüzdeki **`Nexus AI Studio.command`** dosyasına çift tıklayın!
   - veya Terminalden: `bash macos/start.sh`
3. **Durdurma**:
   - **`macos/Nexus-Mac-Stop.command`** dosyasına çift tıklayın veya `bash macos/stop.sh`
4. **Güncelleme**:
   - **`macos/Nexus-Mac-Update.command`** veya `bash macos/update.sh`

---

## 🐳 Docker Desktop / Colima Setup
```bash
docker compose -f macos/docker-compose.yml up -d --build
```

---

## 🗑️ Uninstallation
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/installation/uninstall-macos.sh | bash
```
