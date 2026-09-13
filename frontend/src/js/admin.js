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
    if (secId === 'models') { fetchStoreItems(); fetchInstalledModels(); }
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
    if (!tbody) return;
    try {
        const res = await fetch(`${API_BASE}/admin/models`, {
            headers: getOllamaHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.models && data.models.length > 0) {
            const badge = document.getElementById('store-models-installed-badge') || document.getElementById('installed-count-badge');
            if (badge) badge.textContent = `${data.models.length} Model`;
            data.models.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge-model"><i class="fa-solid fa-cube"></i> ${escapeHtml(m.name)}</span></td>
                    <td><span class="badge-size">${m.parameter_size !== 'N/A' ? m.parameter_size : ''} (${m.size_gb} GB)</span></td>
                    <td><code style="font-size: 0.78rem; color: #a5b4fc;">${escapeHtml(m.quantization_level || 'N/A')}</code></td>
                    <td style="color: #94a3b8; font-size: 0.8rem;">${m.format ? escapeHtml(m.format.toUpperCase()) : 'GGUF'}</td>
                    <td style="text-align: right;">
                        <button class="btn-danger" onclick="deleteModel('${escapeHtml(m.name)}')">
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
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://192.168.0.188:3050`;
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

// 1-Click Update Application with Real-Time SSE Stream
async function applyUpdate() {
    const modal = document.getElementById('updateProgressModal');
    const termBox = document.getElementById('update-terminal-box');
    const modalSub = document.getElementById('update-modal-sub');
    const btnClose = document.getElementById('btn-update-modal-close');
    const btnApply = document.getElementById('btn-apply-update');

    if (modal) modal.style.display = 'flex';
    if (termBox) {
        termBox.innerHTML = `
            <div style="color: var(--accent-cyan); font-weight: 700;">> [1/5] Nexus Evrimsel Güncelleme Motoru Başlatılıyor...</div>
            <div style="color: #64748b;">> Canlı SSE bağlantısı kuruluyor...</div>
        `;
    }
    if (btnClose) btnClose.style.display = 'none';
    if (btnApply) btnApply.disabled = true;

    try {
        const evtSource = new EventSource(`${API_BASE}/admin/updates/apply-stream`);

        evtSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (termBox && data.message) {
                    const stepDiv = document.createElement('div');
                    if (data.status === 'success') {
                        stepDiv.style.color = 'var(--accent-green)';
                        stepDiv.style.fontWeight = '800';
                    } else if (data.status === 'warning') {
                        stepDiv.style.color = 'var(--accent-amber)';
                    } else if (data.status === 'error') {
                        stepDiv.style.color = 'var(--accent-red)';
                        stepDiv.style.fontWeight = '700';
                    } else {
                        stepDiv.style.color = '#cbd5e1';
                    }
                    stepDiv.innerHTML = `> ${escapeHtml(data.message)}`;
                    termBox.appendChild(stepDiv);
                    termBox.scrollTop = termBox.scrollHeight;
                }

                if (data.status === 'success') {
                    evtSource.close();
                    if (modalSub) {
                        modalSub.textContent = '🎉 Güncelleme başarıyla tamamlandı! Sayfa yenileniyor...';
                        modalSub.style.color = 'var(--accent-green)';
                    }
                    if (btnClose) btnClose.style.display = 'inline-flex';
                    setTimeout(() => {
                        window.location.href = window.location.pathname + '?_t=' + Date.now();
                    }, 2500);
                } else if (data.status === 'error') {
                    evtSource.close();
                    if (modalSub) {
                        modalSub.textContent = 'Güncelleme sırasında hata oluştu.';
                        modalSub.style.color = 'var(--accent-red)';
                    }
                    if (btnClose) {
                        btnClose.style.display = 'inline-flex';
                        btnClose.textContent = 'Kapat';
                        btnClose.onclick = () => { modal.style.display = 'none'; };
                    }
                }
            } catch (e) {
                console.error('SSE JSON error:', e);
            }
        };

        evtSource.onerror = (err) => {
            evtSource.close();
            if (termBox) {
                const errDiv = document.createElement('div');
                errDiv.style.color = 'var(--accent-red)';
                errDiv.innerHTML = `> [X] Canlı güncelleme bağlantısı tamamlandı / kesildi.`;
                termBox.appendChild(errDiv);
            }
            if (btnClose) btnClose.style.display = 'inline-flex';
        };

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


// --- NEXUS STORE & HUB ENGINE ---

function switchStoreTab(tabId) {
    document.querySelectorAll('.store-tab-btn').forEach(btn => {
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.borderColor = 'var(--card-border)';
        btn.style.color = 'var(--text-muted)';
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeBtn) {
        activeBtn.style.background = 'rgba(0, 242, 254, 0.15)';
        activeBtn.style.borderColor = 'rgba(0, 242, 254, 0.3)';
        activeBtn.style.color = 'var(--accent-cyan)';
        activeBtn.classList.add('active');
    }

    document.querySelectorAll('.store-tab-content').forEach(content => {
        content.style.display = 'none';
    });

    const targetContent = document.getElementById(`store-tab-content-${tabId}`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }

    if (tabId === 'huggingface') {
        const grid = document.getElementById('hf-models-grid');
        if (grid && (grid.children.length === 0 || grid.innerText.includes('Arama yapılıyor'))) {
            searchHuggingFaceHub('gguf');
        }
    }
}

async function fetchStoreItems() {
    try {
        const res = await fetch(`${API_BASE}/store/items`, { headers: getOllamaHeaders() });
        const data = await res.json();
        if (data.status === 'ok') {
            renderStoreModels(data.models || []);
            renderStoreTools(data.tools || []);
            renderStoreSkills(data.skills || []);

            const badge = document.getElementById('store-models-installed-badge');
            if (badge) badge.textContent = `${data.total_installed_models || 0} Yüklü Model`;
        }
    } catch (e) {
        console.error('Error fetching store items:', e);
    }
}

function renderStoreModels(models) {
    const grid = document.getElementById('store-models-grid');
    if (!grid) return;

    grid.innerHTML = '';
    models.forEach(m => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifySpaceBetween = 'space-between';
        card.style.marginBottom = '0';
        card.style.border = m.installed ? '1px solid rgba(0, 245, 160, 0.35)' : '1px solid var(--card-border)';
        card.style.background = m.installed ? 'linear-gradient(135deg, rgba(0, 245, 160, 0.05), rgba(14, 20, 32, 0.8))' : 'var(--card-bg)';

        const tagsHtml = (m.tags || []).map(t => `<span class="quick-tag" style="font-size: 0.72rem; padding: 2px 7px;">${escapeHtml(t)}</span>`).join(' ');

        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span class="badge-model" style="background: rgba(0,242,254,0.12); color: var(--accent-cyan);">${escapeHtml(m.category_label || 'Model')}</span>
                    ${m.installed ? '<span class="status-pill" style="padding: 3px 8px; font-size: 0.72rem;"><span class="pulse-dot"></span> YÜKLÜ</span>' : '<span style="font-size: 0.75rem; color: #64748b; font-family: JetBrains Mono;">İndirilebilir</span>'}
                </div>
                <h4 style="font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0 0 6px 0;">${escapeHtml(m.name)}</h4>
                <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">${escapeHtml(m.description)}</p>
                <div style="display: flex; gap: 8px; font-size: 0.76rem; color: #cbd5e1; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px;">
                    <span>💾 Boyut: <strong>${m.size_gb} GB</strong></span>
                    <span>⚡ GPU: <strong>${escapeHtml(m.vram_req)}</strong></span>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">${tagsHtml}</div>
            </div>
            <div>
                ${m.installed 
                    ? `<button class="btn-danger" style="width: 100%; padding: 9px;" onclick="deleteModel('${m.id}')"><i class="fa-solid fa-trash"></i> Yüklü (Sil)</button>`
                    : `<button class="btn-action" style="width: 100%; justify-content: center; padding: 9px;" onclick="startStreamingModelPull('${m.id}')"><i class="fa-solid fa-cloud-arrow-down"></i> 1-Tıkla İndir & Kur</button>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderStoreTools(tools) {
    const grid = document.getElementById('store-tools-grid');
    if (!grid) return;

    grid.innerHTML = '';
    tools.forEach(t => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.marginBottom = '0';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0;">${escapeHtml(t.name)}</h4>
                <span class="badge-size" style="background: rgba(138,43,226,0.15); color: var(--accent-purple);">${escapeHtml(t.badge)}</span>
            </div>
            <p style="font-size: 0.83rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px;">${escapeHtml(t.description)}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: #64748b; font-family: JetBrains Mono;">Sürüm: ${t.version}</span>
                <label style="position: relative; display: inline-block; width: 44px; height: 22px; cursor: pointer;">
                    <input type="checkbox" ${t.installed ? 'checked' : ''} onchange="toggleStoreTool('${t.id}', this.checked)" style="opacity: 0; width: 0; height: 0;">
                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${t.installed ? '#00f5a0' : '#334155'}; transition: .3s; border-radius: 22px;"></span>
                </label>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderStoreSkills(skills) {
    const grid = document.getElementById('store-skills-grid');
    if (!grid) return;

    grid.innerHTML = '';
    skills.forEach(s => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.marginBottom = '0';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0;">${escapeHtml(s.name)}</h4>
                <span class="badge-size" style="background: rgba(0,242,254,0.15); color: var(--accent-cyan);">${escapeHtml(s.badge)}</span>
            </div>
            <p style="font-size: 0.83rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px;">${escapeHtml(s.description)}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: #64748b;">Yazar: ${s.author}</span>
                <button class="btn-action" style="padding: 6px 12px; font-size: 0.8rem; background: ${s.installed ? 'rgba(0,245,160,0.15)' : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))'}; color: ${s.installed ? 'var(--accent-green)' : '#04060c'};" onclick="toggleStoreSkill('${s.id}', ${!s.installed})">
                    <i class="fa-solid ${s.installed ? 'fa-check' : 'fa-download'}"></i> ${s.installed ? 'AI Studio\'da Aktif' : 'Studio\'ya Aktar'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Streaming Chunked Model Pull (SSE Engine)
function startStreamingModelPull(modelName) {
    const box = document.getElementById('store-download-progress-box');
    const titleEl = document.getElementById('dl-progress-model-title');
    const statusEl = document.getElementById('dl-progress-layer-status');
    const percentEl = document.getElementById('dl-progress-percent');
    const speedEl = document.getElementById('dl-progress-speed');
    const barFill = document.getElementById('dl-progress-bar-fill');
    const bytesEl = document.getElementById('dl-progress-bytes');
    const etaEl = document.getElementById('dl-progress-eta');

    if (box) box.style.display = 'block';
    if (titleEl) titleEl.textContent = `'${modelName}' İndiriliyor...`;
    if (statusEl) statusEl.textContent = 'Ollama katmanlarına bağlanılıyor...';

    const evtSource = new EventSource(`${API_BASE}/store/pull-stream?model=${encodeURIComponent(modelName)}`);

    evtSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.status === 'downloading') {
                if (statusEl) statusEl.textContent = `Katman: ${data.ollama_status} (${data.digest || ''})`;
                if (percentEl) percentEl.textContent = `${data.percent}%`;
                if (speedEl) speedEl.textContent = `${data.speed_mb_s} MB/s`;
                if (barFill) barFill.style.width = `${Math.min(100, data.percent)}%`;
                if (bytesEl) bytesEl.textContent = `${data.completed_mb} MB / ${data.total_mb} MB`;
                if (etaEl) etaEl.textContent = `Katman indiriliyor...`;
            } else if (data.status === 'success') {
                evtSource.close();
                if (percentEl) percentEl.textContent = '100%';
                if (barFill) barFill.style.width = '100%';
                if (statusEl) statusEl.textContent = `✅ Tamamlandı: ${data.message || 'Model hazır'}`;
                
                setTimeout(() => {
                    if (box) box.style.display = 'none';
                    fetchStoreItems();
                    fetchInstalledModels();
                    alert(`✅ '${modelName}' başarıyla indirildi ve AI Studio kullanıma hazır!`);
                }, 2000);
            } else if (data.status === 'error') {
                evtSource.close();
                alert(`❌ İndirme Hatası: ${data.message}`);
                if (box) box.style.display = 'none';
            }
        } catch (e) {
            console.error('SSE Error:', e);
        }
    };

    evtSource.onerror = (err) => {
        evtSource.close();
    };
}

function triggerCustomModelPull() {
    const input = document.getElementById('input-store-custom-model');
    const name = input ? input.value.trim() : '';
    if (!name) {
        alert('Lütfen indirmek istediğiniz model adını girin (örn: deepseek-r1:14b)');
        return;
    }
    startStreamingModelPull(name);
    if (input) input.value = '';
}

async function searchHuggingFaceHub(query) {
    const input = document.getElementById('input-hf-search');
    const searchQuery = (query !== undefined ? query : (input ? input.value : '')).trim() || 'gguf';
    
    const grid = document.getElementById('hf-models-grid');
    const badge = document.getElementById('hf-search-count-badge');
    const titleEl = document.getElementById('hf-search-results-title');

    if (grid) {
        grid.innerHTML = `<div style="text-align: center; color: var(--text-muted); grid-column: 1/-1; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--accent-cyan); margin-bottom: 10px;"></i><br>Hugging Face Hub aranıyor...</div>`;
    }

    try {
        const res = await fetch(`${API_BASE}/store/huggingface/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        
        if (data.status === 'ok') {
            if (badge) badge.textContent = `${data.total || 0} Sonuç`;
            if (titleEl) titleEl.textContent = `🤗 HuggingFace GGUF Modelleri (${escapeHtml(data.query)})`;
            renderHuggingFaceResults(data.models || []);
        } else {
            if (grid) grid.innerHTML = `<div style="text-align: center; color: #ef4444; grid-column: 1/-1; padding: 2rem;">Arama hatası: ${escapeHtml(data.detail || 'Bilinmeyen hata')}</div>`;
        }
    } catch (e) {
        console.error('HF Search error:', e);
        if (grid) grid.innerHTML = `<div style="text-align: center; color: #ef4444; grid-column: 1/-1; padding: 2rem;">HuggingFace API bağlantı hatası</div>`;
    }
}

function renderHuggingFaceResults(models) {
    const grid = document.getElementById('hf-models-grid');
    if (!grid) return;

    if (!models || models.length === 0) {
        grid.innerHTML = `<div style="text-align: center; color: var(--text-muted); grid-column: 1/-1; padding: 2rem;">Eşleşen HuggingFace GGUF modeli bulunamadı.</div>`;
        return;
    }

    grid.innerHTML = '';
    models.forEach(m => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';
        card.style.marginBottom = '0';

        const tagsHtml = (m.tags || []).map(t => `<span class="quick-tag" style="font-size: 0.72rem; padding: 2px 7px;">${escapeHtml(t)}</span>`).join(' ');

        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span class="badge-model" style="background: rgba(255, 184, 0, 0.15); color: #ffb800; border: 1px solid rgba(255, 184, 0, 0.3);"><i class="fa-solid fa-cube"></i> GGUF</span>
                    <span style="font-size: 0.75rem; color: #64748b; font-family: 'JetBrains Mono', monospace;"><i class="fa-solid fa-user" style="margin-right: 4px;"></i> ${escapeHtml(m.author || 'HF User')}</span>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0 0 6px 0; word-break: break-all;">${escapeHtml(m.name)}</h4>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px; font-family: 'JetBrains Mono', monospace;">
                    ${escapeHtml(m.id)}
                </div>
                <div style="display: flex; gap: 12px; font-size: 0.76rem; color: #cbd5e1; font-family: 'JetBrains Mono', monospace; margin-bottom: 12px;">
                    <span><i class="fa-solid fa-download" style="color: var(--accent-cyan);"></i> <strong>${m.downloads.toLocaleString()}</strong> indirme</span>
                    <span><i class="fa-solid fa-heart" style="color: #ef4444;"></i> <strong>${m.likes.toLocaleString()}</strong> beğeni</span>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">${tagsHtml}</div>
            </div>
            <div>
                <button class="btn-action" style="width: 100%; justify-content: center; padding: 9px; background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 107, 0, 0.2)); border: 1px solid rgba(255, 184, 0, 0.4); color: #ffb800;" onclick="startStreamingModelPull('${escapeHtml(m.ollama_tag)}')">
                    <i class="fa-solid fa-cloud-arrow-down"></i> 1-Tıkla İndir & Kur
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function toggleStoreTool(id, isInstall) {
    try {
        await fetch(`${API_BASE}/store/toggle-tool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'tool', id, action: isInstall ? 'install' : 'uninstall' })
        });
        fetchStoreItems();
    } catch (e) {}
}

async function toggleStoreSkill(id, isInstall) {
    try {
        await fetch(`${API_BASE}/store/toggle-skill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'skill', id, action: isInstall ? 'install' : 'uninstall' })
        });
        fetchStoreItems();
    } catch (e) {}
}

async function submitCustomStoreUpload() {
    const type = document.getElementById('upload-item-type').value;
    const title = document.getElementById('upload-item-title').value.trim();
    const statusBox = document.getElementById('upload-status-box');

    if (!title) {
        alert('Lütfen bir başlık girin');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/store/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type: type, title: title, content: title })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            statusBox.style.display = 'block';
            statusBox.style.background = 'rgba(0, 245, 160, 0.15)';
            statusBox.style.color = 'var(--accent-green)';
            statusBox.textContent = `✅ ${data.message}`;
            document.getElementById('upload-item-title').value = '';
            fetchStoreItems();
        }
    } catch (e) {
        alert(`Yükleme hatası: ${e.message}`);
    }
}

async function installDesktopAppFromCP() {
    const btn = document.getElementById('btn-install-desktop');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kuruluyor...';
    }
    try {
        const res = await fetch(`${API_BASE}/admin/desktop/install`, { method: 'POST' });
        const data = await res.json();
        if (data.status === 'ok') {
            alert(`✅ ${data.message}\n\nNexus AI Studio masaüstü kısayolu sisteminize eklendi! (Uygulama Menüsünden veya butondan başlatabilirsiniz).`);
        } else {
            alert(`⚠️ Kurulum uyarısı: ${data.message}`);
        }
    } catch (e) {
        alert(`Kurulum hatası: ${e.message}`);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Masaüstü Kısayolunu Kur</span>';
        }
    }
}

async function launchDesktopAppFromCP() {
    try {
        const res = await fetch(`${API_BASE}/admin/desktop/launch`, { method: 'POST' });
        const data = await res.json();
        alert(data.message || 'Masaüstü uygulaması başlatıldı!');
    } catch (e) {
        alert(`Masaüstü uygulaması başlatılamadı: ${e.message}`);
    }
}

// Auto-check updates & store on startup
document.addEventListener('DOMContentLoaded', () => {
    checkUpdates();
});


