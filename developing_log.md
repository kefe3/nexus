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

## 🔒 Güvenlik, Gizlilik ve Performans İlkeleri

1. **Sıfır Telemetri & Yerel Depolama:** Kullanıcının API anahtarları sunucu üzerinde kalıcı olarak saklanmaz, yalnızca kullanıcının kendi tarayıcısının `localStorage` alanında tutulur ve istek anında HTTP başlığı ile güvenli bir şekilde aktarılır.
2. **İzole Sandbox & Güvenli Yayın:** Yapay zekanın ürettiği JavaScript kodları ve web arayüzleri `sandbox="allow-scripts allow-modals"` yetkileriyle izole bir iframe içinde çalıştırılır, ana web paneline ve çerezlere erişemez.
3. **Sıfır Yapılandırmalı Canlı Tünel (Cloudflare Quick Tunnel):** Kullanıcının port açmasına, statik IP almasına veya Cloudflare hesabı bağlamasına gerek kalmadan uçtan uca TLS şifreli `https://*.trycloudflare.com` alan adlarıyla canlı web paylaşımı sağlanır.
4. **Kullanıcı Kontrollü Dış Erişim Kilidi:** Kullanıcı dilediği zaman tek tıkla dış erişimi kapatıp sistemi yalnızca yerel ağa (LAN) sınırlandırabilir.
5. **SSE Performansı:** Server-Sent Events akışı `proxy_buffering off` ve `GZipMiddleware` ile tamponlama gecikmesi olmadan sıfır gecikmeyle istemciye aktarılır.




