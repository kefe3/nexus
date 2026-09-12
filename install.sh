#!/usr/bin/env bash
# ==============================================================================
# ⚡ Nexus AI Studio — Otomatik & Akıllı Hızlı Kurulum Betiği (Universal Installer)
# Linux (Ubuntu, Debian, Fedora, Arch, CentOS), macOS ve WSL2 Uyumlu
# ==============================================================================

set -e

# Renk kodları
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ███╗   ██╗███████╗██╗   ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗ ██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚████╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝    ╚██╔╝  ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗   ██║   ╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚═════╝ ╚══════╝"
echo -e "         ${PURPLE}⚡ Self-Hosted AI Studio & Control Panel${NC}\n"

# 1. Root / Sudo Yetki Kontrolü
SUDO=""
if [ "$EUID" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
    else
        echo -e "${RED}❌ Hata: Bu betik paket kurulumu yapabilmek için root veya sudo yetkisi gerektirir.${NC}"
        exit 1
    fi
fi

# 2. İşletim Sistemi ve Paket Yöneticisi Tespiti
OS="$(uname -s)"
echo -e "${YELLOW}🔍 Sistem kontrol ediliyor: ${OS} (${NC}$(uname -m)${YELLOW})...${NC}"

install_package() {
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
    else
        echo -e "${RED}❌ Otomatik paket yöneticisi bulunamadı. Lütfen $PKG paketini manuel kurun.${NC}"
    fi
}

# 3. Temel Araçların Kontrolü (curl, git)
if ! command -v curl >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 curl bulunamadı, yükleniyor...${NC}"
    install_package curl
fi

if ! command -v git >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 git bulunamadı, yükleniyor...${NC}"
    install_package git
fi

# 4. Docker & Docker Compose Kontrolü ve Otomatik Kurulumu
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}🐳 Docker sistemde yüklü değil. Resmi Docker kurulumu başlatılıyor...${NC}"
    if [ "$OS" = "Linux" ]; then
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
        $SUDO sh /tmp/get-docker.sh
        rm -f /tmp/get-docker.sh
        
        # Docker servisini başlat ve açılışa ekle
        if command -v systemctl >/dev/null 2>&1; then
            $SUDO systemctl enable --now docker
        elif command -v service >/dev/null 2>&1; then
            $SUDO service docker start
        fi
        
        # Mevcut kullanıcıyı docker grubuna ekle
        if [ -n "$USER" ] && [ "$USER" != "root" ]; then
            $SUDO usermod -aG docker "$USER" 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Docker başarıyla kuruldu ve başlatıldı!${NC}"
    elif [ "$OS" = "Darwin" ]; then
        echo -e "${YELLOW}🍎 macOS tespit edildi. Docker Desktop kurmak için: brew install --cask docker${NC}"
        brew install --cask docker || true
    fi
else
    echo -e "${GREEN}✅ Docker zaten yüklü ($(docker --version))${NC}"
fi

# Docker Compose kontrolü
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${YELLOW}📦 Docker Compose eklentisi kuruluyor...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        $SUDO apt-get update -qq && $SUDO apt-get install -y -qq docker-compose-plugin || true
    fi
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
fi

# 5. Nexus Kaynak Kodunun İndirilmesi veya Güncellenmesi
INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Mevcut kurulum tespit edildi: $INSTALL_DIR (Güncelleniyor...)${NC}"
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "${YELLOW}📥 Nexus AI Studio indiriliyor -> $INSTALL_DIR...${NC}"
    git clone https://github.com/kefe3/nexus.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 6. Dizin İzinleri ve Veri Klasörleri
mkdir -p "$INSTALL_DIR/data/deployments"
chmod -R 777 "$INSTALL_DIR/data" 2>/dev/null || true

# 7. Konteynerleri Başlatma
echo -e "\n${CYAN}🚀 Nexus AI Studio servisleri başlatılıyor...${NC}"
$DOCKER_COMPOSE_CMD up -d --build

# 8. Yerel IP Adresini Bulma
LOCAL_IP="127.0.0.1"
if command -v hostname >/dev/null 2>&1; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 TEBRİKLER! NEXUS AI STUDIO BAŞARIYLA KURULDU VE ÇALIŞIYOR!${NC}"
echo -e "${GREEN}================================================================${NC}\n"
echo -e "📱 ${CYAN}Nexus AI Studio (Kullanıcı Arayüzü):${NC}  http://${LOCAL_IP}:3050"
echo -e "🎛️ ${CYAN}Nexus Kontrol Paneli 2.0:${NC}           http://${LOCAL_IP}:3050/admin.html"
echo -e "⚡ ${CYAN}FastAPI Backend Uç Noktası:${NC}        http://${LOCAL_IP}:8500"
echo -e "🌐 ${CYAN}Dünyaya Açık Tünel & Paylaşım:${NC}     Kontrol Paneli > Canlı Yayınlar sekmesinden açabilirsiniz."
echo -e "\n${YELLOW}💡 İpucu: Sistemi durdurmak için 'cd $INSTALL_DIR && docker compose down', yeniden başlatmak için 'docker compose restart' yazabilirsiniz.${NC}\n"
