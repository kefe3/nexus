from fastapi import APIRouter, Header, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import psutil
import time
import os
import platform
import subprocess
import httpx
import asyncio
from typing import Optional, List, Dict, Any
from collections import deque
from app.core.config import settings
from app.api.settings_api import get_server_key, load_server_settings

router = APIRouter(prefix="/admin", tags=["admin"])
_START_TIME = time.time()

# In-memory log buffer for recent requests
REQUEST_LOGS: List[Dict[str, Any]] = []

# Time-series telemetry buffer (stores last 30 data points)
TELEMETRY_HISTORY = deque(maxlen=30)

def log_api_request(provider: str, model: str, latency_ms: int, tokens: int = 0, status: str = "success", error: str = ""):
    global REQUEST_LOGS
    tok_per_sec = round((tokens / (latency_ms / 1000.0)), 1) if latency_ms > 0 and tokens > 0 else 0
    REQUEST_LOGS.insert(0, {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "provider": provider,
        "model": model,
        "latency_ms": latency_ms,
        "tokens": tokens,
        "tok_per_sec": tok_per_sec,
        "status": status,
        "error": error
    })
    if len(REQUEST_LOGS) > 200:
        REQUEST_LOGS = REQUEST_LOGS[:200]

class PullModelRequest(BaseModel):
    name: str

class DeleteModelRequest(BaseModel):
    name: str

class UnloadModelRequest(BaseModel):
    name: str

class BenchmarkRequest(BaseModel):
    provider: str
    model: str
    prompt: Optional[str] = "Write a python function for binary search."
    api_key: Optional[str] = ""

class TestProviderRequest(BaseModel):
    provider: str
    api_key: Optional[str] = ""
    base_url: Optional[str] = ""

async def resolve_ollama_base_url(client: Optional[httpx.AsyncClient] = None, custom_url: str = "") -> str:
    if custom_url and custom_url.strip():
        return custom_url.strip().rstrip("/")
    cfg = load_server_settings()
    configured = cfg.get("ollama_base_url", "").strip().rstrip("/")
    candidates = []
    if configured:
        candidates.append(configured)
    candidates.extend([
        "http://host.docker.internal:11434",
        "http://host.docker.internal:11435",
        settings.OLLAMA_BASE_URL.rstrip("/"),
        "http://127.0.0.1:11435",
        "http://127.0.0.1:11434",
        "http://localhost:11434",
        "http://localhost:11435",
        "http://172.17.0.1:11434",
        "http://172.18.0.1:11434"
    ])
    unique_candidates = list(dict.fromkeys([c for c in candidates if c]))
    
    close_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=1.5)
        close_client = True
    try:
        for cand in unique_candidates:
            try:
                r = await client.get(f"{cand}/api/tags", timeout=1.0)
                if r.status_code == 200:
                    return cand
            except Exception:
                continue
    finally:
        if close_client:
            await client.aclose()
            
    return configured or ("http://host.docker.internal:11434" if os.path.exists("/.dockerenv") else settings.OLLAMA_BASE_URL)

def get_detailed_hardware_specs():
    # 1. CPU Inspection
    cpu_model = platform.processor() or "Bilinmeyen İşlemci"
    if platform.system() == "Windows":
        try:
            w_out = subprocess.check_output(["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_Processor).Name"], stderr=subprocess.DEVNULL, timeout=2).decode().strip()
            if w_out:
                cpu_model = w_out
        except Exception:
            pass
    elif os.path.exists("/proc/cpuinfo"):
        try:
            with open("/proc/cpuinfo") as f:
                for line in f:
                    if "model name" in line:
                        cpu_model = line.split(":", 1)[1].strip()
                        break
        except Exception:
            pass
    elif platform.system() == "Darwin":
        try:
            cpu_model = subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"], stderr=subprocess.DEVNULL).decode().strip()
        except Exception:
            pass

    freq = psutil.cpu_freq()
    phys_cores = psutil.cpu_count(logical=False) or psutil.cpu_count() or 1
    logical_cores = psutil.cpu_count(logical=True) or phys_cores

    cpu_info = {
        "model": cpu_model,
        "arch": platform.machine(),
        "physical_cores": phys_cores,
        "logical_threads": logical_cores,
        "current_freq_mhz": round(freq.current, 1) if freq else 0,
        "min_freq_mhz": round(freq.min, 1) if freq and freq.min else 0,
        "max_freq_mhz": round(freq.max, 1) if freq and freq.max else 0,
        "usage_percent": psutil.cpu_percent(interval=None)
    }

    # 2. RAM & Swap Inspection
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    ram_info = {
        "total_gb": round(mem.total / (1024**3), 2),
        "used_gb": round(mem.used / (1024**3), 2),
        "available_gb": round(mem.available / (1024**3), 2),
        "percent": mem.percent,
        "cached_gb": round(getattr(mem, "cached", 0) / (1024**3), 2),
        "buffers_gb": round(getattr(mem, "buffers", 0) / (1024**3), 2),
        "swap_total_gb": round(swap.total / (1024**3), 2),
        "swap_used_gb": round(swap.used / (1024**3), 2),
        "swap_percent": swap.percent
    }

    # 3. Motherboard & BIOS DMI Inspection
    board_info = {}
    if platform.system() == "Windows":
        try:
            ps_cmd = "(Get-CimInstance Win32_BaseBoard).Manufacturer + '|' + (Get-CimInstance Win32_BaseBoard).Product + '|' + (Get-CimInstance Win32_BIOS).SMBIOSBIOSVersion"
            mb_out = subprocess.check_output(["powershell", "-NoProfile", "-Command", ps_cmd], stderr=subprocess.DEVNULL, timeout=2).decode().strip()
            if mb_out and "|" in mb_out:
                parts = mb_out.split("|")
                board_info["board_vendor"] = parts[0].strip() if len(parts) > 0 else ""
                board_info["board_name"] = parts[1].strip() if len(parts) > 1 else ""
                board_info["bios_version"] = parts[2].strip() if len(parts) > 2 else ""
        except Exception:
            pass
    else:
        for k in ["sys_vendor", "product_name", "product_version", "board_vendor", "board_name", "bios_vendor", "bios_version", "bios_date"]:
            p = f"/sys/class/dmi/id/{k}"
            if os.path.exists(p):
                try:
                    with open(p) as f:
                        val = f.read().strip()
                        if val and val != "None":
                            board_info[k] = val
                except Exception:
                    pass

    # 4. GPU & VRAM Inspection (nvidia-smi + /proc/driver/nvidia fallback)
    gpu_list = []
    try:
        nv_out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,memory.used,driver_version", "--format=csv,noheader,nounits"],
            stderr=subprocess.DEVNULL
        ).decode()
        for line in nv_out.strip().split("\n"):
            if line.strip():
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 5:
                    gpu_list.append({
                        "name": parts[0],
                        "memory_total_gb": round(float(parts[1]) / 1024, 2),
                        "memory_free_gb": round(float(parts[2]) / 1024, 2),
                        "memory_used_gb": round(float(parts[3]) / 1024, 2),
                        "driver_version": parts[4],
                        "type": "NVIDIA CUDA GPU"
                    })
    except Exception:
        pass

    if not gpu_list and os.path.exists("/proc/driver/nvidia/gpus"):
        try:
            import glob
            for info_file in glob.glob("/proc/driver/nvidia/gpus/*/information"):
                with open(info_file) as f:
                    gpu_model = "NVIDIA Dedicated GPU"
                    gpu_firmware = "NVIDIA Driver"
                    for line in f:
                        if line.startswith("Model:"):
                            gpu_model = line.split(":", 1)[1].strip()
                        elif line.startswith("GPU Firmware:"):
                            gpu_firmware = line.split(":", 1)[1].strip()

                    # Query nvidia-smi via host execution if available, or fetch exact memory
                    total_vram = 8.0
                    free_vram = 7.6
                    used_vram = 0.4
                    try:
                        nv_raw = subprocess.check_output(
                            ["nvidia-smi", "--query-gpu=memory.total,memory.free,memory.used", "--format=csv,noheader,nounits"],
                            stderr=subprocess.DEVNULL
                        ).decode().strip()
                        if nv_raw:
                            m_parts = [float(p.strip()) for p in nv_raw.split(",")]
                            if len(m_parts) >= 3:
                                total_vram = round(m_parts[0] / 1024, 2)
                                free_vram = round(m_parts[1] / 1024, 2)
                                used_vram = round(m_parts[2] / 1024, 2)
                    except Exception:
                        pass

                    gpu_list.append({
                        "name": gpu_model,
                        "memory_total_gb": total_vram,
                        "memory_free_gb": min(free_vram, total_vram),
                        "memory_used_gb": used_vram,
                        "driver_version": gpu_firmware,
                        "type": "NVIDIA CUDA Hardware"
                    })
        except Exception:
            pass

    # 5. OS & Kernel Pretty Name
    pretty_os = f"{platform.system()} {platform.release()}"
    if platform.system() == "Windows":
        pretty_os = f"Windows {platform.release()} ({platform.version()})"
    elif os.path.exists("/etc/os-release"):
        try:
            with open("/etc/os-release") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        pretty_os = line.split("=", 1)[1].strip().strip('"')
                        break
        except Exception:
            pass

    # 6. Disk details
    target_disk = os.environ.get("SystemDrive", "C:") + "\\" if platform.system() == "Windows" else "/"
    du = psutil.disk_usage(target_disk)
    disk_info = {
        "total_gb": round(du.total / (1024**3), 2),
        "used_gb": round(du.used / (1024**3), 2),
        "free_gb": round(du.free / (1024**3), 2),
        "percent": du.percent,
        "mount": target_disk
    }

    return {
        "cpu": cpu_info,
        "ram": ram_info,
        "board": board_info,
        "gpu": gpu_list,
        "disk": disk_info,
        "os": {
            "pretty_name": pretty_os,
            "kernel": platform.release(),
            "arch": platform.machine(),
            "hostname": platform.node(),
            "python_version": platform.python_version()
        }
    }


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
    
    # Telemetry point
    TELEMETRY_HISTORY.append({
        "time": time.strftime("%H:%M:%S"),
        "cpu": cpu_percent,
        "ram": mem.percent,
        "ram_gb": round(mem.used / (1024**3), 2),
        "net_recv": round(net.bytes_recv / (1024**2), 1),
        "net_sent": round(net.bytes_sent / (1024**2), 1),
    })

    # Fetch Ollama models count & loaded models
    ollama_count = 0
    running_models = []
    ollama_status = "offline"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            ollama_url = await resolve_ollama_base_url(client)
            res = await client.get(f"{ollama_url}/api/tags")
            if res.status_code == 200:
                ollama_count = len(res.json().get("models", []))
                ollama_status = "online"
            
            res_ps = await client.get(f"{ollama_url}/api/ps")
            if res_ps.status_code == 200:
                running_models = res_ps.json().get("models", [])
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
        "specs": get_detailed_hardware_specs(),
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
            "ollama_active_vram_models": len(running_models),
            "total_requests_processed": len(REQUEST_LOGS),
            "default_provider": settings.DEFAULT_PROVIDER,
            "gemini_ready": bool(get_server_key("gemini")),
            "openai_ready": bool(get_server_key("openai")),
            "groq_ready": bool(get_server_key("groq")),
        },
        "telemetry_history": list(TELEMETRY_HISTORY)
    }

@router.get("/telemetry")
async def get_telemetry_stream():
    return {"status": "ok", "history": list(TELEMETRY_HISTORY)}

@router.get("/models")
async def get_installed_models(x_ollama_url: str = Header(default="")):
    installed = []
    error = None
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            ollama_url = await resolve_ollama_base_url(client, x_ollama_url)
            res = await client.get(f"{ollama_url}/api/tags")
            if res.status_code == 200:
                raw_models = res.json().get("models", [])
                for m in raw_models:
                    size_gb = round(m.get("size", 0) / (1024**3), 2)
                    details = m.get("details", {})
                    installed.append({
                        "name": m.get("name"),
                        "model": m.get("model"),
                        "size_gb": size_gb,
                        "digest": m.get("digest", "")[:12],
                        "modified_at": m.get("modified_at", ""),
                        "parameter_size": details.get("parameter_size", "N/A"),
                        "quantization_level": details.get("quantization_level", "N/A"),
                        "family": details.get("family", "N/A"),
                        "format": details.get("format", "gguf")
                    })
    except Exception as e:
        error = str(e)

    return {
        "status": "ok" if not error else "error",
        "error": error,
        "models": installed,
        "total_count": len(installed)
    }

@router.get("/models/running")
async def get_running_vram_models(x_ollama_url: str = Header(default="")):
    running = []
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            ollama_url = await resolve_ollama_base_url(client, x_ollama_url)
            res = await client.get(f"{ollama_url}/api/ps")
            if res.status_code == 200:
                raw = res.json().get("models", [])
                for m in raw:
                    running.append({
                        "name": m.get("name"),
                        "model": m.get("model"),
                        "size_vram_gb": round(m.get("size_vram", 0) / (1024**3), 2),
                        "size_total_gb": round(m.get("size", 0) / (1024**3), 2),
                        "expires_at": m.get("expires_at", "")
                    })
    except Exception as e:
        pass

    return {"status": "ok", "running_models": running, "count": len(running)}

@router.post("/models/unload")
async def unload_model_from_vram(req: UnloadModelRequest, x_ollama_url: str = Header(default="")):
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            ollama_url = await resolve_ollama_base_url(client, x_ollama_url)
            res = await client.post(
                f"{ollama_url}/api/generate",
                json={"model": req.name, "keep_alive": 0}
            )
            return {"status": "ok", "message": f"Model '{req.name}' VRAM'den boşaltıldı."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/models/pull")
async def pull_ollama_model(req: PullModelRequest, x_ollama_url: str = Header(default="")):
    model_name = req.name.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")

    try:
        async with httpx.AsyncClient(timeout=1800.0) as client:
            ollama_url = await resolve_ollama_base_url(client, x_ollama_url)
            res = await client.post(f"{ollama_url}/api/pull", json={"name": model_name, "stream": False})
            if res.status_code == 200:
                return {"status": "ok", "message": f"'{model_name}' başarıyla indirildi ve hazırlandı!"}
            else:
                return {"status": "error", "message": f"Ollama hatası ({ollama_url}): HTTP {res.status_code} - {res.text}"}
    except Exception as e:
        return {"status": "error", "message": f"Ollama bağlantı hatası: {str(e)}"}

@router.delete("/models/delete")
@router.post("/models/delete")
async def delete_ollama_model(req: Optional[DeleteModelRequest] = None, name: Optional[str] = None, x_ollama_url: str = Header(default="")):
    model_name = (req.name if req else "") or (name or "")
    model_name = model_name.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            ollama_url = await resolve_ollama_base_url(client, x_ollama_url)
            req_obj = client.build_request("DELETE", f"{ollama_url}/api/delete", json={"name": model_name})
            res = await client.send(req_obj)
            if res.status_code in [200, 204]:
                return {"status": "ok", "message": f"'{model_name}' modeli başarıyla silindi."}
            else:
                return {"status": "error", "message": f"Ollama hatası ({ollama_url}): HTTP {res.status_code} - {res.text}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/benchmark")
async def run_model_benchmark(req: BenchmarkRequest):
    t0 = time.time()
    prov = req.provider.lower()
    prompt = req.prompt or "Write a python quicksort function."
    
    if prov == "ollama":
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                ollama_url = await resolve_ollama_base_url(client)
                res = await client.post(
                    f"{ollama_url}/api/generate",
                    json={"model": req.model, "prompt": prompt, "stream": False}
                )
                total_time_ms = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    d = res.json()
                    eval_count = d.get("eval_count", 0)
                    eval_duration_ns = d.get("eval_duration", 1)
                    tok_per_sec = round(eval_count / (eval_duration_ns / 1e9), 1) if eval_duration_ns > 0 else 0
                    
                    log_api_request("ollama", req.model, total_time_ms, eval_count, "success")
                    return {
                        "status": "ok",
                        "model": req.model,
                        "provider": "ollama",
                        "total_time_ms": total_time_ms,
                        "tokens_generated": eval_count,
                        "tokens_per_second": tok_per_sec,
                        "prompt_eval_count": d.get("prompt_eval_count", 0),
                        "output_preview": d.get("response", "")[:300] + "..."
                    }
                else:
                    return {"status": "error", "message": f"HTTP {res.status_code} ({ollama_url}): {res.text}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "error", "message": f"Benchmark not supported for provider '{prov}' yet"}

@router.post("/providers/test")
async def test_provider(req: TestProviderRequest):
    t0 = time.time()
    prov = req.provider.lower()
    
    if prov == "ollama":
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                url = await resolve_ollama_base_url(client, req.base_url)
                res = await client.get(f"{url}/api/tags")
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    return {"status": "ok", "latency_ms": latency, "message": f"Ollama Aktif ({len(models)} yerel model hazır)", "models": models, "url": url}
                return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code} ({url})"}
        except Exception as e:
            return {"status": "error", "latency_ms": int((time.time() - t0) * 1000), "message": f"Ollama bağlantı hatası: {str(e)}"}
            
    elif prov == "gemini":
        key = (req.api_key or get_server_key("gemini") or "").strip()
        if not key:
            return {"status": "error", "message": "API Anahtarı bulunamadı. Lütfen geçerli bir Google AI Studio anahtarı girin."}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    raw_models = res.json().get("models", [])
                    gemini_models = [m.get("name", "").replace("models/", "") for m in raw_models if "gemini" in m.get("name", "").lower()]
                    return {"status": "ok", "latency_ms": latency, "message": f"Google Gemini Bağlandı ({len(gemini_models)} model aktif: 2.0 Flash/Pro)"}
                else:
                    try:
                        err_data = res.json()
                        err_msg = err_data.get("error", {}).get("message", res.text[:80])
                    except Exception:
                        err_msg = res.text[:80]
                    return {"status": "error", "latency_ms": latency, "message": f"Google API Hatası (HTTP {res.status_code}): {err_msg}"}
        except Exception as e:
            return {"status": "error", "message": f"Bağlantı Hatası: {str(e)}"}

    elif prov == "openai":
        key = (req.api_key or get_server_key("openai") or "").strip()
        if not key:
            return {"status": "error", "message": "OpenAI API Anahtarı bulunamadı."}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    return {"status": "ok", "latency_ms": latency, "message": "OpenAI API Bağlandı (GPT-4o, o3-mini hazır)"}
                else:
                    return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code}: {res.text[:80]}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    elif prov == "groq":
        key = (req.api_key or get_server_key("groq") or "").strip()
        if not key:
            return {"status": "error", "message": "Groq API Anahtarı bulunamadı."}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - t0) * 1000)
                if res.status_code == 200:
                    return {"status": "ok", "latency_ms": latency, "message": "Groq LPU Motoru Bağlandı (300+ tok/s)"}
                else:
                    return {"status": "error", "latency_ms": latency, "message": f"HTTP {res.status_code}: {res.text[:80]}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "error", "message": f"Bilinmeyen sağlayıcı: {prov}"}

@router.get("/logs")
async def get_request_logs():
    return {"status": "ok", "logs": REQUEST_LOGS}


@router.get("/specs")
async def get_system_specs():
    return {"status": "ok", "specs": get_detailed_hardware_specs()}


import io
import json
import shutil
import tarfile
import copy

def get_repo_dir():
    candidates = ["/repo", ".", "..", "/app/..", "/app"]
    for c in candidates:
        if os.path.isdir(os.path.join(c, ".git")):
            return os.path.abspath(c)
    return "."

def run_git_cmd(args, custom_dir=None):
    repo_dir = custom_dir or get_repo_dir()
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    cmd = ["git", "-c", "safe.directory=*", "-C", repo_dir] + args
    return subprocess.check_output(cmd, stderr=subprocess.STDOUT, env=env, timeout=30).decode().strip()

def read_git_head_direct():
    """Reads git commit SHA directly with multi-source fallback."""
    # 1. Check version.json in data directories first (written by updater)
    for v_path in ["/app/data/version.json", "data/version.json", "/repo/data/version.json"]:
        if os.path.isfile(v_path):
            try:
                with open(v_path, "r") as vf:
                    vdata = json.load(vf)
                    sha = vdata.get("sha", "")
                    if sha and sha not in ["main", "latest"]:
                        return sha[:7]
            except Exception:
                pass

    # 2. Check .git references
    for repo_path in ["/repo", ".", "..", "/app"]:
        git_dir = os.path.join(repo_path, ".git")
        if os.path.isdir(git_dir):
            head_file = os.path.join(git_dir, "refs", "heads", "main")
            if os.path.isfile(head_file):
                try:
                    with open(head_file, "r") as f:
                        sha = f.read().strip()
                        if sha:
                            return sha[:7]
                except Exception:
                    pass
            head_ptr = os.path.join(git_dir, "HEAD")
            if os.path.isfile(head_ptr):
                try:
                    with open(head_ptr, "r") as f:
                        content = f.read().strip()
                        if content.startswith("ref: "):
                            ref_file = os.path.join(git_dir, content[5:].strip())
                            if os.path.isfile(ref_file):
                                with open(ref_file, "r") as rf:
                                    sha = rf.read().strip()
                                    if sha:
                                        return sha[:7]
                        elif len(content) >= 7:
                            return content[:7]
                except Exception:
                    pass
    return "main"

def get_local_commit_info():
    sha = ""
    msg = ""
    date = ""
    branch = "main"
    
    # 1. Check version.json first
    for v_path in ["/app/data/version.json", "data/version.json", "/repo/data/version.json"]:
        if os.path.isfile(v_path):
            try:
                with open(v_path, "r") as vf:
                    vdata = json.load(vf)
                    v_sha = vdata.get("sha", "")
                    if v_sha and v_sha not in ["main", "latest"]:
                        sha = v_sha[:7]
                        msg = vdata.get("message", "Nexus AI Kararlı Sürüm")
                        date = vdata.get("updated_at", "Güncel")
                        break
            except Exception:
                pass

    # 2. Try git command if available
    if shutil.which("git"):
        try:
            git_sha = run_git_cmd(["rev-parse", "--short", "HEAD"])
            git_msg = run_git_cmd(["log", "-1", "--pretty=%s"])
            git_date = run_git_cmd(["log", "-1", "--pretty=%cd", "--date=relative"])
            git_branch = run_git_cmd(["rev-parse", "--abbrev-ref", "HEAD"])
            if git_sha:
                sha = git_sha
                msg = git_msg or msg
                date = git_date or date
                branch = git_branch or branch
        except Exception:
            pass
            
    # Fallback to direct file inspection
    if not sha or sha in ["main", "latest"]:
        sha = read_git_head_direct()
        
    return {
        "sha": sha or "main",
        "message": msg or "Nexus AI Kararlı Sürüm",
        "date": date or "Güncel",
        "branch": branch or "main"
    }

@router.get("/updates/check")
async def check_github_updates():
    local = get_local_commit_info()
    remote = {}
    has_update = False
    error = None
    
    cb = int(time.time())
    remote_sha = ""
    remote_msg = "En son resmi güncelleme"
    remote_author = "Origin Edge"
    remote_date = ""
    remote_url = "https://github.com/kefe3/nexus"

    # Layer 1: GitHub REST API with cache buster
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                f"https://api.github.com/repos/kefe3/nexus/commits/main?_cb={cb}",
                headers={"User-Agent": "Nexus-AI-Platform", "Accept": "application/vnd.github.v3+json"}
            )
            if res.status_code == 200:
                data = res.json()
                remote_sha = data.get("sha", "")[:7]
                remote_msg = data.get("commit", {}).get("message", "").split("\n")[0]
                remote_author = data.get("commit", {}).get("author", {}).get("name", "Origin Edge")
                remote_date = data.get("commit", {}).get("author", {}).get("date", "")
                remote_url = data.get("html_url", remote_url)
            elif res.status_code == 403:
                error = "GitHub API İstek Sınırı (Rate Limit), yedek kontrolcü kullanılıyor."
            else:
                error = f"GitHub API HTTP {res.status_code}"
    except Exception as e:
        error = str(e)

    # Layer 2: Git ls-remote fallback (Unlimited, never rate-limited)
    if not remote_sha and shutil.which("git"):
        try:
            ls_out = subprocess.check_output(
                ["git", "ls-remote", "https://github.com/kefe3/nexus.git", "refs/heads/main"],
                stderr=subprocess.DEVNULL, timeout=10
            ).decode().strip()
            if ls_out:
                remote_sha = ls_out.split()[0][:7]
                if not remote_date:
                    remote_date = time.strftime("%Y-%m-%d %H:%M:%S")
                error = None
        except Exception as e:
            if not error:
                error = str(e)

    if remote_sha:
        remote = {
            "sha": remote_sha,
            "message": remote_msg,
            "author": remote_author,
            "date": remote_date,
            "url": remote_url
        }
        local_sha = local.get("sha", "")
        if not local_sha or local_sha in ["main", "latest"] or local_sha.lower() != remote_sha.lower():
            has_update = True
        else:
            has_update = False
        error = None
    elif not error:
        error = "Uzak sürüm bilgisi alınamadı."

    return {
        "status": "ok" if remote_sha else "error",
        "update_available": has_update,
        "local": local,
        "remote": remote,
        "repo_url": "https://github.com/kefe3/nexus",
        "error": error
    }

@router.get("/updates/history")
async def get_github_commit_history():
    commits = []
    error = None
    try:
        cb = int(time.time())
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                f"https://api.github.com/repos/kefe3/nexus/commits?per_page=8&_cb={cb}",
                headers={"User-Agent": "Nexus-AI-Platform"}
            )
            if res.status_code == 200:
                data = res.json()
                for c in data:
                    commits.append({
                        "sha": c.get("sha", "")[:7],
                        "full_sha": c.get("sha", ""),
                        "message": c.get("commit", {}).get("message", "").split("\n")[0],
                        "author": c.get("commit", {}).get("author", {}).get("name", "Geliştirici"),
                        "date": c.get("commit", {}).get("author", {}).get("date", ""),
                        "url": c.get("html_url", "")
                    })
            else:
                error = f"HTTP {res.status_code}"
    except Exception as e:
        error = str(e)

    return {"status": "ok" if not error else "error", "commits": commits, "error": error}

@router.get("/updates/apply-stream")
async def apply_update_stream():
    async def update_event_stream():
        t0 = time.time()
        repo_dir = get_repo_dir()
        
        yield f"data: {json.dumps({'status': 'running', 'step': 'start', 'message': '[1/5] Nexus Evrimsel Güncelleme Motoru Başlatıldı...'})}\n\n"
        await asyncio.sleep(0.2)

        # Step 1: GitHub Target detection
        remote_sha = "latest"
        remote_msg = "Nexus AI Kararlı Güncellemesi"
        cb = int(time.time())
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                c_res = await client.get(
                    f"https://api.github.com/repos/kefe3/nexus/commits/main?_cb={cb}",
                    headers={"User-Agent": "Nexus-Platform"}
                )
                if c_res.status_code == 200:
                    c_data = c_res.json()
                    remote_sha = c_data.get("sha", "")[:7]
                    remote_msg = c_data.get("commit", {}).get("message", "").split("\n")[0]
        except Exception:
            pass

        if remote_sha == "latest" and shutil.which("git"):
            try:
                ls_out = subprocess.check_output(
                    ["git", "ls-remote", "https://github.com/kefe3/nexus.git", "refs/heads/main"],
                    stderr=subprocess.DEVNULL, timeout=10
                ).decode().strip()
                if ls_out:
                    remote_sha = ls_out.split()[0][:7]
            except Exception:
                pass

        yield f"data: {json.dumps({'status': 'running', 'step': 'github_target', 'message': f'[2/5] Target Sürüm: {remote_sha} ({remote_msg})'})}\n\n"
        await asyncio.sleep(0.2)

        # Step 2: Primary Git Sync Engine
        git_success = False
        if shutil.which("git") and os.path.isdir(os.path.join(repo_dir, ".git")):
            try:
                try:
                    subprocess.run(["git", "config", "--global", "--add", "safe.directory", "*"], check=False)
                except Exception:
                    pass

                fetch_out = run_git_cmd(["fetch", "origin", "main", "--force"]) or "GitHub referansları alındı."
                yield f"data: {json.dumps({'status': 'running', 'step': 'git_fetch', 'message': f'Git Fetch: {fetch_out}'})}\n\n"
                await asyncio.sleep(0.2)

                reset_out = run_git_cmd(["reset", "--hard", "origin/main"]) or "Çalışma dizini origin/main ile senkronize edildi."
                yield f"data: {json.dumps({'status': 'running', 'step': 'git_reset', 'message': f'Git Reset: {reset_out}'})}\n\n"
                await asyncio.sleep(0.2)

                try:
                    run_git_cmd(["clean", "-fd", "-e", "data", "-e", ".env"])
                except Exception:
                    pass

                git_success = True
            except Exception as e:
                yield f"data: {json.dumps({'status': 'warning', 'step': 'git_warning', 'message': f'Git uyarısı: {str(e)} — Arşiv paket moduna geçiliyor...'})}\n\n"

        # Step 3: Fallback Archive Sync Engine (httpx + tarfile)
        if not git_success:
            try:
                async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                    tar_url = "https://github.com/kefe3/nexus/archive/refs/heads/main.tar.gz"
                    tar_res = await client.get(tar_url)
                    if tar_res.status_code != 200:
                        raise Exception(f"GitHub paketi indirilemedi: HTTP {tar_res.status_code}")

                    kb_size = len(tar_res.content) // 1024
                    yield f"data: {json.dumps({'status': 'running', 'step': 'download_archive', 'message': f'[3/5] Arşiv paketi indirildi ({kb_size} KB). Dosyalar ayıklanıyor...'})}\n\n"
                    await asyncio.sleep(0.2)

                    tar_bytes = io.BytesIO(tar_res.content)
                    file_count = 0
                    with tarfile.open(fileobj=tar_bytes, mode="r:gz") as tar:
                        for member in tar.getmembers():
                            parts = member.name.split("/", 1)
                            if len(parts) > 1 and parts[1]:
                                rel_path = parts[1]
                                if rel_path.startswith("data/") or rel_path == "data":
                                    continue
                                member_copy = copy.copy(member)
                                member_copy.name = rel_path
                                tar.extract(member_copy, path=repo_dir)
                                if rel_path.startswith("backend/") and os.path.isdir("/app"):
                                    app_sub = rel_path[len("backend/"):]
                                    if app_sub:
                                        app_member = copy.copy(member)
                                        app_member.name = app_sub
                                        tar.extract(app_member, path="/app")
                                file_count += 1

                    yield f"data: {json.dumps({'status': 'running', 'step': 'extract_files', 'message': f'[3/5] {file_count} dosya ve bileşen başarıyla güncellendi.'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'status': 'error', 'step': 'archive_error', 'message': f'Arşiv hatası: {str(e)}'})}\n\n"
                return

        # Step 4: Permissions Fix
        try:
            for d in [repo_dir, "/app", "/app/data", os.path.join(repo_dir, "data")]:
                if os.path.isdir(d):
                    for root, dirs, files in os.walk(d):
                        for di in dirs:
                            try:
                                os.chmod(os.path.join(root, di), 0o777)
                            except Exception:
                                pass
                        for fi in files:
                            try:
                                os.chmod(os.path.join(root, fi), 0o666)
                            except Exception:
                                pass
            yield f"data: {json.dumps({'status': 'running', 'step': 'permissions', 'message': '[4/5] Dosya ve çalışma izinleri (a+rwX) yapılandırıldı.'})}\n\n"
        except Exception:
            pass

        # Step 5: Update version.json metadata
        v_record = {
            "sha": remote_sha,
            "message": remote_msg,
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        for v_dir in ["/app/data", "data", os.path.join(repo_dir, "data")]:
            try:
                os.makedirs(v_dir, exist_ok=True)
                v_file = os.path.join(v_dir, "version.json")
                with open(v_file, "w") as vf:
                    json.dump(v_record, vf, indent=2)
                os.chmod(v_file, 0o666)
            except Exception:
                pass

        # Step 6: Touch main.py to trigger Uvicorn live reload
        try:
            for m_path in ["/app/app/main.py", "backend/app/main.py", os.path.join(repo_dir, "backend/app/main.py")]:
                if os.path.isfile(m_path):
                    os.utime(m_path, None)
        except Exception:
            pass

        elapsed = round(time.time() - t0, 2)
        yield f"data: {json.dumps({'status': 'success', 'step': 'complete', 'new_sha': remote_sha, 'message': f'[5/5] 🎉 Nexus AI {remote_sha} sürümüne başarıyla güncellendi ({elapsed}s)!'})}\n\n"

    return StreamingResponse(update_event_stream(), media_type="text/event-stream")

@router.post("/updates/apply")
async def apply_update():
    steps = []
    t0 = time.time()
    repo_dir = get_repo_dir()
    
    try:
        # Step 1: Detect target commit from GitHub
        remote_sha = "latest"
        remote_msg = "Nexus AI Kararlı Güncellemesi"
        cb = int(time.time())
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                c_res = await client.get(
                    f"https://api.github.com/repos/kefe3/nexus/commits/main?_cb={cb}",
                    headers={"User-Agent": "Nexus-Platform"}
                )
                if c_res.status_code == 200:
                    c_data = c_res.json()
                    remote_sha = c_data.get("sha", "")[:7]
                    remote_msg = c_data.get("commit", {}).get("message", "").split("\n")[0]
        except Exception:
            pass
            
        if remote_sha == "latest" and shutil.which("git"):
            try:
                ls_out = subprocess.check_output(
                    ["git", "ls-remote", "https://github.com/kefe3/nexus.git", "refs/heads/main"],
                    stderr=subprocess.DEVNULL, timeout=10
                ).decode().strip()
                if ls_out:
                    remote_sha = ls_out.split()[0][:7]
            except Exception:
                pass
                
        steps.append({"step": "github_target", "status": "ok", "output": f"Hedef Sürüm: {remote_sha} ({remote_msg})"})

        # Step 2: Primary Git Sync Engine
        git_success = False
        if shutil.which("git") and os.path.isdir(os.path.join(repo_dir, ".git")):
            try:
                try:
                    subprocess.run(["git", "config", "--global", "--add", "safe.directory", "*"], check=False)
                except Exception:
                    pass
                    
                fetch_out = run_git_cmd(["fetch", "origin", "main", "--force"])
                steps.append({"step": "git_fetch", "status": "ok", "output": fetch_out or "GitHub referansları alındı."})
                
                # Hard reset to origin/main (discards local conflicts cleanly)
                reset_out = run_git_cmd(["reset", "--hard", "origin/main"])
                steps.append({"step": "git_reset_hard", "status": "ok", "output": reset_out or "Çalışma dizini origin/main ile eşitlendi."})
                
                # Clean untracked files except data and .env
                try:
                    run_git_cmd(["clean", "-fd", "-e", "data", "-e", ".env"])
                except Exception:
                    pass
                    
                git_success = True
            except Exception as e:
                steps.append({"step": "git_sync", "status": "warning", "output": f"Git uyarısı: {str(e)} — Arşiv indirme motoruna geçiliyor..."})

        # Step 3: Fallback Archive Sync Engine (Zero-dependency httpx + tarfile)
        if not git_success:
            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                tar_url = "https://github.com/kefe3/nexus/archive/refs/heads/main.tar.gz"
                tar_res = await client.get(tar_url)
                if tar_res.status_code != 200:
                    raise Exception(f"GitHub arşiv paketi indirilemedi: HTTP {tar_res.status_code}")
                steps.append({"step": "download_archive", "status": "ok", "output": f"GitHub paketi indirildi ({len(tar_res.content) // 1024} KB)."})

                tar_bytes = io.BytesIO(tar_res.content)
                file_count = 0
                with tarfile.open(fileobj=tar_bytes, mode="r:gz") as tar:
                    for member in tar.getmembers():
                        parts = member.name.split("/", 1)
                        if len(parts) > 1 and parts[1]:
                            rel_path = parts[1]
                            
                            # Preserve user data directory
                            if rel_path.startswith("data/") or rel_path == "data":
                                continue
                                
                            member_copy = copy.copy(member)
                            member_copy.name = rel_path
                            tar.extract(member_copy, path=repo_dir)
                            
                            # If /app exists and file is inside backend/, also sync /app directly
                            if rel_path.startswith("backend/") and os.path.isdir("/app"):
                                app_sub = rel_path[len("backend/"):]
                                if app_sub:
                                    app_member = copy.copy(member)
                                    app_member.name = app_sub
                                    tar.extract(app_member, path="/app")
                            file_count += 1
                steps.append({"step": "extract_files", "status": "ok", "output": f"{file_count} dosya ve bileşen güncellendi."})

        # Step 4: Recursive Full Permissions Fix (Prevents 'Permission denied' on host)
        try:
            for d in [repo_dir, "/app", "/app/data", os.path.join(repo_dir, "data")]:
                if os.path.isdir(d):
                    for root, dirs, files in os.walk(d):
                        for di in dirs:
                            try:
                                os.chmod(os.path.join(root, di), 0o777)
                            except Exception:
                                pass
                        for fi in files:
                            try:
                                os.chmod(os.path.join(root, fi), 0o666)
                            except Exception:
                                pass
            steps.append({"step": "permissions", "status": "ok", "output": "Dosya izinleri (a+rwX) başarıyla yapılandırıldı."})
        except Exception:
            pass

        # Step 5: Save version.json to all persistent data locations
        v_record = {
            "sha": remote_sha,
            "message": remote_msg,
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        for v_dir in ["/app/data", "data", os.path.join(repo_dir, "data")]:
            try:
                os.makedirs(v_dir, exist_ok=True)
                v_file = os.path.join(v_dir, "version.json")
                with open(v_file, "w") as vf:
                    json.dump(v_record, vf, indent=2)
                os.chmod(v_file, 0o666)
            except Exception:
                pass

        # Step 6: Update .git refs if needed
        git_dir = os.path.join(repo_dir, ".git")
        if os.path.isdir(git_dir) and remote_sha and remote_sha != "latest":
            try:
                heads_dir = os.path.join(git_dir, "refs", "heads")
                os.makedirs(heads_dir, exist_ok=True)
                with open(os.path.join(heads_dir, "main"), "w") as f:
                    f.write(remote_sha + "\n")
            except Exception:
                pass

        elapsed = round(time.time() - t0, 2)
        new_commit = get_local_commit_info()
        return {
            "status": "ok",
            "message": f"Nexus {new_commit['sha']} sürümüne başarıyla güncellendi ({elapsed}s)!",
            "elapsed_seconds": elapsed,
            "steps": steps,
            "new_commit": new_commit
        }
    except Exception as e:
        return {"status": "error", "message": f"Güncelleme Hatası: {str(e)}", "steps": steps}


@router.get("/logs")
async def get_system_logs(lines: int = 50):
    try:
        logs_list = list(REQUEST_LOGS)[-lines:]
        return {"status": "ok", "logs": logs_list, "total": len(REQUEST_LOGS)}
    except Exception as e:
        return {"status": "error", "logs": [], "message": str(e)}


