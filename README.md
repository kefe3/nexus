# ⚡ Nexus AI Studio — Self-Hosted AI Platform

<div align="center">

![Nexus AI Studio](https://img.shields.io/badge/Nexus-AI_Studio_v2.2-6366f1?style=for-the-badge&logo=probot&logoColor=white)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Claymorphism UI](https://img.shields.io/badge/Design-Claymorphism_3D-00f2fe?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Multi Platform](https://img.shields.io/badge/OS-Linux_|_Windows_|_macOS-3b82f6?style=for-the-badge)
![Multi Provider](https://img.shields.io/badge/Providers-Ollama_|_Gemini_|_OpenAI_|_Groq_|_Claude-ff6b6b?style=for-the-badge)

**The modern, ultra-fast, open-source Self-Hosted AI Platform featuring Tactile Claymorphism UI, Unified Model Hub & Store, Dual-Mode LLM/Embedding Benchmarking, 1-Click Cloudflare Public Tunnel, and OpenAI-Compatible API Gateway.**

---

[🇹🇷 Türkçe Dokümantasyona Git](#-türkçe-dokümantasyon) • [🇬🇧 Jump to English Documentation](#-english-documentation) • [📜 Development Log](developing_log.md)

</div>

---

<a name="-english-documentation"></a>
# 🇬🇧 English Documentation

## 🌟 Key Features

* 🚀 **1-Command Zero-Config Installer:** Automatically detects OS, installs Docker/Git (if missing), and boots the platform with zero manual configuration.
* 🎨 **Tactile Claymorphism Design System (v2.2):** Soft 3D lighting, inner bevels, sunken input capsules, puffy tactile buttons, and clean responsive layouts across Studio and Control Panel.
* 🛍️ **Unified Model Hub & Store (`/admin.html`):**
  * **Installed Models:** View disk usage, model architectures, and 1-click model removal.
  * **Nexus Store:** 1-click downloads for top open-source LLMs (`deepseek-r1`, `qwen2.5-coder`, `llama3.2`, `mistral`, `phi-4`).
  * **HuggingFace GGUF Downloader:** Direct model pulling from any HuggingFace repository (`repo/model:quant`).
  * **Skills & Plugins:** Extensible agent toolsets.
* ⚡ **Dual-Mode Benchmark Arena (LLM & Embedding):**
  * **Generative LLMs:** Real-time tokens-per-second (tok/s), latency, and TTFT benchmarking.
  * **Embedding Models:** Vector dimension (e.g. 768-dim float) and embedding generation speed testing without 400 errors.
* 🔑 **Unlimited API Key Generator & OpenAI-Compatible Gateway (`/v1`):**
  * Issue unlimited API keys (`nx-live-...`) via 1-click REST API.
  * Connect any standard OpenAI SDK (Python `openai`, Node.js `openai`, LangChain, cURL, AutoGen) via `http://localhost:3050/v1` or public tunnel.
  * Multi-Host switcher: Local Host, Cloudflare Live Tunnel, and Custom Domain.
  * Real-time SSE Streaming (`stream: true`) and non-streaming responses across all local and cloud models.
* 🌍 **1-Click Live Public Web Publishing & Cloudflare Tunnel:**
  * Instantly publish AI-generated HTML/JS/CSS applications to the internet (`https://*.trycloudflare.com/share/{id}`).
  * Expose Studio (`/`) and Control Panel (`/admin.html`) with an interactive toggle switch.
  * Auto-downloading `cloudflared` daemon with dynamic QR code generation.
* 🔄 **Centralized Server-Side State & Persistent Sync:**
  * API keys (Gemini, OpenAI, Groq, Anthropic) and conversation histories are synced and persisted server-side (`data/`).
* 📈 **Cluster Control Panel Telemetry:**
  * Live dual-axis Chart.js CPU & RAM hardware monitoring graphs.
  * GPU VRAM monitor with 1-click VRAM flush.
  * Provider speed radar with live latency ping tests.
* ⚡ **Live Artifact Execution Sandbox:** Live preview and interact with generated web apps inside an isolated responsive sandbox (Desktop, Tablet, Mobile) with `.html` download.
* 🧠 **DeepSeek Reasoning Accordion:** Gracefully parses and displays `<think>...</think>` thought chains in collapsible blocks.
* 🎙️ **Voice Mode & Dual Language:** Speech-to-text input with real-time waveform and instant 🇹🇷 Turkish / 🇬🇧 English UI toggle.

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

### 🪟 Windows (Native Batch - No Docker Needed)
1. Clone repo: `git clone https://github.com/kefe3/nexus.git`
2. Double-click **`Nexus-Windows-Installer.bat`**
3. Double-click **`Nexus-Windows-Start.bat`** to launch!

---

## 🌐 Endpoints & Ports

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Nexus AI Studio** | `http://localhost:3050` | Main Chat UI, Persona Store & Sandbox |
| **Control Panel & Store** | `http://localhost:3050/admin.html` | Cluster Management, Hub, Store & Benchmarks |
| **OpenAI API Gateway** | `http://localhost:3050/v1` | OpenAI-compatible REST API (`/v1/chat/completions`) |
| **FastAPI Backend** | `http://localhost:8500` | Core API Engine & SSE Streamer |

---

## 🗑️ Uninstallation (1-Line Quick Removal)
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

* 🚀 **Tek Satırda Tam Otomatik Kurulum:** Sisteminizde Docker veya Git kurulu olmasa bile betik her şeyi otomatik indirir, kurar ve başlatır.
* 🎨 **Dokunsal Claymorphism Tasarım Sistemi (v2.2):** Yumuşak 3D gölgeler, iç ışık kırılmaları, gömülü giriş alanları, dokunsal butonlar ve modern temiz yerleşim.
* 🛍️ **Birleşik Model Merkezi & Mağaza (`/admin.html`):**
  * **Yüklü Modeller:** Disk kullanımı, VRAM durumu ve tek tıkla model silme.
  * **Nexus Store:** Popüler açık kaynaklı modelleri (`deepseek-r1`, `qwen2.5-coder`, `llama3.2`, `mistral`, `phi-4`) tek tıkla indirme.
  * **HuggingFace GGUF İndirici:** HuggingFace üzerindeki herhangi bir GGUF modelini doğrudan sunucuya çekme.
  * **Eklenti & Yetenek Merkezi:** Ajan araç setleri ve eklentiler.
* ⚡ **Çift Modlu Benchmark Arenası (LLM & Embedding):**
  * **Üretken LLM'ler:** Saniyede üretilen token (tok/s), toplam süre ve TTFT hız testleri.
  * **Embedding Modelleri:** `nomic-embed-text`, `bge-m3` vb. modeller için 768+ boyutlu float vektör üretimi ve gecikme testi (400 hatası almadan).
* 🔑 **Sınırsız API Key Verme & OpenAI Uyumlu Gateway (`/v1`):**
  * Tek tıkla sınırsız `nx-live-...` API anahtarı oluşturma ve yönetme.
  * Standart OpenAI kütüphaneleri (Python `openai`, Node.js, LangChain, cURL, AutoGen) ile `http://localhost:3050/v1` üzerinden tam uyumlu çalışma.
  * Çoklu Host Seçici: Local Host, Cloudflare Canlı Tünel ve Özel Domain adresi.
* 🌍 **1-Click Canlı Yayın & Cloudflare Tünel Entegrasyonu:**
  * Yapay zekanın yazdığı web uygulamalarını internete açma (`https://*.trycloudflare.com/share/{id}`).
  * Studio (`/`) ve Kontrol Paneli (`/admin.html`) için anlık Aç/Kapat (ON/OFF) anahtarı ve otomatik mobil QR kodu.
* 🔄 **Merkezi Sunucu Senkronizasyonu & Kalıcı Veri:**
  * API anahtarları (Gemini, OpenAI, Groq vb.) ve sohbet geçmişi sunucu tarafında (`data/`) kalıcı olarak saklanır.
* 📈 **Canlı Donanım Telemetrisi & Kontrol:**
  * Çift eksenli CPU ve RAM yük grafikleri (Chart.js).
  * GPU VRAM monitörü ve tek tıkla VRAM boşaltma.
  * Sağlayıcı hız radarı (Ollama, Gemini, OpenAI, Groq canlı ping).
* ⚡ **Canlı Artifact Kod Sanal Alanı (Sandbox):** Üretilen web sitelerini iframe içinde masaüstü, tablet ve mobil çözünürlüklerde anında test etme ve `.html` indirme.
* 🧠 **DeepSeek Düşünce Akordeonu:** `<think>...</think>` akıl yürütme adımlarını açılır-kapanır bloklarda düzenli sunma.
* 🎙️ **Sesli Mod & Çift Dil:** Sesle komut verme ve anlık 🇹🇷 Türkçe / 🇬🇧 İngilizce arayüz geçişi.

---

## 🚀 Hızlı Başlangıç

### 🐧 Linux & macOS
```bash
curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash
```

### 🪟 Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/kefe3/nexus/main/install.ps1 | iex
```

### 🪟 Windows (Yerel Batch — Docker Gerekmez)
1. Repoyu indirin: `git clone https://github.com/kefe3/nexus.git`
2. **`Nexus-Windows-Installer.bat`** dosyasına çift tıklayarak Python ortamını kurun.
3. **`Nexus-Windows-Start.bat`** dosyasına çift tıklayarak sistemi başlatın!

---

## 📜 Geliştirme Günlüğü
Detaylı değişiklik geçmişi ve mimari kayıtlar için [`developing_log.md`](developing_log.md) dosyasına göz atabilirsiniz.
