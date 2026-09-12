from fastapi import APIRouter, Header, HTTPException, Body
from pydantic import BaseModel
import psutil
import time
import os
import platform
import httpx
import asyncio
from typing import Optional, List, Dict, Any
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])
_START_TIME = time.time()

# In-memory log buffer for recent requests
REQUEST_LOGS: List[Dict[str, Any]] = []

def log_api_request(provider: str, model: str, latency_ms: int, status: str = "success", error: str = ""):
    global REQUEST_LOGS
    REQUEST_LOGS.insert(0, {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "provider": provider,
        "model": model,
        "latency_ms": latency_ms,
        "status": status,
        "error": error
    })
    if len(REQUEST_LOGS) > 100:
        REQUEST_LOGS = REQUEST_LOGS[:100]

class PullModelRequest(BaseModel):
    name: str

class DeleteModelRequest(BaseModel):
    name: str

class TestProviderRequest(BaseModel):
    provider: str
    api_key: Optional[str] = ""
    base_url: Optional[str] = ""

@router.get("/overview")
async def get_admin_overview():
    uptime_sec = int(time.time() - _START_TIME)
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_count = psutil.cpu_count(logical=True)
    cpu_freq = psutil.cpu_freq()
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()
    
    # Fetch Ollama models count
    ollama_count = 0
    ollama_status = "offline"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                ollama_count = len(res.json().get("models", []))
                ollama_status = "online"
    except Exception:
        pass

    return {
        "status": "ok",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "server": {
            "hostname": platform.node(),
            "os": f"{platform.system()} {platform.release()} ({platform.machine()})",
            "python_version": platform.python_version(),
            "uptime_seconds": uptime_sec,
            "uptime_formatted": f"{uptime_sec // 86400}g {(uptime_sec % 86400) // 3600}s {(uptime_sec % 3600) // 60}d {uptime_sec % 60}sn",
        },
        "hardware": {
            "cpu_percent": cpu_percent,
            "cpu_cores": cpu_count,
            "cpu_freq_mhz": round(cpu_freq.current, 1) if cpu_freq else 0,
            "ram_total_gb": round(mem.total / (1024**3), 2),
            "ram_used_gb": round(mem.used / (1024**3), 2),
            "ram_free_gb": round(mem.available / (1024**3), 2),
            "ram_percent": mem.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_percent": disk.percent,
            "net_sent_mb": round(net.bytes_sent / (1024**2), 2),
            "net_recv_mb": round(net.bytes_recv / (1024**2), 2),
        },
        "ai_cluster": {
            "ollama_status": ollama_status,
            "ollama_models_count": ollama_count,
            "total_requests_processed": len(REQUEST_LOGS),
            "default_provider": settings.DEFAULT_PROVIDER,
            "gemini_ready": bool(settings.GEMINI_API_KEY),
            "openai_ready": bool(settings.OPENAI_API_KEY),
            "groq_ready": bool(settings.GROQ_API_KEY),
        }
    }

@router.get("/models")
async def get_installed_models(x_ollama_url: str = Header(default="")):
    ollama_url = x_ollama_url or settings.OLLAMA_BASE_URL
    installed = []
    error = None
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{ollama_url}/api/tags")
            if res.status_code == 200:
                raw_models = res.json().get("models", [])
                for m in raw_models:
                    size_gb = round(m.get("size", 0) / (1024**3), 2)
                    installed.append({
                        "name": m.get("name"),
                        "model": m.get("model"),
                        "size_gb": size_gb,
                        "digest": m.get("digest", "")[:12],
                        "modified_at": m.get("modified_at", ""),
                        "details": m.get("details", {})
                    })
    except Exception as e:
        error = str(e)

    return {
        "status": "ok" if not error else "error",
        "error": error,
        "models": installed,
        "total_count": len(installed)
    }

@router.post("/models/pull")
async def pull_ollama_model(req: PullModelRequest, x_ollama_url: str = Header(default="")):
    ollama_url = x_ollama_url or settings.OLLAMA_BASE_URL
    model_name = req.name.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            res = await client.post(f"{ollama_url}/api/pull", json={"name": model_name, "stream": False})
            if res.status_code == 200:
                return {"status": "ok", "message": f"Model '{model_name}' successfully downloaded!"}
            else:
                return {"status": "error", "message": f"Ollama error: HTTP {res.status_code} - {res.text}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.delete("/models/delete")
async def delete_ollama_model(req: DeleteModelRequest, x_ollama_url: str = Header(default="")):
    ollama_url = x_ollama_url or settings.OLLAMA_BASE_URL
    model_name = req.name.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            req_obj = client.build_request("DELETE", f"{ollama_url}/api/delete", json={"name": model_name})
            res = await client.send(req_obj)
            if res.status_code in [200, 204]:
                return {"status": "ok", "message": f"Model '{model_name}' deleted."}
            else:
                return {"status": "error", "message": f"Ollama error: HTTP {res.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/providers/test")
async def test_provider(req: TestProviderRequest):
    t0 = time.time()
    prov = req.provider.lower()
    
    if prov == "ollama":
        url = req.base_url or settings.OLLAMA_BASE_URL
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{url}/api/tags")
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    return {"status": "ok", "latency_ms": latency, "message": f"Online ({len(models)} models available)", "models": models}
                return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "error", "latency_ms": int((time.time() - t0) * 1000), "message": str(e)}
            
    elif prov == "gemini":
        key = req.api_key or settings.GEMINI_API_KEY
        if not key:
            return {"status": "error", "message": "API Key not provided"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    return {"status": "ok", "latency_ms": latency, "message": "Google Gemini 2.0 API Connected"}
                return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code}: {res.text[:100]}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    elif prov == "openai":
        key = req.api_key or settings.OPENAI_API_KEY
        if not key:
            return {"status": "error", "message": "API Key not provided"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    return {"status": "ok", "latency_ms": latency, "message": "OpenAI API Connected (GPT-4o ready)"}
                return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code}: {res.text[:100]}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    elif prov == "groq":
        key = req.api_key or settings.GROQ_API_KEY
        if not key:
            return {"status": "error", "message": "API Key not provided"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    return {"status": "ok", "latency_ms": latency, "message": "Groq LPU Engine Connected"}
                return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code}: {res.text[:100]}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "error", "message": f"Unknown provider: {prov}"}

@router.get("/logs")
async def get_request_logs():
    return {"status": "ok", "logs": REQUEST_LOGS}
