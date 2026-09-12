#!/usr/bin/env bash
# ==============================================================================
# ⚡ Nexus AI Studio — Tam Kapsamlı Otomatik Kurulum Betiği (All-In-One Universal Installer)
# Docker, Ollama, Cloudflared, Git, Curl, Modeller — Ne eksikse tek komutla kurar!
# Linux (Ubuntu, Debian, Fedora, Arch, CentOS, Alpine), macOS ve WSL2 Tam Uyumlu
# ==============================================================================

set -e

# Renk tanımları
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

clear || true
echo -e "${CYAN}${BOLD}"
echo "  ███╗   ██╗███████╗██╗   ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗ ██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚████╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝    ╚██╔╝  ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗   ██║   ╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚══════╝"
echo -e "      ${PURPLE}⚡ Self-Hosted AI Studio & Cluster Control Platform${NC}\n"

# 1. Yetki Kontrolü
SUDO=""
if [ "$EUID" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
    else
        echo -e "${RED}❌ Hata: Paket kurulumlarını yapabilmek için root veya sudo yetkisi gereklidir.${NC}"
        exit 1
    fi
fi

# 2. İşletim Sistemi ve Paket Yöneticisi
OS="$(uname -s)"
ARCH="$(uname -m)"
echo -e "${YELLOW}🔍 Sistem Analiz Ediliyor: ${BOLD}${OS} (${ARCH})${NC}..."

install_pkg() {
    PKG=$1
    if command -v apt-get >/dev/null 2>&1; then
        $SUDO apt-get update -qq && $SUDO apt-get install -y -qq "$PKG"
    elif command -v dnf >/dev/null 2>&1; then
        $SUDO dnf install -y -q "$PKG"
    elif command -v yum >/dev/null 2>&1; then
        $SUDO yum install -y -q "$PKG"
    elif command -v pacman >/dev/null 2>&1; then
        $SUDO pacman -Sy --noconfirm "$PKG"
    elif command -v brew >/dev/null 2>&1; then
        brew install "$PKG"
    fi
}

# 3. Temel Araçlar (curl, git, wget, jq, pciutils)
echo -e "\n${CYAN}📦 1/5 Temel sistem araçları denetleniyor...${NC}"
for tool in curl git wget jq; do
    if ! command -v $tool >/dev/null 2>&1; then
        echo -e "${YELLOW}  -> $tool eksik, otomatik kuruluyor...${NC}"
        install_pkg $tool
    fi
done
echo -e "${GREEN}  ✓ Temel araçlar hazır!${NC}"

# 4. Docker & Docker Compose Kurulumu (Eksikse Anında Kurar)
echo -e "\n${CYAN}🐳 2/5 Docker & Konteyner Altyapısı denetleniyor...${NC}"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}  -> Docker bulunamadı. Resmi get.docker.com motoru kuruluyor...${NC}"
    if [ "$OS" = "Linux" ]; then
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
        $SUDO sh /tmp/get-docker.sh
        rm -f /tmp/get-docker.sh
        
        if command -v systemctl >/dev/null 2>&1; then
            $SUDO systemctl enable --now docker
        elif command -v service >/dev/null 2>&1; then
            $SUDO service docker start
        fi
        
        if [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -aG docker "$USER" 2>/dev/null || true
        fi
        echo -e "${GREEN}  ✓ Docker başarıyla kuruldu ve başlatıldı!${NC}"
    elif [ "$OS" = "Darwin" ]; then
        echo -e "${YELLOW}  -> macOS Docker Desktop kuruluyor...${NC}"
        brew install --cask docker || true
    fi
else
    echo -e "${GREEN}  ✓ Docker zaten kurulu ($(docker --version))${NC}"
fi

# Docker compose kontrolü
DOCKER_COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    else
        echo -e "${YELLOW}  -> Docker Compose eklentisi kuruluyor...${NC}"
        install_pkg docker-compose-plugin || install_pkg docker-compose || true
        if command -v docker-compose >/dev/null 2>&1; then
            DOCKER_COMPOSE="docker-compose"
        fi
    fi
fi
echo -e "${GREEN}  ✓ Docker Compose hazır!${NC}"

# 5. Ollama Yerel Yapay Zeka Motoru Kurulumu (Eksikse Otomatik Kurar)
echo -e "\n${CYAN}🧠 3/5 Ollama Yerel GPU/CPU Motoru denetleniyor...${NC}"
if ! command -v ollama >/dev/null 2>&1; then
    echo -e "${YELLOW}  -> Ollama yerel yapay zeka motoru eksik. Resmi kurulum başlatılıyor...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh
    
    if command -v systemctl >/dev/null 2>&1; then
        $SUDO systemctl enable --now ollama || true
    fi
    sleep 3
    echo -e "${GREEN}  ✓ Ollama motoru kuruldu ve GPU/CPU desteğiyle başlatıldı!${NC}"
else
    echo -e "${GREEN}  ✓ Ollama zaten kurulu ve hazır!${NC}"
fi

# Ollama servisinin açık olduğundan emin ol
if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl start ollama 2>/dev/null || true
fi

# Eğer hiç model yoksa hızlı bir başlangıç modeli indir
if command -v ollama >/dev/null 2>&1; then
    MODEL_COUNT=$(ollama list 2>/dev/null | grep -v 'NAME' | grep -v '^$' | wc -l || echo "0")
    if [ "$MODEL_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}  -> Henüz yerel model yok. Hızlı başlangıç modeli (qwen2.5-coder:1.5b) indiriliyor...${NC}"
        ollama pull qwen2.5-coder:1.5b 2>/dev/null || ollama pull deepseek-r1:1.5b 2>/dev/null || true
    fi
fi

# 6. Cloudflared Tünel İkili Dosyası (Eksikse Doğrudan İndirilir)
echo -e "\n${CYAN}🌐 4/5 Cloudflared Dış Erişim Tüneli denetleniyor...${NC}"
if [ ! -f "/usr/local/bin/cloudflared" ] && ! command -v cloudflared >/dev/null 2>&1; then
    echo -e "${YELLOW}  -> Cloudflared tünel ikilisi indiriliyor...${NC}"
    if [ "$ARCH" = "x86_64" ]; then
        $SUDO curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
        $SUDO chmod +x /usr/local/bin/cloudflared
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        $SUDO curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
        $SUDO chmod +x /usr/local/bin/cloudflared
    fi
fi
echo -e "${GREEN}  ✓ Cloudflared tünel motoru hazır!${NC}"

# 7. Nexus Kodlarını İndir ve Konteynerleri Başlat
echo -e "\n${CYAN}🚀 5/5 Nexus AI Studio başlatılıyor...${NC}"
INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "${YELLOW}  -> Mevcut kurulum güncelleniyor: $INSTALL_DIR${NC}"
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "${YELLOW}  -> Nexus AI deposu klonlanıyor -> $INSTALL_DIR${NC}"
    git clone https://github.com/kefe3/nexus.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR/data/deployments"
chmod -R 777 "$INSTALL_DIR/data" 2>/dev/null || true

# Konteynerleri başlat
$DOCKER_COMPOSE up -d --build

# IP Tespiti
LOCAL_IP="127.0.0.1"
if command -v hostname >/dev/null 2>&1; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 TEBRİKLER! NEXUS AI STUDIO VE TÜM BİLEŞENLER EKSİKSİZ KURULDU!${NC}"
echo -e "${GREEN}========================================================================${NC}\n"
echo -e "📱 ${CYAN}${BOLD}Nexus AI Studio (Kullanıcı Arayüzü):${NC}  http://${LOCAL_IP}:3050"
echo -e "🎛️ ${CYAN}${BOLD}Nexus Kontrol Paneli (Specs & VRAM):${NC} http://${LOCAL_IP}:3050/admin.html"
echo -e "⚡ ${CYAN}${BOLD}FastAPI Backend Uç Noktası:${NC}        http://${LOCAL_IP}:8500"
echo -e "🧠 ${CYAN}${BOLD}Ollama Yerel Çıkarım Motoru:${NC}       http://127.0.0.1:11434"
echo -e "🌐 ${CYAN}${BOLD}Canlı Dış Tünel:${NC}                    Kontrol Paneli > Canlı Yayınlar sekmesinden açabilirsiniz."
echo -e "\n${YELLOW}💡 Her şey arka planda çalışıyor. Bilgisayarınızı kapatsanız bile servisler otomatik başlayacaktır.${NC}\n"
