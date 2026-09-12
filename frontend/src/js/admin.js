// Nexus AI Studio — Admin Control Panel Logic

const API_BASE = '/api';

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
    if (secId === 'models') fetchInstalledModels();
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
            document.getElementById('val-ollama-status').textContent = a.ollama_status === 'online' ? 'Ollama GPU Aktif (2ms)' : 'Ollama Bağlantısı Yok';

            // Server details
            document.getElementById('val-uptime').textContent = `Çalışma Süresi: ${s.uptime_formatted}`;
            document.getElementById('val-os').textContent = s.os;
            document.getElementById('val-hostname').textContent = s.hostname;
            document.getElementById('val-python').textContent = `Python ${s.python_version}`;
            document.getElementById('val-net').textContent = `⬇ ${h.net_recv_mb} MB | ⬆ ${h.net_sent_mb} MB`;
            
            document.getElementById('server-ping-text').textContent = `Server Online (${data.timestamp.split(' ')[1]})`;
        }
    } catch (e) {
        console.error('Error fetching overview:', e);
        document.getElementById('server-ping-text').textContent = 'Server Bağlantı Hatası';
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
                    <td><span class="badge-size">${m.size_gb} GB</span></td>
                    <td><code style="font-size: 0.75rem; color: #94a3b8;">${m.digest || 'SHA256'}</code></td>
                    <td style="color: #94a3b8; font-size: 0.8rem;">${m.modified_at ? m.modified_at.split('T')[0] : 'Güncel'}</td>
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

// Test Provider
async function testProvider(prov) {
    const resBox = document.getElementById(`test-result-${prov}`);
    if (resBox) resBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Test ediliyor...';

    const apiKey = localStorage.getItem(`nexus_${prov}_key`) || '';

    try {
        const res = await fetch(`${API_BASE}/admin/providers/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: prov, api_key: apiKey })
        });
        const data = await res.json();

        if (data.status === 'ok') {
            resBox.innerHTML = `<span style="color: var(--accent-green);">🟢 ${data.message} (${data.latency_ms}ms)</span>`;
        } else {
            resBox.innerHTML = `<span style="color: var(--accent-red);">🔴 ${data.message}</span>`;
        }
    } catch (e) {
        if (resBox) resBox.innerHTML = `<span style="color: var(--accent-red);">🔴 Hata: ${e.message}</span>`;
    }
}

function testAllProviders() {
    ['ollama', 'gemini', 'openai', 'groq'].forEach(p => {
        const key = localStorage.getItem(`nexus_${p}_key`);
        const input = document.getElementById(`input-api-${p}`);
        if (input && key) input.value = key;
        testProvider(p);
    });
}

function saveKey(prov, val) {
    localStorage.setItem(`nexus_${prov}_key`, val.trim());
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
                    <span>Sağlayıcı: <strong>${l.provider}</strong> | Model: <code>${l.model}</code> | Gecikme: ${l.latency_ms}ms</span>
                    ${l.error ? `<span style="color: var(--accent-red); margin-left: 8px;">(${l.error})</span>` : ''}
                `;
                term.appendChild(line);
            });
        }
    } catch (e) {
        console.error('Error fetching logs:', e);
    }
}

// Initial Load & Auto Refresh Interval
document.addEventListener('DOMContentLoaded', () => {
    fetchOverview();
    setInterval(fetchOverview, 5000); // 5 saniyede bir donanım metriklerini güncelle
});
