import os
from pydantic import BaseModel
from typing import List, Optional

class Settings(BaseModel):
    PROJECT_NAME: str = "Nexus AI Studio"
    VERSION: str = "3.2.1"
    API_PREFIX: str = "/api"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: List[str] = ["*"]

    # Provider Defaults
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "ollama")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    
    # Server-side API Keys (Optional fallbacks)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", "")

settings = Settings()
