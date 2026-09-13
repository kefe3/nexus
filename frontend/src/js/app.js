// Nexus AI Studio — Main Controller Engine
let currentChatId = null;
let chatsHistory = JSON.parse(localStorage.getItem("nexus_chats") || "[]");
let currentMessages = [];
let activeAbortController = null;
let currentPersonaPrompt = "";
let isArenaMode = false;
let workspaceFiles = [];

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

function toggleArenaMode() {
    isArenaMode = !isArenaMode;
    const btn = document.getElementById("arenaModeBtn");
    const container = document.getElementById("modelSelect2Container");
    if (btn) {
        if (isArenaMode) {
            btn.classList.add("bg-amber-500/20", "text-amber-300", "border-amber-500/40");
            btn.classList.remove("bg-slate-900", "text-slate-300");
        } else {
            btn.classList.remove("bg-amber-500/20", "text-amber-300", "border-amber-500/40");
            btn.classList.add("bg-slate-900", "text-slate-300");
        }
    }
    if (container) {
        if (isArenaMode) {
            container.classList.remove("hidden");
            container.classList.add("flex");
        } else {
            container.classList.add("hidden");
            container.classList.remove("flex");
        }
    }
    if (typeof showToast === "function") {
        showToast(isArenaMode ? "⚔️ Arena Modu Aktif (İkili Model Yarışı)" : "Standart Tek Model Modu");
    }
}

function handleWorkspaceFilesUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
            if (typeof showToast === "function") showToast(`${file.name} çok büyük (maks 2MB)`);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            workspaceFiles.push({
                name: file.name,
                size: file.size,
                content: content
            });
            renderWorkspaceFiles();
            if (typeof showToast === "function") showToast(`${file.name} projenize eklendi!`);
        };
        reader.readAsText(file);
    });
}

function removeWorkspaceFile(index) {
    workspaceFiles.splice(index, 1);
    renderWorkspaceFiles();
}

function renderWorkspaceFiles() {
    const list = document.getElementById("workspaceFilesList");
    if (!list) return;
    if (workspaceFiles.length === 0) {
        list.innerHTML = '<div class="text-[11px] text-slate-500 italic px-1">Henüz dosya eklenmedi</div>';
        return;
    }
    list.innerHTML = "";
    workspaceFiles.forEach((file, idx) => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-white/5 text-[11px]";
        item.innerHTML = `
            <span class="truncate font-mono text-indigo-300 max-w-[170px]" title="${file.name}">📄 ${file.name}</span>
            <button onclick="removeWorkspaceFile(${idx})" class="text-slate-500 hover:text-rose-400 px-1"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(item);
    });
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

function getSessionId() {
    let sid = localStorage.getItem("nexus_session_id");
    if (!sid) {
        sid = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        localStorage.setItem("nexus_session_id", sid);
    }
    return sid;
}

async function syncChatsWithServer() {
    try {
        const res = await fetch("/api/chats", {
            headers: { "X-Session-ID": getSessionId() }
        });
        const data = await res.json();
        if (data.status === "ok" && data.chats && data.chats.length > 0) {
            chatsHistory = data.chats;
            localStorage.setItem("nexus_chats", JSON.stringify(chatsHistory));
            renderChatsList();
            if (!currentChatId || !chatsHistory.find(c => c.id === currentChatId)) {
                loadChat(chatsHistory[0].id);
            }
        }
    } catch (e) {
        console.warn("Server chat sync skipped:", e);
    }
}

async function persistChatToServer(chatObj) {
    if (!chatObj) return;
    try {
        await fetch("/api/chats", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Session-ID": getSessionId()
            },
            body: JSON.stringify(chatObj)
        });
    } catch (e) {}
}

function loadChat(chatId) {
    const chat = chatsHistory.find(c => c.id === chatId);
    if (!chat) return;
    currentChatId = chat.id;
    currentMessages = chat.messages || [];
    renderMessages();
}

function deleteChat(e, chatId) {
    e.stopPropagation();
    chatsHistory = chatsHistory.filter(c => c.id !== chatId);
    localStorage.setItem("nexus_chats", JSON.stringify(chatsHistory));
    
    if (currentChatId === chatId) {
        if (chatsHistory.length > 0) {
            loadChat(chatsHistory[0].id);
        } else {
            createNewChat();
        }
    } else {
        renderChatsList();
    }
}

function renderChatsList() {
    const list = document.getElementById("chatsHistoryList");
    if (!list) return;
    list.innerHTML = "";

    const search = (document.getElementById("searchChatInput")?.value || "").toLowerCase();

    chatsHistory.forEach(c => {
        if (search && !c.title.toLowerCase().includes(search)) return;

        const active = c.id === currentChatId;
        const item = document.createElement("div");
        item.className = `group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs font-medium ${active ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`;
        item.onclick = () => loadChat(c.id);

        item.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <i class="fa-regular fa-message text-[11px] ${active ? 'text-indigo-400' : 'text-slate-500'}"></i>
                <span class="truncate">${escapeHtml(c.title || 'Yeni Sohbet')}</span>
            </div>
            <button onclick="deleteChat(event, '${c.id}')" class="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-all">
                <i class="fa-solid fa-trash-can text-[10px]"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

function renderMessages() {
    const container = document.getElementById("messagesContainer");
    const hero = document.getElementById("welcomeHero");
    if (!container) return;

    if (currentMessages.length === 0) {
        container.innerHTML = "";
        if (hero) hero.classList.remove("hidden");
        return;
    }

    if (hero) hero.classList.add("hidden");
    container.innerHTML = "";

    currentMessages.forEach(m => {
        const isUser = m.role === "user";
        const div = document.createElement("div");
        div.className = `flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`;

        if (isUser) {
            div.innerHTML = `
                <div class="max-w-2xl bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm shadow-xl space-y-1">
                    <p class="whitespace-pre-wrap leading-relaxed">${escapeHtml(m.content)}</p>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg text-white text-xs font-black">
                    <i class="fa-solid fa-bolt"></i>
                </div>
                <div class="max-w-3xl glass-panel p-4 rounded-2xl rounded-tl-sm text-sm text-slate-100 shadow-xl space-y-2 markdown-body overflow-x-auto w-full">
                    ${renderMarkdown(m.content)}
                </div>
            `;
        }
        container.appendChild(div);
    });

    highlightCodeBlocks();
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById("promptInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    autoResizeInput(input);

    let chatObj = chatsHistory.find(c => c.id === currentChatId);
    if (!chatObj) {
        chatObj = {
            id: currentChatId,
            title: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
            messages: []
        };
        chatsHistory.unshift(chatObj);
    }

    currentMessages.push({ role: "user", content: text });
    renderMessages();
    renderChatsList();

    const container = document.getElementById("messagesContainer");
    const aiDiv = document.createElement("div");
    aiDiv.className = "flex gap-3.5 justify-start animate-fade-in";

    if (isArenaMode) {
        const m2Name = typeof activeModel2 !== "undefined" ? activeModel2 : activeModel;
        aiDiv.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg text-white text-xs font-black">
                <i class="fa-solid fa-swords"></i>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                <div class="glass-panel p-4 rounded-2xl text-sm space-y-2 border-indigo-500/30 flex flex-col justify-between">
                    <div class="text-xs font-bold text-indigo-400 border-b border-white/5 pb-2 flex items-center justify-between">
                        <span>🤖 Model 1: ${escapeHtml(activeModel)}</span>
                    </div>
                    <div id="streamingTarget1" class="markdown-body flex-1 overflow-x-auto"><span class="streaming-cursor"></span></div>
                </div>
                <div class="glass-panel p-4 rounded-2xl text-sm space-y-2 border-amber-500/30 flex flex-col justify-between">
                    <div class="text-xs font-bold text-amber-400 border-b border-white/5 pb-2 flex items-center justify-between">
                        <span>⚡ Model 2: ${escapeHtml(m2Name)}</span>
                    </div>
                    <div id="streamingTarget2" class="markdown-body flex-1 overflow-x-auto"><span class="streaming-cursor"></span></div>
                </div>
            </div>
        `;
    } else {
        aiDiv.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg text-white text-xs font-black">
                <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="max-w-3xl glass-panel p-4 rounded-2xl rounded-tl-sm text-sm text-slate-100 shadow-xl space-y-2 markdown-body overflow-x-auto w-full" id="streamingTarget">
                <span class="streaming-cursor"></span>
            </div>
        `;
    }

    container.appendChild(aiDiv);
    container.scrollTop = container.scrollHeight;

    activeAbortController = new AbortController();
    toggleStopButton(true);

    const historyPayload = [];
    if (currentPersonaPrompt) {
        historyPayload.push({ role: "system", content: currentPersonaPrompt });
    }

    if (workspaceFiles.length > 0) {
        let wsText = "YÜKLENEN PROJE DOSYALARI VE KOD BAĞLAMI:\n\n";
        workspaceFiles.forEach(f => {
            wsText += `--- DOSYA: ${f.name} ---\n${f.content}\n\n`;
        });
        historyPayload.push({ role: "system", content: wsText });
    }

    historyPayload.push(...currentMessages);

    if (isArenaMode) {
        let full1 = "", full2 = "";
        const target1 = document.getElementById("streamingTarget1");
        const target2 = document.getElementById("streamingTarget2");
        const m2Name = typeof activeModel2 !== "undefined" ? activeModel2 : activeModel;

        const streamCall = async (modelName, targetEl, callback) => {
            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getProviderHeaders() },
                    body: JSON.stringify({
                        model: modelName,
                        messages: historyPayload,
                        temperature: parseFloat(localStorage.getItem("nexus_temperature") || "0.7"),
                        stream: true
                    }),
                    signal: activeAbortController.signal
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let acc = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split("\n")) {
                        if (line.startsWith("data: ")) {
                            const dataStr = line.slice(6).trim();
                            if (dataStr === "[DONE]") continue;
                            const parsed = jsonParseSafe(dataStr);
                            if (parsed && parsed.content) {
                                acc += parsed.content;
                                targetEl.innerHTML = renderMarkdown(acc) + '<span class="streaming-cursor"></span>';
                                container.scrollTop = container.scrollHeight;
                            }
                        }
                    }
                }
                targetEl.innerHTML = renderMarkdown(acc);
                callback(acc);
            } catch (e) {
                targetEl.innerHTML = `<span class="text-rose-400">❌ ${e.message}</span>`;
                callback(`❌ Hata: ${e.message}`);
            }
        };

        try {
            await Promise.all([
                streamCall(activeModel, target1, r => full1 = r),
                streamCall(m2Name, target2, r => full2 = r)
            ]);
            highlightCodeBlocks();
            const combinedResp = `**[⚔️ Arena Sonuçları]**\n\n### 🤖 Model 1 (${activeModel}):\n${full1}\n\n---\n\n### ⚡ Model 2 (${m2Name}):\n${full2}`;
            currentMessages.push({ role: "assistant", content: combinedResp });
            chatObj.messages = currentMessages;
            localStorage.setItem("nexus_chats", JSON.stringify(chatsHistory));
        } finally {
            toggleStopButton(false);
            activeAbortController = null;
        }
    } else {
        const target = document.getElementById("streamingTarget");
        let fullResponse = "";
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
                    temperature: parseFloat(localStorage.getItem("nexus_temperature") || "0.7"),
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

function renderMarkdown(text) {
    if (typeof marked !== "undefined") {
        return marked.parse(text || "");
    }
    return escapeHtml(text || "");
}

function highlightCodeBlocks() {
    if (typeof hljs === "undefined") return;

    document.querySelectorAll("pre code").forEach(block => {
        if (!block.dataset.highlighted) {
            hljs.highlightElement(block);
            block.dataset.highlighted = "true";

            const pre = block.parentElement;
            if (pre && !pre.querySelector(".code-header")) {
                const header = document.createElement("div");
                header.className = "code-header flex items-center justify-between px-4 py-1.5 bg-slate-900/90 border-b border-white/10 text-xs text-slate-400 font-mono select-none rounded-t-xl";
                
                const lang = (block.className.match(/language-(\w+)/) || [])[1] || "code";
                header.innerHTML = `
                    <span class="font-bold text-indigo-400">${lang.toUpperCase()}</span>
                    <div class="flex items-center gap-2">
                        ${(lang === 'html' || lang === 'js' || lang === 'css') ? `
                            <button class="btn-open-sandbox hover:text-emerald-400 transition-all flex items-center gap-1 font-bold">
                                <i class="fa-solid fa-play text-[10px]"></i> <span>Canlı Çalıştır</span>
                            </button>
                        ` : ''}
                        <button class="btn-copy-code hover:text-white transition-all flex items-center gap-1">
                            <i class="fa-regular fa-copy text-[10px]"></i> <span>Kopyala</span>
                        </button>
                    </div>
                `;
                pre.insertBefore(header, block);
            }

            const sandboxBtn = block.parentElement.querySelector(".btn-open-sandbox");
            if (sandboxBtn) {
                sandboxBtn.onclick = (e) => {
                    e.preventDefault();
                    if (typeof openSandbox === "function") openSandbox(block.textContent);
                };
            }
            const copyBtn = block.parentElement.querySelector(".btn-copy-code");
            if (copyBtn) {
                copyBtn.onclick = (e) => {
                    e.preventDefault();
                    copyCodeFromBlock(copyBtn);
                };
            }
        }
    });
}

function copyCodeFromBlock(btn) {
    const pre = btn.closest("pre");
    const code = pre ? pre.querySelector("code") : null;
    if (code) {
        navigator.clipboard.writeText(code.textContent);
        btn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> <span>Kopyalandı!</span>`;
        setTimeout(() => {
            btn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>Kopyala</span>`;
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
                <div class="font-bold text-xs text-white">${p.title_tr || p.title}</div>
                <div class="text-[11px] text-slate-400 line-clamp-2">${p.desc_tr || p.desc_en}</div>
            `;
            container.appendChild(card);
        });
    } catch (e) {}
}

function selectPreset(preset) {
    currentPersonaPrompt = preset.prompt;
    if (typeof showToast === "function") showToast(`${preset.title} persona seçildi!`);
    const badge = document.getElementById("activePersonaBadge");
    if (badge) {
        badge.textContent = preset.title_tr || preset.title;
        badge.classList.remove("hidden");
    }
}

function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

// Global scope window exports
window.toggleArenaMode = toggleArenaMode;
window.handleWorkspaceFilesUpload = handleWorkspaceFilesUpload;
window.removeWorkspaceFile = removeWorkspaceFile;
