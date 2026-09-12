// Nexus AI Studio — Internationalization (i18n) Engine (TR / EN)
const TRANSLATIONS = {
    tr: {
        app_title: "Nexus AI Studio",
        new_chat: "Yeni Sohbet",
        search_chats: "Sohbetlerde ara...",
        history_title: "Geçmiş Sohbetler",
        settings: "Ayarlar",
        provider: "Sağlayıcı",
        model: "Model",
        system_prompt: "Sistem Promptu / Persona",
        voice_chat: "Sesli Konuşma",
        voice_start: "Sesle Yazdır",
        voice_listening: "Dinleniyor...",
        input_placeholder: "Bir mesaj yazın veya kod/proje isteyin... (Shift+Enter yeni satır)",
        send: "Gönder",
        stop: "Durdur",
        clear_history: "Sohbeti Temizle",
        export_chat: "Sohbeti İndir (JSON)",
        live_preview: "Canlı Önizle",
        copy_code: "Kopyala",
        copied: "Kopyalandı!",
        sandbox_title: "⚡ Canlı Artifact Sandbox",
        sandbox_desc: "Üretilen HTML/CSS/JS kodunu canlı çalıştırın ve test edin",
        device_desktop: "Masaüstü",
        device_tablet: "Tablet",
        device_mobile: "Mobil",
        download_html: "HTML İndir",
        refresh: "Yenile",
        fullscreen: "Tam Ekran",
        close: "Kapat",
        settings_title: "Nexus AI Studio Ayarları",
        api_keys_desc: "API anahtarlarınız yalnızca yerel tarayıcınızda (LocalStorage) saklanır, üçüncü taraflara iletilmez.",
        ollama_url: "Ollama URL (Yerel GPU)",
        gemini_key: "Google Gemini API Key (Pro / Flash)",
        openai_key: "OpenAI API Key (GPT-4o)",
        groq_key: "Groq API Key (300+ tok/s)",
        anthropic_key: "Anthropic API Key (Claude)",
        custom_endpoint: "Özel OpenAI-Uyumlu Endpoint",
        save_settings: "Ayarları Kaydet",
        saved_success: "Ayarlar başarıyla kaydedildi!",
        thinking: "Akıl Yürütme (Düşünce Süreci)",
        tokens: "Token",
        speed: "Hız",
        latency: "Gecikme",
        presets_title: "Öne Çıkan Rol Şablonları"
    },
    en: {
        app_title: "Nexus AI Studio",
        new_chat: "New Chat",
        search_chats: "Search chats...",
        history_title: "Recent Chats",
        settings: "Settings",
        provider: "Provider",
        model: "Model",
        system_prompt: "System Prompt / Persona",
        voice_chat: "Voice Chat",
        voice_start: "Voice Input",
        voice_listening: "Listening...",
        input_placeholder: "Type a message or describe a website/app to build... (Shift+Enter for newline)",
        send: "Send",
        stop: "Stop",
        clear_history: "Clear Chat",
        export_chat: "Export Chat (JSON)",
        live_preview: "Live Preview",
        copy_code: "Copy",
        copied: "Copied!",
        sandbox_title: "⚡ Live Artifact Sandbox",
        sandbox_desc: "Run, interact with, and test generated HTML/CSS/JS apps live",
        device_desktop: "Desktop",
        device_tablet: "Tablet",
        device_mobile: "Mobile",
        download_html: "Download HTML",
        refresh: "Refresh",
        fullscreen: "Fullscreen",
        close: "Close",
        settings_title: "Nexus AI Studio Settings",
        api_keys_desc: "Your API keys are stored locally in your browser (LocalStorage) and never sent to 3rd parties.",
        ollama_url: "Ollama URL (Local GPU)",
        gemini_key: "Google Gemini API Key (Pro / Flash)",
        openai_key: "OpenAI API Key (GPT-4o)",
        groq_key: "Groq API Key (300+ tok/s)",
        anthropic_key: "Anthropic API Key (Claude)",
        custom_endpoint: "Custom OpenAI-Compatible Endpoint",
        save_settings: "Save Settings",
        saved_success: "Settings saved successfully!",
        thinking: "Reasoning & Thought Process",
        tokens: "Tokens",
        speed: "Speed",
        latency: "Latency",
        presets_title: "Featured Personas & Prompts"
    }
};

let currentLang = localStorage.getItem("nexus_lang") || "tr";

function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || (TRANSLATIONS["en"][key]) || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("nexus_lang", lang);
    applyTranslations();
}

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (key) el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (key) el.placeholder = t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        if (key) el.title = t(key);
    });

    const flagBtn = document.getElementById("langToggleBtn");
    if (flagBtn) {
        flagBtn.innerHTML = currentLang === "tr" 
            ? `<span class="text-sm">🇹🇷</span><span class="font-bold text-xs">TR</span>`
            : `<span class="text-sm">🇬🇧</span><span class="font-bold text-xs">EN</span>`;
    }
}
