// Nexus AI Studio — Admin Control Panel v2.0 Engine

const API_BASE = '/api';
let telemetryChart = null;
let chartLabels = [];
let cpuData = [];
let ramData = [];

// Initialize Telemetry Chart
function initTelemetryChart() {
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;

    telemetryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'CPU Kullanımı (%)',
                    data: cpuData,
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0, 242, 254, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointBackgroundColor: '#00f2fe'
                },
                {
                    label: 'RAM Kullanımı (%)',
                    data: ramData,
                    borderColor: '#8a2be2',
                    backgroundColor: 'rgba(138, 43, 226, 0.06)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointBackgroundColor: '#8a2be2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' } }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' } }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#cbd5e1', font: { size: 11, family: 'Plus Jakarta Sans', weight: 'bold' } }
                }
            }
        }
    });
}

// Switch Navigation Section
function switchSection(secId) {
    document.querySelectorAll('.cp-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.cp-section').forEach(el => el.classList.remove('active'));

    const activeNav = Array.from(document.querySelectorAll('.cp-nav-item')).find(el => 
        el.getAttribute('onclick') && el.getAttribute('onclick').includes(secId)
    );
    if (activeNav) activeNav.classList.add('active');

    const targetSec = document.getElementById(`sec-${secId}`);
    if (targetSec) targetSec.classList.add('active');

    if (secId === 'overview') fetchOverview();
    if (secId === 'specs') fetchSpecs();
    if (secId === 'system') checkUpdates();
    if (secId === 'vram') fetchRunningModels();
    if (secId === 'models') fetchInstalledModels();
    if (secId === 'benchmark') populateBenchmarkModels();
    if (secId === 'deployments') fetchDeployments();
    if (secId === 'providers') testAllProviders();
    if (secId === 'logs') fetchLogs();
}

// Fetch Overview System Metrics
async function fetchOverview() {
    try {
        const res = await fetch(`${API_BASE}/admin/overview`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.status === 'ok') {
            const h = data.hardware;
            const s = data.server;
            const a = data.ai_cluster;

            // CPU
            document.getElementById('val-cpu').textContent = `${h.cpu_percent}%`;
            document.getElementById('val-cpu-cores').textContent = `${h.cpu_cores} Çekirdek (${h.cpu_freq_mhz} MHz)`;
            document.getElementById('bar-cpu').style.width = `${Math.min(100, h.cpu_percent)}%`;
            document.getElementById('badge-cpu-load').textContent = `${h.cpu_percent}%`;

            // RAM
            document.getElementById('val-ram').textContent = `${h.ram_percent}%`;
            document.getElementById('val-ram-detail').textContent = `${h.ram_used_gb} GB / ${h.ram_total_gb} GB`;
            document.getElementById('bar-ram').style.width = `${Math.min(100, h.ram_percent)}%`;

            // Disk
            document.getElementById('val-disk').textContent = `${h.disk_percent}%`;
            document.getElementById('val-disk-detail').textContent = `${h.disk_used_gb} GB / ${h.disk_total_gb} GB`;
            document.getElementById('bar-disk').style.width = `${Math.min(100, h.disk_percent)}%`;

            // AI Cluster
            document.getElementById('val-models-count').textContent = a.ollama_models_count;
            document.getElementById('badge-models-count').textContent = a.ollama_models_count;
            document.getElementById('badge-vram-count').textContent = `${a.ollama_active_vram_models || 0} Aktif`;
            document.getElementById('val-ollama-status').textContent = a.ollama_status === 'online' ? 'Ollama GPU Aktif (2ms)' : 'Ollama Bağlantısı Yok';

            // Server details
            document.getElementById('val-uptime').textContent = `Çalışma Süresi: ${s.uptime_formatted}`;
            document.getElementById('val-os').textContent = s.os;
            document.getElementById('val-hostname').textContent = s.hostname;
            document.getElementById('val-python').textContent = `Python ${s.python_version}`;
            document.getElementById('val-net').textContent = `⬇ ${h.net_recv_mb} MB | ⬆ ${h.net_sent_mb} MB`;
            
            document.getElementById('server-ping-text').textContent = `Server Online (${data.timestamp.split(' ')[1]})`;

            // Update Chart
            if (data.telemetry_history && telemetryChart) {
                chartLabels.length = 0;
                cpuData.length = 0;
                ramData.length = 0;
                data.telemetry_history.forEach(pt => {
                    chartLabels.push(pt.time);
                    cpuData.push(pt.cpu);
                    ramData.push(pt.ram);
                });
                telemetryChart.update();
            }
        }
    } catch (e) {
        console.error('Error fetching overview:', e);
        document.getElementById('server-ping-text').textContent = 'Server Bağlantı Hatası';
    }
}

function getOllamaHeaders() {
    const customUrl = localStorage.getItem('nexus_ollama_url') || localStorage.getItem('nexus_custom_url') || '';
    return customUrl ? { 'x-ollama-url': customUrl } : {};
}

// Fetch Running VRAM Models
async function fetchRunningModels() {
    const tbody = document.getElementById('vram-models-tbody');
    try {
        const res = await fetch(`${API_BASE}/admin/models/running`, {
            headers: getOllamaHeaders()
        });
        const data = await res.json();
        tbody.innerHTML = '';

        if (data.running_models && data.running_models.length > 0) {
            document.getElementById('badge-vram-count').textContent = `${data.running_models.length} Aktif`;
            data.running_models.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge-model"><i class="fa-solid fa-cube"></i> ${m.name}</span></td>
                    <td><span class="badge-size" style="background: rgba(0,245,160,0.15); color: var(--accent-green);">${m.size_vram_gb} GB VRAM</span></td>
                    <td><span class="badge-size">${m.size_total_gb} GB</span></td>
                    <td style="color: #94a3b8; font-size: 0.8rem;">${m.expires_at ? m.expires_at.split('T')[1].slice(0,8) : 'Süresiz'}</td>
                    <td style="text-align: right;">
                        <button class="btn-danger" onclick="unloadModel('${m.name}')">
                            <i class="fa-solid fa-eject"></i> VRAM'den Çıkar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Şu an VRAM'e yüklü model yok (İlk istekte otomatik yüklenir).</td></tr>`;
            document.getElementById('badge-vram-count').textContent = '0 Aktif';
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--accent-red);">VRAM modelleri alınamadı: ${e.message}</td></tr>`;
    }
}

// Unload Model from VRAM
async function unloadModel(name) {
    try {
        const res = await fetch(`${API_BASE}/admin/models/unload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getOllamaHeaders() },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            fetchRunningModels();
        }
    } catch (e) {
        alert(`Hata: ${e.message}`);
    }
}

// Fetch Installed Models from Ollama
async function fetchInstalledModels() {
    const tbody = document.getElementById('installed-models-tbody');
    try {
        const res = await fetch(`${API_BASE}/admin/models`, {
            headers: getOllamaHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.models && data.models.length > 0) {
            const countStr = `${data.models.length} Model`;
            const badge1 = document.getElementById('installed-count-badge');
            const badge2 = document.getElementById('tab-installed-count');
            const badgeNav = document.getElementById('badge-models-count');
            if (badge1) badge1.textContent = countStr;
            if (badge2) badge2.textContent = data.models.length;
            if (badgeNav) badgeNav.textContent = data.models.length;

            data.models.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge-model"><i class="fa-solid fa-cube"></i> ${m.name}</span></td>
                    <td><span class="badge-size">${m.parameter_size !== 'N/A' ? m.parameter_size : ''} (${m.size_gb} GB)</span></td>
                    <td><code style="font-size: 0.78rem; color: #a5b4fc;">${m.quantization_level}</code></td>
                    <td style="color: #94a3b8; font-size: 0.8rem;">${m.format.toUpperCase()}</td>
                    <td style="text-align: right;">
                        <button class="btn-danger" onclick="deleteModel('${m.name}')">
                            <i class="fa-solid fa-trash"></i> Sil
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Yüklü model bulunamadı veya Ollama çevrimdışı.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--accent-red);">Modeller alınırken hata oluştu: ${e.message}</td></tr>`;
    }
}

function setPullName(name) {
    document.getElementById('input-pull-name').value = name;
}

// Pull New Model
async function pullModel() {
    const input = document.getElementById('input-pull-name');
    const modelName = input.value.trim();
    if (!modelName) return;

    const btn = document.getElementById('btn-pull-submit');
    const statusBox = document.getElementById('pull-status-box');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İndiriliyor...';
    statusBox.style.display = 'block';
    statusBox.style.background = 'rgba(0, 242, 254, 0.1)';
    statusBox.style.color = 'var(--accent-cyan)';
    statusBox.textContent = `'${modelName}' indiriliyor, lütfen bekleyin (model boyutuna göre birkaç dakika sürebilir)...`;

    try {
        const res = await fetch(`${API_BASE}/admin/models/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getOllamaHeaders() },
            body: JSON.stringify({ name: modelName })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            statusBox.style.background = 'rgba(0, 245, 160, 0.15)';
            statusBox.style.color = 'var(--accent-green)';
            statusBox.textContent = `✅ Başarılı: ${data.message}`;
            input.value = '';
            fetchInstalledModels();
            fetchRunningModels();
        } else {
            throw new Error(data.message || 'İndirme başarısız');
        }
    } catch (e) {
        statusBox.style.background = 'rgba(255, 65, 108, 0.15)';
        statusBox.style.color = 'var(--accent-red)';
        statusBox.textContent = `❌ Hata: ${e.message}`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-download"></i> İndir';
    }
}

// Delete Model
async function deleteModel(name) {
    if (!confirm(`'${name}' modelini sunucudan silmek istediğinizden emin misiniz?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/models/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...getOllamaHeaders() },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            fetchInstalledModels();
            fetchRunningModels();
        } else {
            alert(`Hata: ${data.message}`);
        }
    } catch (e) {
        alert(`Silinemedi: ${e.message}`);
    }
}

// Populate Benchmark Dropdown
async function populateBenchmarkModels() {
    const select = document.getElementById('bench-model-select');
    try {
        const res = await fetch(`${API_BASE}/admin/models`, {
            headers: getOllamaHeaders()
        });
        const data = await res.json();
        select.innerHTML = '<option value="">Model Seçin...</option>';
        if (data.models) {
            data.models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.textContent = `${m.name} (${m.size_gb} GB)`;
                select.appendChild(opt);
            });
        }
    } catch (e) {}
}

// Run Benchmark
async function runBenchmark() {
    const model = document.getElementById('bench-model-select').value;
    const prompt = document.getElementById('bench-prompt-input').value.trim();
    if (!model) {
        alert('Lütfen test edilecek bir model seçin');
        return;
    }

    const btn = document.getElementById('btn-bench-run');
    const container = document.getElementById('bench-result-container');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Test Ediliyor...';

    try {
        const res = await fetch(`${API_BASE}/admin/benchmark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'ollama', model, prompt })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            container.style.display = 'block';
            document.getElementById('bench-tok-sec').textContent = `${data.tokens_per_second} tok/s`;
            document.getElementById('bench-total-time').textContent = `${data.total_time_ms} ms`;
            document.getElementById('bench-total-tokens').textContent = data.tokens_generated;
            document.getElementById('bench-preview-text').textContent = data.output_preview;
        } else {
            alert(`Benchmark Hatası: ${data.message}`);
        }
    } catch (e) {
        alert(`Hata: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Hız Testini Başlat';
    }
}

// Test Provider
async function testProvider(prov) {
    const resBox = document.getElementById(`test-result-${prov}`);
    if (resBox) resBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Test ediliyor...';

    const input = document.getElementById(`input-api-${prov}`);
    let apiKey = input ? input.value.trim() : '';
    if (!apiKey) {
        apiKey = localStorage.getItem(`nexus_key_${prov}`) || localStorage.getItem(`nexus_${prov}_key`) || '';
        if (input && apiKey) input.value = apiKey;
    } else {
        // Automatically persist key
        localStorage.setItem(`nexus_key_${prov}`, apiKey);
        localStorage.setItem(`nexus_${prov}_key`, apiKey);
    }

    try {
        const res = await fetch(`${API_BASE}/admin/providers/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: prov, api_key: apiKey })
        });
        const data = await res.json();

        if (data.status === 'ok') {
            resBox.innerHTML = `<span style="color: var(--accent-green); font-weight: 600;">🟢 ${data.message} (${data.latency_ms}ms)</span>`;
        } else {
            resBox.innerHTML = `<span style="color: var(--accent-red); font-weight: 600;">🔴 ${data.message}</span>`;
        }
    } catch (e) {
        if (resBox) resBox.innerHTML = `<span style="color: var(--accent-red); font-weight: 600;">🔴 Bağlantı Hatası: ${e.message}</span>`;
    }
}

async function testAllProviders() {
    await fetchServerSettingsForAdmin();
    ['ollama', 'gemini', 'openai', 'groq'].forEach(p => {
        const key = localStorage.getItem(`nexus_key_${p}`) || localStorage.getItem(`nexus_${p}_key`);
        const input = document.getElementById(`input-api-${p}`);
        if (input && key) input.value = key;
        testProvider(p);
    });
}

async function saveKey(prov, val) {
    const clean = val.trim();
    localStorage.setItem(`nexus_key_${prov}`, clean);
    localStorage.setItem(`nexus_${prov}_key`, clean);
    
    try {
        await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: prov, api_key: clean })
        });
    } catch (e) {}

    testProvider(prov);
}

async function fetchServerSettingsForAdmin() {
    try {
        const res = await fetch(`${API_BASE}/settings`);
        const data = await res.json();
        if (data.status === 'ok' && data.providers) {
            ['gemini', 'openai', 'groq', 'anthropic'].forEach(p => {
                const info = data.providers[p];
                const input = document.getElementById(`input-api-${p}`);
                if (input && !input.value) {
                    if (localStorage.getItem(`nexus_key_${p}`)) {
                        input.value = localStorage.getItem(`nexus_key_${p}`);
                    } else if (info && info.has_key && info.key_preview) {
                        input.placeholder = `Sunucuda Kayıtlı (${info.key_preview})`;
                    }
                }
            });
        }
    } catch (e) {}
}

// Fetch Request Logs
async function fetchLogs() {
    const term = document.getElementById('log-terminal-output');
    try {
        const res = await fetch(`${API_BASE}/admin/logs`);
        const data = await res.json();
        if (data.status === 'ok' && data.logs && data.logs.length > 0) {
            term.innerHTML = '';
            data.logs.forEach(l => {
                const line = document.createElement('div');
                line.className = 'log-line';
                line.innerHTML = `
                    <span class="log-time">[${l.timestamp}]</span>
                    <span class="log-tag ${l.status}">${l.status.toUpperCase()}</span>
                    <span>Sağlayıcı: <strong>${l.provider}</strong> | Model: <code>${l.model}</code> | Gecikme: <strong>${l.latency_ms}ms</strong> | Hız: <strong>${l.tok_per_sec || 0} tok/s</strong></span>
                    ${l.error ? `<span style="color: var(--accent-red); margin-left: 8px;">(${l.error})</span>` : ''}
                `;
                term.appendChild(line);
            });
        }
    } catch (e) {
        console.error('Error fetching logs:', e);
    }
}

// Live Deployments & Cloudflare Tunnel Management
// Live Deployments & Cloudflare Tunnel Management
async function fetchDeployments() {
    const tbody = document.getElementById('deployments-tbody');
    const pill = document.getElementById('tunnel-status-pill');
    const studioInput = document.getElementById('admin-studio-remote-url');
    const studioLink = document.getElementById('admin-studio-remote-link');
    const cpInput = document.getElementById('admin-cp-remote-url');
    const cpLink = document.getElementById('admin-cp-remote-link');
    const qrImg = document.getElementById('admin-remote-qr-img');
    const checkbox = document.getElementById('tunnel-toggle-checkbox');
    const sliderSpan = document.getElementById('tunnel-slider-span');
    const btnAction = document.getElementById('btn-tunnel-action');
    const btnActionText = document.getElementById('btn-tunnel-action-text');
    const iconBox = document.getElementById('tunnel-icon-box');

    try {
        const res = await fetch(`${API_BASE}/deploy/studio-tunnel`);
        const data = await res.json();
        const resList = await fetch(`${API_BASE}/deploy/list`);
        const dataList = await resList.json();

        // Update tunnel status & Remote URLs
        if (data.active && data.public_studio_url) {
            if (pill) {
                pill.className = 'status-pill';
                pill.style.background = 'rgba(0, 245, 160, 0.12)';
                pill.style.borderColor = 'rgba(0, 245, 160, 0.3)';
                pill.style.color = 'var(--accent-green)';
                pill.innerHTML = '<span class="pulse-dot"></span> Canlı Dış Tünel Açık (Yayında)';
            }

            if (checkbox) checkbox.checked = true;
            if (sliderSpan) {
                sliderSpan.style.background = 'linear-gradient(135deg, #00f5a0, #00f2fe)';
                sliderSpan.style.boxShadow = '0 0 12px rgba(0, 245, 160, 0.4)';
            }
            if (btnAction) {
                btnAction.style.background = 'rgba(255, 65, 108, 0.2)';
                btnAction.style.color = '#ff4b2b';
                btnAction.style.border = '1px solid rgba(255, 65, 108, 0.4)';
            }
            if (btnActionText) btnActionText.textContent = 'Dış Erişimi Kapat';
            if (iconBox) {
                iconBox.style.background = 'linear-gradient(135deg, rgba(0, 245, 160, 0.2), rgba(0, 242, 254, 0.2))';
                iconBox.style.borderColor = 'rgba(0, 245, 160, 0.4)';
                iconBox.style.color = 'var(--accent-green)';
            }

            if (studioInput) studioInput.value = data.public_studio_url;
            if (studioLink) {
                studioLink.href = data.public_studio_url;
                studioLink.style.display = 'inline-flex';
            }

            if (cpInput) cpInput.value = data.public_admin_url;
            if (cpLink) {
                cpLink.href = data.public_admin_url;
                cpLink.style.display = 'inline-flex';
            }

            if (qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.public_studio_url)}`;
                qrImg.style.opacity = '1';
                qrImg.style.filter = 'none';
            }
        } else {
            if (pill) {
                pill.className = 'status-pill';
                pill.style.background = 'rgba(255, 65, 108, 0.12)';
                pill.style.borderColor = 'rgba(255, 65, 108, 0.3)';
                pill.style.color = 'var(--accent-red)';
                pill.innerHTML = '<i class="fa-solid fa-lock"></i> Dış Erişim Kapalı (Yalnızca Yerel LAN)';
            }

            if (checkbox) checkbox.checked = false;
            if (sliderSpan) {
                sliderSpan.style.background = '#334155';
                sliderSpan.style.boxShadow = 'none';
            }
            if (btnAction) {
                btnAction.style.background = 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))';
                btnAction.style.color = '#04060c';
                btnAction.style.border = 'none';
            }
            if (btnActionText) btnActionText.textContent = 'Dış Erişimi Aç';
            if (iconBox) {
                iconBox.style.background = 'rgba(255, 255, 255, 0.05)';
                iconBox.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                iconBox.style.color = '#94a3b8';
            }

            if (studioInput) studioInput.value = '🔒 Dış erişim kapalı (Açmak için butona basın)';
            if (cpInput) cpInput.value = '🔒 Dış erişim kapalı (Açmak için butona basın)';
            if (studioLink) studioLink.style.display = 'none';
            if (cpLink) cpLink.style.display = 'none';

            if (qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin)}`;
                qrImg.style.opacity = '0.35';
                qrImg.style.filter = 'grayscale(100%)';
            }
        }

        // Render table
        tbody.innerHTML = '';
        if (dataList.deployments && dataList.deployments.length > 0) {
            document.getElementById('deploy-table-count-badge').textContent = `${dataList.deployments.length} Proje`;
            document.getElementById('badge-deployments-count').textContent = dataList.deployments.length;

            dataList.deployments.forEach(d => {
                const tr = document.createElement('tr');
                const sizeKb = round((d.size_bytes || 0) / 1024, 1);
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 700; color: #fff;">${escapeHtml(d.title || 'Nexus Web App')}</div>
                        <div style="font-size: 0.75rem; color: #64748b; font-family: 'JetBrains Mono', monospace;">ID: ${d.id}</div>
                    </td>
                    <td>
                        <a href="${d.public_url}" target="_blank" style="color: var(--accent-green); text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-earth-americas text-xs"></i> <span>${d.public_url}</span>
                        </a>
                    </td>
                    <td>
                        <a href="${d.local_url}" target="_blank" style="color: var(--accent-cyan); text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">
                            ${d.local_url}
                        </a>
                    </td>
                    <td><span class="badge-size">${sizeKb} KB</span></td>
                    <td style="color: #94a3b8; font-size: 0.8rem;">${d.created_at || '-'}</td>
                    <td><span class="badge-model" style="color: var(--accent-amber); border-color: rgba(255,179,0,0.3); background: rgba(255,179,0,0.1);"><i class="fa-regular fa-eye"></i> ${d.views || 0}</span></td>
                    <td style="text-align: right;">
                        <button class="btn-danger" onclick="deleteDeployment('${d.id}')">
                            <i class="fa-solid fa-trash"></i> Sil
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Henüz yayınlanmış bir proje bulunmuyor. AI Studio üzerinden bir web kodu üretip "Dünyaya Aç" butonuna basarak ilk projenizi yayınlayın!</td></tr>`;
            document.getElementById('badge-deployments-count').textContent = '0';
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-red);">Yayınlar alınamadı: ${e.message}</td></tr>`;
    }
}

async function toggleStudioTunnel() {
    const pill = document.getElementById('tunnel-status-pill');
    if (pill) pill.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';

    try {
        const res = await fetch(`${API_BASE}/deploy/studio-tunnel/toggle`, { method: 'POST' });
        const data = await res.json();
        alert(data.message || (data.active ? '🟢 Dış erişim açıldı!' : '🔴 Dış erişim kapatıldı.'));
        await fetchDeployments();
    } catch (e) {
        alert(`Hata: ${e.message}`);
        await fetchDeployments();
    }
}

function handleTunnelCheckbox(isChecked) {
    toggleStudioTunnel();
}

async function restartTunnel() {
    const pill = document.getElementById('tunnel-status-pill');
    if (pill) pill.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Tünel Yeniden Başlatılıyor...';

    try {
        const res = await fetch(`${API_BASE}/deploy/studio-tunnel/restart`, { method: 'POST' });
        const data = await res.json();
        if (data.status === 'ok') {
            setTimeout(fetchDeployments, 2000);
        }
    } catch (e) {
        alert(`Tünel yeniden başlatılamadı: ${e.message}`);
    }
}

async function deleteDeployment(id) {
    if (!confirm(`'${id}' ID'li yayını silmek istediğinize emin misiniz?`)) return;

    try {
        const res = await fetch(`${API_BASE}/deploy/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status === 'ok') {
            fetchDeployments();
        } else {
            alert(`Hata: ${data.message}`);
        }
    } catch (e) {
        alert(`Silinemedi: ${e.message}`);
    }
}

function round(val, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(val * factor) / factor;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function copyRemoteUrl(type) {
    const inputId = type === 'studio' ? 'admin-studio-remote-url' : 'admin-cp-remote-url';
    const input = document.getElementById(inputId);
    if (input && input.value && !input.value.includes('kapalı')) {
        navigator.clipboard.writeText(input.value);
        const name = type === 'studio' ? 'Nexus AI Studio' : 'Nexus Kontrol Paneli';
        alert(`✅ ${name} dış erişim linki panoya kopyalandı!`);
    } else {
        alert('Dış erişim kapalı olduğu için kopyalanacak bağlantı yok. Lütfen önce tüneli açın.');
    }
}

// Initial Load & Auto Refresh Interval
document.addEventListener('DOMContentLoaded', () => {
    initTelemetryChart();
    fetchOverview();
    setInterval(fetchOverview, 4000); // 4 saniyede bir donanım metriklerini güncelle
});


// Fetch Comprehensive Hardware & System Specs
async function fetchSpecs(showToastAlert = false) {
    try {
        const res = await fetch(`${API_BASE}/admin/specs`);
        const data = await res.json();
        if (data.status === 'ok' && data.specs) {
            const sp = data.specs;
            const cpu = sp.cpu || {};
            const ram = sp.ram || {};
            const gpu = (sp.gpu && sp.gpu.length > 0) ? sp.gpu[0] : null;
            const board = sp.board || {};
            const disk = sp.disk || {};
            const os = sp.os || {};

            // Hero
            const machineName = board.board_name || board.product_name || os.hostname || 'İş İstasyonu / Sunucu';
            const machineVendor = board.board_vendor || board.sys_vendor || 'Donanım Platformu';
            document.getElementById('spec-hero-machine').textContent = `${machineVendor} ${machineName}`;
            document.getElementById('spec-hero-sub').textContent = `${cpu.model || 'CPU'} | ${gpu ? gpu.name : 'Standart Entegre Grafik'}`;

            document.getElementById('spec-os-badge').textContent = os.pretty_name || 'Linux';
            document.getElementById('spec-gpu-badge').textContent = gpu ? `${gpu.name} (${gpu.memory_total_gb} GB)` : 'CPU Modu (Yerel)';

            // CPU
            document.getElementById('spec-cpu-model').textContent = cpu.model || 'Bilinmeyen İşlemci';
            document.getElementById('spec-cpu-arch').textContent = cpu.arch || 'x86_64';
            document.getElementById('spec-cpu-cores').textContent = `${cpu.physical_cores || '-'} Fiziksel Çekirdek`;
            document.getElementById('spec-cpu-threads').textContent = `${cpu.logical_threads || '-'} İş Parçacığı (Threads)`;
            document.getElementById('spec-cpu-freq').textContent = `${cpu.current_freq_mhz || '-'} MHz`;
            document.getElementById('spec-cpu-max-freq').textContent = cpu.max_freq_mhz ? `${cpu.max_freq_mhz} MHz (${(cpu.max_freq_mhz / 1000).toFixed(2)} GHz)` : 'Dinamik Boost';

            // GPU
            if (gpu) {
                document.getElementById('spec-gpu-name').textContent = gpu.name;
                document.getElementById('spec-gpu-vram-total').textContent = `${gpu.memory_total_gb} GB GDDR VRAM`;
                document.getElementById('spec-gpu-vram-free').textContent = `${gpu.memory_free_gb} GB Boş`;
                document.getElementById('spec-gpu-driver-ver').textContent = gpu.driver_version || 'NVIDIA Driver';
                document.getElementById('spec-gpu-hw-type').textContent = gpu.type || 'CUDA Hızlandırıcı';
                document.getElementById('spec-gpu-driver').textContent = 'CUDA Hızlandırma Aktif';
            } else {
                document.getElementById('spec-gpu-name').textContent = 'Ayrık GPU Tespit Edilmedi (CPU Çıkarımı)';
                document.getElementById('spec-gpu-vram-total').textContent = 'RAM Paylaşımlı';
                document.getElementById('spec-gpu-vram-free').textContent = `${ram.available_gb} GB`;
                document.getElementById('spec-gpu-driver-ver').textContent = 'CPU Native';
                document.getElementById('spec-gpu-hw-type').textContent = 'Host CPU';
                document.getElementById('spec-gpu-driver').textContent = 'CPU Modu';
            }

            // RAM
            document.getElementById('spec-ram-percent').textContent = `%${ram.percent}`;
            document.getElementById('spec-ram-main').textContent = `${ram.total_gb} GB Toplam Fiziksel RAM`;
            document.getElementById('spec-ram-used').textContent = `${ram.used_gb} GB`;
            document.getElementById('spec-ram-free').textContent = `${ram.available_gb} GB`;
            document.getElementById('spec-ram-cached').textContent = `${ram.cached_gb || 0} GB`;
            document.getElementById('spec-ram-swap').textContent = `${ram.swap_total_gb} GB (Kullanılan: ${ram.swap_used_gb} GB)`;

            // Motherboard
            document.getElementById('spec-board-name').textContent = board.board_name || board.product_name || 'Özel Sunucu Anakartı';
            document.getElementById('spec-board-vendor').textContent = board.board_vendor || board.sys_vendor || 'Üretici';
            document.getElementById('spec-sys-vendor').textContent = board.sys_vendor || 'Bilinmiyor';
            document.getElementById('spec-product-name').textContent = board.product_name || board.product_version || 'Özel Yapılandırma';
            document.getElementById('spec-bios-ver').textContent = board.bios_version || 'N/A';
            document.getElementById('spec-bios-vendor').textContent = board.bios_vendor || 'Standart BIOS';

            // Disk
            document.getElementById('spec-disk-percent').textContent = `%${disk.percent}`;
            document.getElementById('spec-disk-main').textContent = `${disk.total_gb} GB NVMe/SSD Depolama`;
            document.getElementById('spec-disk-used').textContent = `${disk.used_gb} GB`;
            document.getElementById('spec-disk-free').textContent = `${disk.free_gb} GB`;

            // OS
            document.getElementById('spec-os-title').textContent = `${os.pretty_name} (${os.arch})`;
            document.getElementById('spec-os-kernel').textContent = `Linux ${os.kernel}`;
            document.getElementById('spec-os-host').textContent = os.hostname;
            document.getElementById('spec-os-py').textContent = `Python ${os.python_version}`;

            if (showToastAlert) {
                alert('✅ Tüm donanım ve sunucu özellikleri başarıyla tarandı ve güncellendi!');
            }
        }
    } catch (e) {
        console.error('Error fetching specs:', e);
    }
}


// GitHub Sürüm & Güncelleme Kontrolcüsü
async function checkUpdates(showToast = false) {
    const btnCheck = document.getElementById('btn-check-updates');
    if (btnCheck && showToast) {
        btnCheck.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Denetleniyor...';
        btnCheck.disabled = true;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/updates/check?_cb=${Date.now()}`);
        const data = await res.json();
        
        const elLocalSha = document.getElementById('val-local-sha');
        const elLocalDate = document.getElementById('val-local-date');
        const elLocalMsg = document.getElementById('val-local-msg');

        const elRemSha = document.getElementById('val-remote-sha');
        const elRemDate = document.getElementById('val-remote-date');
        const elRemMsg = document.getElementById('val-remote-msg');

        const topBanner = document.getElementById('update-top-banner');
        const statusBadge = document.getElementById('update-status-badge');
        const statusSub = document.getElementById('update-status-sub');
        const btnApply = document.getElementById('btn-apply-update');

        if (data.status === 'ok') {
            const loc = data.local || {};
            const rem = data.remote || {};
            
            if (elLocalSha) elLocalSha.textContent = loc.sha || 'latest';
            if (elLocalDate) elLocalDate.textContent = loc.date || 'Aktif';
            if (elLocalMsg) elLocalMsg.textContent = loc.message || 'Nexus AI Kararlı Sürüm';

            if (elRemSha) elRemSha.textContent = rem.sha || loc.sha || 'main';
            if (elRemDate) elRemDate.textContent = rem.date ? new Date(rem.date).toLocaleString('tr-TR') : 'Güncel';
            if (elRemMsg) elRemMsg.textContent = rem.message || 'Nexus Kararlı Sürüm';

            if (data.update_available) {
                if (topBanner) {
                    topBanner.style.display = 'flex';
                    const topText = document.getElementById('update-top-text');
                    if (topText) topText.textContent = `🚀 Yeni Güncelleme: ${rem.sha}`;
                }
                if (statusBadge) {
                    statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber);"></i> <span style="color: var(--accent-amber); font-weight: 800;">Yeni Güncelleme Mevcut! (${rem.sha})</span>`;
                }
                if (statusSub) {
                    statusSub.textContent = `GitHub'da yeni sürüm (${rem.sha}: ${rem.message}) yayınlandı.`;
                }
                if (btnApply) {
                    btnApply.style.background = 'linear-gradient(135deg, #ff9a44, #fc6076)';
                    btnApply.style.color = '#fff';
                    btnApply.innerHTML = `<i class="fa-solid fa-cloud-arrow-down fa-bounce"></i> <span>Şimdi Güncelle (${rem.sha})</span>`;
                    btnApply.disabled = false;
                }
                if (showToast) {
                    alert(`🚀 Yeni bir güncelleme mevcut! (${rem.sha}: ${rem.message})\n\n'Şimdi Güncelle' butonuna basarak sistemi anında yükseltebilirsiniz.`);
                }
            } else {
                if (topBanner) topBanner.style.display = 'none';
                if (statusBadge) {
                    statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span style="color: var(--accent-green); font-weight: 800;">Sisteminiz En Güncel Sürümde (${loc.sha})</span>`;
                }
                if (statusSub) {
                    statusSub.textContent = `Resmi GitHub deposu (kefe3/nexus: ${loc.sha || rem.sha}) ile senkronize.`;
                }
                if (btnApply) {
                    btnApply.style.background = 'rgba(255,255,255,0.08)';
                    btnApply.style.color = '#cbd5e1';
                    btnApply.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Sistemi Yeniden Eşitle</span>';
                    btnApply.disabled = false;
                }
                if (showToast) {
                    alert(`✅ Sistem en güncel sürümde (${loc.sha}).`);
                }
            }
        } else {
            if (statusBadge) {
                statusBadge.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: var(--accent-amber);"></i> <span style="color: var(--accent-amber); font-weight: 800;">Güncelleme Kontrol Uyarısı</span>`;
            }
            if (statusSub) {
                statusSub.textContent = data.error || 'GitHub sürüm kontrolü yapılamadı.';
            }
            if (btnApply) {
                btnApply.disabled = false;
                btnApply.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Sistemi Yeniden Eşitle</span>';
            }
            if (showToast) {
                alert(`⚠️ Güncelleme denetleme uyarısı: ${data.error || 'Bilinmeyen hata'}`);
            }
        }
    } catch (e) {
        console.error('Error checking updates:', e);
        if (showToast) alert(`Ağ hatası: ${e.message}`);
    } finally {
        if (btnCheck && showToast) {
            btnCheck.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Güncellemeleri Denetle</span>';
            btnCheck.disabled = false;
        }
    }

    // Also fetch recent commits
    fetchCommitHistory();
}

// Fetch and render recent commits history
async function fetchCommitHistory() {
    const tbody = document.getElementById('github-commits-tbody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/admin/updates/history?_cb=${Date.now()}`);
        const data = await res.json();
        
        if (data.status === 'ok' && data.commits && data.commits.length > 0) {
            tbody.innerHTML = '';
            data.commits.forEach(c => {
                const tr = document.createElement('tr');
                const dateStr = c.date ? new Date(c.date).toLocaleString('tr-TR') : '-';
                tr.innerHTML = `
                    <td>
                        <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent-cyan); background: rgba(0, 242, 254, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(0, 242, 254, 0.2);">
                            ${escapeHtml(c.sha)}
                        </span>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #fff; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${escapeHtml(c.message)}
                        </div>
                    </td>
                    <td>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-user-gear" style="color: var(--accent-purple);"></i> ${escapeHtml(c.author)}
                        </span>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
                    <td style="text-align: right;">
                        <a href="${c.url || 'https://github.com/kefe3/nexus'}" target="_blank" class="btn-action" style="padding: 4px 10px; font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                            <span>İncele</span> <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.65rem;"></i>
                        </a>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.25rem;">Commit geçmişi alınamadı: ${data.error || 'Bilinmeyen hata'}</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--accent-red); padding: 1.25rem;">Bağlantı hatası: ${e.message}</td></tr>`;
    }
}

// 1-Click Update Application with Live Terminal Modal
async function applyUpdate() {
    const modal = document.getElementById('updateProgressModal');
    const termBox = document.getElementById('update-terminal-box');
    const modalSub = document.getElementById('update-modal-sub');
    const btnClose = document.getElementById('btn-update-modal-close');
    const btnApply = document.getElementById('btn-apply-update');

    if (modal) modal.style.display = 'flex';
    if (termBox) {
        termBox.innerHTML = `
            <div style="color: var(--accent-cyan); font-weight: 700;">> [1/4] Nexus Güncelleme Motoru Başlatıldı...</div>
            <div style="color: #64748b;">> Hedef Depo: https://github.com/kefe3/nexus.git (Dal: main)</div>
            <div style="color: var(--accent-amber);">> [2/4] GitHub senkronizasyonu başlatılıyor...</div>
        `;
    }
    if (btnClose) btnClose.style.display = 'none';
    if (btnApply) btnApply.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/admin/updates/apply`, { method: 'POST' });
        const data = await res.json();
        
        if (data.status === 'ok') {
            if (termBox) {
                if (data.steps && data.steps.length > 0) {
                    data.steps.forEach(st => {
                        const stepDiv = document.createElement('div');
                        stepDiv.style.color = st.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-amber)';
                        stepDiv.innerHTML = `> [✓] ${st.step}: ${escapeHtml(st.output || 'Tamamlandı')}`;
                        termBox.appendChild(stepDiv);
                    });
                }
                const finDiv = document.createElement('div');
                finDiv.style.color = 'var(--accent-green)';
                finDiv.style.fontWeight = '800';
                finDiv.style.marginTop = '8px';
                finDiv.innerHTML = `> [3/4] ${data.message} (Yeni Sürüm: ${data.new_commit?.sha || 'latest'})`;
                termBox.appendChild(finDiv);

                const reloadDiv = document.createElement('div');
                reloadDiv.style.color = 'var(--accent-cyan)';
                reloadDiv.innerHTML = `> [4/4] Sistem güncellendi. Sayfa otomatik yenileniyor...`;
                termBox.appendChild(reloadDiv);
                termBox.scrollTop = termBox.scrollHeight;
            }

            if (modalSub) {
                modalSub.textContent = 'Güncelleme başarıyla tamamlandı! Yenileniyor...';
                modalSub.style.color = 'var(--accent-green)';
            }
            if (btnClose) btnClose.style.display = 'inline-flex';

            setTimeout(() => {
                window.location.href = window.location.pathname + '?_t=' + Date.now();
            }, 2500);
        } else {
            if (termBox) {
                if (data.steps && data.steps.length > 0) {
                    data.steps.forEach(st => {
                        const stepDiv = document.createElement('div');
                        stepDiv.style.color = st.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-amber)';
                        stepDiv.innerHTML = `> [!] ${st.step}: ${escapeHtml(st.output || '')}`;
                        termBox.appendChild(stepDiv);
                    });
                }
                const errDiv = document.createElement('div');
                errDiv.style.color = 'var(--accent-red)';
                errDiv.style.fontWeight = '700';
                errDiv.style.marginTop = '8px';
                errDiv.innerHTML = `> [X] HATA: ${data.message || 'Güncelleme başarısız'}`;
                termBox.appendChild(errDiv);
                termBox.scrollTop = termBox.scrollHeight;
            }
            if (modalSub) {
                modalSub.textContent = 'Güncelleme sırasında bir hata oluştu.';
                modalSub.style.color = 'var(--accent-red)';
            }
            if (btnClose) {
                btnClose.style.display = 'inline-flex';
                btnClose.textContent = 'Kapat';
                btnClose.onclick = () => { modal.style.display = 'none'; };
            }
        }
    } catch (e) {
        if (termBox) {
            const errDiv = document.createElement('div');
            errDiv.style.color = 'var(--accent-red)';
            errDiv.innerHTML = `> [X] Ağ / İstek Hatası: ${e.message}`;
            termBox.appendChild(errDiv);
        }
        if (btnClose) {
            btnClose.style.display = 'inline-flex';
            btnClose.textContent = 'Kapat';
            btnClose.onclick = () => { modal.style.display = 'none'; };
        }
    } finally {
        if (btnApply) btnApply.disabled = false;
    }
}

// Auto-check updates on startup
document.addEventListener('DOMContentLoaded', () => {
    checkUpdates();
});





// ==================== STORE & API KEYS MODULE ====================

let activeGatewayMode = 'auto'; // 'auto' | 'tunnel' | 'custom'
let customGatewayBase = '';
let activeTunnelUrl = '';

function switchModelHubTab(tab) {
    document.querySelectorAll('.hub-subtab').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#sec-models .btn-secondary').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById('hub-tab-' + tab);
    const targetBtn = document.getElementById('tab-btn-' + tab);
    if (targetTab) targetTab.style.display = 'block';
    if (targetBtn) targetBtn.classList.add('active');

    if (tab === 'installed') {
        fetchInstalledModels();
    } else if (tab === 'store-models' || tab === 'plugins-skills') {
        loadStoreCatalog();
    }
}

function switchStoreTab(tab) {
    switchModelHubTab(tab);
}

async function loadStoreCatalog() {
    try {
        const res = await fetch('/api/store/catalog');
        if (!res.ok) return;
        const data = await res.json();
        
        // Render Models
        const modelsGrid = document.getElementById('store-models-grid');
        if (modelsGrid && data.models) {
            modelsGrid.innerHTML = data.models.map(m => {
                const isInstalled = m.installed;
                return `
                <div class="cp-card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; border-left: 3px solid ${m.color || '#6366f1'}; position: relative;">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; background: rgba(255,255,255,0.08); color: ${m.color || '#6366f1'}; border: 1px solid rgba(255,255,255,0.1);">${m.badge}</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                ${isInstalled ? '<span style="font-size: 0.7rem; font-weight: 800; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 6px; border-radius: 6px;"><i class="fa-solid fa-check"></i> YÜKLÜ</span>' : ''}
                                <span style="font-size: 0.75rem; color: var(--text-secondary); font-family: 'JetBrains Mono';">${m.size}</span>
                            </div>
                        </div>
                        <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
                            <i class="${m.icon}" style="color: ${m.color};"></i> ${m.display_name}
                        </h4>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.4;">${m.desc}</p>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="btn btn-primary" onclick="pullStoreModel('${m.name}')" style="flex: 1; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; background: ${isInstalled ? 'linear-gradient(135deg, #059669, #10b981)' : `linear-gradient(135deg, ${m.color}, #4f46e5)`}; border: none;">
                            <i class="fa-solid ${isInstalled ? 'fa-rotate' : 'fa-download'}"></i> ${isInstalled ? 'Yeniden İndir' : 'İndir & Yükle'}
                        </button>
                        ${isInstalled ? `
                        <button class="btn btn-secondary" onclick="deleteStoreModel('${m.name}')" style="border-radius: 8px; padding: 6px 10px; font-size: 0.8rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" title="Sil">
                            <i class="fa-solid fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
            `}).join('');
        }

        // Render Plugins
        const pluginsGrid = document.getElementById('store-plugins-grid');
        if (pluginsGrid && data.plugins) {
            pluginsGrid.innerHTML = data.plugins.map(p => `
                <div class="cp-card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; border-left: 3px solid ${p.enabled ? '#10b981' : '#64748b'};">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">${p.badge}</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">${p.category}</span>
                        </div>
                        <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
                            <i class="${p.icon}" style="color: ${p.enabled ? '#10b981' : '#94a3b8'};"></i> ${p.name}
                        </h4>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 12px 0;">${p.description}</p>
                    </div>
                    <button class="btn ${p.enabled ? 'btn-primary' : 'btn-secondary'}" onclick="togglePluginUI('${p.id}')" style="border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; ${p.enabled ? 'background: #10b981; color: #04060c; border: none;' : 'color: #94a3b8;'}">
                        <i class="fa-solid ${p.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}"></i> ${p.enabled ? 'Etkinleştirildi (Açık)' : 'Devre Dışı (Kapalı)'}
                    </button>
                </div>
            `).join('');
        }

        // Render Skills
        const skillsGrid = document.getElementById('store-skills-grid');
        if (skillsGrid && data.skills) {
            skillsGrid.innerHTML = data.skills.map(s => `
                <div class="cp-card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; border-left: 3px solid ${s.installed ? '#a855f7' : '#64748b'};">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3);">${s.badge}</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">${s.author}</span>
                        </div>
                        <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
                            <i class="${s.icon}" style="color: ${s.installed ? '#a855f7' : '#94a3b8'};"></i> ${s.name}
                        </h4>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0 0 12px 0;">${s.description}</p>
                    </div>
                    <button class="btn ${s.installed ? 'btn-primary' : 'btn-secondary'}" onclick="toggleSkillUI('${s.id}')" style="border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; ${s.installed ? 'background: #a855f7; color: #fff; border: none;' : 'color: #94a3b8;'}">
                        <i class="fa-solid ${s.installed ? 'fa-check' : 'fa-plus'}"></i> ${s.installed ? 'Aktif Ajan Becerisi' : 'Beceriyi Yükle'}
                    </button>
                </div>
            `).join('');
        }

    } catch (e) {
        console.error("Store catalog error:", e);
    }
}

async function togglePluginUI(pluginId) {
    try {
        const res = await fetch('/api/store/plugin/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pluginId })
        });
        if (res.ok) {
            loadStoreCatalog();
        }
    } catch (e) {
        alert("Eklenti değiştirme hatası: " + e);
    }
}

async function toggleSkillUI(skillId) {
    try {
        const res = await fetch('/api/store/skill/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: skillId })
        });
        if (res.ok) {
            loadStoreCatalog();
        }
    } catch (e) {
        alert("Beceri değiştirme hatası: " + e);
    }
}

async function pullStoreModel(name) {
    if (!name) return;
    const msg = document.getElementById('hf-status-msg');
    if (msg) {
        msg.style.display = 'block';
        msg.innerText = `'${name}' indirme işlemi arka planda başlatıldı...`;
    }
    try {
        const res = await fetch('/api/store/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        const data = await res.json();
        alert(data.message || `'${name}' indirme işlemi başlatıldı.`);
        setTimeout(loadStoreCatalog, 2000);
    } catch (e) {
        alert("Model indirme hatası: " + e);
    }
}

async function searchHuggingFaceUI() {
    const input = document.getElementById('hf-model-input');
    const resultsBox = document.getElementById('hf-search-results');
    if (!input || !resultsBox) return;

    const q = input.value.trim();
    if (!q) {
        alert("Lütfen aramak için bir model adı veya anahtar kelime girin.");
        return;
    }

    resultsBox.style.display = 'block';
    resultsBox.innerHTML = `<div style="text-align: center; color: #f59e0b; padding: 12px;"><i class="fa-solid fa-spinner fa-spin"></i> Hugging Face GGUF modelleri taranıyor...</div>`;

    try {
        const res = await fetch(`/api/store/hf-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.status === 'ok' && data.results && data.results.length > 0) {
            resultsBox.innerHTML = `
                <div style="font-size: 0.8rem; font-weight: 700; color: #fff; margin-bottom: 8px;">HF Arama Sonuçları (${data.results.length} GGUF Modeli):</div>
                <div style="display: grid; gap: 8px;">
                    ${data.results.map(r => `
                        <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <div style="font-weight: 800; font-size: 0.85rem; color: #f59e0b; font-family: 'JetBrains Mono';">${r.model_id}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
                                    <i class="fa-solid fa-heart" style="color: #ec4899;"></i> ${r.likes} beğeni &bull; <i class="fa-solid fa-download"></i> ${r.downloads} indirme
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="pullStoreModel('${r.ollama_ref}')" style="background: #f59e0b; color: #04060c; font-weight: 700; padding: 6px 14px; border-radius: 6px; font-size: 0.78rem; border: none;">
                                <i class="fa-solid fa-cloud-arrow-down"></i> Ollama'ya Yükle
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            resultsBox.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 12px;">Hugging Face üzerinde "${q}" için uygun GGUF model bulunamadı.</div>`;
        }
    } catch (e) {
        resultsBox.innerHTML = `<div style="color: #ef4444; padding: 12px;">HF Arama Hatası: ${e}</div>`;
    }
}

async function pullCustomModel() {
    const input = document.getElementById('hf-model-input');
    if (!input || !input.value || !input.value.trim()) return;
    const val = input.value.trim();
    if (!val) {
        alert("Lütfen bir HuggingFace veya Ollama model adı girin.");
        return;
    }
    await pullStoreModel(val);
}

async function deleteStoreModel(name) {
    if (!confirm(`'${name}' modelini silmek istediğinizden emin misiniz?`)) return;
    try {
        const res = await fetch(`/api/store/delete/${encodeURIComponent(name)}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.message || "Model silindi.");
        loadStoreCatalog();
    } catch (e) {
        alert("Model silme hatası: " + e);
    }
}

async function loadApiKeys() {
    const tableBody = document.getElementById('apikeys-table-body');
    if (!tableBody) return;
    
    try {
        const res = await fetch('/api/apikeys');
        if (!res.ok) return;
        const data = await res.json();
        
        if (!data.keys || data.keys.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 20px;">Henüz aktif bir API anahtarı bulunmuyor.</td></tr>`;
            return;
        }

        tableBody.innerHTML = data.keys.map(k => `
            <tr>
                <td style="font-weight: 700; color: #fff;">${k.name}</td>
                <td><code style="background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 6px; color: #38bdf8; font-family: 'JetBrains Mono'; cursor: pointer;" title="Kopyala" onclick="navigator.clipboard.writeText('${k.key_preview}'); alert('Anahtar önizlemesi kopyalandı.');">${k.key_preview}</code></td>
                <td><span style="font-size: 0.75rem; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 10px; font-weight: 700;">${k.rate_limit.toUpperCase()}</span></td>
                <td style="font-family: 'JetBrains Mono'; font-weight: 700; color: #f59e0b;">${k.requests_count} İstek</td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${k.created_at}</td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${k.last_used}</td>
                <td>
                    <button class="btn btn-secondary" onclick="revokeApiKeyUI('${k.id}')" style="padding: 4px 8px; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);">
                        <i class="fa-solid fa-trash"></i> İptal Et
                    </button>
                </td>
            </tr>
        `).join('');

        // Also pre-fill test key if empty
        const testKeyInput = document.getElementById('gw-test-key');
        if (testKeyInput && !testKeyInput.value && data.keys.length > 0) {
            testKeyInput.value = "nx-live-unlimited-nexus-master-key";
        }

    } catch (e) {
        console.error("API keys loading error:", e);
    }
}

async function generateApiKeyUI() {
    const name = prompt("Yeni API Key için İstemci / Tanım Adı girin (Örn: Cursor IDE, VSCode Roo, Mobil Uygulama):", "Sınırsız Uygulama Key");
    if (name === null) return;
    
    try {
        const res = await fetch('/api/apikeys/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name || "Sınırsız Client Key" })
        });
        const data = await res.json();
        if (data.key) {
            prompt("✅ Yeni Sınırsız Nexus API Key Üretildi! Bu anahtarı kopyalayıp saklayın:", data.key);
            const testKeyInput = document.getElementById('gw-test-key');
            if (testKeyInput) testKeyInput.value = data.key;
            loadApiKeys();
        } else {
            alert("Hata: " + (data.message || "Key üretilemedi."));
        }
    } catch (e) {
        alert("API Key üretme hatası: " + e);
    }
}

async function revokeApiKeyUI(keyId) {
    if (!confirm("Bu API anahtarını iptal etmek istediğinizden emin misiniz?")) return;
    try {
        const res = await fetch(`/api/apikeys/${keyId}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.message || "Key iptal edildi.");
        loadApiKeys();
    } catch (e) {
        alert("İptal hatası: " + e);
    }
}

// Gateway URL Modes & Switcher
function setGatewayUrlMode(mode) {
    activeGatewayMode = mode;
    document.querySelectorAll('#btn-gw-mode-auto, #btn-gw-mode-tunnel, #btn-gw-mode-custom').forEach(b => b.classList.remove('active'));
    
    const btn = document.getElementById(`btn-gw-mode-${mode}`);
    if (btn) btn.classList.add('active');

    const customContainer = document.getElementById('custom-gw-url-container');
    if (customContainer) {
        customContainer.style.display = mode === 'custom' ? 'block' : 'none';
    }

    if (mode === 'tunnel') {
        checkOrStartTunnel();
    } else {
        updateDynamicGatewayBaseUrl();
    }
}

async function checkOrStartTunnel() {
    const baseCode = document.getElementById('gateway-base-url-code');
    if (baseCode) baseCode.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cloudflare Canlı Tüneli başlatılıyor / kontrol ediliyor...';
    
    try {
        // Step 1: Check existing status
        let res = await fetch('/api/deploy/tunnel');
        let data = await res.json();
        
        if (data.active && data.url) {
            activeTunnelUrl = data.url;
            updateDynamicGatewayBaseUrl();
            return;
        }

        // Step 2: Trigger start
        await fetch('/api/deploy/tunnel/restart', { method: 'POST' });

        // Step 3: Poll for up to 10 seconds (5 attempts x 2s)
        for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 2000));
            res = await fetch('/api/deploy/tunnel');
            data = await res.json();
            if (data.active && data.url) {
                activeTunnelUrl = data.url;
                updateDynamicGatewayBaseUrl();
                return;
            }
        }
        
        // If still not ready
        if (baseCode) {
            baseCode.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Tünel henüz başlatılamadı. Tekrar denemek için "Yeniden Başlat" butonuna basın.</span>`;
        }
    } catch (e) {
        if (baseCode) {
            baseCode.innerHTML = `<span style="color: #ef4444;">Tünel hatası: ${e.message}</span>`;
        }
    }
}

function applyCustomGatewayUrl() {
    const input = document.getElementById('custom-gw-url-input');
    if (!input || !input.value.trim()) {
        alert("Lütfen geçerli bir URL girin (Örn: https://ai.domain.com veya http://88.250.x.x:3050)");
        return;
    }
    customGatewayBase = input.value.trim().replace(/\/v1\/?$/, '').replace(/\/$/, '');
    updateDynamicGatewayBaseUrl();
}

function getActiveGatewayBaseUrl() {
    if (activeGatewayMode === 'custom' && customGatewayBase) {
        return `${customGatewayBase}/v1`;
    }
    if (activeGatewayMode === 'tunnel' && activeTunnelUrl) {
        return `${activeTunnelUrl}/v1`;
    }
    return `${window.location.origin}/v1`;
}

function copyGatewayBaseUrl() {
    const url = getActiveGatewayBaseUrl();
    navigator.clipboard.writeText(url);
    alert(`Base URL kopyalandı:\n${url}`);
}

function switchCodeTab(tab) {
    document.querySelectorAll('.code-snippet-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tab-code-curl, #tab-code-python, #tab-code-node, #tab-code-cursor').forEach(b => b.classList.remove('active'));

    const targetPane = document.getElementById(`snippet-container-${tab}`);
    const targetBtn = document.getElementById(`tab-code-${tab}`);
    if (targetPane) targetPane.style.display = 'block';
    if (targetBtn) targetBtn.classList.add('active');
}

function updateDynamicGatewayBaseUrl() {
    const v1Url = getActiveGatewayBaseUrl();

    const baseCode = document.getElementById('gateway-base-url-code');
    const curlSnippet = document.getElementById('gateway-curl-snippet');
    const pythonSnippet = document.getElementById('gateway-python-snippet');
    const nodeSnippet = document.getElementById('gateway-node-snippet');
    const cursorEls = document.querySelectorAll('.cursor-gw-base-url');

    if (baseCode) {
        baseCode.textContent = v1Url;
    }
    cursorEls.forEach(el => el.textContent = v1Url);

    if (curlSnippet) {
        curlSnippet.textContent = `curl ${v1Url}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "Merhaba!"}]
  }'`;
    }

    if (pythonSnippet) {
        pythonSnippet.textContent = `from openai import OpenAI

client = OpenAI(
    base_url="${v1Url}",
    api_key="YOUR_API_KEY"
)

res = client.chat.completions.create(
    model="qwen2.5-coder:7b",
    messages=[{"role": "user", "content": "Merhaba!"}]
)
print(res.choices[0].message.content)`;
    }

    if (nodeSnippet) {
        nodeSnippet.textContent = `import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: "${v1Url}",
    apiKey: "YOUR_API_KEY"
});

const response = await openai.chat.completions.create({
    model: "qwen2.5-coder:7b",
    messages: [{ role: "user", content: "Merhaba!" }]
});

console.log(response.choices[0].message.content);`;
    }
}

// Live Gateway Test Execution
async function runGatewayTestUI() {
    const key = (document.getElementById('gw-test-key')?.value || '').trim();
    const model = (document.getElementById('gw-test-model')?.value || 'qwen2.5-coder:7b').trim();
    const promptText = (document.getElementById('gw-test-prompt')?.value || 'Merhaba!').trim();
    const resultBox = document.getElementById('gw-test-result-box');

    if (!key) {
        alert("Lütfen test etmek için bir API anahtarı girin.");
        return;
    }
    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div style="color: #f59e0b;"><i class="fa-solid fa-spinner fa-spin"></i> ${getActiveGatewayBaseUrl()}/chat/completions adresine istek gönderiliyor (${model})...</div>`;

    try {
        const res = await fetch(`${getActiveGatewayBaseUrl()}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: promptText }],
                stream: false
            })
        });

        const data = await res.json();
        if (res.ok) {
            const content = data.choices?.[0]?.message?.content || JSON.stringify(data);
            resultBox.innerHTML = `
                <div style="color: #10b981; font-weight: 800; margin-bottom: 6px;"><i class="fa-solid fa-check-circle"></i> HTTP ${res.status} OK — Başarılı Yanıt Alındı:</div>
                <div style="color: #e2e8f0; white-space: pre-wrap; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">${content}</div>
                <div style="color: #64748b; font-size: 0.72rem; margin-top: 6px;">Model: ${data.model} | ID: ${data.id} | Token: ${data.usage?.total_tokens || 0}</div>
            `;
        } else {
            resultBox.innerHTML = `
                <div style="color: #ef4444; font-weight: 800;"><i class="fa-solid fa-triangle-exclamation"></i> HTTP ${res.status} Hata:</div>
                <div style="color: #fca5a5; white-space: pre-wrap; margin-top: 4px;">${JSON.stringify(data, null, 2)}</div>
            `;
        }
    } catch (e) {
        resultBox.innerHTML = `<div style="color: #ef4444;"><i class="fa-solid fa-circle-xmark"></i> Bağlantı Hatası: ${e.message}</div>`;
    }
}

// Hook into section switching
const originalSwitchSection = window.switchSection;
window.switchSection = function(sectionId) {
    if (typeof originalSwitchSection === 'function') {
        originalSwitchSection(sectionId);
    } else {
        document.querySelectorAll('.cp-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.cp-nav-item').forEach(el => el.classList.remove('active'));
        const sec = document.getElementById('sec-' + sectionId);
        if (sec) sec.classList.add('active');
    }
    
    if (sectionId === 'models' || sectionId === 'store') {
        fetchInstalledModels();
        loadStoreCatalog();
    } else if (sectionId === 'apikeys') {
        loadApiKeys();
        updateDynamicGatewayBaseUrl();
    }
};

// Initial trigger
document.addEventListener('DOMContentLoaded', () => {
    const hostLabel = document.getElementById('gw-auto-host-label');
    if (hostLabel) {
        hostLabel.textContent = `Mevcut Host (${window.location.host})`;
    }
    loadStoreCatalog();
    loadApiKeys();
    updateDynamicGatewayBaseUrl();
});

