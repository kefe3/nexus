from fastapi import APIRouter, Header
import httpx
from app.core.config import settings
from app.api.settings_api import get_server_key, load_server_settings

router = APIRouter()

@router.get("/models")
async def list_models(
    x_provider: str = Header(default=""),
    x_api_key: str = Header(default=""),
    x_custom_url: str = Header(default="")
):
    cfg = load_server_settings()
    provider = (x_provider or cfg.get("default_provider", "ollama")).lower().strip()
    api_key = x_api_key.strip() or get_server_key(provider)
    models = []

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            if provider == "ollama":
                url = x_custom_url.rstrip("/") if x_custom_url else cfg.get("ollama_base_url", settings.OLLAMA_BASE_URL)
                res = await client.get(f"{url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [{"id": m["name"], "name": m["name"], "provider": "ollama"} for m in data.get("models", [])]
            
            elif provider == "gemini":
                if api_key:
                    try:
                        g_res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
                        if g_res.status_code == 200:
                            raw_models = g_res.json().get("models", [])
                            for m in raw_models:
                                m_name = m.get("name", "").replace("models/", "")
                                methods = m.get("supportedGenerationMethods", [])
                                if "generateContent" in methods and "gemini" in m_name.lower():
                                    display_name = m.get("displayName", m_name)
                                    models.append({
                                        "id": m_name,
                                        "name": f"{display_name} ({m_name})",
                                        "provider": "gemini"
                                    })
                    except Exception:
                        pass

                if not models:
                    models = [
                        {"id": "gemini-3.6-flash", "name": "Gemini 3.6 Flash (Fast, Smart — Flagship)", "provider": "gemini"},
                        {"id": "gemini-3.6-pro", "name": "Gemini 3.6 Pro (Deep Intelligence & Reasoning)", "provider": "gemini"},
                        {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro (2M Context)", "provider": "gemini"},
                        {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash (Lightweight)", "provider": "gemini"}
                    ]

            elif provider == "openai":
                if api_key:
                    try:
                        o_res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {api_key}"})
                        if o_res.status_code == 200:
                            raw = o_res.json().get("data", [])
                            for m in raw:
                                mid = m.get("id", "")
                                if any(k in mid for k in ["gpt-4o", "o1", "o3", "gpt-4-turbo"]):
                                    models.append({"id": mid, "name": mid, "provider": "openai"})
                    except Exception:
                        pass

                if not models:
                    models = [
                        {"id": "gpt-4o", "name": "GPT-4o (Omni Flagship)", "provider": "openai"},
                        {"id": "gpt-4o-mini", "name": "GPT-4o Mini (Fast & Smart)", "provider": "openai"},
                        {"id": "o3-mini", "name": "o3-mini (Reasoning)", "provider": "openai"},
                        {"id": "o1", "name": "o1 (Deep Reasoning)", "provider": "openai"}
                    ]

            elif provider == "groq":
                models = [
                    {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B (Groq 300+ tok/s)", "provider": "groq"},
                    {"id": "deepseek-r1-distill-llama-70b", "name": "DeepSeek R1 70B (Groq)", "provider": "groq"},
                    {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B (32K)", "provider": "groq"}
                ]

            elif provider == "anthropic":
                models = [
                    {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet (Coding King)", "provider": "anthropic"},
                    {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku (Fast)", "provider": "anthropic"}
                ]

    except Exception as e:
        models = [{"id": "default", "name": f"Provider connection error: {str(e)}", "provider": provider}]

    if not models:
        models = [{"id": "default", "name": "No models available", "provider": provider}]

    return {"status": "ok", "provider": provider, "models": models}