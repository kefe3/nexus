# ⚡ Nexus AI Studio

<div align="center">

![Nexus AI Studio](https://img.shields.io/badge/Nexus-AI_Studio_v2.0-6366f1?style=for-the-badge&logo=probot&logoColor=white)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Multi Platform](https://img.shields.io/badge/OS-Linux_|_Windows_|_macOS-3b82f6?style=for-the-badge)
![Multi Provider](https://img.shields.io/badge/Providers-Ollama_|_Gemini_|_OpenAI_|_Groq_|_Claude-ff6b6b?style=for-the-badge)

**The modern, ultra-lightweight, open-source Self-Hosted AI Platform with Live Code Sandboxing, 1-Click Cloudflare Public Tunnel, Multi-Provider Streaming, and Centralized Persistent Sync.**

---

[🇹🇷 Türkçe Dokümantasyona Git](#-türkçe-dokümantasyon) • [🇬🇧 Jump to English Documentation](#-english-documentation) • [📜 Development Log](developing_log.md)

</div>

---

<a name="-english-documentation"></a>
# 🇬🇧 English Documentation

## 🌟 Key Features

* 🚀 **1-Command Zero-Config Installer:** Automatically installs Docker, Git, and starts the entire platform with zero manual intervention.
* 🌍 **1-Click Live Public Web Publishing & Remote Control Suite:**
  * Instantly publish AI-generated HTML/JS/CSS web applications to the public internet using zero-config **Cloudflare Quick Tunnels** (`https://*.trycloudflare.com/share/{id}`).
  * Expose both **Nexus AI Studio** (`/`) and **Control Panel** (`/admin.html`) to the world with an interactive **ON/OFF Toggle Switch**.
  * Dynamic **Mobile QR Code Generator** for instant smartphone testing and remote management.
* 🔄 **Centralized Server-Side State & Persistent Chat History:**
  * API keys (Gemini, OpenAI, Groq, Anthropic) and conversation histories are synced and persisted server-side.
  * Seamlessly switch between Local LAN (`http://localhost:3050`) and Public Tunnels without losing chat history or configured keys.
* ⚡ **Cluster Control Panel 2.0 (`/admin.html`):**
  * 📈 **Real-Time Telemetry:** Live dual-axis Chart.js CPU & RAM hardware monitoring graphs.
  * ⏱️ **Model Speed Benchmark Arena:** Measure real-time tokens-per-second (tok/s), TTFT, and latency across models.
  * 🧠 **VRAM & Memory Manager:** Inspect loaded GPU models, memory footprints, and 1-click VRAM flush.
  * 📦 **Ollama Model Hub:** Dynamic 1-click model puller and manager (`deepseek-r1`, `qwen2.5-coder`, `llama3.2`, etc.).
  * 🔑 **Provider Speed Radar:** Real-time ping & health benchmarks for Ollama, Gemini 3.6, OpenAI, Groq.
* 🔌 **Universal Multi-Provider Support:**
  * **Ollama (Local GPU/CPU):** Connect to local models (`qwen2.5-coder`, `deepseek-r1`, `llama3`, `mistral`, etc.).
  * **Google Gemini:** Full support for Gemini 3.6 Flash / Pro (Google AI Studio key with 1M+ context).
  * **OpenAI & Anthropic:** GPT-4o, o3-mini, Claude 3.5 Sonnet.
  * **Groq:** Ultra-fast inference at 300+ tokens/second.
  * **Custom Endpoints:** Connect to any OpenAI-compatible API reverse proxy.
* 🖥️ **Cross-Platform Compatibility:**
  * 🐧 **Linux:** Native Docker & GPU acceleration (Ubuntu, Debian, Fedora, Arch, CentOS).
  * 🪟 **Windows:** Docker Desktop + WSL2 or PowerShell installer (`install.ps1`).
  * 🍏 **macOS:** Apple Silicon (M1/M2/M3/M4) & Intel via Docker Desktop or OrbStack.
* ⚡ **Live Artifact Execution Sandbox:** Live preview, test, and interact with generated single-file HTML/JS/CSS applications inside an isolated responsive sandbox (Desktop, Tablet, Mobile).
* 🧠 **DeepSeek-Style Reasoning Accordion:** Automatically parses and gracefully renders `<think>...</think>` thought chains in collapsible containers.
* 🎙️ **Voice Mode:** Integrated speech-to-text with real-time waveform input.
* 🌐 **Dual Language Engine:** Instant 1-click switch between **Turkish 🇹🇷** and **English 🇬🇧**.
* 📜 **Full Audit Timeline:** View the second-by-second development changelog at [`developing_log.md`](developing_log.md).

---

## 🚀 Quickstart (1-Line Universal Install)

### 🐧 Linux & macOS (Auto-Installs Docker & All Dependencies)
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash
```

### 🪟 Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/install.ps1 | iex
```

### 🗑️ Uninstallation (1-Line Quick Removal)
```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.ps1 | iex
```

---

<a name="-türkçe-dokümantasyon"></a>
# 🇹🇷 Türkçe Dokümantasyon

## 🌟 Öne Çıkan Özellikler

* 🚀 **Tek Satırda Tam Otomatik Kurulum:** Sisteminizde Docker veya Git kurulu olmasa bile betik her şeyi otomatik indirir, kurar ve sistemi çalıştırır.
* 🌍 **1-Click Dünyaya Aç / Canlı Yayın ve Uzaktan Kontrol:**
  * Yapay zekanın yazdığı HTML/JS/CSS uygulamalarını sıfır yapılandırma ile Cloudflare tüneli üzerinden anında tüm dünyaya açın (`https://*.trycloudflare.com/share/{id}`).
  * **Nexus AI Studio** (`/`) ve **Kontrol Paneli**'ni (`/admin.html`) tek bir **Aç/Kapat (ON/OFF) Switch** ile internete açıp kapatabilme.
  * Telefon kamerasıyla anında tarayıp bağlanmak için dinamik **Mobil QR Kod Oluşturucu**.
* 🔄 **Merkezi Sunucu Senkronizasyonu & Kalıcı Sohbet Geçmişi:**
  * Girilen tüm API anahtarları (Gemini, OpenAI, Groq vb.) ve sohbet geçmişiniz sunucu tarafında (`data/`) kalıcı olarak saklanır.
  * Hem yerel ağdan (`http://192.168.0.188:3050`) hem dış tünelden bağlandığınızda **birebir aynı sohbetler ve hazır modeller** anında yüklenir.
* ⚡ **Gelişmiş Kontrol Paneli 2.0 (`/admin.html`):**
  * 📈 **Canlı Donanım Telemetrisi:** Chart.js destekli anlık CPU ve RAM yük grafikleri.
  * ⏱️ **Model Hız & Benchmark Arenası:** Modellerin saniyede ürettiği token (tok/s), TTFT ve gecikme sürelerini anında test etme.
  * 🧠 **VRAM & Bellek Monitörü:** GPU'ya yüklenmiş aktif modelleri görme ve tek tıkla VRAM boşaltma.
  * 📦 **Ollama Model Merkezi:** Tek tıkla model indirme (`deepseek-r1`, `qwen2.5-coder`, `llama3.2` vb.) ve sunucudan silme.
  * 🔑 **Sağlayıcı Hız Radarı:** Ollama, Gemini 3.6, OpenAI ve Groq için canlı gecikme (ping) testleri.
* 🔌 **Sınırsız Çoklu Sağlayıcı (Multi-Provider):**
  * **Ollama (Yerel GPU/CPU):** Kendi ekran kartınızdaki yerel modeller (`qwen2.5-coder`, `deepseek-r1`, `llama3`, vb.).
  * **Google Gemini:** Gemini 3.6 Flash / Pro (Google AI Studio anahtarıyla 1M+ token context).
  * **OpenAI & Anthropic:** GPT-4o, o3-mini, Claude 3.5 Sonnet.
  * **Groq:** 300+ token/saniye hızında yıldırım hızında çıkarım.
  * **Özel Uç Noktalar:** Herhangi bir OpenAI-uyumlu API köprüsüne bağlanabilme.
* 🖥️ **Tüm İşletim Sistemleriyle Uyumlu (Cross-Platform):**
  * 🐧 **Linux:** Ubuntu, Debian, Fedora, Arch, CentOS (Tam GPU donanım hızlandırma).
  * 🪟 **Windows:** Windows 10/11 WSL2 ve Docker Desktop veya PowerShell kurulum betiği.
  * 🍏 **macOS:** Apple Silicon M1/M2/M3/M4 & Intel işlemciler (Docker Desktop / OrbStack).
* ⚡ **Canlı Artifact Sandbox (Kod Çalıştırıcı):** Yapay zekanın yazdığı web sitelerini tarayıcı içinde canlı test edin, mobil/tablet boyutlarında inceleyin ve `.html` olarak indirin.
* 🧠 **Düşünce Süreci (DeepSeek Akordeonu):** Modelin `<think>...</think>` akıl yürütme adımlarını şık açılır-kapanır bloklarda düzenli gösterir.
* 🎙️ **Sesli Mod:** Gerçek zamanlı konuşarak yazdırma (Speech-to-Text).
* 🌐 **Çift Dil Desteği:** Tek tıkla anında **Türkçe 🇹🇷** ve **İngilizce 🇬🇧** arayüz.
* 📜 **Detaylı Geliştirme Günlüğü:** Tüm mimari kararlar ve zaman çizelgesi için [`developing_log.md`](developing_log.md) dosyasına göz atın.

---

## 🚀 Hızlı Başlangıç (Tek Komutla Otomatik Kurulum)

### 🐧 Linux & macOS (Docker Dahil Her Şeyi Otomatik Kurar)
Terminalinizi açın ve aşağıdaki komutu yapıştırın:
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash
```

### 🪟 Windows (PowerShell ile Otomatik Kurulum)
PowerShell'i açın ve çalıştırın:
```powershell
### 🗑️ Sistemi Kaldırma (Tek Komutla Temiz Kaldırma)
```bash
# Linux / macOS
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.ps1 | iex
```

Tarayıcınızdan **`http://localhost:3050`** (AI Studio) veya **`http://localhost:3050/admin.html`** (Kontrol Paneli) adresine gidin!

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
