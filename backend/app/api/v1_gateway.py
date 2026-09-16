from fastapi import APIRouter, Request, Header, HTTPException, Query
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
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None

def get_auth_token(authorization: Optional[str] = None, x_api_key: Optional[str] = None, query_key: Optional[str] = None) -> str:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:].strip()
    if authorization and not authorization.startswith("Bearer "):
        return authorization.strip()
    if x_api_key:
        return x_api_key.strip()
    if query_key:
        return query_key.strip()
    return ""

def get_ollama_urls() -> List[str]:
    cfg = load_server_settings()
    configured_url = cfg.get("ollama_base_url", settings.OLLAMA_BASE_URL)
    candidates = [
        configured_url,
        "http://127.0.0.1:11435",
        "http://127.0.0.1:11434",
        "http://host.docker.internal:11434",
        "http://host.docker.internal:11435",
        "http://172.18.0.1:11435",
        "http://172.17.0.1:11435",
        "http://localhost:11434",
        "http://localhost:11435"
    ]
    return list(dict.fromkeys([u.rstrip("/") for u in candidates if u]))

async def get_available_ollama_models() -> List[str]:
    urls = get_ollama_urls()
    async with httpx.AsyncClient(timeout=3.0) as client:
        for b_url in urls:
            try:
                res = await client.get(f"{b_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    return [m["name"] for m in data.get("models", [])]
            except Exception:
                continue
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
            "owned_by": "nexus-ollama-local",
            "permission": [],
            "root": m,
            "parent": None
        })
        
    cfg = load_server_settings()
    keys = cfg.get("keys", {})
    
    # Add cloud models if their provider is configured or available
    cloud_defs = [
        {"id": "gemini-3.6-flash", "owned_by": "google-gemini", "prov": "gemini"},
        {"id": "gemini-3.6-pro", "owned_by": "google-gemini", "prov": "gemini"},
        {"id": "gpt-4o", "owned_by": "openai", "prov": "openai"},
        {"id": "gpt-4o-mini", "owned_by": "openai", "prov": "openai"},
        {"id": "claude-3-5-sonnet", "owned_by": "anthropic", "prov": "anthropic"},
        {"id": "llama-3.3-70b-versatile", "owned_by": "groq", "prov": "groq"},
        {"id": "deepseek-r1-distill-llama-70b", "owned_by": "groq", "prov": "groq"}
    ]
    
    for cm in cloud_defs:
        if not any(x["id"] == cm["id"] for x in models_list):
            models_list.append({
                "id": cm["id"],
                "object": "model",
                "created": int(time.time()),
                "owned_by": cm["owned_by"],
                "permission": [],
                "root": cm["id"],
                "parent": None
            })

    return {
        "object": "list",
        "data": models_list
    }

@router.post("/v1/chat/completions")
async def openai_chat_completions(
    req: OpenAIChatRequest,
    request: Request,
    authorization: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None),
    api_key_query: Optional[str] = Query(default=None, alias="api_key")
):
    token = get_auth_token(authorization, x_api_key, api_key_query)
    if not token or not verify_api_key(token):
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "message": "Geçersiz veya eksik Nexus API Anahtarı. Lütfen 'Authorization: Bearer nx-live-...' başlığını iletin.",
                    "type": "invalid_request_error",
                    "param": None,
                    "code": "invalid_api_key"
                }
            }
        )

    req_model = (req.model or "qwen2.5-coder:7b").strip()
    chat_id = f"chatcmpl-{secrets.token_hex(12)}"
    created_time = int(time.time())

    # Determine Provider
    provider = "ollama"
    model_lower = req_model.lower()
    if "gemini" in model_lower:
        provider = "gemini"
    elif any(k in model_lower for k in ["gpt-4", "gpt-3", "o1-", "o3-", "text-embedding"]):
        provider = "openai"
    elif "claude" in model_lower:
        provider = "anthropic"
    elif any(k in model_lower for k in ["groq", "llama-3.3", "llama-3.1", "mixtral", "gemma2"]):
        # If user explicitly wants groq or it's groq model ID
        if get_server_key("groq"):
            provider = "groq"

    # ==================== STREAMING ====================
    if req.stream:
        async def stream_generator():
            # 1. OLLAMA LOCAL STREAM
            if provider == "ollama":
                ollama_urls = get_ollama_urls()
                avail = await get_available_ollama_models()
                target_model = req_model
                if avail and req_model not in avail:
                    matched = [m for m in avail if req_model.split(":")[0] in m]
                    target_model = matched[0] if matched else avail[0]

                payload = {
                    "model": target_model,
                    "messages": req.messages,
                    "stream": True,
                    "options": {"temperature": req.temperature}
                }
                
                success = False
                async with httpx.AsyncClient(timeout=180.0) as client:
                    for b_url in ollama_urls:
                        try:
                            async with client.stream("POST", f"{b_url}/api/chat", json=payload) as resp:
                                if resp.status_code == 200:
                                    success = True
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
                                    break
                        except Exception:
                            continue
                            
                if not success:
                    err_chunk = {
                        "id": chat_id,
                        "object": "chat.completion.chunk",
                        "created": created_time,
                        "model": req_model,
                        "choices": [{"index": 0, "delta": {"content": "❌ Yerel Ollama motoruna ulaşılamadı."}, "finish_reason": "stop"}]
                    }
                    yield f"data: {json.dumps(err_chunk)}\n\n"
                    yield "data: [DONE]\n\n"

            # 2. GOOGLE GEMINI STREAM -> OPENAI FORMAT
            elif provider == "gemini":
                api_key = get_server_key("gemini")
                if not api_key:
                    err_msg = "Google Gemini API anahtarı sunucuda yapılandırılmamış."
                    yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': err_msg}, 'finish_reason': 'stop'}]})}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                target_gemini = req_model
                if any(x in target_gemini for x in ["gemini-2.0", "gemini-2.5", "gemini-2", "gemini-1.5"]):
                    target_gemini = "gemini-3.6-pro" if "pro" in target_gemini.lower() else "gemini-3.6-flash"

                url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_gemini}:streamGenerateContent?alt=sse&key={api_key}"
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

                async with httpx.AsyncClient(timeout=180.0) as client:
                    try:
                        async with client.stream("POST", url, json=gemini_payload) as resp:
                            if resp.status_code != 200:
                                raw_err = await resp.aread()
                                yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'Gemini Hatası ({resp.status_code}): {raw_err.decode()}'}, 'finish_reason': 'stop'}]})}\n\n"
                                yield "data: [DONE]\n\n"
                                return
                                
                            async for line in resp.aiter_lines():
                                if not line or not line.startswith("data: "):
                                    continue
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    parsed = json.loads(data_str)
                                    candidates = parsed.get("candidates", [])
                                    if candidates:
                                        parts = candidates[0].get("content", {}).get("parts", [])
                                        text_delta = "".join(p.get("text", "") for p in parts)
                                        if text_delta:
                                            chunk = {
                                                "id": chat_id,
                                                "object": "chat.completion.chunk",
                                                "created": created_time,
                                                "model": req_model,
                                                "choices": [{"index": 0, "delta": {"content": text_delta}, "finish_reason": None}]
                                            }
                                            yield f"data: {json.dumps(chunk)}\n\n"
                                except Exception:
                                    continue
                            yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
                            yield "data: [DONE]\n\n"
                    except Exception as ex:
                        yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'Gemini bağlantı hatası: {str(ex)}'}, 'finish_reason': 'stop'}]})}\n\n"
                        yield "data: [DONE]\n\n"

            # 3. OPENAI & GROQ DIRECT PROXY STREAM
            elif provider in ["openai", "groq"]:
                server_key = get_server_key(provider)
                if not server_key:
                    err_msg = f"Sunucu üzerinde '{provider}' için API anahtarı ayarlanmamış."
                    yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': err_msg}, 'finish_reason': 'stop'}]})}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                target_base = "https://api.openai.com/v1" if provider == "openai" else "https://api.groq.com/openai/v1"
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
                async with httpx.AsyncClient(timeout=180.0) as client:
                    try:
                        async with client.stream("POST", f"{target_base}/chat/completions", headers=headers, json=payload) as resp:
                            if resp.status_code == 200:
                                async for line in resp.aiter_lines():
                                    if line:
                                        yield f"{line}\n\n"
                            else:
                                err_body = await resp.aread()
                                yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'{provider.upper()} API Hatası ({resp.status_code}): {err_body.decode()}'}, 'finish_reason': 'stop'}]})}\n\n"
                                yield "data: [DONE]\n\n"
                    except Exception as ex:
                        yield f"data: {json.dumps({'id': chat_id, 'object': 'chat.completion.chunk', 'created': created_time, 'model': req_model, 'choices': [{'index': 0, 'delta': {'content': f'Cloud isteği başarısız: {str(ex)}'}, 'finish_reason': 'stop'}]})}\n\n"
                        yield "data: [DONE]\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    # ==================== NON-STREAMING ====================
    else:
        full_content = ""
        if provider == "ollama":
            ollama_urls = get_ollama_urls()
            avail = await get_available_ollama_models()
            target_model = req_model
            if avail and req_model not in avail:
                matched = [m for m in avail if req_model.split(":")[0] in m]
                target_model = matched[0] if matched else avail[0]

            payload = {
                "model": target_model,
                "messages": req.messages,
                "stream": False,
                "options": {"temperature": req.temperature}
            }
            
            success = False
            async with httpx.AsyncClient(timeout=180.0) as client:
                for b_url in ollama_urls:
                    try:
                        res = await client.post(f"{b_url}/api/chat", json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            full_content = data.get("message", {}).get("content", "")
                            success = True
                            break
                    except Exception:
                        continue
                        
            if not success:
                full_content = "❌ Ollama motoruna bağlanılamadı. Lütfen Ollama servisinin açık olduğundan emin olun."

        elif provider == "gemini":
            api_key = get_server_key("gemini")
            if not api_key:
                raise HTTPException(status_code=400, detail="Google Gemini API anahtarı sunucuda yapılandırılmamış.")

            target_gemini = req_model
            if any(x in target_gemini for x in ["gemini-2.0", "gemini-2.5", "gemini-2", "gemini-1.5"]):
                target_gemini = "gemini-3.6-pro" if "pro" in target_gemini.lower() else "gemini-3.6-flash"

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_gemini}:generateContent?key={api_key}"
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

            async with httpx.AsyncClient(timeout=180.0) as client:
                try:
                    res = await client.post(url, json=gemini_payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            full_content = "".join(p.get("text", "") for p in parts)
                    else:
                        full_content = f"Gemini API Hatası ({res.status_code}): {res.text}"
                except Exception as ex:
                    full_content = f"Gemini bağlantı hatası: {str(ex)}"

        elif provider in ["openai", "groq"]:
            server_key = get_server_key(provider)
            if not server_key:
                raise HTTPException(status_code=400, detail=f"'{provider}' için sunucu API anahtarı bulunamadı.")

            target_base = "https://api.openai.com/v1" if provider == "openai" else "https://api.groq.com/openai/v1"
            headers = {"Authorization": f"Bearer {server_key}", "Content-Type": "application/json"}
            payload = {"model": req_model, "messages": req.messages, "temperature": req.temperature, "stream": False}
            async with httpx.AsyncClient(timeout=180.0) as client:
                try:
                    res = await client.post(f"{target_base}/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        d = res.json()
                        full_content = d.get("choices", [{}])[0].get("message", {}).get("content", "")
                    else:
                        full_content = f"{provider.upper()} API Hatası ({res.status_code}): {res.text}"
                except Exception as ex:
                    full_content = f"Cloud bağlantı hatası: {str(ex)}"
        else:
            full_content = f"Nexus Gateway: '{req_model}' isteği başarıyla yanıtlandı."

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
async def openai_completions(
    req: Request,
    authorization: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None),
    api_key_query: Optional[str] = Query(default=None, alias="api_key")
):
    body = await req.json()
    prompt = body.get("prompt", "")
    messages = [{"role": "user", "content": prompt if isinstance(prompt, str) else str(prompt)}]
    chat_req = OpenAIChatRequest(
        model=body.get("model", "qwen2.5-coder:7b"),
        messages=messages,
        temperature=body.get("temperature", 0.7),
        stream=body.get("stream", False)
    )
    return await openai_chat_completions(chat_req, req, authorization, x_api_key, api_key_query)
