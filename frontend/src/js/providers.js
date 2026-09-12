// Nexus AI Studio — Multi-Provider API Connector

const PROVIDERS = {
    ollama: { name: "Ollama (Yerel GPU)", icon: "fa-solid fa-server", requiresKey: false },
    gemini: { name: "Google Gemini", icon: "fa-brands fa-google", requiresKey: true },
    openai: { name: "OpenAI (GPT-4o)", icon: "fa-solid fa-brain", requiresKey: true },
    groq: { name: "Groq (Ultra Hızlı)", icon: "fa-solid fa-bolt", requiresKey: true },
    anthropic: { name: "Anthropic (Claude)", icon: "fa-solid fa-robot", requiresKey: true },
    custom: { name: "Özel Uç Nokta", icon: "fa-solid fa-link", requiresKey: false }
};

let activeProvider = localStorage.getItem("nexus_provider") || "ollama";
let activeModel = localStorage.getItem(`nexus_model_${activeProvider}`) || "";

function isProviderConfigured(prov) {
    if (prov === "ollama") return true;
    if (prov === "custom") {
        return !!(localStorage.getItem("nexus_url_custom") || "").trim();
    }
    const key = (localStorage.getItem(`nexus_key_${prov}`) || localStorage.getItem(`nexus_${prov}_key`) || "").trim();
    return !!key;
}

function getProviderHeaders() {
    return {
        "x-provider": activeProvider,
        "x-api-key": localStorage.getItem(`nexus_key_${activeProvider}`) || localStorage.getItem(`nexus_${activeProvider}_key`) || "",
        "x-custom-url": localStorage.getItem(`nexus_url_${activeProvider}`) || ""
    };
}

function initProviderSelector() {
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

    // If currently selected provider lacks API key, fallback to ollama or first ready provider
    if (!isProviderConfigured(activeProvider)) {
        activeProvider = "ollama";
        localStorage.setItem("nexus_provider", "ollama");
    }

    provSelect.value = activeProvider;
}

async function fetchModelsForActiveProvider() {
    const select = document.getElementById("modelSelect");
    if (!select) return;

    initProviderSelector();
    select.innerHTML = '<option value="">Modeller yükleniyor...</option>';

    try {
        const res = await fetch("/api/models", {
            headers: getProviderHeaders()
        });
        const data = await res.json();
        
        select.innerHTML = "";
        if (data.models && data.models.length > 0) {
            let savedModel = localStorage.getItem(`nexus_model_${activeProvider}`) || "";
            
            // Auto clean obsolete model names
            if (activeProvider === "gemini" && (savedModel.includes("gemini-2.") || savedModel.includes("gemini-1."))) {
                savedModel = "gemini-3.6-flash";
            }

            let found = false;
            data.models.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m.id;
                opt.textContent = m.name;
                if (m.id === savedModel) {
                    opt.selected = true;
                    found = true;
                }
                select.appendChild(opt);
            });

            if (!found && select.options.length > 0) {
                select.options[0].selected = true;
            }

            activeModel = select.value;
            localStorage.setItem(`nexus_model_${activeProvider}`, activeModel);
            localStorage.setItem("nexus_model", activeModel);
        } else {
            select.innerHTML = '<option value="default">Model bulunamadı</option>';
        }
    } catch (e) {
        console.error("Fetch models error:", e);
        select.innerHTML = '<option value="default">Bağlantı hatası</option>';
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

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
    initProviderSelector();
});
