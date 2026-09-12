from fastapi import APIRouter, Header
import httpx
from app.core.config import settings

router = APIRouter()

@router.get("/models")
async def list_models(
    x_provider: str = Header(default="ollama"),
    x_api_key: str = Header(default=""),
    x_custom_url: str = Header(default="")
):
    provider = x_provider.lower()
    models = []

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            if provider == "ollama":
                url = x_custom_url.rstrip("/") if x_custom_url else settings.OLLAMA_BASE_URL
                res = await client.get(f"{url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [{"id": m["name"], "name": m["name"], "provider": "ollama"} for m in data.get("models", [])]
            
            elif provider == "gemini":
                models = [
                    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash (Lightning Fast)", "provider": "gemini"},
                    {"id": "gemini-2.0-pro-exp-02-05", "name": "Gemini 2.0 Pro (Top Intelligence)", "provider": "gemini"},
                    {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro (2M Token Context)", "provider": "gemini"},
                    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "provider": "gemini"}
                ]

            elif provider == "openai":
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
