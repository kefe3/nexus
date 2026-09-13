// Nexus AI Studio — Multi-Provider API Connector with Dynamic Server Sync

const PROVIDERS = {
    ollama: { name: "Ollama (Yerel GPU)", icon: "fa-solid fa-server", requiresKey: false },
    gemini: { name: "Google Gemini", icon: "fa-brands fa-google", requiresKey: true },
    openai: { name: "OpenAI (GPT-4o)", icon: "fa-solid fa-brain", requiresKey: true },
    groq: { name: "Groq (Ultra Hızlı)", icon: "fa-solid fa-bolt", requiresKey: true },
    anthropic: { name: "Anthropic (Claude)", icon: "fa-solid fa-robot", requiresKey: true },
    custom: { name: "Özel Uç Nokta", icon: "fa-solid fa-link", requiresKey: false }
};

let serverProvidersConfig = {};
let activeProvider = localStorage.getItem("nexus_provider") || "ollama";
let activeModel = localStorage.getItem(`nexus_model_${activeProvider}`) || "";

async function fetchServerSettingsForProviders() {
    try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.status === "ok" && data.providers) {
            serverProvidersConfig = data.providers;

            // Two-way sync: If local browser has a key that server doesn't, sync it to server
            const keyProviders = ['gemini', 'openai', 'groq', 'anthropic'];
            for (const p of keyProviders) {
                const localKey = (localStorage.getItem(`nexus_key_${p}`) || localStorage.getItem(`nexus_${p}_key`) || "").trim();
                if (localKey && (!serverProvidersConfig[p] || !serverProvidersConfig[p].configured)) {
                    await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ provider: p, api_key: localKey })
                    }).catch(() => {});
                    if (serverProvidersConfig[p]) {
                        serverProvidersConfig[p].configured = true;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch server settings for providers:", e);
    }
}

function isProviderConfigured(prov) {
    if (prov === "ollama") return true;
    
    // Check server-side configured state first
    if (serverProvidersConfig[prov] && serverProvidersConfig[prov].configured) {
        return true;
    }
    
    // Check local client storage
    if (prov === "custom") {
        return !!(localStorage.getItem("nexus_url_custom") || "").trim();
    }
    const key = (localStorage.getItem(`nexus_key_${prov}`) || localStorage.getItem(`nexus_${prov}_key`) || "").trim();
    return !!key;
}

function getProviderHeaders() {
    const headers = {
        "x-provider": activeProvider
    };
    
    const clientKey = localStorage.getItem(`nexus_key_${activeProvider}`) || localStorage.getItem(`nexus_${activeProvider}_key`) || "";
    if (clientKey) {
        headers["x-api-key"] = clientKey;
    }
    
    const clientUrl = localStorage.getItem(`nexus_url_${activeProvider}`) || "";
    if (clientUrl) {
        headers["x-custom-url"] = clientUrl;
    }
    
    return headers;
}

async function initProviderSelector() {
    await fetchServerSettingsForProviders();
    const provSelect = document.getElementById("providerSelect");
    if (!provSelect) return;

    provSelect.innerHTML = "";
    Object.keys(PROVIDERS).forEach(key => {
        const p = PROVIDERS[key];
        const ready = isProviderConfigured(key);
        const opt = document.createElement("option");
        opt.value = key;
        opt.className = "bg-slate-900 text-white";
        
        if (ready) {
            opt.textContent = `${p.name} (Hazır)`;
            opt.disabled = false;
        } else {
            opt.textContent = `🔒 ${p.name} (Key Gerekli)`;
            opt.disabled = true;
            opt.style.color = "#64748b";
        }
        provSelect.appendChild(opt);
    });

    if (!isProviderConfigured(activeProvider)) {
        activeProvider = "ollama";
        localStorage.setItem("nexus_provider", "ollama");
    }

    provSelect.value = activeProvider;
}

let activeModel2 = localStorage.getItem("nexus_model2") || "";

function switchModel2(val) {
    activeModel2 = val;
    localStorage.setItem("nexus_model2", val);
}

async function fetchModelsForActiveProvider() {
    const select = document.getElementById("modelSelect");
    const select2 = document.getElementById("modelSelect2");
    if (!select) return;

    await initProviderSelector();
    select.innerHTML = '<option value="">Modeller yükleniyor...</option>';
    if (select2) select2.innerHTML = '<option value="">Modeller yükleniyor...</option>';

    try {
        const res = await fetch("/api/models", {
            headers: getProviderHeaders()
        });
        const data = await res.json();
        
        select.innerHTML = "";
        if (select2) select2.innerHTML = "";

        if (data.models && data.models.length > 0) {
            let savedModel = localStorage.getItem(`nexus_model_${activeProvider}`) || "";
            let savedModel2 = localStorage.getItem("nexus_model2") || "";
            
            if (activeProvider === "gemini" && (savedModel.includes("gemini-2.") || savedModel.includes("gemini-1."))) {
                savedModel = "gemini-3.6-flash";
            }

            let found = false;
            let found2 = false;
            data.models.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m.id;
                opt.textContent = m.name;
                if (m.id === savedModel) {
                    opt.selected = true;
                    found = true;
                }
                select.appendChild(opt);

                if (select2) {
                    const opt2 = document.createElement("option");
                    opt2.value = m.id;
                    opt2.textContent = m.name;
                    if (m.id === savedModel2) {
                        opt2.selected = true;
                        found2 = true;
                    }
                    select2.appendChild(opt2);
                }
            });

            if (!found && select.options.length > 0) {
                select.options[0].selected = true;
            }
            if (select2 && !found2 && select2.options.length > 1) {
                select2.options[1].selected = true;
            }

            activeModel = select.value;
            if (select2) activeModel2 = select2.value;
            localStorage.setItem(`nexus_model_${activeProvider}`, activeModel);
            localStorage.setItem("nexus_model", activeModel);
            if (select2) localStorage.setItem("nexus_model2", activeModel2);
        } else {
            select.innerHTML = '<option value="default">Model bulunamadı</option>';
            if (select2) select2.innerHTML = '<option value="default">Model bulunamadı</option>';
        }
    } catch (e) {
        console.error("Fetch models error:", e);
        select.innerHTML = '<option value="default">Bağlantı hatası</option>';
        if (select2) select2.innerHTML = '<option value="default">Bağlantı hatası</option>';
    }
}

function switchProvider(prov) {
    if (!isProviderConfigured(prov)) {
        if (typeof openSettingsModal === "function") openSettingsModal();
        if (typeof showToast === "function") showToast("Lütfen önce bu sağlayıcı için API anahtarınızı girin.");
        initProviderSelector();
        return;
    }
    activeProvider = prov;
    localStorage.setItem("nexus_provider", prov);
    activeModel = localStorage.getItem(`nexus_model_${prov}`) || "";
    fetchModelsForActiveProvider();
}

function switchModel(model) {
    activeModel = model;
    localStorage.setItem(`nexus_model_${activeProvider}`, model);
    localStorage.setItem("nexus_model", model);
}

let activeTemperature = parseFloat(localStorage.getItem("nexus_temperature") || "0.7");

function updateTemperature(val) {
    activeTemperature = parseFloat(val);
    localStorage.setItem("nexus_temperature", val);
    const el = document.getElementById("tempVal");
    if (el) el.textContent = val;
}

document.addEventListener("DOMContentLoaded", async () => {
    await initProviderSelector();
    const tempSlider = document.getElementById("tempSlider");
    if (tempSlider) {
        tempSlider.value = activeTemperature;
        const el = document.getElementById("tempVal");
        if (el) el.textContent = activeTemperature;
    }
});

