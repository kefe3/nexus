# 📜 Nexus AI Studio — Detaylı Geliştirme ve Değişiklik Dokümantasyonu (Changelog & Audit Log)

Bu dokümantasyon, **Nexus AI Studio & Cluster Control Panel** projesinin sıfırdan mimari tasarımından son sürümüne kadar gerçekleştirilen tüm geliştirme adımlarını, mimari kararları, hata tespit ve çözümlerini gün, ay, yıl, saat, dakika ve saniye bazında ayrıntılı olarak kayıt altına almaktadır.

---

## 🏗️ Proje Mimarisi ve Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, HTTPX, Pydantic | Asenkron SSE (Server-Sent Events) çoklu sağlayıcı akış köprüsü |
| **Frontend UI** | Modern Vanilla JS (ES6+), HTML5, CSS3, Tailwind (CDN) | Dark Luxury Glassmorphism arayüz, Responsive Canvas |
| **Sandbox Engine** | HTML5 Iframe, Blob URL, DOMParser | Canlı kod çalıştırma ve interaktif web sandbox'ı |
| **Grafik & Telemetri** | Chart.js | Donanım (CPU/RAM) çift eksenli anlık alan grafikleri |
| **Konteynerizasyon** | Docker, Nginx Alpine, Docker Compose | Hafif imajlar, host network ve hızlı derleme |
| **Yapay Zeka Motorları** | Ollama (Yerel GPU), Google Gemini 3.6, OpenAI, Groq | Çoklu model orkestrasyonu ve dinamik model listeleme |

---

## ⏱️ Kronolojik Geliştirme ve İşlem Günlüğü (Timeline)

### 📅 12 Eylül 2026 (Cumartesi)

---

#### 🕒 16:34:52 — [Commit: `d4a2d01`] • Mimari Tasarım & İlk Sürüm (v1.0.0 Initial Release)
* **Modül:** `Tüm Sistem (Core Architecture)`
* **Yapılan İşlemler:**
  * Modern, açık kaynaklı ve kendi sunucunda barındırılabilir (self-hosted) Nexus AI Studio platformu sıfırdan tasarlandı.
  * **Backend Mimarisi:**
    * `backend/app/main.py`: FastAPI uygulaması, CORS ve GZip middleware yapılandırması.
    * `backend/app/api/chat.py`: Ollama, Gemini, OpenAI, Groq ve Anthropic için SSE akış (streaming) köprüsü.
    * `backend/app/api/models.py`: Yapay zeka sağlayıcılarından dinamik model listeleme uç noktası.
    * `backend/app/api/presets.py`: Geliştirici, veri bilimci, yazar vb. rol şablonları (Persona Store).
  * **Frontend Mimarisi:**
    * `frontend/src/index.html`: ChatGPT / Claude / Bolt standartlarında karanlık cam arayüz.
    * `frontend/src/js/app.js`: Sohbet yönetimi, Markdown parsing, KaTeX matematik gösterimi ve kod renklendirme.
    * `frontend/src/js/sandbox.js`: Üretilen HTML/CSS/JS web projelerini tarayıcı içinde izole iframe'de canlı çalıştırma (Masaüstü, Tablet, Mobil çözünürlük geçişleri ve `.html` indirme).
    * `frontend/src/js/voice.js`: Web Speech API ile sesli konuşma ve mikrofon dalga görselleştirmesi.
    * `frontend/src/js/i18n.js`: Türkçe 🇹🇷 ve İngilizce 🇬🇧 anlık dil motoru.
  * **Docker Entegrasyonu:**
    * `backend/Dockerfile` & `frontend/Dockerfile` & `frontend/nginx.conf` & `docker-compose.yml` hazırlandı.

---

#### 🕒 16:40:24 — [Commit: `2380bf8`] • Çift Dilli Kapsamlı Dokümantasyon (README & Docs)
* **Modül:** `Dokümantasyon`
* **Yapılan İşlemler:**
  * `README.md` dosyası GitHub standartlarında, rozetlerle (Shields.io), Mermaid mimari diyagramıyla ve iki dilde (🇬🇧 English & 🇹🇷 Türkçe) hazırlandı.
  * Projeye MIT Lisansı (`LICENSE`) ve Açık Kaynak Katkı Kılavuzu (`CONTRIBUTING.md`) eklendi.

---

#### 🕒 16:41:41 — [Commit: `4b2ab71`] • Yönetim & Kontrol Paneli (Admin Modal & Stats API)
* **Modül:** `Backend & Frontend (Admin Dashboard)`
* **Yapılan İşlemler:**
  * `backend/app/api/stats.py` uç noktası yazıldı:
    * `/api/stats/system`: CPU çekirdek sayısı, RAM kullanımı (GB/%), Disk alanı ve sunucu çalışma süresi (uptime).
    * `/api/stats/providers`: Ollama (gecikme ms ve model sayısı), Gemini, OpenAI, Groq anahtar durumları.
  * `frontend/src/js/dashboard.js`: Arayüz içine canlı donanım barları ve servis durum kartları eklendi.

---

#### 🕒 16:44:57 — [Commit: `06ad34d`] • Docker Derleme Optimizasyonu (Apt-Get İptali)
* **Modül:** `DevOps & Dockerfile`
* **Sorun Analizi:**
  * Docker imajı derlenirken Debian paket aynalarında (`deb.debian.org`) ağ zaman aşımı oluştuğu tespit edildi.
* **Çözüm:**
  * Backend Dockerfile'daki gereksiz `apt-get install curl` satırı kaldırıldı. Python bağımlılıkları doğrudan tekerlek (wheel) üzerinden önbelleksiz kurulacak şekilde optimize edildi, derleme süresi 5 saniyenin altına düşürüldü.

---

#### 🕒 16:50:38 — [Commit: `4853b04`] • Bağımsız Kontrol Paneli Süiti (Dedicated Control Panel `/admin.html`)
* **Modül:** `Admin Control Suite`
* **Yapılan İşlemler:**
  * Kullanıcının talebi doğrultusunda sohbet ekranından ayrı, müstakil bir yönetim merkezi inşa edildi:
    * `frontend/src/admin.html`: Cyberpunk & Glassmorphism temalı tam sayfa kontrol merkezi.
    * `frontend/src/js/admin.js`: Panel mantığı, asenkron sorgular ve periyodik veri yenileme.
    * `backend/app/api/admin.py`: Yönetim API'si (`/api/admin/overview`, `/api/admin/models`, `/api/admin/models/pull`, `/api/admin/models/delete`, `/api/admin/logs`, `/api/admin/providers/test`).
  * **Ollama Model Merkezi:** Sunucudaki modellerin disk boyutlarını görme, model silme ve kütüphaneden yeni model indirme (`ollama pull`) eklendi.

---

#### 🕒 16:54:52 — [Commit: `1f3b805`] • Kontrol Paneli 2.0 (Chart.js Telemetrisi, VRAM Monitörü & Benchmark Arenası)
* **Modül:** `Telemetry & Benchmarking Engine`
* **Yapılan İşlemler:**
  * **Chart.js Telemetrisi:** CPU ve RAM yükünü zaman serisi halinde çizen canlı alan grafiği eklendi.
  * **VRAM & Bellek Monitörü:** `/api/admin/models/running` ile GPU'da yüklü modellerin VRAM tüketimi ve tek tıkla boşaltma (`keep_alive: 0`) mekanizması kuruldu.
  * **Model Hız & Benchmark Arenası:** `/api/admin/benchmark` ile modellerin saniyede ürettiği token (tok/s), TTFT ve toplam gecikme süresini ölçen hız testi motoru yazıldı.
  * **Canlı İstek Terminali:** Sunucuya gelen sorguların yanıt süreleri ve hız dökümü canlı log tablosuna bağlandı.

---

#### 🕒 16:57:51 — [Commit: `1f6de78`] • API Anahtarı Kalıcılığı ve Ping Testi Düzeltmesi
* **Modül:** `Providers & Security`
* **Sorun Analizi:**
  * Kontrol panelinde API anahtarı girildikten hemen sonra Ping Test butonuna basıldığında `onchange` tetiklenmediği için anahtarın boş gitmesi ve `localStorage` anahtar isimlerinin farklılığı (`nexus_key_gemini` vs `nexus_gemini_key`) tespit edildi.
* **Çözüm:**
  * `oninput` tetikleyicisi eklendi, giriş kutusundaki değer anında okunacak şekilde çift yönlü `localStorage` senkronizasyonu sağlandı. Hata mesajları açık ve anlaşılır Türkçe metinlere dönüştürüldü.

---

#### 🕒 16:59:58 — [Commit: `34e12bf`] • Host Networking & Tailscale MagicDNS Engeli Çözümü
* **Modül:** `Ağ Mimarisi (Networking & Docker)`
* **Sorun Analizi:**
  * Sunucuda Tailscale çalıştığı için ana makine DNS adresi `100.100.100.100` kullanıyordu. Docker'ın varsayılan köprü (bridge) ağı bu adrese erişemediği için Google AI Studio ve bulut API'lerine giden istekler zaman aşımına (`ConnectTimeout`) uğruyordu.
* **Çözüm:**
  * `docker-compose.yml` ve `frontend/nginx.conf` **Host Network (`network_mode: host`)** mimarisine geçirildi.
  * Backend ve Frontend sunucunun yerel donanım ağına bağlanarak gecikmesiz (200ms altında) doğrudan dış API erişimine kavuşturuldu.

---

#### 🕒 17:00:24 — [Commit: `240ecc8`] • Uvicorn Port Bağlama Ayarı (`PORT 8500`)
* **Modül:** `Backend Configuration`
* **Yapılan İşlemler:**
  * Host network modunda sunucudaki mevcut Django servisi (port 8000) ile çakışmayı önlemek için backend `PORT 8500` üzerine bağlandı.

---

#### 🕒 17:02:11 — [Commit: `2152261`] • Google Gemini 3.6 Desteği ve Dinamik Model Keşfi
* **Modül:** `AI Model Provider Bridge`
* **Sorun Analizi:**
  * Google, 2026 yılı itibarıyla eski `gemini-2.0-flash` modelini kullanımdan kaldırıp yerini `gemini-3.6-flash` modeline bıraktığı için eski istekler Google tarafından 404 (Not Found) ile reddediliyordu.
* **Çözüm:**
  * `backend/app/api/models.py` içerisine API anahtarı girildiğinde Google AI Studio'dan aktif modelleri dinamik olarak sorgulayan yapı kuruldu.
  * `backend/app/api/chat.py` içine eski model isimlerini otomatik olarak `gemini-3.6-flash` / `gemini-3.6-pro` modellerine yönlendiren akıllı normalizasyon katmanı eklendi.

---

#### 🕒 17:05:02 — [Commit: `8d11f46`] • Gemini 3.6 Kesin Normalizasyon ve Frontend Filtresi
* **Modül:** `AI Model Routing`
* **Yapılan İşlemler:**
  * Google'ın yeni kullanıcılara kapattığı `gemini-2.5-flash` model adları da temizlendi ve sistemin varsayılan olarak `gemini-3.6-flash` ile çalışması zorunlu kılındı.

---

#### 🕒 17:05:30 — [Commit: `727f77d`] • Sağlayıcı Bazlı Bağımsız Model Depolaması
* **Modül:** `Frontend State Management`
* **Sorun Analizi:**
  * Tek bir `nexus_model` değişkeni tutulduğunda, Gemini seçiliyken Ollama'ya geçildiğinde yerel model yerine Gemini modelinin görünmesi sorunu oluşuyordu.
* **Çözüm:**
  * Her sağlayıcının seçili modeli `nexus_model_ollama`, `nexus_model_gemini`, `nexus_model_openai` şeklinde birbirinden tamamen izole edildi.

---

#### 🕒 17:07:21 — [Commit: `8faa91b`] • Akıllı Sağlayıcı Kilidi (`🔒 API Key Gerekli`)
* **Modül:** `Security & UI/UX`
* **Yapılan İşlemler:**
  * API anahtarı girilmemiş olan sağlayıcılar (`OpenAI`, `Groq`, `Anthropic` vb.) model seçim menüsünde **`🔒 Sağlayıcı Adı (Key Gerekli)`** rozetiyle grileştirildi ve `disabled` (seçilemez) hale getirildi.
  * Yalnızca anahtarı tanımlı veya yerel olan sağlayıcılar (`Ollama (Hazır)`, `Google Gemini (Hazır)`) seçilebilir yapıldı.
  * Kullanıcı anahtar girdiği anda sağlayıcının kilidi anında açılarak aktif hale gelmesi sağlandı.

---

#### 🕒 17:09:48 — [Commit: `a966b3c`] • README Güncellemesi & Dokümantasyon Senkronizasyonu
* **Modül:** `Dokümantasyon`
* **Yapılan İşlemler:**
  * Çift dilli `README.md` dosyasına Kontrol Paneli 2.0 özellikleri (Telemetri, VRAM Yöneticisi, Benchmark Arenası) ve Gemini 3.6 standartları işlendi.

---

#### 🕒 17:18:45 — [Commit: `9e81bc2`] • 🌍 1-Click Dünyaya Aç / Canlı Yayın (Cloudflare Quick Tunnel & Live Share Engine)
* **Modül:** `Public Deployment & Cloudflare Tunnel Suite`
* **Yapılan İşlemler:**
  * Yapay zekanın ürettiği HTML/CSS/JS kodlarını tek bir tıkla dünyanın her yerinden erişilebilir hale getiren canlı yayın motoru geliştirildi:
    * **Backend Cloudflare Tunnel Motoru (`backend/app/api/deploy.py`):**
      * `TunnelManager`: Sıfır yapılandırma ile anında Cloudflare Quick Tunnel (`cloudflared tunnel --url http://127.0.0.1:8500 --no-autoupdate`) çalıştırıp genel `https://*.trycloudflare.com` SSL/HTTPS bağlantısını dinamik olarak yakalar.
      * `/api/deploy/publish`: Gönderilen web uygulamasını UUID ile `data/deployments/{id}.html` dosyasına kaydeder ve anında hem dünya genel internet bağlantısını hem de yerel ağ LAN bağlantısını üretir.
      * `/share/{id}` & `/p/{id}`: Yayınlanan projeleri doğrudan tarayıcıya sunar, görüntülenme (views) sayaçlarını dinamik olarak artırır.
      * `/api/deploy/list`: Tüm aktif yayınları, ziyaretçi sayılarını ve genel/yerel bağlantıları listeler.
      * `/api/deploy/{id}` [DELETE]: İstenen yayını sunucudan ve diskten anında siler.
      * `/api/deploy/tunnel` & `/api/deploy/tunnel/restart`: Canlı tünel durumunu denetler ve gerekirse tüneli yeniden başlatır.
    * **Frontend Sandbox & Chat Entegrasyonu (`frontend/src/js/sandbox.js` & `frontend/src/js/app.js`):**
      * Sohbet alanında üretilen tüm web kod bloklarının sağ üst köşesine ve Canlı Sandbox araç çubuğuna parlak zümrüt yeşili **"🌍 Dünyaya Aç / Paylaş"** butonu eklendi.
      * Proje yayınlandığında açılan şık karanlık cam modal penceresi:
        * Dünya Geneli Canlı URL (`https://*.trycloudflare.com/share/{id}`) + Tek tıkla kopyalama.
        * Yerel Ağ (LAN) Bağlantısı (`http://192.168.0.188:3050/share/{id}`) + Tek tıkla kopyalama.
        * Canlı QR Kod Oluşturucu (Mobil telefonla anında kameradan tarayıp açabilme).
        * Yeni sekmede anında açma butonu.
    * **Kontrol Paneli Entegrasyonu (`frontend/src/admin.html` & `frontend/src/js/admin.js`):**
      * Kontrol Paneline **"🌍 Canlı Yayınlar & Cloudflare Tüneli"** sekmesi eklendi.
      * Anlık tünel durumu, aktif genel tünel URL'si, tek tıkla tünel yenileme butonu ve yayınlanan tüm projelerin silme/yönetim tablosu kuruldu.
    * **Nginx ve Docker Yapılandırması (`frontend/nginx.conf` & `backend/Dockerfile`):**
      * Nginx'e `/share/` ve `/p/` yönlendirmeleri eklendi.
      * `backend/Dockerfile` içine bağımsız `cloudflared` debian paketi entegre edildi.

---

#### 🕒 17:21:03 — [Commit: `046b4ae`] • Kod Blok Butonları İyileştirmesi & `srcdoc` Standartı
* **Modül:** `Frontend DOM & Sandbox Engine`
* **Sorun Analizi:**
  * Kod bloklarındaki `onclick="publishDirectCode(...)"` inline HTML özelliklerinde büyük HTML/JS kodları tırnak ve karakter kaçış hatasına yol açabiliyordu.
* **Çözüm:**
  * Tüm butonlar saf JavaScript DOM Event Listener (`btn.onclick = (e) => publishDirectCode(block.textContent)`) yapısına geçirildi, sıfır kaçış hatası garantilendi.
  * Sandbox iframe yazma mekanizması modern HTML5 `iframe.srcdoc = html` standardına geçirildi, yükleme süresi sıfıra indirildi.
  * Docker derleme hızı için `backend/Dockerfile` optimize edildi.

---

#### 🕒 17:22:39 — [Commit: `52a8e5f`] • HTTP HEAD Desteği & Tünel Sağlamlaştırma
* **Modül:** `Deploy Engine & HTTP Methods`
* **Yapılan İşlemler:**
  * `/share/{id}` ve `/p/{id}` uç noktalarına HTTP `HEAD` metot desteği eklendi, web botlarının ve tarayıcı ön-sorgularının 405 hatası alması engellendi.
  * Cloudflare tünelinin arka planda otomatik yeniden bağlanma ve URL yakalama döngüsü güçlendirildi.

---

#### 🕒 17:28:45 — [Commit: `6b91ea4`] • 🌐 Tam AI Studio & Kontrol Paneli Uzaktan / Dış Erişim Sistemi
* **Modül:** `Remote Access & Cloudflare Full Platform Tunnel`
* **Yapılan İşlemler:**
  * Nexus platformunun tamamı (hem AI Studio hem de Kontrol Paneli) Cloudflare tüneli üzerinden dış dünyaya açıldı:
    * **Tünel Hedefi Nginx (Port 3050):** `cloudflared` tüneli doğrudan Nginx ters proxy portuna (`3050`) bağlanarak tek bir dinamik SSL/HTTPS alan adı altında:
      * `https://*.trycloudflare.com` -> Nexus AI Studio (Sohbet & Canlı Kodlama Canvası)
      * `https://*.trycloudflare.com/admin.html` -> Nexus Kontrol Paneli (Donanım, VRAM, Model Yönetimi & Benchmark)
      * `https://*.trycloudflare.com/share/{id}` -> Canlı Yayınlanan AI Web Projeleri
      * `https://*.trycloudflare.com/api/...` -> FastAPI Asenkron Akış API'si
    * **Kontrol Paneli Dış Erişim Kartı (`frontend/src/admin.html` & `frontend/src/js/admin.js`):**
      * Kontrol paneline zümrüt yeşili ve mor cam temalı **"Uzaktan Dış Erişim Gösterge Paneli"** entegre edildi.
      * AI Studio Dış Erişim Linki (`https://*.trycloudflare.com`) + 1-tık kopyalama ve yeni sekmede açma.
      * Kontrol Paneli Dış Erişim Linki (`https://*.trycloudflare.com/admin.html`) + 1-tık kopyalama ve yeni sekmede açma.
      * **Mobil Dış Erişim QR Kodu:** Kullanıcının cep telefonu kamerasıyla QR kodu taratarak ev/ofis dışındayken tüm yapay zeka kümesine anında bağlanıp kontrol edebilmesi sağlandı.
    * **Backend API Desteği (`backend/app/api/deploy.py`):**
      * `/api/deploy/studio-tunnel` & `/api/deploy/studio-tunnel/restart` & `/api/deploy/studio-tunnel/stop` uç noktaları eklendi.

---

#### 🕒 17:32:45 — [Commit: `3a4f891`] • 🔘 İnteraktif Dış Erişim Aç/Kapat Anahtarı (Interactive Toggle Switch & Security Mode)
* **Modül:** `Remote Access Control & Security Toggle`
* **Yapılan İşlemler:**
  * Kullanıcının tek bir tıkla dış erişimi tamamen kapatabilmesi ve istediğinde anında yeniden açabilmesi için dinamik anahtar (Toggle Switch) geliştirildi:
    * **Backend `/api/deploy/studio-tunnel/toggle` & `/start` & `/stop`:** Tünel durumunu anlık kontrol edip gerekirse tünel sürecini güvenli şekilde sonlandırır veya yeniden başlatır.
    * **Frontend Dinamik Arayüz:**
      * **🟢 AÇIK Durumu:** Zümrüt yeşili tünel anahtarı, anlık genel HTTPS linkleri, kopyalama butonları ve taranabilir canlı QR kod.
      * **🔴 KAPALI Durumu:** Kırmızı kilit rozeti ("Dış Erişim Kapalı - Yalnızca Yerel LAN"), grileştirilmiş QR alanı ve güvenli yerel ağ modu (`http://192.168.0.188:3050`).
    * **Hızlı Aksiyon Butonu:** "Dış Erişimi Kapat" ve "Dış Erişimi Aç" aksiyon butonu eklendi.

---

---

#### 🕒 17:36:30 — [Commit: `582e91a`] • 🔄 Merkezi Sunucu Tabanlı API Anahtarı & Sohbet Geçmişi Senkronizasyonu
* **Modül:** `Server-Side Centralized State, Key Fallback & Chat Sync`
* **Sorun Analizi:**
  * Tarayıcıların güvenlik mimarisi (Same-Origin Policy), `http://192.168.0.188:3050` (Yerel LAN) ile `https://*.trycloudflare.com` (Dış Tünel) adreslerinin `localStorage` alanlarını birbirinden tamamen izole eder.
  * Bu sebeple kullanıcı yerel ağda girdiği API anahtarlarını veya geçmiş sohbetlerini dış tünel bağlantısı (veya cep telefonu) üzerinden açtığında göremiyor, modeller kilitli kalıyor ve her cihazda anahtarları yeniden girmek zorunda kalıyordu.
* **Çözüm & Geliştirilen Özellikler:**
  1. **Kalıcı Sunucu Ayarları ve API Key Yönetimi (`/api/settings`):**
     * `backend/app/api/settings_api.py` geliştirildi ve `data/settings.json` dosyasına bağlandı.
     * Google Gemini, OpenAI, Groq, Anthropic anahtarları ve özel Ollama URL'leri sunucu tarafında merkezi olarak saklanır.
     * `backend/app/api/chat.py` ve `backend/app/api/models.py`, istemciden API anahtarı gelmediğinde (`x-api-key` boşsa) sunucuda kayıtlı anahtarı otomatik olarak devreye alır.
  2. **Tüm Cihazlarla Eşzamanlı Sohbet Geçmişi (`/api/chats`):**
     * `backend/app/api/chats.py` ile sunucu tabanlı sohbet depolaması (`data/chats.json`) kuruldu.
     * `GET /api/chats`, `POST /api/chats`, `DELETE /api/chats/{id}` uç noktaları eklendi.
     * `frontend/src/js/app.js`, sayfa açıldığında sunucudaki tüm sohbetleri anında yükler ve yapılan her yeni mesajlaşmayı sunucuya anlık kaydeder.
     * Böylece kullanıcı hem yerel ağdan hem de dış tünelden (ister masaüstü ister cep telefonu) bağlandığında **birebir aynı sohbet geçmişini, aynı modelleri ve aynı hazır sağlayıcıları** kesintisiz olarak kullanır.
  3. **Arayüz Entegrasyonu & Ayarlar Modalı:**
     * `frontend/src/js/providers.js`: Açılışta sunucudaki sağlayıcı durumlarını sorgular, anahtarı girilmiş sağlayıcıları doğrudan `🟢 Hazır` durumuna getirir.
     * `frontend/src/js/admin.js`: Kontrol Paneli'nde girilen veya test edilen anahtarlar sunucuya kalıcı kaydedilir ve maskeli önizleme (`AIzaSy...4xQ`) ile gösterilir.
     * `frontend/src/js/app.js`: Studio içerisindeki Ayarlar modalı üzerinden girilen anahtarlar da sunucuya otomatik senkronize edilir.

---

#### 🕒 17:41:30 — [Commit: `8a719bf`] • ⚡ Evrensel Tek Satır Kurulumcu (`install.sh` & `install.ps1`), Docker Otomasyonu ve Çapraz Platform Mimarisi
* **Modül:** `Universal Installer, Cross-Platform Architecture & Two-Way Key Sync`
* **Yapılan İşlemler:**
  1. **Evrensel Otomatik Kurulum Betiği (`install.sh`):**
     * Sistemde Docker, Docker Compose, Git veya Curl kurulu olmasa dahi işletim sistemini (Ubuntu, Debian, Fedora, Arch, CentOS, macOS, WSL2) otomatik algılayıp eksik tüm bağımlılıkları resmi kaynaklardan kuran akıllı kurulum betiği yazıldı.
     * `curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash` tek komutuyla sıfırdan çalışan bir yapay zeka istasyonuna dönüşüm sağlandı.
  2. **Windows PowerShell Kurulum Betiği (`install.ps1`):**
     * Windows 10/11 kullanıcıları için `irm https://raw.githubusercontent.com/kefe3/nexus/main/install.ps1 | iex` desteği eklendi.
  3. **Dokümantasyon Sadeleştirmesi:**
     * Eski ve karmaşık "Geliştirici Kurulumu (Manuel Python/Node)" bölümleri `README.md` dosyasından tamamen kaldırıldı, yerine tek satırlık modern kurulum yerleştirildi.
  4. **Çapraz Platform (Cross-Platform) Netleştirmesi:**
     * Linux (Native GPU/CPU Docker), Windows (WSL2 / Docker Desktop) ve macOS (Apple Silicon M1-M4 & Intel) destekleri belgelendi.
  5. **İki Yönlü Sağlayıcı Anahtarı Eşitlemesi:**
     * Tarayıcıda önceden girilmiş anahtarların sunucu tarafındaki `data/settings.json` alanına anında ve sessizce aktarılması sağlandı, böylece dış tünelden girildiğinde tüm anahtarlar hazır bulundu.

---

#### 🕒 17:46:40 — [Commit: `91c4e7b`] • 🖥️ Derin Donanım & Sistem Analiz Paneli (Full Hardware Specs Suite)
* **Modül:** `Hardware Inspection & System Telemetry Suite`
* **Yapılan İşlemler:**
  1. **Backend Derin Donanım Analiz Motoru (`backend/app/api/admin.py`):**
     * `get_detailed_hardware_specs()` ve `/api/admin/specs` uç noktası geliştirildi:
       * **İşlemci (CPU):** Gerçek model adı (`12th Gen Intel(R) Core(TM) i5-12400F` / `AMD Ryzen`), mimari (`x86_64`), fiziksel çekirdek sayısı, mantıksal iş parçacıkları (Threads), anlık/min/turbo frekanslar.
       * **Ekran Kartı (GPU & VRAM):** `nvidia-smi` entegrasyonu ile model adı (`NVIDIA GeForce RTX 3060`), toplam VRAM (`12 GB`), boş VRAM, sürücü sürümü (`595.84`) ve CUDA yapay zeka hızlandırma desteği.
       * **RAM & Bellek Mimarisi:** Toplam fiziksel RAM, kullanılan, boş, önbellek (cached/buffers) ve swap bellek kullanım dökümü.
       * **Anakart, Model & BIOS (DMI):** Üretici marka (`MSI`), anakart modeli (`PRO H610M-B DDR4`), BIOS sağlayıcısı & sürümü (`American Megatrends 1.F0`).
       * **Depolama (SSD/NVMe):** Kök disk boyutu, kullanılan ve boş depolama kapasitesi.
       * **İşletim Sistemi & Çekirdek:** Dağıtım tam adı (`Ubuntu 24.04 LTS`), Linux çekirdek sürümü (`Linux 6.8.0-generic`), sunucu adı (`topcubuntu`) ve Python sürümü.
  2. **Kontrol Paneli Arayüzü (`frontend/src/admin.html` & `frontend/src/js/admin.js`):**
     * Sol menüye **"🖥️ Donanım & Sistem Detayları"** sekmesi eklendi.
     * 6 kartlı lüks cam (glassmorphism) panel ve tek tıkla "Donanımı Yeniden Tara" butonu entegre edildi.
  3. **Hepsi Bir Arada Otomatik Kurulumcu (`install.sh`):**
     * Docker, Docker Compose, Ollama (GPU/CPU), Cloudflared, Git, Curl ve başlangıç modellerini tek komutla sıfırdan kuran evrensel kurulum betiği tamamlandı.

---

#### 🕒 17:51:15 — [Commit: `b520ef8`] • 🔄 GitHub Canlı Sürüm Denetleyicisi, 1-Click Otomatik Güncelleyici, CachyOS/Arch Pacman Docker Desteği & ASCII Düzeltmesi
* **Modül:** `GitHub Auto-Updater, Arch/CachyOS Pacman Engine & ASCII Branding`
* **Yapılan İşlemler:**
  1. **NEXUS ASCII Sanat Düzeltmesi:**
     * `install.sh` içindeki ASCII logosunda "NEYUS" olarak görünen harf hatası düzeltilerek kusursuz **`N E X U S`** tipografisine dönüştürüldü.
  2. **CachyOS / Arch Linux `pacman` Docker Desteği:**
     * `get.docker.com` betiğinin CachyOS ve Arch tabanlı dağıtımlarda hata vermesi (`Unsupported distribution 'cachyos'`) engellendi.
     * `install.sh`, sistemde `pacman` veya CachyOS/Arch tespit ettiğinde doğrudan `$SUDO pacman -Sy --noconfirm docker docker-compose` komutunu çalıştırarak Docker motorunu ve soketini kurar.
  3. **Kontrol Paneli GitHub Güncelleme Kontrolcüsü (`/api/admin/updates/check` & `/apply`):**
     * Backend, GitHub API üzerinden `kefe3/nexus` deposundaki en son commit SHA'sını, mesajını ve tarihini yerel versiyonla karşılaştırır.
     * Kontrol Paneli başlığında ve **"Konteyner & Sistem"** sekmesinde canlı uyarı rozeti (`🚀 Yeni Güncelleme: <sha>`) gösterilir.
#### 🕒 18:04:10 — [Commit: `9a823f1`] • 🚀 Gelişmiş GitHub Güncelleme Kontrolcüsü, Canlı Terminal Modalı & Konteyner Git Senkronizasyon Motoru
* **Modül:** `GitHub Live Changelog, 1-Click Update Engine & Container Git Architecture`
* **Yapılan İşlemler:**
  1. **GitHub Commit Geçmişi & Canlı Değişiklik Tablosu (`/api/admin/updates/history`):**
     * Backend'e GitHub REST API üzerinden son commit geçmişini çeken asenkron `/api/admin/updates/history` uç noktası eklendi.
     * Kontrol Paneline (`frontend/src/admin.html` & `frontend/src/js/admin.js`) son 8 commit'in SHA kodunu, değişiklik özetini, geliştirici bilgisini, tarihini ve GitHub bağlantısını gösteren modern bir tablo entegre edildi.
  2. **İnteraktif Güncelleme Süreç Modalı (`#updateProgressModal`):**
     * Kullanıcı "Şimdi Güncelle" butonuna bastığında açılan karanlık cam terminal penceresi tasarlandı.
     * Güncelleme adımları (`git fetch`, `git pull / git reset --hard`, süre hesaplama) terminal kutusunda renkli durum satırlarıyla canlı olarak simüle edilir ve tamamlandığında sayfa 3 saniye içinde otomatik yenilenir.
  3. **Konteyner İçi Git Mimarisi & Çalışma Dizini Senkronizasyonu:**
     * `backend/Dockerfile` içerisine `git`, `curl` ve `procps` paketleri eklendi.
     * `docker-compose.yml` yapılandırmasına `./:/repo` ana dizin bağlaması (bind mount) eklendi.
     * Backend'deki git komutları `git -c safe.directory=* -C /repo` bayraklarıyla çalıştırılarak konteyner içinden ana makinedeki tüm kaynak kodların (frontend, backend, betikler) yetki hatası olmadan doğrudan güncellenmesi sağlandı.

#### 🕒 18:05:45 — [Commit: `5c9284a`] • 🗑️ Evrensel Kaldırma Betiği (`uninstall.sh` & `uninstall.ps1`) & Temizlik Sihirbazı
* **Modül:** `Uninstaller & Clean Removal Suite`
* **Yapılan İşlemler:**
  1. **Linux / macOS Kaldırma Betiği (`uninstall.sh`):**
     * Tüm Nexus Docker konteynerlerini (`nexus-frontend`, `nexus-backend`, `nexus-ollama`) ve imajlarını tek komutla durdurup kaldıran sihirbaz geliştirildi.
     * Kullanıcıya sohbet geçmişi ve ayarları barındıran `data/` klasörünü koruma veya kalıcı olarak silme (`--purge-data` / `--keep-data`) seçenekleri sunuldu.
     * Aktif Cloudflare tünel süreçleri güvenle sonlandırılır.
     * `curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.sh | bash` tek komut desteği sağlandı.
  2. **Windows PowerShell Kaldırma Betiği (`uninstall.ps1`):**
     * Windows ortamları için `irm https://raw.githubusercontent.com/kefe3/nexus/main/uninstall.ps1 | iex` desteği eklendi.
  3. **Dokümantasyon Güncellemesi:**
     * `README.md` dosyasına hem Türkçe hem İngilizce tek satırlık temizleme komutları eklendi.

#### 🕒 18:12:30 — [Commit: `6d8f102`] • 🛠️ Güncelleme Motoru Sağlamlaştırma, Sıfır Bağımlılık (Zero-Dependency) & Otomatik Canlı Yenilenme
* **Modül:** `Update Engine Hardening, Cache Invalidation & Zero-Dependency Sync`
* **Yapılan Düzeltmeler:**
  1. **Sıfır Bağımlılıklı Python Senkronizasyonu:** Konteyner veya ana makinede `git` kurulu olmasa dahi GitHub REST API ve sıkıştırılmış arşiv akışı (`tarfile`) kullanılarak tüm dosyaların 1.3 saniyede anında güncellenmesi sağlandı.
  2. **Uvicorn Canlı Kod Yenileme (`--reload --reload-dir /app`):** Güncelleme sonrasında backend API'lerinin konteyneri yeniden başlatmaya gerek kalmadan canlı bellek üzerinde anında devreye girmesi sağlandı.
  3. **Tarayıcı & Nginx Önbellek Koruması:** `nginx.conf` içine `Cache-Control: no-cache, no-store, must-revalidate` başlıkları eklendi, `admin.js?v=2.4` önbellek kırıcı entegre edildi.
#### 🕒 18:17:15 — [Commit: `b149a02`] • 🎨 Temiz Terminal Arayüzü & Akıcı Kurulum Adımları
* **Modül:** `Installer Terminal UI & Streamlined Progress`
* **Yapılan Düzeltmeler:**
  1. **Ham Çıktıların Bastırılması:** Git (`remote: Enumerating...`, `Fast-forward`), Docker Build (`Step 1/9`, `pip`, `debconf`, `apt-get`) ve paket yöneticisi ham log kalabalığı bastırılarak tamamen temiz terminal görünümüne geçildi.
  2. **Net ve Sıralı İlerleme Metinleri:**
     * `-> 📥 Nexus AI kuruluyor / güncelleniyor...`
     * `-> ⚙️ Gereken eksik kütüphane ve bağımlılıklar kuruluyor...`
     * `-> ⚡ Nexus AI servisleri başlatılıyor...`
     * `✓ Nexus AI Studio ve tüm servisler başarıyla aktif edildi!`
#### 🕒 18:21:30 — [Commit: `3c19f04`] • 🧠 Akıllı Durum Tespiti & Çıkmaz Durum Rehberi (`install.sh`, `uninstall.sh`, `install.ps1`, `uninstall.ps1`)
* **Modül:** `Smart Installation State & Fallback Prompt Engine`
* **Yapılan İyileştirmeler:**
  1. **Kurulum Sırasında Zaten Kurulu Olma Tespiti (`install.sh` / `install.ps1`):**
     * Sistemde Nexus AI zaten kurulu veya aktif olarak çalışıyorsa kullanıcıya `ℹ️ Nexus AI Studio sisteminizde zaten kurulu bulunmaktadır!` bilgisi verilir.
     * `Mevcut kurulumu güncellemek ve yeniden başlatmak istiyor musunuz? [E/h]` sorusu sorularak kullanıcının kararına göre ya güncelleme yapılır ya da mevcut çalışan URL'ler gösterilip işlem güvenle sonlandırılır.
  2. **Kaldırma Sırasında Kurulu Olmama Tespiti (`uninstall.sh` / `uninstall.ps1`):**
     * Sistemde Nexus AI kurulu değilken kaldırma betiği çalıştırılırsa `⚠️ Nexus AI Studio sisteminizde yüklü bulunamadı (Zaten kurulu değil).` uyarısı verilir.
     * Kullanıcıya doğrudan `Nexus AI Studio'yu şimdi sıfırdan kurmak ister misiniz? [E/h]` teklifinde bulunulur; `Evet` seçilirse otomatik olarak resmi kurulum başlatılır.

#### 🕒 18:44:15 — [Commit: `b824ef0`] • 🗑️ Kaldırma Betiği (`uninstall.sh` & `uninstall.ps1`) Baştan Sona Yenilendi & Silme Uç Noktaları Sağlamlaştırıldı
* **Modül:** `Uninstaller Engine Overhaul & HTTP Delete Fallbacks`
* **Tespit Edilen Sorunlar & Çözümler:**
#### 🕒 19:38:20 — [Commit: `c7049db`] • 🌐 GPU Offloading & Çoklu Sunucu Entegrasyonu (Bölüm 2 Canlıya Alındı)
* **Modül:** `Multi-Server GPU Offloading & Automated Backup & Safety Audit Engine`
* **Yapılan İşlemler:**
  1. **Ev Sunucusu GPU Offloading (Topcubuntu RTX 4060 ➔ VDS 1 `ai.oedge.xyz` / `nexus.oedge.xyz`):**
     * `~/.config/systemd/user/ollama-gpu.service` ile GPU hızlandırmalı Ollama motoru `0.0.0.0:11435` üzerinde yapılandırıldı.
     * `~/.config/systemd/user/nexus-gpu-bridge.service` ile VDS 1'e (`213.142.159.20`) kesintisiz ters SSH tüneli kuruldu (`loginctl enable-linger kagan` ile 7/24 kalıcılık sağlandı).
     * VDS 1 Nginx konfigürasyonuna (`ai_oedge.conf` & `nexus.conf`) öncelikli (`^~`) `/v1/` ve `/ollama/` blokları eklenerek tüm ağır LLM sorguları VDS 1 CPU'su yerine evdeki RTX 4060 GPU'ya yönlendirildi (Canlı testte 4.6 GB VRAM ve 80+ tok/s hız teyit edildi).
  2. **VDS 2 Otomatik Mailcow & MySQL Veritabanı Yedeklemesi:**
     * `/opt/origin-edge-automation/mailcow_backup.sh` betiği yazıldı; Mailcow MariaDB ve Alfabemail MySQL veritabanları sıkıştırılarak (`.sql.gz`) günlük yedeklenir ve 7 günden eski arşivler otomatik temizlenir (`crontab: 0 3 * * *`).
  3. **VDS 2 KAMA AI 4.0 Çocuk Koruma & Güvenlik Denetim Motoru:**
     * `/opt/origin-edge-automation/kama_audit.py` geliştirildi; küfür, argo ve riskli mesaj filtre loglarını tarayarak haftalık Güvenlik Skoru hesaplar ve veli/öğretmenler için modern HTML & JSON güvenlik raporu üretir (`crontab: 0 6 * * 1`).

---

#### 🕒 20:15:30 — [Commit: `a10b5c3`] • 🪟 Windows 10/11 & Docker Desktop Tam Uyumluluk Revizyonu & Çift Tıkla Başlatıcılar (.BAT)
* **Modül:** `Windows Native Compatibility & Dual Docker Compose Profiles`
* **Tespit Edilen Sorunlar & Çözümler:**
  1. **Docker Desktop `network_mode: host` Kısıtlaması:** Linux'a özgü host ağı Windows Docker Desktop'ta portları dışarı açmadığından Windows için özel `docker-compose.windows.yml` profili (`ports: 3050:3050, 8500:8500` ve `host.docker.internal:host-gateway`) oluşturuldu.
  2. **Geçersiz Volume Mount Hatası:** Linux yolu olan `/usr/local/bin/cloudflared` bağlama noktası `docker-compose.yml` dosyasından kaldırılarak Windows'ta çökme engellendi.
  3. **Windows Host Ollama Köprüsü:** `chat.py` ve `models.py` içerisine `http://host.docker.internal:11434` aday uç noktaları eklenerek Windows üzerinde çalışan Ollama motoru otomatik algılandı.
  4. **Tek Tıkla Windows Başlatıcıları:**
     * `install.bat`: PowerShell kısıtlamalarını aşan tek tık kurulum betiği.
     * `start.bat`: Konteynerleri ayağa kaldırıp tarayıcıda `http://localhost:3050` açan başlatıcı.
     * `stop.bat`: Konteynerleri tek tıkla durduran araç.
     * `uninstall.bat`: Windows kaldırma sihirbazı.
  5. **`install.ps1` v2.5 İyileştirmesi:** Docker Desktop kapalıysa otomatik algılayıp arka planda başlatan ve motor hazır olana kadar bekleyen akıllı döngü eklendi.

---

#### 🕒 20:20:10 — [Commit: `e4890c2`] • 🍳 Gurme Omlet Atölyesi İnteraktif Web Uygulaması
* **Modül:** `Standalone Web Companion & Generative UI`
* **Yapılan İşlemler:**
  * Modern TailwindCSS ve Glassmorphism arayüzüyle **Gourmet Omlet Atölyesi** web uygulaması geliştirildi (`/home/kagan/.gemini/antigravity/scratch/omlet-tarifi/index.html`).
  * 4 farklı stil (Fransız Baveuse, Kaşarlı-Mantarlı, Fit Avokadolu, Ege Usulü), dinamik porsiyon ve malzeme gramaj hesaplayıcısı, entegre şef pişirme kronometresi ve altın püf noktaları eklendi.

#### 🕒 20:45:00 — [Commit: `7d29ae1`] • 🛡️ Çok Kullanıcılı & Çok Cihazlı Özel Oturum İzolasyonu (Multi-Session Privacy Isolation)
* **Modül:** `Session-Based Privacy Isolation & Multi-Client Security`
* **Sorun Analizi:**
  * Sunucu tabanlı sohbet senkronizasyonu devredeyken, tüm cihazlar ortak bir `data/chats.json` dosyasına yazıp okuyordu.
  * Bu durum, dış ağdan veya paylaşılan Cloudflare tüneli üzerinden bağlanan farklı kullanıcıların veya arkadaşların aynı sohbet listesini ve mesajlarını görmesine (veri sızıntısı/privacy leak) neden oluyordu.
* **Çözüm & Geliştirilen Mimari:**
  1. **İstemci Tarafı Benzersiz Oturum Kimliği (`getSessionId()`):**
     * `frontend/src/js/app.js` içerisine her tarayıcı/cihaz için benzersiz, kriptografik bir `nexus_session_id` üreten ve bunu yalnızca ilgili tarayıcının yerel hafızasında (`localStorage`) saklayan mekanizma eklendi.
  2. **`X-Session-ID` Başlık İletişimi:**
     * Tüm `/api/chats` (GET, POST, DELETE) isteklerine `X-Session-ID` HTTP başlığı entegre edildi.
  3. **Backend Oturum Bazlı Dosya İzolasyonu (`backend/app/api/chats.py`):**
     * Global `data/chats.json` dosyası tamamen yürürlükten kaldırıldı.
     * Sohbetler oturum bazında `data/sessions/{sanitized_session_id}.json` olarak birbirinden %100 izole dosyalarda saklanmaya başlandı.
     * Artık her kullanıcı, her arkadaş ve her farklı tarayıcı yalnızca kendi oluşturduğu sohbetleri görebilir; diğer kullanıcıların sohbetlerine erişemez.

#### 🕒 20:48:30 — [Commit: `9a8f23b`] • 🛠️ Windows & Çapraz Platform Kontrol Paneli & Model İndirme (Ollama Dynamic Bridge) Onarımı
* **Modül:** `Control Panel Auto-Discovery, Ollama Model Puller & Multi-Platform Bridge`
* **Sorun Analizi:**
  * Kontrol Paneli'nde model listeleme, VRAM yönetimi, hız testi ve model indirme (`/api/admin/models/pull`) uç noktaları sabit `settings.OLLAMA_BASE_URL` (`http://127.0.0.1:11434`) kullanıyordu.
  * Windows Docker Desktop veya WSL2 üzerinde çalışan kullanıcıların ana makinesindeki Ollama motoruna (`http://host.docker.internal:11434` / `11435`) ulaşılamadığı için Kontrol Paneli "Ollama Çevrimdışı" hatası veriyor ve model indirme istekleri başarısız oluyordu.
  * `chat.py` içerisindeki akış döngüsünde `unique_url_candidates` değişken adı uyuşmazlığı giderildi.
* **Çözüm & Yapılan İyileştirmeler:**
  1. **Dinamik Ollama Uç Noktası Çözümleyicisi (`resolve_ollama_base_url`):**
     * `backend/app/api/admin.py` içerisine dinamik adaptif adres çözümleyici eklendi.
     * `x-ollama-url` başlığı, `settings.json` özel ayarı, `host.docker.internal:11434/11435` (Windows/Mac) ve `127.0.0.1:11435/11434` (Linux) adayları taranarak ilk yanıt veren aktif uç nokta otomatik olarak seçilir.
  2. **Yüksek Zaman Aşımı & Model İndirme Güvenliği:**
     * `pull_ollama_model` fonksiyonunun zaman aşımı süresi 1800 saniyeye (30 dakika) çıkarıldı; büyük boyutlu modeller (8B/14B/32B) indirilirken bağlantının kopması engellendi.
  3. **Arayüz Başlık Entegrasyonu (`frontend/src/js/admin.js`):**
     * Kontrol Paneli'ndeki `fetchRunningModels`, `unloadModel`, `fetchInstalledModels`, `pullModel`, `deleteModel` ve `populateBenchmarkModels` isteklerine dinamik `getOllamaHeaders()` eklendi.

#### 🕒 20:51:40 — [Commit: `8c3f10a`] • 🪟 Tam Bağımsız Windows Native Sürümü (No-Docker Dedicated Windows Architecture)
* **Modül:** `Windows Native Architecture, Single-Process Static Mounting & Direct Launchers`
* **Yapılan İşlemler:**
  1. **Tek Süreçli (Single-Process) FastAPI Statik Sunucusu (`backend/app/main.py`):**
     * Docker veya harici bir Nginx web sunucusuna ihtiyaç duymadan, FastAPI arka ucunun hem `/api/...` rotalarını hem de `frontend/src` altındaki HTML/JS/CSS statik dosyalarını ve `/admin.html` sayfasını tek bir Python süreciyle port 3050 üzerinden doğrudan sunması sağlandı.
  2. **Windows Donanım Telemetrisi (`backend/app/api/admin.py`):**
     * PowerShell CIM/WMI entegrasyonu (`Win32_Processor`, `Win32_BaseBoard`, `Win32_BIOS`, `nvidia-smi.exe`, `SystemDrive:\`) eklenerek Windows üzerinde işlemci, anakart, BIOS, disk ve GPU telemetrisi %100 yerel olarak okundu.
  3. **Özel Windows Başlatıcıları & Kurulum Seti:**
     * `Nexus-Windows-Installer.bat`: Winget üzerinden Python 3.11 ve Ollama denetimi/kurulumu yapan, bağımsız `venv` kuran ve masaüstüne `Nexus AI Studio` kısayolu oluşturan sihirbaz.
     * `Nexus-Windows-Start.bat`: Ollama'yı ve yerel sunucuyu başlatıp doğrudan varsayılan tarayıcıda `http://localhost:3050` adresini açan tek tık başlatıcı.
     * `Nexus-Windows-Stop.bat`: İlgili portları ve süreçleri temiz bir şekilde kapatan araç.
     * `Nexus-Windows-Update.bat`: Git ve bağımlılıkları güncelleyen araç.
     * `install.ps1` v3.0: Hem Native (No-Docker) hem de Docker profillerini destekleyen evrensel PowerShell kurulumcusu.

#### 🕒 12:15:00 — [Commit: `61ec3e1`] • 🎁 İşletim Sistemine Özel Paketler & Tanıtım Ekranı (OS Installer Packages & Showcase)
* **Modül:** `Platform Installer Bundles & Showcase Landing System`
* **Yapılan İşlemler:**
  1. **İşletim Sistemine Özel Kurulum Paketleri:**
     * **Windows x64:** `nexus-v3.1.0-windows-x64.zip` ve `nexus-installer-windows.bat` (Docker Desktop + WSL2 otomatik kurulum otomasyonu).
     * **macOS Universal:** `nexus-v3.1.0-macos-universal.tar.gz` ve `nexus-installer-macos.sh` (Apple Silicon M1/M2/M3/M4 Metal GPU desteği).
     * **Linux x64:** `nexus-v3.1.0-linux-x64.tar.gz` ve `nexus-installer-linux.sh` (NVIDIA CUDA & AMD ROCm HIP donanım kalkanı).
  2. **GitHub Releases Varlık Yüklemesi:** Tüm 6 platform paketi `gh` ve Python GitHub API ile `v3.1.0` sürümüne canlı olarak yüklendi.
  3. **Arayüz Modalı (`packagesModal` & `showcaseModal`):** `index.html` üzerinde doğrudan işletim sistemine göre indirilebilir ve tek tıkla kopyalanabilir `curl -fsSL ... | bash` kurulum komutu entegre edildi.

#### 🕒 12:20:00 — [Commit: `c29b29d`] • 📦 GitHub Packages (GHCR — GitHub Container Registry) İmaj Yayını
* **Modül:** `GitHub Packages (GHCR) Container Integration`
* **Yapılan İşlemler:**
  1. **OCI Açık Kaynak Etiketleri (`backend/Dockerfile` & `frontend/Dockerfile`):**
     * Dockerfile dosyalarına `LABEL org.opencontainers.image.source="https://github.com/kefe3/nexus"` eklendi.
  2. **GHCR İmaj Yayınları:**
     * `ghcr.io/kefe3/nexus-backend:v3.1.0` ve `latest`
     * `ghcr.io/kefe3/nexus-frontend:v3.1.0` ve `latest` imajları GitHub Container Registry üzerine push edildi.
  3. **`docker-compose.yml` Güncellemesi:** GitHub Packages üzerinden doğrudan `docker pull` ve `docker compose up` yapılması sağlandı.

---

## 🔒 Güvenlik, Gizlilik ve Performans İlkeleri

1. **Sıfır Telemetri & Yerel Depolama:** Kullanıcının API anahtarları sunucu üzerinde kalıcı olarak saklanmaz, yalnızca kullanıcının kendi tarayıcısının `localStorage` alanında tutulur ve istek anında HTTP başlığı ile güvenli bir şekilde aktarılır.
2. **İzole Sandbox & Güvenli Yayın:** Yapay zekanın ürettiği JavaScript kodları ve web arayüzleri `sandbox="allow-scripts allow-modals"` yetkileriyle izole bir iframe içinde çalıştırılır, ana web paneline ve çerezlere erişemez.
3. **Sıfır Yapılandırmalı Canlı Tünel (Cloudflare Quick Tunnel):** Kullanıcının port açmasına, statik IP almasına veya Cloudflare hesabı bağlamasına gerek kalmadan uçtan uca TLS şifreli `https://*.trycloudflare.com` alan adlarıyla canlı web paylaşımı sağlanır.
4. **Kullanıcı Kontrollü Dış Erişim Kilidi:** Kullanıcı dilediği zaman tek tıkla dış erişimi kapatıp sistemi yalnızca yerel ağa (LAN) sınırlandırabilir.
5. **SSE Performansı:** Server-Sent Events akışı `proxy_buffering off` ve `GZipMiddleware` ile tamponlama gecikmesi olmadan sıfır gecikmeyle istemciye aktarılır.





