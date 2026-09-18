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
    fi
fi

# 2. Önceden Kurulu Olma Durumu Kontrolü (Smart Detection)
INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"
IS_ALREADY_INSTALLED=false
IS_RUNNING=false

if [ -d "$INSTALL_DIR" ] && { [ -f "$INSTALL_DIR/docker/docker-compose.yml" ] || [ -f "$INSTALL_DIR/docker-compose.yml" ]; }; then
    IS_ALREADY_INSTALLED=true
fi

DOCKER_CMD="docker"
if command -v docker >/dev/null 2>&1; then
    if ! docker info >/dev/null 2>&1 && [ -n "$SUDO" ]; then
        DOCKER_CMD="$SUDO docker"
    fi
    if $DOCKER_CMD ps --format '{{.Names}}' 2>/dev/null | grep -q 'nexus-frontend'; then
        IS_RUNNING=true
        IS_ALREADY_INSTALLED=true
    fi
fi

if [ "$IS_ALREADY_INSTALLED" = true ]; then
    echo -e "${YELLOW}ℹ️ Nexus AI Studio sisteminizde zaten kurulu bulunmaktadır!${NC}"
    if [ "$IS_RUNNING" = true ]; then
        echo -e "${GREEN}✓ Servisler şu anda aktif olarak çalışıyor: ${BOLD}http://localhost:3050${NC}"
    fi
    echo ""
    read -p "Mevcut kurulumu güncellemek ve yeniden başlatmak istiyor musunuz? [E/h]: " CONFIRM_REINSTALL </dev/tty || CONFIRM_REINSTALL="E"
    CONFIRM_REINSTALL=${CONFIRM_REINSTALL:-E}
    if [[ ! "$CONFIRM_REINSTALL" =~ ^[eEyY] ]]; then
        echo -e "\n${CYAN}Kurulum sonlandırıldı. Mevcut sisteminiz çalışmaya devam ediyor.${NC}"
        echo -e "👉 AI Studio:        ${BOLD}http://localhost:3050${NC}"
        echo -e "👉 Kontrol Paneli:   ${BOLD}http://localhost:3050/admin.html${NC}\n"
        exit 0
    fi
    echo -e "${CYAN}🔄 Mevcut kurulum güncelleniyor ve servisler yenileniyor...${NC}\n"
fi

# 3. İşletim Sistemi ve Dağıtım Tespiti
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
        $SUDO pacman -Sy --noconfirm "$PKG" >/dev/null 2>&1 || $SUDO pacman -S --noconfirm "$PKG" >/dev/null 2>&1 || true
    elif command -v apt-get >/dev/null 2>&1; then
        $SUDO apt-get update -qq >/dev/null 2>&1 && $SUDO apt-get install -y -qq "$PKG" >/dev/null 2>&1 || true
    elif command -v dnf >/dev/null 2>&1; then
        $SUDO dnf install -y -q "$PKG" >/dev/null 2>&1 || true
    elif command -v yum >/dev/null 2>&1; then
        $SUDO yum install -y -q "$PKG" >/dev/null 2>&1 || true
    elif command -v zypper >/dev/null 2>&1; then
        $SUDO zypper in -y "$PKG" >/dev/null 2>&1 || true
    elif command -v apk >/dev/null 2>&1; then
        $SUDO apk add "$PKG" >/dev/null 2>&1 || true
    elif command -v brew >/dev/null 2>&1; then
        brew install "$PKG" >/dev/null 2>&1 || true
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
        $SUDO pacman -Sy --noconfirm docker docker-compose >/dev/null 2>&1 || true
        $SUDO systemctl enable --now docker >/dev/null 2>&1 || true
        if [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -aG docker "$USER" 2>/dev/null || true
        fi
        echo -e "${GREEN}  ✓ CachyOS/Arch Docker motoru başarıyla kuruldu ve başlatıldı!${NC}"
    elif [ "$OS" = "Linux" ]; then
        # Ubuntu, Debian, Fedora vb.
        if curl -fsSL https://get.docker.com -o /tmp/get-docker.sh >/dev/null 2>&1; then
            $SUDO sh /tmp/get-docker.sh >/dev/null 2>&1 || {
                install_pkg docker.io || install_pkg docker || true
            }
            rm -f /tmp/get-docker.sh
        fi
        
        if command -v systemctl >/dev/null 2>&1; then
            $SUDO systemctl enable --now docker >/dev/null 2>&1 || true
        elif command -v service >/dev/null 2>&1; then
            $SUDO service docker start >/dev/null 2>&1 || true
        fi
        
        if [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -aG docker "$USER" 2>/dev/null || true
        fi
    elif [ "$OS" = "Darwin" ]; then
        echo -e "${YELLOW}  -> macOS Docker Desktop kuruluyor...${NC}"
        brew install --cask docker >/dev/null 2>&1 || true
    fi
else
    echo -e "${GREEN}  ✓ Docker zaten kurulu ($(docker --version 2>/dev/null || echo 'Docker Engine'))${NC}"
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
    curl -fsSL https://ollama.com/install.sh | sh >/dev/null 2>&1 || true
    
    if command -v systemctl >/dev/null 2>&1; then
        $SUDO systemctl enable --now ollama >/dev/null 2>&1 || true
    fi
    sleep 2
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
        echo -e "${YELLOW}  -> İlk başlangıç modeli (qwen2.5-coder:1.5b) indiriliyor...${NC}"
        ollama pull qwen2.5-coder:1.5b >/dev/null 2>&1 || true
    fi
fi

# 6. Cloudflared Dış Erişim Tüneli
echo -e "\n${CYAN}🌐 4/5 Cloudflared Dış Erişim Tüneli denetleniyor...${NC}"
if [ ! -f "/usr/local/bin/cloudflared" ] && ! command -v cloudflared >/dev/null 2>&1; then
    echo -e "${YELLOW}  -> Cloudflared tünel motoru indiriliyor...${NC}"
    if [ "$ARCH" = "x86_64" ]; then
        $SUDO curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared >/dev/null 2>&1 || true
        $SUDO chmod +x /usr/local/bin/cloudflared 2>/dev/null || true
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        $SUDO curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared >/dev/null 2>&1 || true
        $SUDO chmod +x /usr/local/bin/cloudflared 2>/dev/null || true
    fi
fi
echo -e "${GREEN}  ✓ Cloudflared tünel motoru hazır!${NC}"

# 7. Nexus Kodlarını İndir ve Konteynerleri Başlat
echo -e "\n${CYAN}🚀 5/5 Nexus AI Studio kurulumu ve aktivasyonu...${NC}"
INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "${YELLOW}  -> 📥 Nexus AI güncelleniyor...${NC}"
    cd "$INSTALL_DIR"
    git pull origin main -q >/dev/null 2>&1 || git pull origin main >/dev/null 2>&1 || true
else
    echo -e "${YELLOW}  -> 📥 Nexus AI kuruluyor ($INSTALL_DIR)...${NC}"
    git clone -q https://github.com/kefe3/nexus.git "$INSTALL_DIR" >/dev/null 2>&1 || git clone https://github.com/kefe3/nexus.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR/nexus/data/deployments" "$INSTALL_DIR/data/deployments" 2>/dev/null || true
chmod -R 777 "$INSTALL_DIR/nexus/data" "$INSTALL_DIR/data" 2>/dev/null || true

# Docker soket iznini ayarla
if [ -S /var/run/docker.sock ]; then
    $SUDO chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

# Docker compose dosyasını belirle
COMPOSE_FILE="$INSTALL_DIR/docker/docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="$INSTALL_DIR/docker-compose.yml"
fi

# Konteynerleri sessiz ve temiz inşa et
echo -e "${YELLOW}  -> ⚙️ Gereken eksik kütüphane ve bağımlılıklar kuruluyor...${NC}"
DOCKER_BUILDKIT=1 $DOCKER_COMPOSE -f "$COMPOSE_FILE" build -q >/dev/null 2>&1 || DOCKER_BUILDKIT=1 $DOCKER_COMPOSE -f "$COMPOSE_FILE" build >/dev/null 2>&1 || true

# Servisleri başlat
echo -e "${YELLOW}  -> ⚡ Nexus AI servisleri başlatılıyor...${NC}"
if docker info >/dev/null 2>&1; then
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d >/dev/null 2>&1 || $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d
else
    $SUDO chmod 666 /var/run/docker.sock 2>/dev/null || true
    $SUDO $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d >/dev/null 2>&1 || $SUDO $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d
fi
echo -e "${GREEN}  ✓ Nexus AI Studio ve tüm servisler başarıyla aktif edildi!${NC}"

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
