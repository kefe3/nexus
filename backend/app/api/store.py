from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx
import json
import asyncio
import os
import time
from app.core.config import settings
from app.api.admin import resolve_ollama_base_url
from app.api.settings_api import load_server_settings

router = APIRouter(prefix="/store", tags=["store"])

STORE_DATA_DIR = "/app/data/store" if os.path.exists("/app/data") else "data/store"
os.makedirs(STORE_DATA_DIR, exist_ok=True)
INSTALLED_TOOLS_FILE = os.path.join(STORE_DATA_DIR, "installed_tools.json")
INSTALLED_SKILLS_FILE = os.path.join(STORE_DATA_DIR, "installed_skills.json")

def load_installed_tools() -> Dict[str, bool]:
    if os.path.isfile(INSTALLED_TOOLS_FILE):
        try:
            with open(INSTALLED_TOOLS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Default active tools
    return {
        "tool_web_search": True,
        "tool_code_interpreter": True,
        "tool_doc_converter": True,
        "tool_image_gen": False,
        "tool_db_explorer": False,
        "tool_http_webhook": True,
    }

def save_installed_tools(data: Dict[str, bool]):
    os.makedirs(os.path.dirname(INSTALLED_TOOLS_FILE), exist_ok=True)
    with open(INSTALLED_TOOLS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_installed_skills() -> Dict[str, bool]:
    if os.path.isfile(INSTALLED_SKILLS_FILE):
        try:
            with open(INSTALLED_SKILLS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Default active skills
    return {
        "skill_senior_developer": True,
        "skill_ui_ux_designer": True,
        "skill_data_scientist": True,
        "skill_security_auditor": False,
        "skill_content_seo": True,
    }

def save_installed_skills(data: Dict[str, bool]):
    os.makedirs(os.path.dirname(INSTALLED_SKILLS_FILE), exist_ok=True)
    with open(INSTALLED_SKILLS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


CURATED_MODELS = [
    {
        "id": "deepseek-r1:8b",
        "name": "DeepSeek R1 8B",
        "category": "reasoning",
        "category_label": "🧠 Akıl Yürütme",
        "description": "Karmaşık matematik, mantık ve adım adım düşünme zinciri (Chain-of-Thought) için optimize edilmiş amiral gemisi yerel model.",
        "size_gb": 4.9,
        "vram_req": "6 GB VRAM / 16 GB RAM",
        "tags": ["DeepSeek", "Reasoning", "CoT", "Popular"]
    },
    {
        "id": "qwen2.5-coder:7b",
        "name": "Qwen 2.5 Coder 7B",
        "category": "coding",
        "category_label": "💻 Kodlama",
        "description": "Alibaba Cloud tarafından geliştirilen, 92+ programlama dilinde yüksek başarı oranına sahip kod yazma ve hata düzeltme uzmanı.",
        "size_gb": 4.7,
        "vram_req": "6 GB VRAM / 16 GB RAM",
        "tags": ["Alibaba", "Coding", "Python/JS", "Top Rated"]
    },
    {
        "id": "qwen2.5:7b",
        "name": "Qwen 2.5 7B General",
        "category": "general",
        "category_label": "💬 Genel Chat",
        "description": "Türkçe ve çok dilli genel sohbet, özetleme ve metin üretimi için ultra dengeli 7B parametreli model.",
        "size_gb": 4.7,
        "vram_req": "6 GB VRAM / 16 GB RAM",
        "tags": ["General", "Turkish Native", "Fast"]
    },
    {
        "id": "llama3.2:3b",
        "name": "Llama 3.2 3B Light",
        "category": "light",
        "category_label": "⚡ Hafif & Hızlı",
        "description": "Meta'nın ultra hızlı ve düşük kaynak tüketen 3B parametreli modeli. Düşük bellekli sistemler için mükemmel seçim.",
        "size_gb": 2.0,
        "vram_req": "3 GB VRAM / 8 GB RAM",
        "tags": ["Meta", "Ultra Fast", "Low Resource"]
    },
    {
        "id": "deepseek-r1:14b",
        "name": "DeepSeek R1 14B",
        "category": "reasoning",
        "category_label": "🧠 Akıl Yürütme",
        "description": "Orta-üst segment GPU'lar için daha yüksek mantıksal doğruluk sunan 14B boyutlu DeepSeek R1 versiyonu.",
        "size_gb": 9.0,
        "vram_req": "10 GB VRAM / 32 GB RAM",
        "tags": ["DeepSeek", "Pro Reasoning"]
    },
    {
        "id": "deepseek-coder-v2:16b",
        "name": "DeepSeek Coder V2 16B",
        "category": "coding",
        "category_label": "💻 Kodlama",
        "description": "Büyük ölçekli proje mimarisi ve karmaşık yazılım refactoring işleri için tasarlanmış kodlama zekası.",
        "size_gb": 8.9,
        "vram_req": "10 GB VRAM / 32 GB RAM",
        "tags": ["DeepSeek", "Software Architecture"]
    },
    {
        "id": "codellama:7b",
        "name": "CodeLlama 7B",
        "category": "coding",
        "category_label": "💻 Kodlama",
        "description": "Meta'nın Llama 2 tabanlı resmi kod tamamlama ve yazma modeli.",
        "size_gb": 3.8,
        "vram_req": "5 GB VRAM / 16 GB RAM",
        "tags": ["Meta", "CodeLlama"]
    },
    {
        "id": "phi4:14b",
        "name": "Microsoft Phi-4 14B",
        "category": "reasoning",
        "category_label": "🧠 Akıl Yürütme",
        "description": "Microsoft Araştırma ekibi tarafından özel sentetik verilerle eğitilmiş yüksek performanslı akıl yürütme modeli.",
        "size_gb": 9.1,
        "vram_req": "10 GB VRAM / 32 GB RAM",
        "tags": ["Microsoft", "Phi-4", "Academic"]
    },
    {
        "id": "mistral:7b",
        "name": "Mistral 7B Instruct",
        "category": "general",
        "category_label": "💬 Genel Chat",
        "description": "Avrupa merkezli Mistral AI'ın hızlı, net ve talimatlara tam uyan popüler 7B modeli.",
        "size_gb": 4.1,
        "vram_req": "5 GB VRAM / 16 GB RAM",
        "tags": ["Mistral AI", "Instruct"]
    },
    {
        "id": "qwen2-vl:7b",
        "name": "Qwen 2 VL 7B Vision",
        "category": "vision",
        "category_label": "👁️ Görsel & Vision",
        "description": "Görselleri, grafikleri ve diyagramları okuyup analiz edebilen multimodal yapay zeka modeli.",
        "size_gb": 4.5,
        "vram_req": "6 GB VRAM / 16 GB RAM",
        "tags": ["Alibaba", "Vision", "Multimodal", "OCR"]
    },
    {
        "id": "gemma2:9b",
        "name": "Google Gemma 2 9B",
        "category": "general",
        "category_label": "💬 Genel Chat",
        "description": "Google DeepMind tarafından geliştirilen yüksek kaliteli metin ve kod üretim modeli.",
        "size_gb": 5.4,
        "vram_req": "6 GB VRAM / 16 GB RAM",
        "tags": ["Google", "DeepMind", "Gemma"]
    },
    {
        "id": "llama3.3:70b",
        "name": "Llama 3.3 70B Flagship",
        "category": "flagship",
        "category_label": "👑 Amiral Gemisi",
        "description": "Meta'nın GPT-4o seviyesinde açık kaynak amiral gemisi modeli (Çok yüksek GPU/VRAM veya RAM gerektirir).",
        "size_gb": 43.0,
        "vram_req": "48 GB VRAM / 64 GB RAM",
        "tags": ["Meta", "70B", "Flagship", "GPT-4 Level"]
    }
]

CURATED_TOOLS = [
    {
        "id": "tool_web_search",
        "name": "🌐 Web Arama Entegrasyonu",
        "description": "Yapay zeka modellerinin DuckDuckGo & Brave üzerinden anlık canlı internet araması yapmasını sağlar.",
        "badge": "Canlı İnternet",
        "version": "v1.4"
    },
    {
        "id": "tool_code_interpreter",
        "name": "🐍 Python Sandbox Code Interpreter",
        "description": "Modellerin ürettiği Python kodlarını güvenli bir izolasyon ortamında çalıştırıp çıktıları ve grafik snapshot'larını döndürür.",
        "badge": "Kod Çalıştırıcı",
        "version": "v2.0"
    },
    {
        "id": "tool_doc_converter",
        "name": "📄 PDF & Doküman Dönüştürücü",
        "description": "Yüklenen PDF, Word, Excel, CSV ve EPUB dosyalarının metinlerini ve tablolarını otomatik ayıklayıp modele bağlam olarak sunar.",
        "badge": "Belge İşleyici",
        "version": "v1.2"
    },
    {
        "id": "tool_image_gen",
        "name": "🎨 Flux & SD Görsel Üreteci",
        "description": "İstemlerden yüksek kaliteli görseller ve mock-up tasarımlar üretmek için yerel/API görsel motoru entegrasyonu.",
        "badge": "Görsel Üretim",
        "version": "v1.0"
    },
    {
        "id": "tool_db_explorer",
        "name": "🗄️ SQL & SQLite Veritabanı Explorer",
        "description": "Veritabanı şemalarını inceleyip güvenli SQL sorguları çalıştırma yeteneği.",
        "badge": "Veritabanı",
        "version": "v1.1"
    },
    {
        "id": "tool_http_webhook",
        "name": "🔔 REST API & Webhook Entegrasyonu",
        "description": "Dış servislere HTTP POST/GET istekleri ve webhooks gönderme aracı.",
        "badge": "API Entegrasyonu",
        "version": "v1.0"
    }
]

CURATED_SKILLS = [
    {
        "id": "skill_senior_developer",
        "name": "💻 Otonom Kıdemli Full-Stack Yazılımcı",
        "description": "Python, JS/TS, React, FastAPI, Go ve C++ projelerinde otonom mimari kararları alma, kod yazma ve hata giderme yeteneği.",
        "author": "Nexus AI Team",
        "badge": "Yazılım Mimarı"
    },
    {
        "id": "skill_ui_ux_designer",
        "name": "🎨 UI/UX Tailwind & Web Tasarım Uzmanı",
        "description": "Glassmorphism, karanlık tema, responsive grid ve mikro-etkileşimli modern web arayüzleri tasarlama skill'i.",
        "author": "Design Studio",
        "badge": "UI/UX Master"
    },
    {
        "id": "skill_data_scientist",
        "name": "📊 Veri Analitiği & Pandas Wizard",
        "description": "Büyük veri kümelerini analiz etme, istatistiksel özet çıkarma ve Matplotlib/Seaborn görselleri hazırlama skill'i.",
        "author": "Data Lab",
        "badge": "Veri Analizi"
    },
    {
        "id": "skill_security_auditor",
        "name": "🛡️ Siber Güvenlik & SAST Kod Audit Uzmanı",
        "description": "OWASP Top 10 zafiyetlerini, SQL injection, XSS ve mantık hatalarını tespit eden güvenlik denetçisi yeteneği.",
        "author": "Security Hub",
        "badge": "Güvenlik"
    },
    {
        "id": "skill_content_seo",
        "name": "✍️ SEO & Teknik İçerik Yazarı",
        "description": "Arama motoru optimizasyonlu (SEO) teknik makaleler, dokümantasyonlar ve pazarlama metinleri üretme yeteneği.",
        "author": "Content Pro",
        "badge": "SEO / Copywriting"
    }
]


@router.get("/items")
async def get_store_items(x_ollama_url: str = Header(default="")):
    # Check installed Ollama models
    installed_ollama_names = set()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            url = await resolve_ollama_base_url(client, x_ollama_url)
            res = await client.get(f"{url}/api/tags")
            if res.status_code == 200:
                models = res.json().get("models", [])
                for m in models:
                    installed_ollama_names.add(m.get("name"))
                    installed_ollama_names.add(m.get("model"))
    except Exception:
        pass

    tools_state = load_installed_tools()
    skills_state = load_installed_skills()

    models_list = []
    for m in CURATED_MODELS:
        item = dict(m)
        m_id = m["id"]
        item["installed"] = (m_id in installed_ollama_names or any(m_id in name for name in installed_ollama_names))
        models_list.append(item)

    tools_list = []
    for t in CURATED_TOOLS:
        item = dict(t)
        item["installed"] = tools_state.get(t["id"], False)
        tools_list.append(item)

    skills_list = []
    for s in CURATED_SKILLS:
        item = dict(s)
        item["installed"] = skills_state.get(s["id"], False)
        skills_list.append(item)

    return {
        "status": "ok",
        "models": models_list,
        "tools": tools_list,
        "skills": skills_list,
        "total_installed_models": len(installed_ollama_names)
    }


class InstallItemRequest(BaseModel):
    type: str  # "model", "tool", "skill"
    id: str
    action: Optional[str] = "install"  # "install" or "uninstall"

@router.post("/toggle-tool")
async def toggle_store_tool(req: InstallItemRequest):
    tools = load_installed_tools()
    tools[req.id] = (req.action == "install")
    save_installed_tools(tools)
    return {"status": "ok", "id": req.id, "installed": tools[req.id]}

@router.post("/toggle-skill")
async def toggle_store_skill(req: InstallItemRequest):
    skills = load_installed_skills()
    skills[req.id] = (req.action == "install")
    save_installed_skills(skills)
    return {"status": "ok", "id": req.id, "installed": skills[req.id]}


@router.get("/huggingface/search")
async def search_huggingface_hub(q: str = "gguf", limit: int = 24, x_ollama_url: str = Header(default="")):
    """
    Search Hugging Face Hub for GGUF format open-weights models.
    """
    query = q.strip() if q else "gguf"
    params = {
        "search": query,
        "filter": "gguf",
        "sort": "downloads",
        "direction": "-1",
        "limit": min(limit, 50)
    }
    headers = {"User-Agent": "Nexus-AI-Studio/1.0"}

    installed_ollama_names = set()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            url = await resolve_ollama_base_url(client, x_ollama_url)
            res = await client.get(f"{url}/api/tags")
            if res.status_code == 200:
                models = res.json().get("models", [])
                for m in models:
                    installed_ollama_names.add(m.get("name", ""))
                    installed_ollama_names.add(m.get("model", ""))
    except Exception:
        pass
    
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            resp = await client.get("https://huggingface.co/api/models", params=params)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Hugging Face API error")
            
            raw_models = resp.json()
            results = []
            for item in raw_models:
                model_id = item.get("id", "")
                if not model_id:
                    continue
                parts = model_id.split("/")
                author = parts[0] if len(parts) > 1 else ""
                name = parts[1] if len(parts) > 1 else model_id
                ollama_tag = f"hf.co/{model_id}"
                
                tags = [t for t in item.get("tags", []) if t not in ["gguf", "endpoints_compatible", "region:us", "license:other"] and not t.startswith("base_model:")]
                
                is_installed = (ollama_tag in installed_ollama_names or any(model_id.lower() in name.lower() for name in installed_ollama_names if name))

                results.append({
                    "id": model_id,
                    "ollama_tag": ollama_tag,
                    "author": author,
                    "name": name,
                    "downloads": item.get("downloads", 0),
                    "likes": item.get("likes", 0),
                    "tags": tags[:5],
                    "installed": is_installed,
                    "pipeline_tag": item.get("pipeline_tag", "text-generation"),
                    "created_at": item.get("createdAt", "")
                })
            return {"status": "ok", "query": query, "total": len(results), "models": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hugging Face search failed: {str(e)}")


@router.get("/pull-stream")
async def stream_ollama_model_pull(model: str, x_ollama_url: str = Header(default="")):
    model_name = model.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name parameter is required")

    async def event_generator():
        try:
            async with httpx.AsyncClient(timeout=3600.0) as client:
                ollama_url = await resolve_ollama_base_url(client, x_ollama_url)
                
                # Send SSE initial connect event
                yield f"data: {json.dumps({'status': 'connecting', 'message': f'{model_name} için Ollama motoruna bağlanılıyor ({ollama_url})...'})}\n\n"
                
                async with client.stream("POST", f"{ollama_url}/api/pull", json={"name": model_name, "stream": True}) as response:
                    if response.status_code != 200:
                        err_txt = await response.aread()
                        yield f"data: {json.dumps({'status': 'error', 'message': f'HTTP {response.status_code}: {err_txt.decode()[:200]}'})}\n\n"
                        return

                    t_start = time.time()
                    
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            status = data.get("status", "")
                            completed = data.get("completed", 0)
                            total = data.get("total", 0)
                            
                            percent = 0.0
                            if total > 0 and completed > 0:
                                percent = round((completed / total) * 100, 1)

                            now = time.time()
                            elapsed = now - t_start
                            speed_mb_s = 0.0
                            if elapsed > 0 and completed > 0:
                                speed_mb_s = round((completed / (1024 * 1024)) / elapsed, 1)

                            payload = {
                                "status": "downloading",
                                "model": model_name,
                                "ollama_status": status,
                                "completed": completed,
                                "total": total,
                                "completed_mb": round(completed / (1024 * 1024), 1),
                                "total_mb": round(total / (1024 * 1024), 1),
                                "percent": percent,
                                "speed_mb_s": speed_mb_s,
                                "digest": data.get("digest", "")[:12]
                            }
                            
                            if status == "success":
                                payload["status"] = "success"
                                payload["message"] = f"'{model_name}' başarıyla indirildi ve hazırlandı!"
                            
                            yield f"data: {json.dumps(payload)}\n\n"
                            await asyncio.sleep(0.02)
                        except Exception:
                            continue
                            
                yield f"data: {json.dumps({'status': 'success', 'percent': 100.0, 'message': f'{model_name} başarıyla tamamlandı!'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': f'İndirme hatası: {str(e)}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


class CustomUploadRequest(BaseModel):
    item_type: str  # "model", "tool", "skill"
    title: str
    content: Optional[str] = ""

@router.post("/upload")
async def upload_custom_store_item(req: CustomUploadRequest):
    upload_dir = os.path.join(STORE_DATA_DIR, "custom_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    if req.content:
        file_path = os.path.join(upload_dir, f"{int(time.time())}_{req.item_type}.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(req.content)

    if req.item_type == "skill":
        skills = load_installed_skills()
        skill_key = f"custom_skill_{int(time.time())}"
        skills[skill_key] = True
        save_installed_skills(skills)
        return {"status": "ok", "message": f"'{req.title}' özel skilli başarıyla yüklendi!", "key": skill_key}

    elif req.item_type == "tool":
        tools = load_installed_tools()
        tool_key = f"custom_tool_{int(time.time())}"
        tools[tool_key] = True
        save_installed_tools(tools)
        return {"status": "ok", "message": f"'{req.title}' özel aracı başarıyla yüklendi!", "key": tool_key}

    return {"status": "ok", "message": f"Özel {req.item_type} yüklendi: {req.title}"}
