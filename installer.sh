#!/bin/bash

# Soul Widgets Manager Installer

# bash または zsh で実行されているかチェック
if [ -z "$BASH_VERSION" ] && [ -z "$ZSH_VERSION" ]; then
    echo "Warning: This script is optimized for bash/zsh. Using 'sh' may cause unexpected behavior."
    echo "Recommended: 'bash installer.sh' or './installer.sh'"
    echo "--------------------------------------------------"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "---------------------------------------------------------------------------------------------------------"
echo "  ____              _  __        ___     _            _         __  __                                   "
echo " / ___|  ___  _   _| | \\ \\      / (_) __| | __ _  ___| |_ ___  |  \\/  | __ _ _ __   __ _  __ _  ___ _ __ "
echo " \\___ \\ / _ \\| | | | |  \\ \\ /\\ / /| |/ _\` |/ _\` |/ _ \\ __/ __| | |\\/| |/ _\` | '_ \\ / _\` |/ _\` |/ _ \\ '__|"
echo "  ___) | (_) | |_| | |   \\ V  V / | | (_| | (_| |  __/ |_\\__ \\ | |  | | (_| | | | | (_| | (_| |  __/ |   "
echo " |____/ \\___/ \\__,_|_|    \\_/\\_/  |_|\\__,_|\\__, |\\___|\\__|___/ |_|  |_|\\__,_|_| |_|\\__,_|\\__, |\\___|_|   "
echo "                                           |___/                                         |___/           "
echo "---------------------------------------------------------------------------------------------------------"

echo -e "${BLUE}Would you like to install Soul Widgets Manager? (y/n)${NC}"
read -r install_choice

if [[ "$install_choice" =~ ^[yY]$ ]]; then
    echo -e "${GREEN}Starting installation...${NC}"

    # Update package list
    echo -e "${BLUE}Updating package lists...${NC}"
    sudo apt update

    # Install system dependencies
    # nodejs/npm: Runtime
    # playerctl: Media player widget control
    # xdg-utils: For xdg-open (opening files/folders)
    # libnss3, libatk, etc.: Required for Electron to run on Linux
    echo -e "${BLUE}Installing system dependencies...${NC}"
    sudo apt install -y \
        nodejs \
        npm \
        playerctl \
        xdg-utils \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libgtk-3-0 \
        libgbm1 \
        libasound2 \
        git

    # Install Node.js dependencies
    echo -e "${BLUE}Installing Node.js packages...${NC}"
    if [ -f "package.json" ]; then
        npm install --production
        echo -e "${GREEN}Node.js dependencies installed successfully.${NC}"
    else
        echo -e "${RED}Error: package.json not found!${NC}"
        exit 1
    fi

    echo -e "${GREEN}Core installation complete!${NC}"
    
    # Optional: AutoStart Extension
    echo -e "${BLUE}Would you like to download Linux VM AutoStart Extension? (y/n)${NC}"
    read -r autostart_choice
    if [[ "$autostart_choice" =~ ^[yY]$ ]]; then
        echo -e "${BLUE}Downloading Linux VM AutoStart Extension...${NC}"
        if [ -d "ChromeOS-AutoStart" ]; then
            echo -e "${BLUE}AutoStart directory already exists. Pulling latest changes...${NC}"
            cd ChromeOS-AutoStart && git pull && cd ..
        else
            git clone https://github.com/supechicken/ChromeOS-AutoStart.git
        fi
        echo -e "${GREEN}AutoStart extension downloaded.${NC}"
    else
        echo -e "${BLUE}AutoStart extension installation skipped.${NC}"
    fi

    echo -e "${GREEN}--------------------------------------------------${NC}"
    echo -e "${GREEN}Soul Widgets Manager is now ready!${NC}"
    echo -e "${BLUE}To start the application, run:${NC}"
    echo -e "  sh startup.sh"
    echo -e "${BLUE}Don't forget to sideload the extension in /chrome_extension!${NC}"
    echo -e "${GREEN}--------------------------------------------------${NC}"
else
    echo -e "${RED}Installation canceled.${NC}"
fi
