import sys
import os
import threading
import time
import webbrowser
import requests
from typing import Callable, Optional

# Try pystray + Pillow for System Tray
PYSTRAY_AVAILABLE = False
try:
    import pystray
    from PIL import Image, ImageDraw, ImageFont
    PYSTRAY_AVAILABLE = True
except ImportError:
    pass

class SystemTrayManager:
    def __init__(self, on_open_studio: Callable, on_open_cp: Callable, on_open_store: Callable, on_exit: Callable):
        self.on_open_studio = on_open_studio
        self.on_open_cp = on_open_cp
        self.on_open_store = on_open_store
        self.on_exit = on_exit
        self.icon: Optional[Any] = None
        self.is_running = False

    def create_icon_image(self):
        # Generate high-resolution 64x64 dark cyan logo icon
        img = Image.new('RGBA', (64, 64), color=(0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Background rounded box
        draw.rounded_rectangle([4, 4, 60, 60], radius=14, fill=(9, 13, 21), outline=(0, 242, 254), width=3)
        # Bolt icon (cyan gradient style)
        draw.polygon([(34, 8), (14, 34), (30, 34), (26, 56), (50, 28), (34, 28)], fill=(0, 242, 254))
        return img

    def toggle_tunnel(self):
        try:
            res = requests.post("http://127.0.0.1:8500/api/deploy/studio-tunnel/toggle", timeout=5)
            data = res.json()
            msg = data.get("message", "Tünel durumu değiştirildi.")
            print(f"[Tray] {msg}")
        except Exception as e:
            print(f"[Tray] Tünel değiştirme hatası: {e}")

    def check_updates(self):
        try:
            res = requests.get("http://127.0.0.1:8500/api/admin/updates/check", timeout=5)
            data = res.json()
            if data.get("update_available"):
                rem = data.get("remote", {})
                print(f"[Tray] 🚀 Yeni Güncelleme Var: {rem.get('sha')} - {rem.get('message')}")
                self.on_open_cp()
            else:
                print(f"[Tray] ✅ Sisteminiz güncel ({data.get('local', {}).get('sha')}).")
        except Exception as e:
            print(f"[Tray] Güncelleme denetleme hatası: {e}")

    def start_tray(self):
        if not PYSTRAY_AVAILABLE:
            print("[Tray] Warning: pystray veya Pillow kütüphanesi eksik. Sistem tepsi simgesi pasif.")
            return

        def _run():
            image = self.create_icon_image()
            menu = pystray.Menu(
                pystray.MenuItem("💬 AI Studio Sohbet", lambda: self.on_open_studio(), default=True),
                pystray.MenuItem("⚙️ Kontrol Paneli", lambda: self.on_open_cp()),
                pystray.MenuItem("🛒 Nexus Store (Mağaza)", lambda: self.on_open_store()),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("🌐 Dış Erişim Tüneli (Aç/Kapat)", lambda: self.toggle_tunnel()),
                pystray.MenuItem("🔄 Güncellemeleri Denetle", lambda: self.check_updates()),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("❌ Çıkış", lambda: self.stop_tray())
            )
            self.icon = pystray.Icon("nexus_ai_studio", image, "Nexus AI Studio — Native Desktop Client", menu)
            self.is_running = True
            self.icon.run()

        threading.Thread(target=_run, daemon=True).start()

    def stop_tray(self):
        if self.icon:
            self.icon.stop()
        self.is_running = False
        if self.on_exit:
            self.on_exit()
