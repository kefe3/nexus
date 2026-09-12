#!/usr/bin/env bash
# ==============================================================================
# 🗑️ Nexus AI Studio — Evrensel Kaldırma Betiği (Universal Uninstaller v1.0)
# CachyOS, Arch Linux, Manjaro, Ubuntu, Debian, Fedora, macOS & WSL2
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
            echo "  --purge-data       Sohbet geçmişi ve ayarları da içeren 'data/' dizinini siler."
            echo "  --keep-data        'data/' dizinini kesinlikle korur."
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
echo -e "      ${YELLOW}⚠️ Nexus AI Studio Kaldırma ve Temizlik Sihirbazı${NC}\n"

# Çalışma Dizinini Belirle
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kullanıcı Onayı
if [ "$AUTO_YES" = false ]; then
    echo -e "${YELLOW}Nexus AI Studio konteynerleri durdurulacak ve sistemden kaldırılacaktır.${NC}"
    read -p "Devam etmek istiyor musunuz? [E/h]: " CONFIRM_UNINSTALL </dev/tty || CONFIRM_UNINSTALL="E"
    CONFIRM_UNINSTALL=${CONFIRM_UNINSTALL:-E}
    if [[ ! "$CONFIRM_UNINSTALL" =~ ^[eEyY] ]]; then
        echo -e "\n${CYAN}Kaldırma işlemi iptal edildi.${NC}"
        exit 0
    fi

    if [ "$PURGE_DATA" = false ] && [ "$KEEP_DATA" = false ]; then
        echo -e "\n${YELLOW}📁 Kullanıcı Verileri:${NC}"
        echo -e "Sohbet geçmişleri, kayıtlı API anahtarları ve paylaşılan projeler '${BOLD}data/${NC}' klasöründe tutulmaktadır."
        read -p "Bu verileri de tamamen silmek istiyor musunuz? [e/H]: " CONFIRM_DATA </dev/tty || CONFIRM_DATA="H"
        CONFIRM_DATA=${CONFIRM_DATA:-H}
        if [[ "$CONFIRM_DATA" =~ ^[eEyY] ]]; then
            PURGE_DATA=true
        fi
    fi
fi

echo -e "\n${CYAN}🛑 1/4 Nexus Konteynerleri ve Ağları durduruluyor...${NC}"
if command -v docker >/dev/null 2>&1; then
    # Docker compose down
    if docker compose version >/dev/null 2>&1; then
        docker compose down --remove-orphans 2>/dev/null || true
    elif command -v docker-compose >/dev/null 2>&1; then
        docker-compose down --remove-orphans 2>/dev/null || true
    fi

    # Ekstra nexus konteynerlerini durdur
    for c in nexus-frontend nexus-backend nexus-ollama; do
        if docker ps -a -q -f name=$c | grep -q .; then
            echo -e "  -> Konteyner durduruluyor: $c"
            docker rm -f $c 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}  ✓ Konteynerler başarıyla durduruldu ve kaldırıldı!${NC}"
else
    echo -e "${YELLOW}  -> Docker bulunamadı, bu adım atlandı.${NC}"
fi

echo -e "\n${CYAN}🧹 2/4 Nexus Docker İmajları temizleniyor...${NC}"
if command -v docker >/dev/null 2>&1; then
    for img in nexus-ai-frontend nexus-ai-backend nexus-self-hosted-frontend nexus-self-hosted-backend; do
        if docker images -q "$img" 2>/dev/null | grep -q .; then
            echo -e "  -> İmaj siliniyor: $img"
            docker rmi -f "$img" 2>/dev/null || true
        fi
    done
    echo -e "${GREEN}  ✓ Nexus imajları temizlendi!${NC}"
fi

echo -e "\n${CYAN}🌐 3/4 Çalışan Tünel Süreçleri denetleniyor...${NC}"
if pgrep -f "cloudflared" >/dev/null 2>&1; then
    echo -e "  -> Nexus Cloudflare tünel süreçleri sonlandırılıyor..."
    pkill -f "cloudflared" 2>/dev/null || true
fi
echo -e "${GREEN}  ✓ Ağ süreçleri temizlendi!${NC}"

echo -e "\n${CYAN}📁 4/4 Dosya ve Dizin Temizliği...${NC}"
if [ "$PURGE_DATA" = true ]; then
    if [ -d "data" ]; then
        echo -e "  -> 'data/' dizini siliniyor..."
        rm -rf data
        echo -e "${GREEN}  ✓ Kullanıcı verileri ve ayarları tamamen silindi.${NC}"
    fi
else
    echo -e "${CYAN}  ℹ️ 'data/' dizini korundu. (İleride tekrar kurarsanız verileriniz korunacaktır)${NC}"
fi

echo -e "\n${GREEN}${BOLD}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🎉 Nexus AI Studio başarıyla sisteminizden kaldırıldı!${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Tekrar kurmak isterseniz dilediğiniz zaman tek komutla kurabilirsiniz:${NC}"
echo -e "${BOLD}curl -fsSL https://raw.githubusercontent.com/kefe3/nexus/main/install.sh | bash${NC}\n"
