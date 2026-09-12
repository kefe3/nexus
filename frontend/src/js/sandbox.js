// Nexus AI Studio — Live Artifact Execution Sandbox
let currentSandboxCode = "";
let currentDeviceMode = "desktop";

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

    let html = currentSandboxCode;

    // Auto-inject Tailwind and Icons if missing
    if (!html.includes("tailwindcss") && !html.includes("tailwind.min.css")) {
        if (html.includes("<head>")) {
            html = html.replace("<head>", '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
        }
    }
    if (!html.includes("font-awesome") && !html.includes("fontawesome")) {
        if (html.includes("</head>")) {
            html = html.replace("</head>", '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n</head>');
        }
    }

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
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
    showToast(t("copied"));
}
