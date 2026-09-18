// Nexus AI Studio — Admin & Control Panel Engine
let metricsInterval = null;

function openControlPanel() {
    const modal = document.getElementById("controlPanelModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    refreshControlPanel();
    if (!metricsInterval) {
        metricsInterval = setInterval(refreshControlPanel, 4000);
    }
}

function closeControlPanel() {
    const modal = document.getElementById("controlPanelModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (metricsInterval) {
        clearInterval(metricsInterval);
        metricsInterval = null;
    }
}

async function refreshControlPanel() {
    await Promise.all([loadSystemMetrics(), loadProvidersHealth()]);
}

async function loadSystemMetrics() {
    try {
        const res = await fetch("/api/stats/system");
        if (!res.ok) return;
        const data = await res.json();
        const sys = data.system;

        // CPU
        const cpuText = document.getElementById("metricCpuText");
        const cpuBar = document.getElementById("metricCpuBar");
        if (cpuText) cpuText.textContent = `${sys.cpu_usage_percent}% (${sys.cpu_cores} Cores)`;
        if (cpuBar) cpuBar.style.width = `${Math.min(sys.cpu_usage_percent, 100)}%`;

        // RAM
        const ramText = document.getElementById("metricRamText");
        const ramBar = document.getElementById("metricRamBar");
        if (ramText) ramText.textContent = `${sys.ram_used_gb} GB / ${sys.ram_total_gb} GB (${sys.ram_percent}%)`;
        if (ramBar) ramBar.style.width = `${sys.ram_percent}%`;

        // Disk
        const diskText = document.getElementById("metricDiskText");
        const diskBar = document.getElementById("metricDiskBar");
        if (diskText) diskText.textContent = `${sys.disk_used_gb} GB / ${sys.disk_total_gb} GB (${sys.disk_percent}%)`;
        if (diskBar) diskBar.style.width = `${sys.disk_percent}%`;

        // Uptime & OS
        const uptimeEl = document.getElementById("metricUptime");
        const osEl = document.getElementById("metricOs");
        if (uptimeEl) uptimeEl.textContent = sys.uptime_formatted;
        if (osEl) osEl.textContent = `${sys.platform} (${sys.arch})`;

    } catch (e) {
        console.error("Metrics load error:", e);
    }
}

async function loadProvidersHealth() {
    try {
        const headers = {
            "x-ollama-url": localStorage.getItem("nexus_url_ollama") || "",
            "x-gemini-key": localStorage.getItem("nexus_key_gemini") || "",
            "x-openai-key": localStorage.getItem("nexus_key_openai") || "",
            "x-groq-key": localStorage.getItem("nexus_key_groq") || ""
        };
        const res = await fetch("/api/stats/providers", { headers });
        if (!res.ok) return;
        const data = await res.json();
        const provs = data.providers;

        const grid = document.getElementById("providersStatusGrid");
        if (!grid) return;

        grid.innerHTML = `
            <!-- Ollama Card -->
            <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${provs.ollama?.online ? 'border-emerald-500/40' : 'border-slate-800'} space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-white flex items-center gap-1.5"><i class="fa-solid fa-server text-emerald-400"></i> Ollama (Local)</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${provs.ollama?.online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
                        ${provs.ollama?.online ? `Online (${provs.ollama.latency_ms}ms)` : 'Offline'}
                    </span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">
                    ${provs.ollama?.online ? `${provs.ollama.models_count} yerel model hazır` : 'Bağlantı bekleniyor'}
                </div>
            </div>

            <!-- Gemini Card -->
            <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${provs.gemini?.configured ? 'border-cyan-500/40' : 'border-slate-800'} space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-white flex items-center gap-1.5"><i class="fa-brands fa-google text-cyan-400"></i> Google Gemini</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${provs.gemini?.configured ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}">
                        ${provs.gemini?.status}
                    </span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">Gemini 2.0 Flash & Pro (1M+ ctx)</div>
            </div>

            <!-- OpenAI Card -->
            <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${provs.openai?.configured ? 'border-indigo-500/40' : 'border-slate-800'} space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-white flex items-center gap-1.5"><i class="fa-solid fa-brain text-indigo-400"></i> OpenAI</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${provs.openai?.configured ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}">
                        ${provs.openai?.status}
                    </span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">GPT-4o, o3-mini, o1</div>
            </div>

            <!-- Groq Card -->
            <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${provs.groq?.configured ? 'border-amber-500/40' : 'border-slate-800'} space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-white flex items-center gap-1.5"><i class="fa-solid fa-bolt text-amber-400"></i> Groq LPU</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${provs.groq?.configured ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}">
                        ${provs.groq?.status}
                    </span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">Llama 3.3 70B @ 300+ tok/s</div>
            </div>
        `;

    } catch (e) {}
}
