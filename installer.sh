echo "------------------------------------------------------------------";
echo "   ____       ___  ____   __        ___     _            _       ";
echo "  / ___|_ __ / _ \\/ ___|  \\ \\      / (_) __| | __ _  ___| |_ ___ ";
echo " | |   | '__| | | \\___ \\   \\ \\ /\\ / /| |/ _\` |/ _\` |/ _ \\ __/ __|";
echo " | |___| |  | |_| |___) |   \\ V  V / | | (_| | (_| |  __/ |_\\__ \\";
echo "  \\____|_|   \\___/|____/     \\_/\\_/  |_|\\__,_|\\__, |\\___|\\__|___/";
echo "                                              |___/              ";
echo "------------------------------------------------------------------";
echo "Would you like to install CrOS Widgets? (y/n)";
read install_choice
if [ "$install_choice" = "y" ] || [ "$install_choice" = "Y" ]; then
    echo "Installing CrOS Widgets...";
    sudo apt install nodejs npm libnss3
    cd CrOS-Widgets
    npm install
    npm update
    echo "Installation complete! You can find CrOS Widgets in your application menu.";
else
    echo "Installation canceled.";
fi