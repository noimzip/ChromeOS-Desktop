echo "---------------------------------------------------------------------------------------------------------";
echo "  ____              _  __        ___     _            _         __  __                                   ";
echo " / ___|  ___  _   _| | \\ \\      / (_) __| | __ _  ___| |_ ___  |  \\/  | __ _ _ __   __ _  __ _  ___ _ __ ";
echo " \\___ \\ / _ \\| | | | |  \\ \\ /\\ / /| |/ _\` |/ _\` |/ _ \\ __/ __| | |\\/| |/ _\` | '_ \\ / _\` |/ _\` |/ _ \\ '__|";
echo "  ___) | (_) | |_| | |   \\ V  V / | | (_| | (_| |  __/ |_\\__ \\ | |  | | (_| | | | | (_| | (_| |  __/ |   ";
echo " |____/ \\___/ \\__,_|_|    \\_/\\_/  |_|\\__,_|\\__, |\\___|\\__|___/ |_|  |_|\\__,_|_| |_|\\__,_|\\__, |\\___|_|   ";
echo "                                           |___/                                         |___/           ";
echo "---------------------------------------------------------------------------------------------------------";
echo "Would you like to install Soul Widgets Manager? (y/n)";
read install_choice
if [ "$install_choice" = "y" ] || [ "$install_choice" = "Y" ]; then
    echo "Installing Soul Widgets Manager...";
    sudo apt install -y nodejs npm libnss3
    npm install
    npm update
    echo "Installation complete!";
    
    echo "Would you like to download Linux VM AutoStart Extension? (y/n)";
    read autostart_choice
    if [ "$autostart_choice" = "y" ] || [ "$autostart_choice" = "Y" ]; then
        echo "Downloading Linux VM AutoStart Extension...";
        sudo apt install -y git
        git clone https://github.com/supechicken/ChromeOS-AutoStart.git
    else
        echo "AutoStart extension installation canceled.";
    fi
else
    echo "Installation canceled.";
fi