from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
from typing import Optional, Dict, Any
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["settings"])

DATA_DIR = os.path.join(os.getcwd(), "data")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
os.makedirs(DATA_DIR, exist_ok=True)

def load_server_settings() -> Dict[str, Any]:
    default_cfg = {
        "default_provider": settings.DEFAULT_PROVIDER,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "keys": {
            "gemini": settings.GEMINI_API_KEY or "",
            "openai": settings.OPENAI_API_KEY or "",
            "groq": settings.GROQ_API_KEY or "",
            "anthropic": settings.ANTHROPIC_API_KEY or ""
        },
        "custom_urls": {}
    }
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if "keys" in saved:
                    default_cfg["keys"].update(saved["keys"])
                if "default_provider" in saved:
                    default_cfg["default_provider"] = saved["default_provider"]
                if "ollama_base_url" in saved:
                    default_cfg["ollama_base_url"] = saved["ollama_base_url"]
                if "custom_urls" in saved:
                    default_cfg["custom_urls"].update(saved["custom_urls"])
                return default_cfg
        except Exception:
            return default_cfg
    return default_cfg

def save_server_settings(cfg: Dict[str, Any]):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def get_server_key(provider: str) -> str:
    prov = provider.lower().strip()
    cfg = load_server_settings()
    keys = cfg.get("keys", {})
    if prov in keys and keys[prov]:
        return keys[prov].strip()
    
    env_key = getattr(settings, f"{prov.upper()}_API_KEY", "")
    return env_key or ""

def mask_key(k: str) -> str:
    if not k:
        return ""
    if len(k) <= 8:
        return "****"
    return k[:4] + "..." + k[-4:]

class UpdateKeyRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    default_provider: Optional[str] = None

@router.get("")
async def get_settings():
    cfg = load_server_settings()
    keys = cfg.get("keys", {})
    
    providers_info = {
        "ollama": {
            "name": "Ollama (Yerel GPU)",
            "configured": True,
            "has_key": False,
            "base_url": cfg.get("ollama_base_url", settings.OLLAMA_BASE_URL)
        },
        "gemini": {
            "name": "Google Gemini",
            "configured": bool(keys.get("gemini")),
            "has_key": bool(keys.get("gemini")),
            "key_preview": mask_key(keys.get("gemini", ""))
        },
        "openai": {
            "name": "OpenAI (GPT-4o)",
            "configured": bool(keys.get("openai")),
            "has_key": bool(keys.get("openai")),
            "key_preview": mask_key(keys.get("openai", ""))
        },
        "groq": {
            "name": "Groq (Ultra Hızlı)",
            "configured": bool(keys.get("groq")),
            "has_key": bool(keys.get("groq")),
            "key_preview": mask_key(keys.get("groq", ""))
        },
        "anthropic": {
            "name": "Anthropic (Claude)",
            "configured": bool(keys.get("anthropic")),
            "has_key": bool(keys.get("anthropic")),
            "key_preview": mask_key(keys.get("anthropic", ""))
        },
        "custom": {
            "name": "Özel Uç Nokta",
            "configured": bool(cfg.get("custom_urls", {}).get("custom")),
            "has_key": False,
            "url": cfg.get("custom_urls", {}).get("custom", "")
        }
    }

    return {
        "status": "ok",
        "default_provider": cfg.get("default_provider", "ollama"),
        "providers": providers_info
    }

@router.post("")
async def update_settings(req: UpdateKeyRequest):
    cfg = load_server_settings()
    prov = req.provider.lower().strip()
    
    if req.default_provider:
        cfg["default_provider"] = req.default_provider
        
    if req.api_key is not None:
        if "keys" not in cfg:
            cfg["keys"] = {}
        cfg["keys"][prov] = req.api_key.strip()
        
    if req.base_url is not None:
        if prov == "ollama":
            cfg["ollama_base_url"] = req.base_url.strip()
        else:
            if "custom_urls" not in cfg:
                cfg["custom_urls"] = {}
            cfg["custom_urls"][prov] = req.base_url.strip()

    save_server_settings(cfg)
    
    return {
        "status": "ok",
        "message": f"'{prov}' ayarları sunucuya kalıcı olarak kaydedildi.",
        "configured": bool(cfg.get("keys", {}).get(prov)) if prov != "ollama" else True
    }