// Nexus AI Studio — Multi-Provider API Connector
const PROVIDERS = {
    ollama: { name: "Ollama (Local GPU)", icon: "fa-solid fa-server", requiresKey: false },
    gemini: { name: "Google Gemini (Pro/Flash)", icon: "fa-brands fa-google", requiresKey: true },
    openai: { name: "OpenAI (GPT-4o)", icon: "fa-solid fa-brain", requiresKey: true },
    groq: { name: "Groq (Ultra Fast)", icon: "fa-solid fa-bolt", requiresKey: true },
    anthropic: { name: "Anthropic (Claude)", icon: "fa-solid fa-robot", requiresKey: true },
    custom: { name: "Custom Endpoint", icon: "fa-solid fa-link", requiresKey: false }
};

let activeProvider = localStorage.getItem("nexus_provider") || "ollama";
let activeModel = localStorage.getItem("nexus_model") || "qwen2.5-coder:7b";

function getProviderHeaders() {
    return {
        "x-provider": activeProvider,
        "x-api-key": localStorage.getItem(`nexus_key_${activeProvider}`) || "",
        "x-custom-url": localStorage.getItem(`nexus_url_${activeProvider}`) || ""
    };
}

async function fetchModelsForActiveProvider() {
    const select = document.getElementById("modelSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Yükleniyor...</option>';

    try {
        const res = await fetch("/api/models", {
            headers: getProviderHeaders()
        });
        const data = await res.json();
        
        select.innerHTML = "";
        if (data.models && data.models.length > 0) {
            data.models.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m.id;
                opt.textContent = m.name;
                if (m.id === activeModel) opt.selected = true;
                select.appendChild(opt);
            });
            activeModel = select.value;
            localStorage.setItem("nexus_model", activeModel);
        } else {
            select.innerHTML = '<option value="default">Model bulunamadı</option>';
        }
    } catch (e) {
        console.error("Fetch models error:", e);
        select.innerHTML = '<option value="default">Bağlantı hatası</option>';
    }
}
