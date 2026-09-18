from fastapi import APIRouter, Header
import psutil
import time
import os
import platform
import httpx
from app.core.config import settings

router = APIRouter()
_START_TIME = time.time()

@router.get("/stats/system")
async def get_system_stats():
    uptime_sec = int(time.time() - _START_TIME)
    
    # CPU & Memory
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_count = psutil.cpu_count(logical=True)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    
    return {
        "status": "ok",
        "system": {
            "platform": platform.system(),
            "release": platform.release(),
            "arch": platform.machine(),
            "cpu_model": platform.processor() or "CPU",
            "cpu_cores": cpu_count,
            "cpu_usage_percent": cpu_percent,
            "ram_total_gb": round(mem.total / (1024**3), 2),
            "ram_used_gb": round(mem.used / (1024**3), 2),
            "ram_percent": mem.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_percent": disk.percent,
            "uptime_seconds": uptime_sec,
            "uptime_formatted": f"{uptime_sec // 3600}s {(uptime_sec % 3600) // 60}d {uptime_sec % 60}sn"
        }
    }

@router.get("/stats/providers")
async def check_providers_health(
    x_ollama_url: str = Header(default=""),
    x_gemini_key: str = Header(default=""),
    x_openai_key: str = Header(default=""),
    x_groq_key: str = Header(default="")
):
    providers_status = {}
    
    # 1. Check Ollama
    ollama_url = x_ollama_url or settings.OLLAMA_BASE_URL
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            t0 = time.time()
            res = await client.get(f"{ollama_url}/api/tags")
            lat = int((time.time() - t0) * 1000)
            if res.status_code == 200:
                models = res.json().get("models", [])
                providers_status["ollama"] = {
                    "online": True, "latency_ms": lat,
                    "models_count": len(models), "models": [m.get("name") for m in models[:8]]
                }
            else:
                providers_status["ollama"] = {"online": False, "error": f"HTTP {res.status_code}"}
    except Exception as e:
        providers_status["ollama"] = {"online": False, "error": str(e)}

    # 2. Check Gemini
    gemini_key = x_gemini_key or settings.GEMINI_API_KEY
    providers_status["gemini"] = {
        "configured": bool(gemini_key),
        "status": "Ready (Google AI Studio 2.0)" if gemini_key else "Key Required"
    }

    # 3. Check OpenAI
    openai_key = x_openai_key or settings.OPENAI_API_KEY
    providers_status["openai"] = {
        "configured": bool(openai_key),
        "status": "Ready (GPT-4o & o3-mini)" if openai_key else "Key Required"
    }

    # 4. Check Groq
    groq_key = x_groq_key or settings.GROQ_API_KEY
    providers_status["groq"] = {
        "configured": bool(groq_key),
        "status": "Ready (Llama 3.3 70B)" if groq_key else "Key Required"
    }

    return {"status": "ok", "providers": providers_status}
