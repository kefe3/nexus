// Nexus AI Studio — Live Artifact Execution & 1-Click Public Deployment Engine
let currentSandboxCode = "";
let currentDeviceMode = "desktop";
let lastPublishData = null;

function openSandbox(code) {
    currentSandboxCode = code || "";
    const modal = document.getElementById("sandboxModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    setDeviceMode("desktop");
    runSandboxCode();
}

function closeSandbox() {
    const modal = document.getElementById("sandboxModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

function setDeviceMode(mode) {
    currentDeviceMode = mode;
    const iframeWrapper = document.getElementById("sandboxFrameWrapper");
    const btns = document.querySelectorAll(".device-btn");
    btns.forEach(b => b.classList.remove("active-device", "bg-indigo-600", "text-white"));

    const activeBtn = document.getElementById(`deviceBtn-${mode}`);
    if (activeBtn) activeBtn.classList.add("active-device", "bg-indigo-600", "text-white");

    if (!iframeWrapper) return;
    if (mode === "desktop") {
        iframeWrapper.style.width = "100%";
    } else if (mode === "tablet") {
        iframeWrapper.style.width = "768px";
    } else if (mode === "mobile") {
        iframeWrapper.style.width = "375px";
    }
}

function runSandboxCode() {
    const iframe = document.getElementById("sandboxIframe");
    if (!iframe) return;

    let html = currentSandboxCode || "";

    // If it's not a full HTML document, wrap it
    if (!html.includes("<html") && !html.includes("<!DOCTYPE")) {
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 1.5rem; background: #0f172a; color: #f8fafc; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    } else {
        // Auto-inject Tailwind and Icons if missing
        if (!html.includes("tailwindcss") && !html.includes("tailwind.min.css")) {
            if (html.includes("<head>")) {
                html = html.replace("<head>", '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
            } else {
                html = `<script src="https://cdn.tailwindcss.com"></script>\n` + html;
            }
        }
        if (!html.includes("font-awesome") && !html.includes("fontawesome")) {
            if (html.includes("</head>")) {
                html = html.replace("</head>", '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n</head>');
            }
        }
    }

    iframe.srcdoc = html;
}

function downloadSandboxHtml() {
    const blob = new Blob([currentSandboxCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-artifact-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copySandboxCode() {
    navigator.clipboard.writeText(currentSandboxCode);
    showToast(typeof t === 'function' ? t("copied") : "Kopyalandı!");
}

// 1-Click Live Deploy to World via Cloudflare Tunnel
async function publishCurrentArtifact() {
    if (!currentSandboxCode) {
        showToast("Yayınlanacak kod bulunamadı!");
        return;
    }
    await publishDirectCode(currentSandboxCode);
}

async function publishDirectCode(code) {
    const cleanCode = (code || "").trim();
    if (!cleanCode) {
        showToast("Yayınlanacak HTML kodu boş olamaz!");
        return;
    }

    const btn = document.getElementById("publishArtifactBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Yayınlanıyor...</span>';
    }

    try {
        // Extract title if available
        let appTitle = "Nexus AI Generated App";
        const titleMatch = cleanCode.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            appTitle = titleMatch[1].trim();
        }

        const res = await fetch("/api/deploy/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                html: cleanCode,
                title: appTitle
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();
        lastPublishData = data;
        openPublishModal(data);
        showToast("🚀 Projeniz başarıyla dünyaya yayınlandı!");

    } catch (e) {
        console.error("Publish error:", e);
        alert(`Yayınlama sırasında hata oluştu: ${e.message}`);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-globe text-xs"></i> <span>Dünyaya Aç / Paylaş</span>';
        }
    }
}

function openPublishModal(data) {
    let modal = document.getElementById("publishSuccessModal");
    if (!modal) {
        createPublishModalElement();
        modal = document.getElementById("publishSuccessModal");
    }

    const pubUrl = data.public_url || data.local_url;
    const localUrl = data.local_url || `http://${window.location.hostname}:3050${data.local_path}`;

    document.getElementById("publishModalTitle").textContent = data.title || "Nexus Web Uygulaması";
    document.getElementById("publishPublicUrlInput").value = pubUrl;
    document.getElementById("publishLocalUrlInput").value = localUrl;
    
    // Status text & badge
    const statusText = document.getElementById("publishStatusBadge");
    if (statusText) {
        if (data.tunnel_active) {
            statusText.className = "px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5";
            statusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Cloudflare Canlı Tünel Aktif';
        } else {
            statusText.className = "px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full text-xs font-bold flex items-center gap-1.5";
            statusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Yerel Ağ & Web Aktif';
        }
    }

    // QR Code
    const qrImg = document.getElementById("publishQrCodeImg");
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pubUrl)}`;
    }

    // Open button link
    const openBtn = document.getElementById("publishOpenNewTabBtn");
    if (openBtn) {
        openBtn.href = pubUrl;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closePublishModal() {
    const modal = document.getElementById("publishSuccessModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function copyPublishUrl(type) {
    const inputId = type === 'public' ? 'publishPublicUrlInput' : 'publishLocalUrlInput';
    const input = document.getElementById(inputId);
    if (input) {
        navigator.clipboard.writeText(input.value);
        showToast("Bağlantı panoya kopyalandı!");
    }
}

function createPublishModalElement() {
    const div = document.createElement("div");
    div.id = "publishSuccessModal";
    div.className = "fixed inset-0 bg-slate-950/85 backdrop-blur-2xl hidden z-50 items-center justify-center p-4";
    div.innerHTML = `
        <div class="w-full max-w-xl bg-[#0c121e] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 text-base font-black shadow-lg shadow-emerald-500/25">
                        <i class="fa-solid fa-globe"></i>
                    </div>
                    <div>
                        <div class="font-black text-sm text-white flex items-center gap-2">
                            <span>🚀 Projeniz Dünyaya Açıldı!</span>
                        </div>
                        <div id="publishModalTitle" class="text-xs text-slate-400 font-mono">Nexus Web App</div>
                    </div>
                </div>
                <button onclick="closePublishModal()" class="p-2 text-slate-400 hover:text-white rounded-xl text-sm transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <!-- Status Indicator -->
            <div class="flex items-center justify-between">
                <div id="publishStatusBadge" class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Canlı Yayın Aktif
                </div>
                <div class="text-[11px] text-slate-400 font-mono">SSL / HTTPS Korumalı</div>
            </div>

            <!-- Link Details & QR Container -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5 items-center">
                <!-- QR Box -->
                <div class="flex flex-col items-center justify-center p-2 bg-white rounded-xl">
                    <img id="publishQrCodeImg" src="" alt="QR Code" class="w-28 h-28 object-contain">
                    <span class="text-[10px] text-slate-800 font-bold mt-1">Telefondan Tara</span>
                </div>

                <!-- URLs Box -->
                <div class="md:col-span-2 space-y-3 text-xs">
                    <!-- Public Cloudflare URL -->
                    <div>
                        <label class="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                            <i class="fa-solid fa-earth-americas"></i> <span>Genel İnternet Bağlantısı (Dünya Erişimi)</span>
                        </label>
                        <div class="flex gap-1.5">
                            <input type="text" id="publishPublicUrlInput" readonly class="flex-1 p-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-emerald-200 font-mono text-[11px] focus:outline-none select-all">
                            <button onclick="copyPublishUrl('public')" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 transition-all" title="Kopyala">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Local Network URL -->
                    <div>
                        <label class="font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                            <i class="fa-solid fa-network-wired"></i> <span>Yerel Ağ (LAN) Bağlantısı</span>
                        </label>
                        <div class="flex gap-1.5">
                            <input type="text" id="publishLocalUrlInput" readonly class="flex-1 p-2 bg-slate-950 border border-white/10 rounded-xl text-slate-300 font-mono text-[11px] focus:outline-none select-all">
                            <button onclick="copyPublishUrl('local')" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1 transition-all" title="Kopyala">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Action Buttons -->
            <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                <div class="text-[11px] text-slate-500">Bu bağlantıyı herkesle paylaşabilirsiniz.</div>
                <div class="flex items-center gap-2">
                    <button onclick="closePublishModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
                        Kapat
                    </button>
                    <a id="publishOpenNewTabBtn" href="#" target="_blank" class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all">
                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> <span>Yeni Sekmede Aç</span>
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(div);
}

// Global scope window exports
window.openSandbox = openSandbox;
window.closeSandbox = closeSandbox;
window.setDeviceMode = setDeviceMode;
window.runSandboxCode = runSandboxCode;
window.downloadSandboxHtml = downloadSandboxHtml;
window.copySandboxCode = copySandboxCode;
window.publishCurrentArtifact = publishCurrentArtifact;
window.publishDirectCode = publishDirectCode;
window.openPublishModal = openPublishModal;
window.closePublishModal = closePublishModal;
window.copyPublishUrl = copyPublishUrl;

