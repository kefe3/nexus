from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import os
import time
import uuid
import json
import subprocess
import threading
import shutil
import re
from typing import Optional, List, Dict, Any

router = APIRouter(tags=["deploy"])

DEPLOYMENTS_DIR = os.path.join(os.getcwd(), "data", "deployments")
METADATA_FILE = os.path.join(os.getcwd(), "data", "deployments_meta.json")
os.makedirs(DEPLOYMENTS_DIR, exist_ok=True)

# Cloudflare Tunnel Manager with Auto-Download Engine
class TunnelManager:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.public_url: Optional[str] = None
        self.is_running = False
        self.lock = threading.Lock()

    def get_cloudflared_binary(self) -> Optional[str]:
        candidates = [
            "/usr/local/bin/cloudflared",
            "/usr/bin/cloudflared",
            "/app/data/cloudflared",
            "data/cloudflared",
            os.path.abspath(os.path.join(os.getcwd(), "data", "cloudflared"))
        ]
        if sw := shutil.which("cloudflared"):
            candidates.insert(0, sw)

        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                return c

        # Auto-download cloudflared binary to temp file first if missing
        target_dir = "/app/data" if os.path.isdir("/app/data") else os.path.join(os.getcwd(), "data")
        os.makedirs(target_dir, exist_ok=True)
        target_bin = os.path.join(target_dir, "cloudflared")
        tmp_bin = os.path.join(target_dir, f"cloudflared_{int(time.time())}.tmp")
        
        try:
            print(f"[TunnelManager] Cloudflared binary indiriliyor -> {target_bin}...")
            import urllib.request
            dl_url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
            urllib.request.urlretrieve(dl_url, tmp_bin)
            os.chmod(tmp_bin, 0o777)
            os.replace(tmp_bin, target_bin)
            if os.path.isfile(target_bin):
                return target_bin
        except Exception as e:
            print(f"[TunnelManager] Cloudflared indirme uyarısı: {e}")
            if os.path.isfile(tmp_bin):
                try:
                    os.chmod(tmp_bin, 0o777)
                    return tmp_bin
                except Exception:
                    pass

        return None

    def start_tunnel(self, port: int = 3050):
        with self.lock:
            if self.is_running and self.public_url and self.process and self.process.poll() is None:
                return self.public_url

            cmd_bin = self.get_cloudflared_binary()
            if not cmd_bin:
                print("[TunnelManager] HATA: Cloudflared ikili dosyası bulunamadı.")
                return None

            try:
                if self.process:
                    try:
                        self.process.terminate()
                        self.process.wait(timeout=2)
                    except Exception:
                        try:
                            self.process.kill()
                        except Exception:
                            pass

                self.public_url = None
                self.process = subprocess.Popen(
                    [cmd_bin, "tunnel", "--url", f"http://127.0.0.1:{port}", "--no-autoupdate"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1
                )
                self.is_running = True

                # Background non-blocking URL listener
                def _reader():
                    while self.is_running and self.process and self.process.stdout:
                        line = self.process.stdout.readline()
                        if not line:
                            if self.process.poll() is not None:
                                break
                            time.sleep(0.1)
                            continue
                        m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
                        if m:
                            self.public_url = m.group(0)
                            print(f"[TunnelManager] 🌐 Canlı Tünel Açıldı: {self.public_url}")

                t = threading.Thread(target=_reader, daemon=True)
                t.start()

                # Wait up to 12s for public URL to be published
                t0 = time.time()
                while time.time() - t0 < 12:
                    if self.public_url:
                        return self.public_url
                    if self.process.poll() is not None:
                        break
                    time.sleep(0.2)

                return self.public_url
            except Exception as e:
                print("[TunnelManager] Tünel başlatma hatası:", e)
                return None

    def stop_tunnel(self):
        with self.lock:
            if self.process:
                try:
                    self.process.terminate()
                    self.process.kill()
                except Exception:
                    pass
            self.process = None
            self.public_url = None
            self.is_running = False

tunnel_manager = TunnelManager()

# Automatically attempt tunnel startup in background for port 3050 (Full Nexus Studio & Control Panel)
threading.Thread(target=lambda: tunnel_manager.start_tunnel(3050), daemon=True).start()

def load_metadata() -> Dict[str, Any]:
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_metadata(meta: Dict[str, Any]):
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

class PublishRequest(BaseModel):
    html: str
    title: Optional[str] = "Nexus AI Generated App"

@router.post("/api/deploy/publish")
async def publish_deployment(req: PublishRequest):
    html_content = req.html.strip()
    if not html_content:
        raise HTTPException(status_code=400, detail="HTML content is empty")

    deploy_id = uuid.uuid4().hex[:8]
    file_path = os.path.join(DEPLOYMENTS_DIR, f"{deploy_id}.html")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    meta = load_metadata()
    pub_url = tunnel_manager.public_url
    if not pub_url:
        pub_url = tunnel_manager.start_tunnel(8500)

    meta[deploy_id] = {
        "id": deploy_id,
        "title": req.title,
        "size_bytes": len(html_content.encode("utf-8")),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "views": 0
    }
    save_metadata(meta)

    return {
        "status": "ok",
        "id": deploy_id,
        "title": req.title,
        "local_path": f"/share/{deploy_id}",
        "local_url": f"http://192.168.0.188:3050/share/{deploy_id}",
        "public_url": f"{pub_url}/share/{deploy_id}" if pub_url else f"http://192.168.0.188:3050/share/{deploy_id}",
        "tunnel_active": bool(pub_url),
        "tunnel_base": pub_url or ""
    }

@router.get("/share/{deploy_id}", response_class=HTMLResponse)
@router.head("/share/{deploy_id}", response_class=HTMLResponse)
@router.get("/p/{deploy_id}", response_class=HTMLResponse)
@router.head("/p/{deploy_id}", response_class=HTMLResponse)
async def serve_share_page(deploy_id: str):
    file_path = os.path.join(DEPLOYMENTS_DIR, f"{deploy_id}.html")
    if not os.path.exists(file_path):
        return HTMLResponse(
            content="""<!DOCTYPE html><html><head><meta charset='utf-8'><title>404 - Not Found</title><style>body{background:#0b0f19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}h1{color:#ff4b2b;}</style></head><body><div style='text-align:center;'><h1>404</h1><p>Bu yayınlanmış sayfa bulunamadı veya silinmiş.</p><a href='/' style='color:#00f2fe;'>Nexus AI Studio'ya Dön</a></div></body></html>""",
            status_code=404
        )

    meta = load_metadata()
    if deploy_id in meta:
        meta[deploy_id]["views"] = meta[deploy_id].get("views", 0) + 1
        save_metadata(meta)

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return HTMLResponse(content=content, status_code=200)

@router.get("/api/deploy/list")
async def list_deployments():
    meta = load_metadata()
    pub_url = tunnel_manager.public_url
    items = []
    for k, v in meta.items():
        items.append({
            **v,
            "local_url": f"http://192.168.0.188:3050/share/{k}",
            "public_url": f"{pub_url}/share/{k}" if pub_url else f"http://192.168.0.188:3050/share/{k}"
        })
    return {
        "status": "ok",
        "tunnel_active": bool(pub_url),
        "tunnel_url": pub_url or "",
        "deployments": sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
    }

@router.get("/api/deploy/tunnel")
@router.get("/api/deploy/studio-tunnel")
async def get_tunnel_status():
    pub_url = tunnel_manager.public_url
    return {
        "status": "ok",
        "active": bool(pub_url),
        "url": pub_url or "",
        "public_studio_url": pub_url or "",
        "public_admin_url": f"{pub_url}/admin.html" if pub_url else "",
        "local_studio_url": "http://192.168.0.188:3050",
        "local_admin_url": "http://192.168.0.188:3050/admin.html",
        "service": "Cloudflare Quick Tunnel (Zero-Config HTTPS)"
    }

@router.post("/api/deploy/tunnel/restart")
@router.post("/api/deploy/studio-tunnel/restart")
async def restart_tunnel():
    tunnel_manager.stop_tunnel()
    pub_url = tunnel_manager.start_tunnel(3050)
    return {
        "status": "ok",
        "active": bool(pub_url),
        "url": pub_url or "",
        "public_studio_url": pub_url or "",
        "public_admin_url": f"{pub_url}/admin.html" if pub_url else ""
    }

@router.post("/api/deploy/studio-tunnel/toggle")
async def toggle_tunnel():
    if tunnel_manager.is_running and tunnel_manager.public_url:
        tunnel_manager.stop_tunnel()
        return {
            "status": "ok",
            "active": False,
            "message": "Dış erişim tüneli kapatıldı. Sistem artık yalnızca yerel ağda (LAN) erişilebilir.",
            "public_studio_url": "",
            "public_admin_url": ""
        }
    else:
        tunnel_manager.stop_tunnel()
        pub_url = tunnel_manager.start_tunnel(3050)
        return {
            "status": "ok",
            "active": bool(pub_url),
            "message": "Dış erişim tüneli başarıyla başlatıldı ve dünyaya açıldı.",
            "public_studio_url": pub_url or "",
            "public_admin_url": f"{pub_url}/admin.html" if pub_url else ""
        }

@router.post("/api/deploy/studio-tunnel/start")
async def start_tunnel_route():
    pub_url = tunnel_manager.start_tunnel(3050)
    return {
        "status": "ok",
        "active": bool(pub_url),
        "public_studio_url": pub_url or "",
        "public_admin_url": f"{pub_url}/admin.html" if pub_url else ""
    }

@router.post("/api/deploy/studio-tunnel/stop")
async def stop_tunnel():
    tunnel_manager.stop_tunnel()
    return {"status": "ok", "active": False, "message": "Tunnel stopped"}

@router.delete("/api/deploy/{deploy_id}")
@router.post("/api/deploy/{deploy_id}/delete")
async def delete_deployment(deploy_id: str):
    file_path = os.path.join(DEPLOYMENTS_DIR, f"{deploy_id}.html")
    if os.path.exists(file_path):
        os.remove(file_path)

    meta = load_metadata()
    if deploy_id in meta:
        del meta[deploy_id]
        save_metadata(meta)

    return {"status": "ok", "message": f"Deployment '{deploy_id}' deleted."}

