#!/usr/bin/env bash
# ==============================================================================
# 🍎 Nexus AI Studio — macOS Universal Installer v3.2.1 (Apple Silicon & Intel)
# ==============================================================================

set -e

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
echo -e "      ${PURPLE}🍎 macOS Dedicated AI Studio & Local LLM Platform v3.2.1${NC}\n"

# Architecture detection
ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
    echo -e "${GREEN}⚡ Detected Apple Silicon (${ARCH}) — Apple Metal GPU acceleration enabled!${NC}"
else
    echo -e "${YELLOW}ℹ️  Detected Intel Mac (${ARCH})${NC}"
fi

INSTALL_DIR="${NEXUS_DIR:-$HOME/nexus}"

# 1. Check Homebrew
echo -e "\n${CYAN}📦 [1/5] Checking Homebrew package manager...${NC}"
if ! command -v brew >/dev/null 2>&1; then
    echo -e "${YELLOW}  ⏳ Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    if [ -f "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -f "/usr/local/bin/brew" ]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo -e "${GREEN}  ✓ Homebrew is ready!${NC}"
fi

# 2. Check Git & Clone / Update Repo
echo -e "\n${CYAN}📥 [2/5] Preparing Nexus AI Studio files (${INSTALL_DIR})...${NC}"
if ! command -v git >/dev/null 2>&1; then
    brew install git
fi

if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    git pull origin main --quiet || true
    echo -e "${GREEN}  ✓ Repository updated to latest version!${NC}"
else
    git clone --quiet https://github.com/kefe3/nexus.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo -e "${GREEN}  ✓ Repository cloned!${NC}"
fi

# 3. Check Python 3.10+
echo -e "\n${CYAN}🐍 [3/5] Setting up Python environment...${NC}"
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${YELLOW}  ⏳ Installing Python 3.11 via Homebrew...${NC}"
    brew install python@3.11
fi

PY_CMD="python3"
if command -v python3.11 >/dev/null 2>&1; then
    PY_CMD="python3.11"
fi

# Setup Virtual Environment
if [ ! -d "$INSTALL_DIR/nexus/backend/venv" ]; then
    echo -e "  ⚙️ Creating Python virtual environment (venv)..."
    $PY_CMD -m venv "$INSTALL_DIR/nexus/backend/venv"
fi

source "$INSTALL_DIR/nexus/backend/venv/bin/activate"
pip install --upgrade pip >/dev/null 2>&1

echo -e "  📦 Installing backend dependencies..."
if [ -f "$INSTALL_DIR/nexus/backend/requirements.txt" ]; then
    pip install -r "$INSTALL_DIR/nexus/backend/requirements.txt" --quiet
elif [ -f "$INSTALL_DIR/backend/requirements.txt" ]; then
    pip install -r "$INSTALL_DIR/backend/requirements.txt" --quiet
fi
echo -e "${GREEN}  ✓ Python dependencies installed!${NC}"

# 4. Check Ollama AI Engine
echo -e "\n${CYAN}🦙 [4/5] Checking Ollama AI Engine...${NC}"
if ! command -v ollama >/dev/null 2>&1; then
    echo -e "${YELLOW}  ⏳ Installing Ollama via Homebrew...${NC}"
    brew install ollama || true
fi

if command -v ollama >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Ollama AI Engine is ready!${NC}"
else
    echo -e "${YELLOW}  ℹ️  If Ollama is not installed via brew, download the macOS app from: https://ollama.com/download${NC}"
fi

# 5. Create Desktop Launcher & Permissions
echo -e "\n${CYAN}🖥️  [5/5] Creating Desktop Launcher...${NC}"
LAUNCHER_SCRIPT="$INSTALL_DIR/macos/Nexus-Mac-Start.command"
STOP_SCRIPT="$INSTALL_DIR/macos/Nexus-Mac-Stop.command"
UPDATE_SCRIPT="$INSTALL_DIR/macos/Nexus-Mac-Update.command"

chmod +x "$LAUNCHER_SCRIPT" "$STOP_SCRIPT" "$UPDATE_SCRIPT" 2>/dev/null || true
chmod +x "$INSTALL_DIR/macos/"*.sh 2>/dev/null || true
chmod +x "$INSTALL_DIR/installation/"*.sh 2>/dev/null || true

# Create Desktop Shortcut
DESKTOP_LAUNCHER="$HOME/Desktop/Nexus AI Studio.command"
cat << 'EOF' > "$DESKTOP_LAUNCHER"
#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="$HOME/nexus"
if [ -f "$INSTALL_DIR/macos/Nexus-Mac-Start.command" ]; then
    bash "$INSTALL_DIR/macos/Nexus-Mac-Start.command"
elif [ -f "$INSTALL_DIR/macos/start.sh" ]; then
    bash "$INSTALL_DIR/macos/start.sh"
fi
EOF
chmod +x "$DESKTOP_LAUNCHER"
echo -e "${GREEN}  ✓ Desktop launcher created: ~/Desktop/Nexus AI Studio.command${NC}"

echo -e "\n${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}✅ Nexus AI Studio v3.2.1 is successfully installed on macOS!${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "  • Start:           Double-click '${BOLD}Nexus AI Studio.command${NC}' on your Desktop"
echo -e "  • Terminal Start:  ${BOLD}bash $INSTALL_DIR/macos/start.sh${NC}"
echo -e "  • Stop:            ${BOLD}bash $INSTALL_DIR/macos/stop.sh${NC}"
echo -e "  • Web UI:          ${BOLD}http://localhost:3050${NC}"
echo -e "  • Control Panel:   ${BOLD}http://localhost:3050/admin.html${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}\n"

read -p "Would you like to start Nexus AI Studio now? (Y/n): " -n 1 -r START_NOW
echo
if [[ $START_NOW =~ ^[Yy]$ ]] || [[ -z $START_NOW ]]; then
    bash "$INSTALL_DIR/macos/Nexus-Mac-Start.command"
fi
