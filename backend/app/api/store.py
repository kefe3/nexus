from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx
import json
import os
import time
import asyncio
from app.core.config import settings
from app.api.settings_api import load_server_settings

router = APIRouter(prefix="/store", tags=["store"])

DATA_DIR = os.path.join(os.getcwd(), "data")
PLUGINS_FILE = os.path.join(DATA_DIR, "plugins.json")
SKILLS_FILE = os.path.join(DATA_DIR, "skills.json")
os.makedirs(DATA_DIR, exist_ok=True)

def get_ollama_urls() -> List[str]:
    cfg = load_server_settings()
    configured_url = cfg.get("ollama_base_url", settings.OLLAMA_BASE_URL)
    candidates = [
        configured_url,
        "http://127.0.0.1:11435",
        "http://127.0.0.1:11434",
        "http://host.docker.internal:11434",
        "http://host.docker.internal:11435",
        "http://localhost:11434",
        "http://localhost:11435"
    ]
    return list(dict.fromkeys([u.rstrip("/") for u in candidates if u]))

DEFAULT_PLUGINS = [
    {
        "id": "web_search",
        "name": "DuckDuckGo & Serp API Web Arama",
        "icon": "fa-solid fa-globe",
        "category": "Arama & Bilgi",
        "badge": "CANLI ARAMA",
        "description": "Yapay zekanın internette anlık arama yaparak en güncel haberleri ve bilgileri getirmesini sağlar.",
        "installed": True,
        "enabled": True
    },
    {
        "id": "code_sandbox",
        "name": "Canlı HTML/JS/CSS Sandbox Executör",
        "icon": "fa-solid fa-code",
        "category": "Kod Geliştirme",
        "badge": "INTERAKTIF",
        "description": "AI tarafından yazılan web uygulamalarını tarayıcı içinde canlı çalıştırır ve önizler.",
        "installed": True,
        "enabled": True
    },
    {
        "id": "vision_ocr",
        "name": "Görsel Çözümleme & OCR OCR Engine",
        "icon": "fa-solid fa-eye",
        "category": "Görsel & Medya",
        "badge": "VISION AI",
        "description": "Görsellerdeki metinleri, diyagramları ve arayüz tasarımlarını analiz eder.",
        "installed": True,
        "enabled": True
    },
    {
        "id": "data_analyst",
        "name": "Python Pandas Data Analyst",
        "icon": "fa-solid fa-chart-line",
        "category": "Veri Analizi",
        "badge": "PYTHON EXEC",
        "description": "CSV, JSON ve Excel verilerini analiz eder, grafikler ve istatistiksel raporlar üretir.",
        "installed": False,
        "enabled": False
    },
    {
        "id": "vector_memory",
        "name": "Vektör Veritabanı & Uzun Süreli Hafıza",
        "icon": "fa-solid fa-brain",
        "category": "Hafıza",
        "badge": "RAG MEMORY",
        "description": "Kullanıcı tercihlerini ve geçmiş sohbetleri vektör indeksinde saklayarak hatırlar.",
        "installed": True,
        "enabled": True
    },
    {
        "id": "speech_synth",
        "name": "Gerçek Zamanlı Ses Sentezleyici (TTS/STT)",
        "icon": "fa-solid fa-microphone",
        "category": "Ses Modu",
        "badge": "REALTIME",
        "description": "Sesli sohbet ve Speech-to-Text ile doğal konuşma etkileşimi sağlar.",
        "installed": True,
        "enabled": True
    }
]

DEFAULT_SKILLS = [
    {
        "id": "fullstack_architect",
        "name": "Fullstack Web Mimar Becerisi",
        "icon": "fa-solid fa-layer-group",
        "badge": "Awwwards UI",
        "author": "Nexus AI Team",
        "description": "Tailwind CSS ve modern JS ile sıfır eksikli tek dosya canlı web uygulaması oluşturur.",
        "installed": True
    },
    {
        "id": "deep_reasoner",
        "name": "DeepSeek-R1 Derin Akıl Yürütücü",
        "icon": "fa-solid fa-brain",
        "badge": "Math & Logic",
        "author": "Nexus AI Team",
        "description": "<think> bloklarında matematiksel ve algoritma problemlerini adım adım çözer.",
        "installed": True
    },
    {
        "id": "devops_master",
        "name": "DevOps & Cloud Server Specialist",
        "icon": "fa-solid fa-server",
        "badge": "Docker & K8s",
        "author": "Nexus AI Team",
        "description": "Docker, Nginx, Kubernetes ve CI/CD betikleri üretir ve yapılandırır.",
        "installed": True
    },
    {
        "id": "growth_copywriter",
        "name": "Yaratıcı Reklam & SEO Metin Yazarı",
        "icon": "fa-solid fa-pen-nib",
        "badge": "SEO & Growth",
        "author": "Nexus AI Team",
        "description": "Dönüşümü yüksek landing sayfa metinleri ve viral reklam yazıları yazar.",
        "installed": False
    }
]

STORE_MODELS = [
    {
        "name": "deepseek-r1:latest",
        "display_name": "DeepSeek R1",
        "tag": "Reasoning & Logic",
        "badge": "POPÜLER",
        "size": "4.7 GB",
        "desc": "DeepSeek'in açık kaynaklı derin düşünme ve akıl yürütme modeli.",
        "icon": "fa-solid fa-brain",
        "color": "#6366f1"
    },
    {
        "name": "qwen2.5-coder:7b",
        "display_name": "Qwen 2.5 Coder 7B",
        "tag": "Master Coding",
        "badge": "ÖNERİLEN",
        "size": "4.7 GB",
        "desc": "Alibaba Cloud'un lider kodlama ve web yazılım geliştirme modeli.",
        "icon": "fa-solid fa-code",
        "color": "#10b981"
    },
    {
        "name": "llama3.2:latest",
        "display_name": "Llama 3.2 3B",
        "tag": "Ultra-Fast",
        "badge": "HIZLI",
        "size": "2.0 GB",
        "desc": "Meta'nın ultra hızlı, hafif ve akıllı nesil yapay zeka modeli.",
        "icon": "fa-solid fa-bolt",
        "color": "#06b6d4"
    },
    {
        "name": "codellama:7b",
        "display_name": "CodeLlama 7B",
        "tag": "Code Assistant",
        "badge": "KODLAMA",
        "size": "3.8 GB",
        "desc": "Yazılım geliştirme ve hata ayıklama için özelleştirilmiş Llama modeli.",
        "icon": "fa-solid fa-laptop-code",
        "color": "#3b82f6"
    },
    {
        "name": "mistral:7b",
        "display_name": "Mistral 7B",
        "tag": "General AI",
        "badge": "GENEL",
        "size": "4.1 GB",
        "desc": "Yüksek performanslı genel amaçlı dil modeli.",
        "icon": "fa-solid fa-wind",
        "color": "#f59e0b"
    },
    {
        "name": "phi4:latest",
        "display_name": "Microsoft Phi-4 14B",
        "tag": "Microsoft AI",
        "badge": "MANTIK",
        "size": "9.1 GB",
        "desc": "Microsoft'un yeni nesil yüksek akıl yürütme kapasiteli modeli.",
        "icon": "fa-brands fa-microsoft",
        "color": "#a855f7"
    },
    {
        "name": "nomic-embed-text:latest",
        "display_name": "Nomic Embed Text",
        "tag": "Vektör Embedding",
        "badge": "RAG",
        "size": "274 MB",
        "desc": "RAG ve uzun süreli hafıza için vektör çıkarma modeli.",
        "icon": "fa-solid fa-cubes",
        "color": "#ec4899"
    }
]

def load_plugins_data():
    if os.path.exists(PLUGINS_FILE):
        try:
            with open(PLUGINS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_PLUGINS

def save_plugins_data(data):
    with open(PLUGINS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_skills_data():
    if os.path.exists(SKILLS_FILE):
        try:
            with open(SKILLS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_SKILLS

def save_skills_data(data):
    with open(SKILLS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Active download tasks tracking
PULL_TASKS: Dict[str, Dict[str, Any]] = {}

@router.get("/catalog")
async def get_store_catalog():
    # Fetch installed Ollama models to update 'installed' state in real-time
    installed_models = []
    urls = get_ollama_urls()
    async with httpx.AsyncClient(timeout=3.0) as client:
        for b_url in urls:
            try:
                res = await client.get(f"{b_url}/api/tags")
                if res.status_code == 200:
                    installed_models = [m.get("name") for m in res.json().get("models", [])]
                    break
            except Exception:
                continue

    models_with_status = []
    for sm in STORE_MODELS:
        m_copy = dict(sm)
        m_copy["installed"] = any(
            sm["name"].lower() == im.lower() or sm["name"].split(":")[0] in im.lower() 
            for im in installed_models
        )
        models_with_status.append(m_copy)

    return {
        "status": "ok",
        "models": models_with_status,
        "plugins": load_plugins_data(),
        "skills": load_skills_data(),
        "active_pulls": PULL_TASKS
    }

class PullModelRequest(BaseModel):
    name: str

@router.post("/pull")
async def pull_ollama_model(req: PullModelRequest):
    model_name = req.name.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model adı boş olamaz.")
        
    PULL_TASKS[model_name] = {
        "name": model_name,
        "status": "downloading",
        "start_time": time.time(),
        "progress": 0,
        "message": "İndirme başlatıldı..."
    }

    async def async_pull():
        urls = get_ollama_urls()
        async with httpx.AsyncClient(timeout=3600.0) as client:
            for b_url in urls:
                try:
                    res = await client.post(f"{b_url}/api/pull", json={"name": model_name, "stream": False})
                    if res.status_code == 200:
                        PULL_TASKS[model_name] = {
                            "name": model_name,
                            "status": "completed",
                            "finish_time": time.time(),
                            "message": "Model başarıyla yüklendi!"
                        }
                        return
                except Exception as ex:
                    pass
        PULL_TASKS[model_name] = {
            "name": model_name,
            "status": "failed",
            "message": "Model indirilemedi. Lütfen Ollama bağlantısını ve disk alanını kontrol edin."
        }
                
    asyncio.create_task(async_pull())
    return {"status": "ok", "message": f"'{model_name}' indirme işlemi arka planda başlatıldı."}

@router.get("/pull/status")
async def get_pull_status():
    return {"status": "ok", "tasks": PULL_TASKS}

@router.delete("/delete/{model_name}")
async def delete_ollama_model(model_name: str):
    urls = get_ollama_urls()
    async with httpx.AsyncClient(timeout=30.0) as client:
        for b_url in urls:
            try:
                res = await client.request("DELETE", f"{b_url}/api/delete", json={"name": model_name})
                if res.status_code == 200:
                    return {"status": "ok", "message": f"'{model_name}' başarıyla silindi."}
            except Exception:
                continue
    return {"status": "error", "message": f"'{model_name}' silinemedi veya model bulunamadı."}

class ToggleItemRequest(BaseModel):
    id: str

@router.post("/plugin/toggle")
async def toggle_plugin(req: ToggleItemRequest):
    plugins = load_plugins_data()
    found = False
    new_state = False
    for p in plugins:
        if p["id"] == req.id:
            p["enabled"] = not p.get("enabled", False)
            new_state = p["enabled"]
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Eklenti bulunamadı.")
    save_plugins_data(plugins)
    return {"status": "ok", "id": req.id, "enabled": new_state}

@router.post("/skill/toggle")
async def toggle_skill(req: ToggleItemRequest):
    skills = load_skills_data()
    found = False
    new_state = False
    for s in skills:
        if s["id"] == req.id:
            s["installed"] = not s.get("installed", False)
            new_state = s["installed"]
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Beceri bulunamadı.")
    save_skills_data(skills)
    return {"status": "ok", "id": req.id, "installed": new_state}

@router.get("/hf-search")
async def search_huggingface(q: str = "gguf"):
    query = q.strip() or "gguf"
    url = f"https://huggingface.co/api/models?search={query}&filter=gguf&limit=20&full=true"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url, headers={"User-Agent": "Nexus-Store"})
            if res.status_code == 200:
                raw = res.json()
                results = []
                for item in raw:
                    mid = item.get("modelId", item.get("id"))
                    results.append({
                        "id": item.get("id"),
                        "model_id": mid,
                        "ollama_ref": f"hf.co/{mid}",
                        "likes": item.get("likes", 0),
                        "downloads": item.get("downloads", 0),
                        "tags": item.get("tags", []),
                        "author": item.get("author", mid.split("/")[0] if "/" in mid else "HuggingFace")
                    })
                return {"status": "ok", "results": results}
    except Exception:
        pass
    return {"status": "error", "results": []}
