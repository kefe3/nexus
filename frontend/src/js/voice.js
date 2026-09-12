// Nexus AI Studio — Web Speech Engine
let isListening = false;
let recognitionInstance = null;

function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = currentLang === "tr" ? "tr-TR" : "en-US";

    rec.onstart = () => {
        isListening = true;
        updateVoiceUI(true);
    };

    rec.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        const promptInput = document.getElementById("promptInput");
        if (promptInput && transcript) {
            promptInput.value = transcript;
            autoResizeInput(promptInput);
        }
    };

    rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        stopVoice();
    };

    rec.onend = () => {
        stopVoice();
    };

    return rec;
}

function toggleVoice() {
    if (isListening) {
        stopVoice();
    } else {
        startVoice();
    }
}

function startVoice() {
    if (!recognitionInstance) recognitionInstance = initVoiceRecognition();
    if (!recognitionInstance) {
        alert("Tarayıcınız sesli konuşmayı desteklemiyor. Chrome/Edge önerilir.");
        return;
    }
    recognitionInstance.lang = currentLang === "tr" ? "tr-TR" : "en-US";
    try {
        recognitionInstance.start();
    } catch (e) {}
}

function stopVoice() {
    isListening = false;
    updateVoiceUI(false);
    if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch (e) {}
    }
}

function updateVoiceUI(active) {
    const btn = document.getElementById("voiceInputBtn");
    if (!btn) return;
    if (active) {
        btn.classList.add("bg-rose-500", "text-white", "animate-pulse");
        btn.classList.remove("text-slate-400");
    } else {
        btn.classList.remove("bg-rose-500", "text-white", "animate-pulse");
        btn.classList.add("text-slate-400");
    }
}
