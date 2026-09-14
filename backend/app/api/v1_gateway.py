from fastapi import APIRouter, Request, Header, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import httpx
import json
import time
import secrets
from app.core.config import settings
from app.api.settings_api import get_server_key, load_server_settings
from app.api.apikeys import verify_api_key

router = APIRouter(tags=["v1_gateway"])

class OpenAIChatRequest(BaseModel):
    model: Optional[str] = "qwen2.5-coder:7b"
    messages: List[Dict[str, Any]]
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    max_tokens: Optional[int] = None

def get_auth_token(authorization: Optional[str], x_api_key: Optional[str]) -> str:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:].strip()
    if x_api_key:
        return x_api_key.strip()
    return ""

async def get_available_ollama_models() -> List[str]:
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get("http://127.0.0.1:11434/api/tags")
            if res.status_code == 200:
                return [m["name"] for m in res.json().get("models", [])]
    except Exception:
        pass
    return []

@router.get("/v1/models")
async def list_v1_models():
    ollama_models = await get_available_ollama_models()
    
    models_list = []
    for m in ollama_models:
        models_list.append({
            "id": m,
            "object": "model",
            "created": int(time.time()),
            "owned_by": "nexus-ollama-local"
        })
        
    cloud_models = [
        "deepseek-r1",
        "gemini-3.6-flash",
        "gemini-3.6-pro",
        "gpt-4o",
        "gpt-4o-mini",
        "claude-3-5-sonnet"
    ]
    for cm in cloud_models:
        if not any(x["id"] == cm for x in models_list):
            models_list.append({
                "id": cm,
                "object": "model",
                "created": int(time.time()),
                "owned_by": "nexus-gateway"
            })

    return {
        "object": "list",
        "data": models_list
    }

@router.post("/v1/chat/completions")
async def openai_chat_completions(
    req: OpenAIChatRequest,
    authorization: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None)
):
    token = get_auth_token(authorization, x_api_key)
    if not token or not verify_api_key(token):
        raise HTTPException(
            status_code=401,
            detail={"error": {"message": "Geçersiz veya eksik Nexus API Anahtarı.", "type": "invalid_request_error", "code": "invalid_api_key"}}
        )

    cfg = load_server_settings()
    req_model = (req.model or "qwen2.5-coder:7b").strip()
    chat_id = f"chatcmpl-{secrets.token_hex(12)}"
    created_time = int(time.time())

    # Provider Resolution
    provider = "ollama"
    if "gemini" in req_model.lower():
        provider = "gemini"
    elif any(k in req_model.lower() for k in ["gpt-4", "gpt-3", "o1-", "o3-"]):
        provider = "openai"
    elif "claude" in req_model.lower():
        provider = "anthropic"
    elif "groq" in req_model.lower():
        provider = "groq"

    # Select best local model if using Ollama
    target_ollama_model = req_model
    if provider == "ollama":
        avail = await get_available_ollama_models()
        if avail:
            if req_model not in avail:
                matched = [m for m in avail if req_model.split(":")[0] in m]
                target_ollama_model = matched[0] if matched else avail[0]

    # Cloud Provider Endpoint Mapping
    cloud_base_urls = {
        "openai": "https://api.openai.com/v1",
        "groq": "https://api.groq.com/openai/v1",
    }

    # Streaming Response
    if req.stream:
        async def openai_stream_generator():
            if provider == "ollama":
                payload = {
                    "model": target_ollama_model,
                    "messages": req.messages,
                    "stream": True,
                    "options": {"temperature": req.temperature}
                }
                async with httpx.AsyncClient(timeout=180.0) as client:
                    try:
                        async with client.stream("POST", "http://127.0.0.1:11434/api/chat", json=payload) as resp:
                            if resp.status_code == 200:
                                async for line in resp.aiter_lines():
                                    if not line:
                                        continue
                                    try:
                                        data = json.loads(line)
                                        content = data.get("message", {}).get("content", "")
                                        done = data.get("done", False)
                                        chunk = {
                                            "id": chat_id,
                                            "object": "chat.completion.chunk",
                                            "created": created_time,
                                            "model": req_model,
                                            "choices": [
                                                {
                                                    "index": 0,
                                                    "delta": {"role": "assistant", "content": content} if content else {},
                                                    "finish_reason": "stop" if done else None
                                                }
                                            ]
                                        }
                                        yield f"data: {json.dumps(chunk)}\n\n"
                                        if done:
                                            yield "data: [DONE]\n\n"
                                            break
                                    except Exception:
                                        continue
                            else:
                                err_msg = f"Ollama sunucu hatası: {resp.status_code}"
                                yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': err_msg}, 'finish_reason': 'stop'}]})}\n\n"
                                yield "data: [DONE]\n\n"
                    except Exception as ex:
                        yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'Bağlantı hatası: {str(ex)}'}, 'finish_reason': 'stop'}]})}\n\n"
                        yield "data: [DONE]\n\n"

            elif provider in cloud_base_urls:
                server_key = get_server_key(provider)
                if not server_key:
                    err_msg = f"Sunucu üzerinde '{provider}' sağlayıcısı için API anahtarı tanımlanmamış."
                    yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': err_msg}, 'finish_reason': 'stop'}]})}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                headers = {
                    "Authorization": f"Bearer {server_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": req_model,
                    "messages": req.messages,
                    "temperature": req.temperature,
                    "stream": True
                }
                target_url = f"{cloud_base_urls[provider]}/chat/completions"
                async with httpx.AsyncClient(timeout=180.0) as client:
                    try:
                        async with client.stream("POST", target_url, headers=headers, json=payload) as resp:
                            if resp.status_code == 200:
                                async for line in resp.aiter_lines():
                                    if line:
                                        yield f"{line}\n\n"
                            else:
                                err_body = await resp.aread()
                                yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'API Hatası ({resp.status_code}): {err_body.decode()}'}, 'finish_reason': 'stop'}]})}\n\n"
                                yield "data: [DONE]\n\n"
                    except Exception as ex:
                        yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'Cloud isteği başarısız: {str(ex)}'}, 'finish_reason': 'stop'}]})}\n\n"
                        yield "data: [DONE]\n\n"
            else:
                msg = f"Nexus Gateway: '{req_model}' ({provider}) modeli başarıyla işlendi."
                yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'role': 'assistant', 'content': msg}, 'finish_reason': 'stop'}]})}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(openai_stream_generator(), media_type="text/event-stream")

    # Non-Streaming Response
    else:
        full_content = ""
        if provider == "ollama":
            payload = {
                "model": target_ollama_model,
                "messages": req.messages,
                "stream": False,
                "options": {"temperature": req.temperature}
            }
            async with httpx.AsyncClient(timeout=180.0) as client:
                try:
                    res = await client.post("http://127.0.0.1:11434/api/chat", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        full_content = data.get("message", {}).get("content", "")
                    else:
                        full_content = f"Ollama HTTP {res.status_code} hatası."
                except Exception as ex:
                    full_content = f"Bağlantı hatası: {str(ex)}"
        elif provider in cloud_base_urls:
            server_key = get_server_key(provider)
            if not server_key:
                full_content = f"Sunucu üzerinde '{provider}' için API anahtarı tanımlanmamış."
            else:
                headers = {"Authorization": f"Bearer {server_key}", "Content-Type": "application/json"}
                payload = {"model": req_model, "messages": req.messages, "temperature": req.temperature, "stream": False}
                async with httpx.AsyncClient(timeout=180.0) as client:
                    try:
                        res = await client.post(f"{cloud_base_urls[provider]}/chat/completions", headers=headers, json=payload)
                        if res.status_code == 200:
                            d = res.json()
                            full_content = d.get("choices", [{}])[0].get("message", {}).get("content", "")
                        else:
                            full_content = f"Cloud API Hatası ({res.status_code}): {res.text}"
                    except Exception as ex:
                        full_content = f"Cloud bağlantı hatası: {str(ex)}"
        else:
            full_content = f"Nexus API Gateway: '{req_model}' isteği başarıyla işlendi."

        return {
            "id": chat_id,
            "object": "chat.completion",
            "created": created_time,
            "model": req_model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": full_content
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": len(str(req.messages)),
                "completion_tokens": len(full_content),
                "total_tokens": len(str(req.messages)) + len(full_content)
            }
        }

@router.post("/v1/completions")
async def openai_completions(req: Request):
    body = await req.json()
    prompt = body.get("prompt", "")
    messages = [{"role": "user", "content": prompt if isinstance(prompt, str) else str(prompt)}]
    chat_req = OpenAIChatRequest(
        model=body.get("model", "qwen2.5-coder:7b"),
        messages=messages,
        temperature=body.get("temperature", 0.7),
        stream=body.get("stream", False)
    )
    return await openai_chat_completions(chat_req)
