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

// Fetch Running VRAM Models
async function fetchRunningModels() {
    const tbody = document.getElementById('vram-models-tbody');
    try {
        const res = await fetch(`${API_BASE}/admin/models/running`);
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
            headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch(`${API_BASE}/admin/models`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.models && data.models.length > 0) {
            document.getElementById('installed-count-badge').textContent = `${data.models.length} Model`;
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            statusBox.style.background = 'rgba(0, 245, 160, 0.15)';
            statusBox.style.color = 'var(--accent-green)';
            statusBox.textContent = `✅ Başarılı: ${data.message}`;
            input.value = '';
            fetchInstalledModels();
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            fetchInstalledModels();
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
        const res = await fetch(`${API_BASE}/admin/models`);
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

function testAllProviders() {
    ['ollama', 'gemini', 'openai', 'groq'].forEach(p => {
        const key = localStorage.getItem(`nexus_key_${p}`) || localStorage.getItem(`nexus_${p}_key`);
        const input = document.getElementById(`input-api-${p}`);
        if (input && key) input.value = key;
        testProvider(p);
    });
}

function saveKey(prov, val) {
    const clean = val.trim();
    localStorage.setItem(`nexus_key_${prov}`, clean);
    localStorage.setItem(`nexus_${prov}_key`, clean);
    testProvider(prov);
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
