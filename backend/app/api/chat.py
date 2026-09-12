from fastapi import APIRouter, Request, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import httpx
import json
from app.core.config import settings

router = APIRouter()

class ChatRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = True
    system_prompt: Optional[str] = None

@router.post("/chat")
async def chat_stream(
    req: ChatRequest,
    x_provider: str = Header(default="ollama"),
    x_api_key: str = Header(default=""),
    x_custom_url: str = Header(default="")
):
    provider = x_provider.lower()
    api_key = x_api_key or getattr(settings, f"{provider.upper()}_API_KEY", "")

    if provider == "ollama":
        url = (x_custom_url.rstrip("/") if x_custom_url else settings.OLLAMA_BASE_URL) + "/api/chat"
        payload = {
            "model": req.model,
            "messages": req.messages,
            "stream": True,
            "options": {"temperature": req.temperature}
        }

        async def ollama_stream_generator():
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload) as resp:
                    if resp.status_code != 200:
                        yield f"data: {json.dumps({'error': f'Ollama HTTP {resp.status_code}'})}\n\n"
                        return
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            done = data.get("done", False)
                            yield f"data: {json.dumps({'content': content, 'done': done})}\n\n"
                            if done:
                                yield "data: [DONE]\n\n"
                                break
                        except Exception:
                            continue

        return StreamingResponse(ollama_stream_generator(), media_type="text/event-stream")

    elif provider == "gemini":
        if not api_key:
            raise HTTPException(status_code=400, detail="Gemini API key is required. Please set it in Settings.")
        
        target_model = req.model
        if "gemini-2.0" in target_model or not target_model:
            target_model = "gemini-3.6-flash" if "flash" in target_model.lower() else "gemini-3.6-pro"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:streamGenerateContent?alt=sse&key={api_key}"
        
        contents = []
        system_instruction = None
        for m in req.messages:
            role = m.get("role", "user")
            text = m.get("content", "")
            if role == "system":
                system_instruction = {"parts": [{"text": text}]}
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": text}]})
            else:
                contents.append({"role": "user", "parts": [{"text": text}]})

        gemini_payload = {
            "contents": contents,
            "generationConfig": {"temperature": req.temperature}
        }
        if system_instruction:
            gemini_payload["systemInstruction"] = system_instruction

        async def gemini_stream_generator():
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=gemini_payload) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        yield f"data: {json.dumps({'error': f'Gemini Error ({resp.status_code}): {err_text.decode()}'})}\n\n"
                        return
                    async for line in resp.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            parsed = json.loads(data_str)
                            candidates = parsed.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                text_delta = "".join(p.get("text", "") for p in parts)
                                yield f"data: {json.dumps({'content': text_delta, 'done': False})}\n\n"
                        except Exception:
                            continue
                    yield "data: [DONE]\n\n"

        return StreamingResponse(gemini_stream_generator(), media_type="text/event-stream")

    elif provider in ["openai", "groq", "custom"]:
        if provider == "openai":
            base_url = "https://api.openai.com/v1"
        elif provider == "groq":
            base_url = "https://api.groq.com/openai/v1"
        else:
            base_url = x_custom_url.rstrip("/") if x_custom_url else "http://localhost:8000/v1"

        if not api_key and provider in ["openai", "groq"]:
            raise HTTPException(status_code=400, detail=f"{provider.capitalize()} API key is required.")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        openai_payload = {
            "model": req.model,
            "messages": req.messages,
            "temperature": req.temperature,
            "stream": True
        }

        async def openai_stream_generator():
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", f"{base_url}/chat/completions", headers=headers, json=openai_payload) as resp:
                    if resp.status_code != 200:
                        err_body = await resp.aread()
                        yield f"data: {json.dumps({'error': f'API Error {resp.status_code}: {err_body.decode()}'})}\n\n"
                        return
                    async for line in resp.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            parsed = json.loads(data_str)
                            delta = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if delta:
                                yield f"data: {json.dumps({'content': delta, 'done': False})}\n\n"
                        except Exception:
                            continue

        return StreamingResponse(openai_stream_generator(), media_type="text/event-stream")

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
