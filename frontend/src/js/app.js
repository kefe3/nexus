// Nexus AI Studio — Main Controller Engine
let currentChatId = null;
let chatsHistory = JSON.parse(localStorage.getItem("nexus_chats") || "[]");
let currentMessages = [];
let activeAbortController = null;
let currentPersonaPrompt = "";

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    initChatInterface();
    loadPresets();
    fetchModelsForActiveProvider();
});

function initChatInterface() {
    renderChatsList();
    if (chatsHistory.length > 0) {
        loadChat(chatsHistory[0].id);
    } else {
        createNewChat();
    }

    const input = document.getElementById("promptInput");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener("input", () => autoResizeInput(input));
    }
}

function autoResizeInput(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
}

function createNewChat() {
    currentChatId = "chat_" + Date.now();
    currentMessages = [];
    renderMessages();
    
    const input = document.getElementById("promptInput");
    if (input) {
        input.value = "";
        input.focus();
    }
}

function renderChatsList() {
    const list = document.getElementById("chatsHistoryList");
    if (!list) return;

    list.innerHTML = "";
    chatsHistory.forEach(chat => {
        const item = document.createElement("div");
        const isActive = chat.id === currentChatId;
        item.className = `group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
            isActive ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        }`;
        item.innerHTML = `
            <div class="flex items-center gap-2 truncate" onclick="loadChat('${chat.id}')">
                <i class="fa-regular fa-message text-[10px]"></i>
                <span class="truncate">${chat.title || "Yeni Sohbet"}</span>
            </div>
            <button onclick="deleteChat('${chat.id}', event)" class="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 text-slate-500 transition-opacity">
                <i class="fa-solid fa-trash-can text-[10px]"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    const chat = chatsHistory.find(c => c.id === id);
    if (chat) {
        currentMessages = chat.messages || [];
    }
    renderChatsList();
    renderMessages();
}

function deleteChat(id, e) {
    if (e) e.stopPropagation();
    chatsHistory = chatsHistory.filter(c => c.id !== id);
    localStorage.setItem("nexus_chats", JSON.stringify(chatsHistory));
    if (currentChatId === id) {
        if (chatsHistory.length > 0) loadChat(chatsHistory[0].id);
        else createNewChat();
    } else {
        renderChatsList();
    }
}

function renderMessages() {
    const container = document.getElementById("messagesContainer");
    const welcome = document.getElementById("welcomeHero");
    if (!container) return;

    if (currentMessages.length === 0) {
        container.innerHTML = "";
        if (welcome) welcome.classList.remove("hidden");
        return;
    }

    if (welcome) welcome.classList.add("hidden");
    container.innerHTML = "";

    currentMessages.forEach((msg, idx) => {
        const isUser = msg.role === "user";
        const div = document.createElement("div");
        div.className = `flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`;

        if (isUser) {
            div.innerHTML = `
                <div class="max-w-2xl bg-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-sm text-sm shadow-md font-medium leading-relaxed">
                    ${escapeHtml(msg.content)}
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg text-white text-xs font-black">
                    <i class="fa-solid fa-bolt"></i>
                </div>
                <div class="max-w-3xl glass-panel p-4 rounded-2xl rounded-tl-sm text-sm text-slate-100 shadow-xl space-y-2 markdown-body overflow-x-auto w-full">
                    ${renderMarkdown(msg.content)}
                </div>
            `;
        }
        container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
    highlightCodeBlocks();
}

async function sendMessage() {
    const input = document.getElementById("promptInput");
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = "";
    input.style.height = "auto";

    currentMessages.push({ role: "user", content: userText });
    renderMessages();

    // Auto title chat
    let chatObj = chatsHistory.find(c => c.id === currentChatId);
    if (!chatObj) {
        chatObj = { id: currentChatId, title: userText.slice(0, 30), messages: currentMessages, timestamp: Date.now() };
        chatsHistory.unshift(chatObj);
    } else {
        chatObj.messages = currentMessages;
    }
    localStorage.setItem("nexus_chats", JSON.stringify(chatsHistory));
    renderChatsList();

    // Create assistant message container
    const container = document.getElementById("messagesContainer");
    const aiDiv = document.createElement("div");
    aiDiv.className = "flex gap-3.5 justify-start animate-fade-in";
    aiDiv.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg text-white text-xs font-black">
            <i class="fa-solid fa-bolt"></i>
        </div>
        <div class="max-w-3xl glass-panel p-4 rounded-2xl rounded-tl-sm text-sm text-slate-100 shadow-xl space-y-2 markdown-body overflow-x-auto w-full" id="streamingTarget">
            <span class="streaming-cursor"></span>
        </div>
    `;
    container.appendChild(aiDiv);
    container.scrollTop = container.scrollHeight;

    const target = document.getElementById("streamingTarget");
    let fullResponse = "";

    activeAbortController = new AbortController();
    toggleStopButton(true);

    const historyPayload = [];
    if (currentPersonaPrompt) {
        historyPayload.push({ role: "system", content: currentPersonaPrompt });
    }
    historyPayload.push(...currentMessages);

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getProviderHeaders()
            },
            body: JSON.stringify({
                model: activeModel,
                messages: historyPayload,
                stream: true
            }),
            signal: activeAbortController.signal
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]") continue;
                    try {
                        const parsed = jsonParseSafe(dataStr);
                        if (parsed && parsed.content) {
                            fullResponse += parsed.content;
                            target.innerHTML = renderMarkdown(fullResponse) + '<span class="streaming-cursor"></span>';
                            container.scrollTop = container.scrollHeight;
                        } else if (parsed && parsed.error) {
                            fullResponse += `\n\n> ❌ **Hata:** ${parsed.error}`;
                            target.innerHTML = renderMarkdown(fullResponse);
                        }
                    } catch (e) {}
                }
            }
        }

        target.innerHTML = renderMarkdown(fullResponse);
        highlightCodeBlocks();
        currentMessages.push({ role: "assistant", content: fullResponse });
        chatObj.messages = currentMessages;
        localStorage.setItem("nexus_chats", JSON.stringify(chatsHistory));

    } catch (e) {
        if (e.name === "AbortError") {
            target.innerHTML = renderMarkdown(fullResponse) + '<span class="text-amber-400 text-xs italic block mt-2"> (Durduruldu)</span>';
        } else {
            target.innerHTML = `<span class="text-rose-400">❌ İstek Başarısız: ${e.message}</span>`;
        }
    } finally {
        toggleStopButton(false);
        activeAbortController = null;
    }
}

function stopStreaming() {
    if (activeAbortController) {
        activeAbortController.abort();
    }
}

function toggleStopButton(isStreaming) {
    const sendBtn = document.getElementById("sendBtn");
    const stopBtn = document.getElementById("stopBtn");
    if (!sendBtn || !stopBtn) return;

    if (isStreaming) {
        sendBtn.classList.add("hidden");
        stopBtn.classList.remove("hidden");
    } else {
        sendBtn.classList.remove("hidden");
        stopBtn.classList.add("hidden");
    }
}

function renderMarkdown(raw) {
    if (!raw) return "";

    // Parse <think> reasoning tags
    let processed = raw;
    processed = processed.replace(/<think>([\s\S]*?)<\/think>/gi, (match, thinkContent) => {
        return `<details class="thinking-box" open>
            <summary class="font-bold cursor-pointer text-indigo-300 flex items-center gap-1.5 select-none mb-1">
                <i class="fa-solid fa-brain text-xs"></i> <span>${t("thinking")}</span>
            </summary>
            <div class="mt-1 text-slate-300 leading-relaxed font-mono text-xs whitespace-pre-wrap">${escapeHtml(thinkContent.trim())}</div>
        </details>`;
    });

    if (window.marked) {
        return window.marked.parse(processed);
    }
    return escapeHtml(processed).replace(/\n/g, "<br>");
}

function highlightCodeBlocks() {
    document.querySelectorAll("pre code").forEach(block => {
        if (window.hljs) window.hljs.highlightElement(block);

        // Add Live Preview & Copy header if not already added
        const pre = block.parentElement;
        if (pre && !pre.querySelector(".code-header")) {
            const lang = block.className.replace("hljs language-", "").replace("language-", "").trim();
            const code = block.textContent;

            const header = document.createElement("div");
            header.className = "code-header flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-white/10 text-slate-400 text-xs font-mono rounded-t-xl";
            
            const isWeb = ["html", "javascript", "js", "svg"].includes(lang) || code.includes("<!DOCTYPE") || code.includes("<html") || code.includes("<body");
            
            header.innerHTML = `
                <span class="font-bold uppercase text-[11px] text-indigo-400">${lang || "CODE"}</span>
                <div class="flex items-center gap-2">
                    ${isWeb ? `
                        <button onclick="publishDirectCode(decodeURIComponent('${encodeURIComponent(code)}'))" class="px-2 py-0.5 rounded bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all" title="Tek tıkla internete ve canlı dünyaya aç">
                            <i class="fa-solid fa-globe text-[9px]"></i> <span>Dünyaya Aç</span>
                        </button>
                        <button onclick="openSandbox(decodeURIComponent('${encodeURIComponent(code)}'))" class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 transition-all">
                            <i class="fa-solid fa-play text-[9px]"></i> <span>${t("live_preview")}</span>
                        </button>
                    ` : ""}
                    <button onclick="copyCodeFromBlock(this)" class="hover:text-white transition-colors text-[11px] flex items-center gap-1">
                        <i class="fa-regular fa-copy"></i> <span>${t("copy_code")}</span>
                    </button>
                </div>
            `;
            pre.insertBefore(header, block);
            pre.className = "rounded-xl border border-white/10 overflow-hidden bg-slate-950/80 my-3";
        }
    });
}

function copyCodeFromBlock(btn) {
    const pre = btn.closest("pre");
    const code = pre ? pre.querySelector("code") : null;
    if (code) {
        navigator.clipboard.writeText(code.textContent);
        btn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> <span>${t("copied")}</span>`;
        setTimeout(() => {
            btn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>${t("copy_code")}</span>`;
        }, 2000);
    }
}

async function loadPresets() {
    try {
        const res = await fetch("/api/presets");
        const data = await res.json();
        const container = document.getElementById("presetsCarousel");
        if (!container || !data.presets) return;

        container.innerHTML = "";
        data.presets.forEach(p => {
            const card = document.createElement("div");
            card.className = "shrink-0 w-64 glass-panel p-3.5 rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:scale-[1.02] transition-all space-y-1.5";
            card.onclick = () => selectPreset(p);
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <i class="${p.icon} text-indigo-400 text-sm"></i>
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">${p.badge}</span>
                </div>
                <div class="font-bold text-xs text-white">${currentLang === "tr" ? p.title_tr : p.title}</div>
                <div class="text-[11px] text-slate-400 line-clamp-2">${currentLang === "tr" ? p.desc_tr : p.desc_en}</div>
            `;
            container.appendChild(card);
        });
    } catch (e) {}
}

function selectPreset(preset) {
    currentPersonaPrompt = preset.prompt;
    showToast(`${preset.title} persona seçildi!`);
    const badge = document.getElementById("activePersonaBadge");
    if (badge) {
        badge.textContent = currentLang === "tr" ? preset.title_tr : preset.title;
        badge.classList.remove("hidden");
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsonParseSafe(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
}

function showToast(msg) {
    const toast = document.getElementById("toastNotification");
    const text = document.getElementById("toastText");
    if (!toast || !text) return;
    text.textContent = msg;
    toast.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
    toast.classList.add("opacity-100", "translate-y-0");
    setTimeout(() => {
        toast.classList.remove("opacity-100", "translate-y-0");
        toast.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
    }, 2500);
}
