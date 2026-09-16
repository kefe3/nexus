from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
import os
import json
import secrets
import time
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/apikeys", tags=["apikeys"])

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data"))
APIKEYS_FILE = os.path.join(DATA_DIR, "apikeys.json")
os.makedirs(DATA_DIR, exist_ok=True)

DEFAULT_MASTER_KEY = "nx-live-unlimited-nexus-master-key"

def load_apikeys() -> Dict[str, Any]:
    if os.path.exists(APIKEYS_FILE):
        try:
            with open(APIKEYS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "keys" in data:
                    return data
        except Exception:
            pass
            
    # Default initial data
    initial = {
        "keys": [
            {
                "id": "key_master_001",
                "key": DEFAULT_MASTER_KEY,
                "name": "Sınırsız Ana Nexus API Key",
                "rate_limit": "unlimited",
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "active",
                "requests_count": 0
            }
        ]
    }
    save_apikeys(initial)
    return initial

def save_apikeys(data: Dict[str, Any]):
    with open(APIKEYS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def verify_api_key(token: str) -> bool:
    if not token:
        return False
    clean_token = token.strip()
    if clean_token == DEFAULT_MASTER_KEY:
        return True
    data = load_apikeys()
    for item in data.get("keys", []):
        if item.get("key") == clean_token and item.get("status", "active") == "active":
            item["requests_count"] = item.get("requests_count", 0) + 1
            item["last_used"] = time.strftime("%Y-%m-%d %H:%M:%S")
            save_apikeys(data)
            return True
    return False

class GenerateKeyRequest(BaseModel):
    name: Optional[str] = "Sınırsız Client Key"
    rate_limit: Optional[str] = "unlimited"

@router.get("")
async def list_keys():
    data = load_apikeys()
    keys_masked = []
    for k in data.get("keys", []):
        raw_key = k.get("key", "")
        masked = raw_key[:10] + "..." + raw_key[-4:] if len(raw_key) > 16 else raw_key
        keys_masked.append({
            "id": k.get("id"),
            "key_preview": masked,
            "name": k.get("name"),
            "rate_limit": k.get("rate_limit", "unlimited"),
            "status": k.get("status", "active"),
            "requests_count": k.get("requests_count", 0),
            "created_at": k.get("created_at"),
            "last_used": k.get("last_used", "Henüz kullanılmadı")
        })
    return {"status": "ok", "keys": keys_masked}

@router.post("/generate")
async def generate_key(req: GenerateKeyRequest):
    data = load_apikeys()
    new_token = "nx-live-" + secrets.token_hex(24)
    key_id = "key_" + secrets.token_hex(6)
    
    new_entry = {
        "id": key_id,
        "key": new_token,
        "name": req.name or "Sınırsız Client Key",
        "rate_limit": req.rate_limit or "unlimited",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "active",
        "requests_count": 0
    }
    
    data.setdefault("keys", []).append(new_entry)
    save_apikeys(data)
    
    return {
        "status": "ok",
        "message": "Yeni Nexus API Anahtarı başarıyla oluşturuldu.",
        "key": new_token,
        "id": key_id,
        "name": new_entry["name"],
        "rate_limit": new_entry["rate_limit"]
    }

@router.delete("/{key_id}")
async def revoke_key(key_id: str):
    data = load_apikeys()
    keys = data.get("keys", [])
    updated = [k for k in keys if k.get("id") != key_id]
    if len(updated) == len(keys):
        raise HTTPException(status_code=404, detail="API anahtarı bulunamadı.")
    
    data["keys"] = updated
    save_apikeys(data)
    return {"status": "ok", "message": "API anahtarı başarıyla iptal edildi."}

@router.get("/verify")
async def verify_key_endpoint(authorization: Optional[str] = Header(default=None)):
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    valid = verify_api_key(token)
    return {"status": "ok", "valid": valid}
