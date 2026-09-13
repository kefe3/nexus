#!/usr/bin/env python3
import os
import sys
import urllib.request
import json

RELEASES = [
    {
        "tag_name": "v3.0.0",
        "name": "🛡️ Nexus AI Studio v3.0.0 - Hardware Audit, 6GB VRAM Check & OOM Crash Guard",
        "body": """## 🛡️ Nexus AI Studio v3.0.0 - Donanım Denetimi & OOM Çökme Kalkanı

### 🚀 Öne Çıkan Özellikler

- **📊 En Az 6.0 GB VRAM & Sistem Kaynak Denetimi**: Kurulum ve çalışma esnasında en az 6.0 GB VRAM, 8.0 GB RAM ve 10.0 GB Boş Disk şartı otomatik denetlenir.
- **🛡️ OOM Çökme Kalkanı (Out-Of-Memory Crash Prevention)**: `OLLAMA_MAX_LOADED_MODELS=1` ve `OLLAMA_NUM_PARALLEL=1` kuralları ile belleğin taşarak sistemin kilitlenmesini veya çökmesini 100% önler.
- **🎛️ Kontrol Paneli Donanım Kalkanı Paneli**: Canlı uyumluluk skoru (`🟢 Mükemmel`, `🟡 Orta Risk`, `🔴 Yüksek Risk`) ve donanım önerileri sunar.
""",
        "draft": False,
        "prerelease": False
    },
    {
        "tag_name": "v2.9.0",
        "name": "🔴 Nexus AI Studio v2.9.0 - AMD Radeon & ROCm GPU Support",
        "body": """## 🔴 Nexus AI Studio v2.9.0 - AMD Radeon & ROCm GPU Desteği

### 🚀 Öne Çıkan Özellikler

- **Yerel AMD Ekran Kartı Desteği**: AMD Radeon ekran kartları ve ROCm / HIP sürücü entegrasyonu.
- **`rocm-smi` & `sysfs` Telemetri**: AMD VRAM kullanımı ve sıcaklık/bellek takibi.
- **Konteyner Geçişi**: Docker üzerinden `/sys` birimi ile donanım sensörü erişimi.
""",
        "draft": False,
        "prerelease": False
    },
    {
        "tag_name": "v2.8.0",
        "name": "🤗 Nexus AI Studio v2.8.0 - HuggingFace Hub Integration",
        "body": """## 🤗 Nexus AI Studio v2.8.0 - HuggingFace Hub Entegrasyonu

### 🚀 Öne Çıkan Özellikler

- **HuggingFace Canlı Model Arama**: 100.000+ açık kaynak GGUF modelini canlı arama ve filtreleme.
- **1-Tıkla SSE Stream İndirme**: HuggingFace üzerindeki modelleri tek tıkla Ollama motoruna indirme ve anlık MB/s indirme paneli.
- **Masaüstü Temizliği**: Temiz ve optimize web & kontrol paneli mimarisi.
""",
        "draft": False,
        "prerelease": False
    },
    {
        "tag_name": "v2.7.0",
        "name": "🛍️ Nexus AI Studio v2.7.0 - Nexus Store & Evolutionary Auto-Updater",
        "body": """## 🛍️ Nexus AI Studio v2.7.0 - Nexus Mağazası & Otomatik Güncelleyici

### 🚀 Öne Çıkan Özellikler

- **Nexus Mağazası**: Model, tool (otonom araçlar) ve skill (iş akışları) mağazası.
- **Evrimsel Web Güncelleyici**: Kontrol panelinden GitHub deposunu tek tıkla güncelleme engine'i.
""",
        "draft": False,
        "prerelease": False
    },
    {
        "tag_name": "v2.6.0",
        "name": "🚀 Nexus AI Studio v2.6.0 - Dual Arena & Workspace Management",
        "body": """## 🚀 Nexus AI Studio v2.6.0 - Çift Model Arenası & İş Alanları

### 🚀 Öne Çıkan Özellikler

- **Çift Model Arenası**: Yan yana LLM akış ve hız karşılaştırma ekranı.
- **İş Alanları (Workspaces)**: Dosya ve bağlam yöneticisi.
""",
        "draft": False,
        "prerelease": False
    }
]

def publish():
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("Lütfen GITHUB_TOKEN çevre değişkenini ayarlayın:")
        print("export GITHUB_TOKEN=ghp_xxx...")
        print("python3 scripts/publish_github_releases.py")
        sys.exit(1)

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Nexus-Release-Publisher/1.0"
    }

    url = "https://api.github.com/repos/kefe3/nexus/releases"

    for r in RELEASES:
        print(f"Yayınlanıyor: {r['tag_name']}...")
        data = json.dumps(r).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                print(f"✅ Başarıyla yayınlandı: {res_data.get('html_url')}")
        except Exception as e:
            print(f"❌ Hata ({r['tag_name']}): {e}")

if __name__ == "__main__":
    publish()
