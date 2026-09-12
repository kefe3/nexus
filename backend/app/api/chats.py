from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import os
import json
import time
import re
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/chats", tags=["chats"])

DATA_DIR = os.path.join(os.getcwd(), "data", "sessions")
os.makedirs(DATA_DIR, exist_ok=True)

def _sanitize_session_id(session_id: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_-]', '', session_id)
    return cleaned if cleaned else "default"

def get_session_file(session_id: str) -> str:
    s_id = _sanitize_session_id(session_id)
    return os.path.join(DATA_DIR, f"{s_id}.json")

def load_chats(session_id: str = "default") -> List[Dict[str, Any]]:
    s_file = get_session_file(session_id)
    if os.path.exists(s_file):
        try:
            with open(s_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_chats(chats: List[Dict[str, Any]], session_id: str = "default"):
    s_file = get_session_file(session_id)
    with open(s_file, "w", encoding="utf-8") as f:
        json.dump(chats, f, ensure_ascii=False, indent=2)

class SaveChatRequest(BaseModel):
    id: str
    title: Optional[str] = "Yeni Sohbet"
    messages: List[Dict[str, Any]]
    timestamp: Optional[int] = None

@router.get("")
async def get_all_chats(x_session_id: str = Header(default="default")):
    chats = load_chats(x_session_id)
    return {"status": "ok", "chats": chats}

@router.post("")
async def save_or_update_chat(req: SaveChatRequest, x_session_id: str = Header(default="default")):
    chats = load_chats(x_session_id)
    found = False
    now = int(time.time() * 1000)
    
    for i, c in enumerate(chats):
        if c.get("id") == req.id:
            chats[i]["title"] = req.title or c.get("title", "Yeni Sohbet")
            chats[i]["messages"] = req.messages
            chats[i]["timestamp"] = req.timestamp or now
            found = True
            break
            
    if not found:
        chats.insert(0, {
            "id": req.id,
            "title": req.title or "Yeni Sohbet",
            "messages": req.messages,
            "timestamp": req.timestamp or now
        })
        
    save_chats(chats, x_session_id)
    return {"status": "ok", "id": req.id}

@router.delete("/{chat_id}")
@router.post("/{chat_id}/delete")
async def delete_single_chat(chat_id: str, x_session_id: str = Header(default="default")):
    chats = load_chats(x_session_id)
    filtered = [c for c in chats if c.get("id") != chat_id]
    save_chats(filtered, x_session_id)
    return {"status": "ok", "message": f"Chat {chat_id} deleted."}

@router.delete("")
@router.post("/delete-all")
async def delete_all_chats(x_session_id: str = Header(default="default")):
    save_chats([], x_session_id)
    return {"status": "ok", "message": "All chats deleted."}