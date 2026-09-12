from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import time
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/chats", tags=["chats"])

DATA_DIR = os.path.join(os.getcwd(), "data")
CHATS_FILE = os.path.join(DATA_DIR, "chats.json")
os.makedirs(DATA_DIR, exist_ok=True)

def load_chats() -> List[Dict[str, Any]]:
    if os.path.exists(CHATS_FILE):
        try:
            with open(CHATS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_chats(chats: List[Dict[str, Any]]):
    with open(CHATS_FILE, "w", encoding="utf-8") as f:
        json.dump(chats, f, ensure_ascii=False, indent=2)

class ChatMessage(BaseModel):
    role: str
    content: str

class SaveChatRequest(BaseModel):
    id: str
    title: Optional[str] = "Yeni Sohbet"
    messages: List[Dict[str, Any]]
    timestamp: Optional[int] = None

@router.get("")
async def get_all_chats():
    chats = load_chats()
    return {"status": "ok", "chats": chats}

@router.post("")
async def save_or_update_chat(req: SaveChatRequest):
    chats = load_chats()
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
        
    save_chats(chats)
    return {"status": "ok", "id": req.id}

@router.delete("/{chat_id}")
@router.post("/{chat_id}/delete")
async def delete_single_chat(chat_id: str):
    chats = load_chats()
    filtered = [c for c in chats if c.get("id") != chat_id]
    save_chats(filtered)
    return {"status": "ok", "message": f"Chat {chat_id} deleted."}

@router.delete("")
@router.post("/delete-all")
async def delete_all_chats():
    save_chats([])
    return {"status": "ok", "message": "All chats deleted."}