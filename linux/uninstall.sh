#!/usr/bin/env bash
# ==============================================================================
# 🗑️ Nexus AI Studio — Evrensel Akıllı Kaldırma Betiği (Universal Uninstaller v2.0)
# CachyOS, Arch Linux, Manjaro, EndeavourOS, Ubuntu, Debian, Fedora, CentOS, macOS & WSL2
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

AUTO_YES=false
PURGE_DATA=false
KEEP_DATA=false

# Argümanları ayrıştır
for arg in "$@"; do
    case $arg in
        -y|--yes)
            AUTO_YES=true
            ;;
        --purge-data)
            PURGE_DATA=true
            ;;
        --keep-data)
            KEEP_DATA=true
            ;;
        -h|--help)
            echo "Kullanım: ./uninstall.sh [SEÇENEKLER]"
            echo ""
            echo "Seçenekler:"
            echo "  -y, --yes          Tüm onayları otomatik olarak 'Evet' kabul eder."
            echo "  --purge-data       Sohbet geçmişi ve ayarları da içeren 'data/' dizini dahil tüm dosyaları siler."
            echo "  --keep-data        'data/' dizinini korur, yalnızca konteyner ve kodları siler."
            echo "  -h, --help         Bu yardım mesajını görüntüler."
            exit 0
            ;;
    esac
done

clear || true
echo -e "${RED}${BOLD}"
echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝"
echo -e "      ${YELLOW}🗑️ Nexus AI Studio Kaldırma ve Tam Temizlik Sihirbazı${NC}\n"

# 1. Sudo ve İzin Yönetimi
SUDO=""
if [ "$EUID" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
        if [ -c /dev/tty ]; then
            sudo -v </dev/tty 2>/dev/null || sudo -v 2>/dev/null || true
        fi
    fi
fi

# 2. Docker Komut Sarmalayıcısı
DOCKER_CMD="docker"
if command -v docker >/dev/null 2>&1; then
    if ! docker info >/dev/null 2>&1; then
        if [ -n "$SUDO" ] && $SUDO docker info >/dev/null 2>&1; then
            DOCKER_CMD="$SUDO docker"
        fi
    fi
fi

# 3. Nexus Kurulum Dizini Tespiti
FOUND_INSTALL_DIR=""
CANDIDATES=(
    "${NEXUS_DIR:-}"
    "$PWD"
    "$HOME/nexus"
    "$HOME/.nexus"
    "/opt/nexus"
)

for dir in "${CANDIDATES[@]}"; do
    if [ -n "$dir" ] && [ -d "$dir" ] && [ -f "$dir/docker-compose.yml" ]; then
        if grep -E -q "nexus-frontend|nexus-backend" "$dir/docker-compose.yml" 2>/dev/null; then
            FOUND_INSTALL_DIR="$(cd "$dir" && pwd)"
            break
        fi
    fi
done

if [ -z "$FOUND_INSTALL_DIR" ] && [ -d "$HOME/nexus" ]; then
    FOUND_INSTALL_DIR="$HOME/nexus"
fi

# 4. Çalışan Konteyner & İmaj Tespiti
CONTAINERS_FOUND=()
if command -v docker >/dev/null 2>&1; then
    RUNNING_LIST=$($DOCKER_CMD ps -a --format '{{.Names}}' 2>/dev/null || true)
    for c in nexus-frontend nexus-backend nexus-ollama nexus-ai-frontend nexus-ai-backend; do
        if echo "$RUNNING_LIST" | grep -q "^${c}$"; then
            CONTAINERS_FOUND+=("$c")
        fi
    done
fi

# Eğer ne dizin ne konteyner bulunamadıysa
if [ -z "$FOUND_INSTALL_DIR" ] && [ ${#CONTAINERS_FOUND[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ Sisteminizde herhangi bir çalışan Nexus AI konteyneri veya kurulum kalıntısı bulunmuyor.${NC}"
    echo -e "${CYAN}Sisteminiz zaten tamamen temiz durumdadır.${NC}\n"
    exit 0
fi

# 5. Kullanıcı Onayı
if [ "$AUTO_YES" = false ]; then
    echo -e "${YELLOW}Nexus AI Studio sisteminizden tamamen kaldırılacaktır.${NC}"
    if [ -n "$FOUND_INSTALL_DIR" ]; then
        echo -e "📁 Tespit Edilen Dizin: ${BOLD}${FOUND_INSTALL_DIR}${NC}"
    fi
    if [ ${#CONTAINERS_FOUND[@]} -gt 0 ]; then
        echo -e "🐳 Tespit Edilen Konteynerler: ${BOLD}${CONTAINERS_FOUND[*]}${NC}"
    fi
    echo ""
    read -p "Kaldırma işlemine devam etmek istiyor musunuz? [E/h]: " CONFIRM_UNINSTALL </dev/tty || CONFIRM_UNINSTALL="E"
    CONFIRM_UNINSTALL=${CONFIRM_UNINSTALL:-E}
    if [[ ! "$CONFIRM_UNINSTALL" =~ ^[eEyY] ]]; then
        echo -e "\n${CYAN}Kaldırma işlemi kullanıcı tarafından iptal edildi.${NC}\n"
        exit 0
    fi

    if [ "$PURGE_DATA" = false ] && [ "$KEEP_DATA" = false ]; then
        echo -e "\n${YELLOW}📁 Kullanıcı Verileri:${NC}"
        echo -e "Sohbet geçmişleri, kayıtlı API anahtarları ve paylaşılan web projeleri 'data/' klasöründe saklanmaktadır."
        read -p "Bu verileri de TAMAMEN silmek istiyor musunuz? [e/H]: " CONFIRM_DATA </dev/tty || CONFIRM_DATA="H"
        CONFIRM_DATA=${CONFIRM_DATA:-H}
        if [[ "$CONFIRM_DATA" =~ ^[eEyY] ]]; then
            PURGE_DATA=true
        fi
    fi
fi

# 6. Adım 1/4: Konteynerlerin ve Ağların Durdurulması
echo -e "\n${CYAN}🛑 1/4 Nexus Konteynerleri ve Ağları durduruluyor...${NC}"
if command -v docker >/dev/null 2>&1; then
    if [ -n "$FOUND_INSTALL_DIR" ] && [ -f "$FOUND_INSTALL_DIR/docker-compose.yml" ]; then
        cd "$FOUND_INSTALL_DIR"
        $DOCKER_CMD compose down --remove-orphans 2>/dev/null || $DOCKER_CMD-compose down --remove-orphans 2>/dev/null || true
    fi

    for c in nexus-frontend nexus-backend nexus-ollama nexus-ai-frontend nexus-ai-backend; do
        if $DOCKER_CMD ps -a -q -f "name=^${c}$" 2>/dev/null | grep -q .; then
            echo -e "  -> Konteyner zorla durdurulup siliniyor: ${BOLD}$c${NC}"
            $DOCKER_CMD rm -f "$c" 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}  ✓ Konteynerler başarıyla durduruldu ve kaldırıldı!${NC}"
else
    echo -e "${YELLOW}  -> Docker bulunamadı, konteyner adımı atlandı.${NC}"
fi

# 7. Adım 2/4: Nexus Docker İmajlarının Temizlenmesi
echo -e "\n${CYAN}🧹 2/4 Nexus Docker İmajları temizleniyor...${NC}"
if command -v docker >/dev/null 2>&1; then
    for img in nexus-frontend nexus-backend nexus-ai-frontend nexus-ai-backend nexus-self-hosted-frontend nexus-self-hosted-backend; do
        if $DOCKER_CMD images -q "$img" 2>/dev/null | grep -q .; then
            echo -e "  -> İmaj siliniyor: ${BOLD}$img${NC}"
            $DOCKER_CMD rmi -f "$img" 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}  ✓ Nexus imajları temizlendi!${NC}"
fi

# 8. Adım 3/4: Cloudflare Tünel Süreçlerinin Sonlandırılması
echo -e "\n${CYAN}🌐 3/4 Çalışan Tünel Süreçleri denetleniyor...${NC}"
if pgrep -f "cloudflared.*3050" >/dev/null 2>&1 || pgrep -f "cloudflared.*8500" >/dev/null 2>&1 || pgrep -f "cloudflared.*tunnel" >/dev/null 2>&1; then
    echo -e "  -> Nexus Cloudflare tünel süreçleri sonlandırılıyor..."
    pkill -f "cloudflared.*3050" 2>/dev/null || true
    pkill -f "cloudflared.*8500" 2>/dev/null || true
    pkill -f "cloudflared.*tunnel" 2>/dev/null || true
fi
echo -e "${GREEN}  ✓ Ağ süreçleri temizlendi!${NC}"

# 9. Adım 4/4: Dizin ve Dosya Temizliği
echo -e "\n${CYAN}📁 4/4 Dosya ve Dizin Temizliği...${NC}"
if [ -n "$FOUND_INSTALL_DIR" ] && [ -d "$FOUND_INSTALL_DIR" ]; then
    if [ "$PURGE_DATA" = true ]; then
        echo -e "  -> '${BOLD}${FOUND_INSTALL_DIR}${NC}' dizini tamamen siliniyor..."
        $SUDO rm -rf "$FOUND_INSTALL_DIR" 2>/dev/null || rm -rf "$FOUND_INSTALL_DIR" 2>/dev/null || true
        echo -e "${GREEN}  ✓ Tüm dosyalar, ayarlar ve sohbet geçmişi tamamen silindi.${NC}"
    else
        echo -e "  -> Nexus kaynak kodları temizleniyor ('data/' dizini korunuyor)..."
        # data/ dışındaki tüm dosya ve klasörleri temizle
        find "$FOUND_INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' -exec $SUDO rm -rf {} + 2>/dev/null || true
        echo -e "${CYAN}  ℹ️ 'data/' dizini korundu (${FOUND_INSTALL_DIR}/data).${NC}"
    fi
else
    echo -e "${GREEN}  ✓ Dizin kalıntısı bulunmadı.${NC}"
fi

echo -e "\n${GREEN}${BOLD}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🎉 NEXUS AI STUDIO BAŞARIYLA VE TAMAMEN SİSTEMİNİZDEN KALDIRILDI!${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════════════════${NC}\n"
echo -e "${CYAN}İleride tekrar kurmak isterseniz tek komutla kurabilirsiniz:${NC}"
echo -e "${BOLD}curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash${NC}\n"
