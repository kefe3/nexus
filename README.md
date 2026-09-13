# ⚡ Nexus AI Studio

<div align="center">

![Nexus AI Studio](https://img.shields.io/badge/Nexus-AI_Studio_v2.5-6366f1?style=for-the-badge&logo=probot&logoColor=white)
![Linux Dedicated](https://img.shields.io/badge/OS-Linux_Dedicated-FCC624?style=for-the-badge&logo=linux&logoColor=black)
![Docker Ready](https://img.shields.io/badge/Docker-Host_Mode-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**The ultra-lightweight, high-performance, open-source Linux Self-Hosted AI Platform with Live Code Sandboxing, 1-Click Cloudflare Public Tunnel, Multi-Provider Streaming, and Cluster Control Panel.**

---

[🇹🇷 Türkçe Dokümantasyona Git](#-türkçe-dokümantasyon) • [🇬🇧 Jump to English Documentation](#-english-documentation) • [📜 Development Log](developing_log.md)

</div>

---

<a name="-english-documentation"></a>
# 🇬🇧 English Documentation

## 🌟 Key Features

* 🚀 **1-Command Zero-Config Installer:** Automatically installs Docker, Git, and starts the entire platform on Linux with zero manual intervention.
* 🌍 **1-Click Live Public Web Publishing & Remote Control Suite:**
  * Instantly publish AI-generated HTML/JS/CSS web applications to the public internet using zero-config **Cloudflare Quick Tunnels** (`https://*.trycloudflare.com/share/{id}`).
  * Expose both **Nexus AI Studio** (`/`) and **Control Panel** (`/admin.html`) to the world with an interactive **ON/OFF Toggle Switch**.
  * Dynamic **Mobile QR Code Generator** for instant smartphone testing and remote management.
* 🔄 **Centralized Server-Side State & Persistent Chat History:**
  * API keys (Gemini, OpenAI, Groq, Anthropic) and conversation histories are synced and persisted server-side.
* ⚡ **Cluster Control Panel 2.0 (`/admin.html`):**
  * 📈 **Real-Time Telemetry:** Live dual-axis Chart.js CPU & RAM hardware monitoring graphs.
  * ⏱️ **Model Speed Benchmark Arena:** Measure real-time tokens-per-second (tok/s), TTFT, and latency across models.
  * 🧠 **VRAM & Memory Manager:** Inspect loaded GPU models, memory footprints, and 1-click VRAM flush.
  * 📦 **Ollama Model Hub:** Dynamic 1-click model puller and manager (`deepseek-r1`, `qwen2.5-coder`, `llama3.2`, etc.).
  * 🔑 **Provider Speed Radar:** Real-time ping & health benchmarks for Ollama, Gemini 3.6, OpenAI, Groq.
* 🐧 **Linux-Native Performance:**
  * Full GPU acceleration via `network_mode: host` (Ubuntu, Debian, CachyOS, Arch, Fedora, CentOS).

---

## 🚀 Quickstart (1-Line Universal Install for Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash
```

### 🗑️ Uninstallation
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.sh | bash
```

---

<a name="-türkçe-dokümantasyon"></a>
# 🇹🇷 Türkçe Dokümantasyon

## 🌟 Öne Çıkan Özellikler

* 🚀 **Tek Satırda Tam Otomatik Linux Kurulumu:** Sisteminizde Docker veya Git kurulu olmasa bile betik her şeyi otomatik indirir, kurar ve Linux üzerinde tam GPU performansı ile sistemi çalıştırır.
* 🌍 **1-Click Dünyaya Aç / Canlı Yayın ve Uzaktan Kontrol:**
  * Yapay zekanın yazdığı HTML/JS/CSS uygulamalarını sıfır yapılandırma ile Cloudflare tüneli üzerinden anında tüm dünyaya açın (`https://*.trycloudflare.com/share/{id}`).
  * **Nexus AI Studio** (`/`) ve **Kontrol Paneli**'ni (`/admin.html`) tek bir **Aç/Kapat (ON/OFF) Switch** ile internete açıp kapatabilme.
* ⚡ **Gelişmiş Kontrol Paneli 2.0 (`/admin.html`):**
  * 📈 **Canlı Donanım Telemetrisi:** Chart.js destekli anlık CPU ve RAM yük grafikleri.
  * ⏱️ **Model Hız & Benchmark Arenası:** Modellerin saniyede ürettiği token (tok/s), TTFT ve gecikme sürelerini anında test etme.
  * 🧠 **VRAM & Bellek Monitörü:** GPU'ya yüklenmiş aktif modelleri görme ve tek tıkla VRAM boşaltma.
  * 📦 **Ollama Model Merkezi:** Tek tıkla model indirme ve silme.
* 🐧 **Linux-Native Performans:**
  * `network_mode: host` ile sıfır gecikme ve tam donanım hızlandırma (Ubuntu, Debian, CachyOS, Arch, Fedora, CentOS).

---

## 🚀 Hızlı Başlangıç (Linux Tek Komutla Kurulum)

```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash
```

### 🗑️ Sistemi Kaldırma
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.sh | bash
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
