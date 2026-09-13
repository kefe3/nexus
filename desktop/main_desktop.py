#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import threading
import requests
from typing import Optional

# Ensure virtualenv modules take priority
script_dir = os.path.dirname(os.path.abspath(__file__))
venv_site = os.path.join(script_dir, "venv", "lib", "python3.14", "site-packages")
if not os.path.exists(venv_site):
    # Fallback to wildcard matching python version in venv
    import glob
    candidates = glob.glob(os.path.join(script_dir, "venv", "lib", "python*", "site-packages"))
    if candidates:
        venv_site = candidates[0]

if os.path.exists(venv_site) and venv_site not in sys.path:
    sys.path.insert(0, venv_site)

import webview
from tray_manager import SystemTrayManager

STUDIO_URL = "http://127.0.0.1:3050"
ADMIN_URL = "http://127.0.0.1:3050/admin.html"
BACKEND_HEALTH_URL = "http://127.0.0.1:8500/health"

class NexusDesktopApp:
    def __init__(self):
        self.window: Optional[webview.Window] = None
        self.tray_mgr: Optional[SystemTrayManager] = None

    def is_backend_alive(self) -> bool:
        try:
            res = requests.get(BACKEND_HEALTH_URL, timeout=1.5)
            return res.status_code == 200
        except Exception:
            return False

    def ensure_backend_running(self):
        if self.is_backend_alive():
            print("[Desktop] ✅ Nexus AI Backend sunucusu aktif (http://127.0.0.1:8500).")
            return

        print("[Desktop] ⚠️ Nexus backend yanıt vermiyor. Otomatik başlatılıyor...")
        repo_dir = os.path.abspath(os.path.join(script_dir, ".."))
        try:
            # Strategy 1: Docker Compose Up
            subprocess.Popen(["docker", "compose", "up", "-d"], cwd=repo_dir, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

        # Wait up to 10s for backend readiness
        t0 = time.time()
        while time.time() - t0 < 10:
            if self.is_backend_alive():
                print("[Desktop] 🚀 Nexus backend başarıyla başlatıldı.")
                return
            time.sleep(0.5)

    def load_studio(self):
        if self.window:
            self.window.load_url(STUDIO_URL)
            self.window.restore()
            self.window.focus()

    def load_admin(self):
        if self.window:
            self.window.load_url(ADMIN_URL)
            self.window.restore()
            self.window.focus()

    def load_store(self):
        if self.window:
            self.window.load_url(f"{ADMIN_URL}#models")
            self.window.restore()
            self.window.focus()

    def on_exit(self):
        print("[Desktop] Nexus Masaüstü Uygulaması Kapatılıyor...")
        if self.window:
            try:
                self.window.destroy()
            except Exception:
                pass
        sys.exit(0)

    def run(self):
        self.ensure_backend_running()

        # Initialize System Tray
        self.tray_mgr = SystemTrayManager(
            on_open_studio=self.load_studio,
            on_open_cp=self.load_admin,
            on_open_store=self.load_store,
            on_exit=self.on_exit
        )
        self.tray_mgr.start_tray()

        # Create Native Webview Window
        print("[Desktop] Native Desktop Window başlatılıyor...")
        self.window = webview.create_window(
            title="Nexus AI Studio — Native Desktop Client v2.0",
            url=STUDIO_URL,
            width=1380,
            height=880,
            min_size=(980, 640),
            background_color="#06080d",
            resizable=True,
            text_select=True,
            confirm_close=False
        )

        webview.start(debug=False)

if __name__ == "__main__":
    if "--check-only" in sys.argv:
        print("Nexus Desktop modules verified OK.")
        sys.exit(0)

    app = NexusDesktopApp()
    app.run()
