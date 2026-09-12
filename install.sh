#!/usr/bin/env bash
# ==============================================================================
# ⚡ Nexus AI Studio — Evrensel Akıllı Kurulum Betiği (Universal Installer v2.3)
# CachyOS, Arch Linux, Manjaro, EndeavourOS, Ubuntu, Debian, Fedora, CentOS, Alpine, macOS & WSL2
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
echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝"
echo -e "      ${PURPLE}⚡ Self-Hosted AI Studio & Cluster Control Platform${NC}\n"

# 1. Root / Sudo Yetki Kontrolü & TTY Bağlantısı
SUDO=""
if [ "$EUID" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
        # Terminal TTY varsa sudo yetkisini al
        if [ -c /dev/tty ]; then
            sudo -v </dev/tty 2>/dev/null || sudo -v 2>/dev/null || true
        fi
    else
        echo -e "${RED}❌ Hata: Kurulum yapabilmek için root veya sudo yetkisi gereklidir.${NC}"
        exit 1
    fi
fi

# 2. İşletim Sistemi ve Dağıtım Tespiti
OS="$(uname -s)"
ARCH="$(uname -m)"
DISTRO="Linux"
if [ -f /etc/os-release ]; then
    DISTRO=$(grep -E '^PRETTY_NAME=' /etc/os-release | cut -d= -f2 | tr -d '"' || echo "Linux")
fi

echo -e "${YELLOW}🔍 Sistem Analiz Ediliyor: ${BOLD}${DISTRO} (${OS} ${ARCH})${NC}..."

# 3. Temel Araçların Kurulum Fonksiyonu
install_pkg() {
    PKG=$1
    if [ -f /etc/cachyos-release ] || [ -f /etc/arch-release ] || command -v pacman >/dev/null 2>&1; then
        $SUDO pacman -Sy --noconfirm "$PKG"
    elif command -v apt-get >/dev/null 2>&1; then
        $SUDO apt-get update -qq && $SUDO apt-get install -y -qq "$PKG"
    elif command -v dnf >/dev/null 2>&1; then
        $SUDO dnf install -y -q "$PKG"
    elif command -v yum >/dev/null 2>&1; then
        $SUDO yum install -y -q "$PKG"
    elif command -v zypper >/dev/null 2>&1; then
        $SUDO zypper in -y "$PKG"
    elif command -v apk >/dev/null 2>&1; then
        $SUDO apk add "$PKG"
    elif command -v brew >/dev/null 2>&1; then
        brew install "$PKG"
    fi
}

# 3. Temel Araçlar (curl, git, wget, jq)
echo -e "\n${CYAN}📦 1/5 Temel sistem araçları denetleniyor...${NC}"
for tool in curl git wget jq; do
    if ! command -v $tool >/dev/null 2>&1; then
        echo -e "${YELLOW}  -> $tool eksik, otomatik kuruluyor...${NC}"
        install_pkg $tool
    fi
done
echo -e "${GREEN}  ✓ Temel araçlar hazır!${NC}"

# 4. Docker & Docker Compose Kurulumu (CachyOS, Arch, Manjaro, Ubuntu, Fedora, macOS)
echo -e "\n${CYAN}🐳 2/5 Docker & Konteyner Altyapısı denetleniyor...${NC}"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}  -> Docker bulunamadı. Dağıtıma özel (${DISTRO}) kurulum başlatılıyor...${NC}"
    
    if [ -f /etc/cachyos-release ] || [ -f /etc/arch-release ] || command -v pacman >/dev/null 2>&1; then
        # CachyOS, Arch, Manjaro, EndeavourOS
        echo -e "${YELLOW}  -> CachyOS/Arch pacman ile Docker ve Docker Compose kuruluyor...${NC}"
        $SUDO pacman -Sy --noconfirm docker docker-compose
        $SUDO systemctl enable --now docker
        if [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -aG docker "$USER" 2>/dev/null || true
        fi
        echo -e "${GREEN}  ✓ CachyOS/Arch Docker motoru başarıyla kuruldu ve başlatıldı!${NC}"
    elif [ "$OS" = "Linux" ]; then
        # Ubuntu, Debian, Fedora vb.
        if curl -fsSL https://get.docker.com -o /tmp/get-docker.sh; then
            $SUDO sh /tmp/get-docker.sh || {
                echo -e "${YELLOW}  -> Paket yöneticisi ile deneniyor...${NC}"
                install_pkg docker.io || install_pkg docker || true
            }
            rm -f /tmp/get-docker.sh
        fi
        
        if command -v systemctl >/dev/null 2>&1; then
            $SUDO systemctl enable --now docker
        elif command -v service >/dev/null 2>&1; then
            $SUDO service docker start
        fi
        
        if [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -aG docker "$USER" 2>/dev/null || true
        fi
    elif [ "$OS" = "Darwin" ]; then
        echo -e "${YELLOW}  -> macOS Docker Desktop kuruluyor...${NC}"
        brew install --cask docker || true
    fi
else
    echo -e "${GREEN}  ✓ Docker zaten kurulu ($(docker --version))${NC}"
fi

# Docker soket izinlerini aç (Kullanıcı grubu oturumunu beklemeden anında çalıştırır)
if [ -S /var/run/docker.sock ]; then
    $SUDO chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

# Docker Compose kontrolü
DOCKER_COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    else
        echo -e "${YELLOW}  -> Docker Compose kuruluyor...${NC}"
        install_pkg docker-compose || install_pkg docker-compose-plugin || true
        if command -v docker-compose >/dev/null 2>&1; then
            DOCKER_COMPOSE="docker-compose"
        fi
    fi
fi
echo -e "${GREEN}  ✓ Docker Compose hazır!${NC}"

# 5. Ollama Yerel Yapay Zeka Motoru
echo -e "\n${CYAN}🧠 3/5 Ollama Yerel GPU/CPU Motoru denetleniyor...${NC}"
if ! command -v ollama >/dev/null 2>&1; then
    echo -e "${YELLOW}  -> Ollama motoru eksik. Resmi kurulum başlatılıyor...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh
    
    if command -v systemctl >/dev/null 2>&1; then
        $SUDO systemctl enable --now ollama || true
    fi
    sleep 3
    echo -e "${GREEN}  ✓ Ollama motoru kuruldu ve başlatıldı!${NC}"
else
    echo -e "${GREEN}  ✓ Ollama zaten kurulu ve hazır!${NC}"
fi

if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl start ollama 2>/dev/null || true
fi

# Başlangıç modeli kontrolü
if command -v ollama >/dev/null 2>&1; then
    MODEL_COUNT=$(ollama list 2>/dev/null | grep -v 'NAME' | grep -v '^$' | wc -l || echo "0")
    if [ "$MODEL_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}  -> İlk hızlı başlangıç modeli (qwen2.5-coder:1.5b) indiriliyor...${NC}"
        ollama pull qwen2.5-coder:1.5b 2>/dev/null || true
    fi
fi

# 6. Cloudflared Dış Erişim Tüneli
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

# Docker soket iznini ayarla
if [ -S /var/run/docker.sock ]; then
    $SUDO chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

# Konteynerleri başlat (Soket izni açıkken çalıştırır)
if docker info >/dev/null 2>&1; then
    $DOCKER_COMPOSE up -d --build
else
    $SUDO chmod 666 /var/run/docker.sock 2>/dev/null || true
    $SUDO $DOCKER_COMPOSE up -d --build
fi

# IP Tespiti
LOCAL_IP="127.0.0.1"
if command -v hostname >/dev/null 2>&1; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

STUDIO_URL="http://${LOCAL_IP}:3050"
ADMIN_URL="http://${LOCAL_IP}:3050/admin.html"

# Panoya (Clipboard) Kopyalama
COPIED=false
if command -v wl-copy >/dev/null 2>&1; then
    echo -n "$STUDIO_URL" | wl-copy 2>/dev/null && COPIED=true
elif command -v xclip >/dev/null 2>&1; then
    echo -n "$STUDIO_URL" | xclip -selection clipboard 2>/dev/null && COPIED=true
elif command -v pbcopy >/dev/null 2>&1; then
    echo -n "$STUDIO_URL" | pbcopy 2>/dev/null && COPIED=true
fi

# Evrensel ANSI/OSC 52 Terminal Panosu Kopyalama
printf "\033]52;c;%s\a" "$(echo -n "$STUDIO_URL" | base64)" 2>/dev/null || true

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 TEBRİKLER! NEXUS AI STUDIO BAŞARIYLA BAŞLATILDI!${NC}"
echo -e "${GREEN}========================================================================${NC}\n"

echo -e "📱 ${CYAN}${BOLD}Nexus AI Studio:${NC}            ${BOLD}${STUDIO_URL}${NC}"
echo -e "🎛️ ${CYAN}${BOLD}Nexus Kontrol Paneli (Specs):${NC} ${BOLD}${ADMIN_URL}${NC}"
echo -e "⚡ ${CYAN}${BOLD}FastAPI Backend Portu:${NC}        http://${LOCAL_IP}:8500"
echo -e "🧠 ${CYAN}${BOLD}Ollama Yerel Çıkarım Motoru:${NC}  http://127.0.0.1:11434"
echo -e "🌐 ${CYAN}${BOLD}Canlı Dış Tünel:${NC}               Kontrol Paneli > Canlı Yayınlar sekmesinden açabilirsiniz."

if [ "$COPIED" = true ]; then
    echo -e "\n${GREEN}📋 ${BOLD}${STUDIO_URL}${NC} adresi panonuza (clipboard) otomatik kopyalandı! Tarayıcınızda CTRL+V ile yapıştırabilirsiniz.${NC}"
else
    echo -e "\n${GREEN}📋 ${BOLD}${STUDIO_URL}${NC} adresine tarayıcınızdan doğrudan gidebilirsiniz.${NC}"
fi

echo -e "\n${YELLOW}💡 Her şey arka planda çalışıyor. Bilgisayarınızı kapatsanız bile servisler otomatik başlayacaktır.${NC}\n"
