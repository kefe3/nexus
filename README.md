# ⚡ Nexus AI Studio

<div align="center">

![Nexus AI Studio](https://img.shields.io/badge/Nexus-AI_Studio_v3.1.0-6366f1?style=for-the-badge&logo=probot&logoColor=white)
![Multi Platform](https://img.shields.io/badge/OS-Linux_|_Windows_|_macOS-3b82f6?style=for-the-badge)
![GitHub Packages](https://img.shields.io/badge/GHCR-ghcr.io%2Fkefe3%2Fnexus--backend-purple?style=for-the-badge&logo=github)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![EdgeOS AI Engine](https://img.shields.io/badge/EdgeOS-Native_AI_Engine-emerald?style=for-the-badge)

**The ultra-lightweight, high-performance, open-source Self-Hosted AI Platform with Live Code Sandboxing, 1-Click Cloudflare Public Tunnel, Multi-Provider Streaming, HuggingFace GGUF Store, Hardware OOM Shield, and Cluster Control Panel.**

---

[🇹🇷 Türkçe Dokümantasyona Git](#-türkçe-dokümantasyon) • [🇬🇧 Jump to English Documentation](#-english-documentation) • [📜 Development Log](developing_log.md)

</div>

---

## 📁 Repository Structure by OS

```
nexus/
├── 🐧 linux/      --> High-performance Linux Native & Docker Host Mode setup
├── 🪟 windows/    --> Windows 1-Click Native Batch Launchers & PowerShell setup
└── 🍏 macos/      --> Apple Silicon & Intel Mac setup
```

---

<a name="-english-documentation"></a>
# 🇬🇧 English Documentation

## 🚀 Quickstart by Operating System

### 🐧 1. Linux (Ubuntu, Debian, CachyOS, Arch, Fedora, CentOS)
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/linux/install.sh | bash
```

### 🪟 2. Windows (Native & Docker Desktop)
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/windows/install.ps1 | iex
```

### 🍏 3. macOS (Apple Silicon M1-M4 & Intel)
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/macos/install.sh | bash
```

---

<a name="-türkçe-dokümantasyon"></a>
# 🇹🇷 Türkçe Dokümantasyon

## 🚀 İşletim Sistemine Göre Hızlı Başlangıç

### 🐧 1. Linux Kurulumu (Önerilen)
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/linux/install.sh | bash
```

### 🪟 2. Windows Kurulumu (Native & Docker)
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/windows/install.ps1 | iex
```

### 🍏 3. macOS Kurulumu (M1/M2/M3/M4 & Intel)
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/macos/install.sh | bash
```

## 🛒 Nexus Store & HuggingFace Hub Integration

Nexus AI Studio, HuggingFace Hub üzerindeki yüzbinlerce açık kaynak GGUF modelini canlı arama ve tek tıkla doğrudan yerel Ollama motorunuza indirme desteği sunar:
- **🤗 HuggingFace Live Search**: Canlı GGUF model arama ve filtreleme.
- **⚡ Chunked SSE Stream**: Gerçek zamanlı model indirme, katman takibi ve MB/s hız göstergesi.
- **🛠️ Tools & Skiller**: Otonom web arama, kod yorumlayıcı ve özel ajan yeteneklerini yönetme.

---

## ⚙️ Port ve Servis Haritası

| Port | Servis | Açıklama |
|---|---|---|
| `3050` | Nginx Frontend & Reverse Proxy | AI Studio, Kontrol Paneli ve Canlı Paylaşımlar |
| `8500` | FastAPI Asenkron Backend | Model Yönlendirme, SSE Akışları ve Telemetri |
| `11434` | Ollama Yerel LLM Motoru | Ekran Kartı / CPU Yerel Yapay Zeka Çıkarımı |

---

## 📄 Lisans / License

Bu proje **[MIT Lisansı](LICENSE)** altında tamamen açık kaynaklıdır.  
Geliştirici: **Origin Edge & Kagan**
