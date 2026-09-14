import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.chat import router as chat_router
from app.api.models import router as models_router
from app.api.presets import router as presets_router
from app.api.stats import router as stats_router
from app.api.admin import router as admin_router
from app.api.deploy import router as deploy_router
from app.api.settings_api import router as settings_router
from app.api.chats import router as chats_router
from app.api.apikeys import router as apikeys_router
from app.api.v1_gateway import router as v1_gateway_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Nexus AI Studio — Open Source Self-Hosted Multi-Provider AI Platform & Admin Dashboard"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(models_router, prefix=settings.API_PREFIX)
app.include_router(presets_router, prefix=settings.API_PREFIX)
app.include_router(stats_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(settings_router, prefix=settings.API_PREFIX)
app.include_router(chats_router, prefix=settings.API_PREFIX)
app.include_router(apikeys_router, prefix=settings.API_PREFIX)
app.include_router(v1_gateway_router)
app.include_router(deploy_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Mount frontend static files if available (Single-process Native Windows & Standalone execution)
possible_frontend_dirs = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "src")),
    "/app/frontend",
]
frontend_dir = next((d for d in possible_frontend_dirs if os.path.isdir(d)), None)

if frontend_dir:
    @app.get("/admin")
    @app.get("/admin.html")
    async def serve_admin():
        admin_path = os.path.join(frontend_dir, "admin.html")
        if os.path.exists(admin_path):
            return FileResponse(admin_path)
        return {"error": "admin.html not found"}

    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)