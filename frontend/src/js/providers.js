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

function getProviderHeaders() {
    return {
        "x-provider": activeProvider,
        "x-api-key": localStorage.getItem(`nexus_key_${activeProvider}`) || localStorage.getItem(`nexus_${activeProvider}_key`) || "",
        "x-custom-url": localStorage.getItem(`nexus_url_${activeProvider}`) || ""
    };
}

function initProviderSelector() {
    const provSelect = document.getElementById("providerSelect");
    if (provSelect) {
        provSelect.value = activeProvider;
    }
}

async function fetchModelsForActiveProvider() {
    const select = document.getElementById("modelSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Modeller yükleniyor...</option>';
    initProviderSelector();

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
