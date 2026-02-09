# Installation

## Prerequisites

Before installing, ensure your Chromebook meets these requirements:

1.  **Linux (Crostini) Enabled:** You must have the Linux development environment turned on in ChromeOS settings.
2.  **GPU Acceleration:** For smooth animations, ensure "Crostini GPU Support" is enabled in `chrome://flags`.
3.  **Git:** If not installed, run `sudo apt install git`.

## Step-by-Step Guide

### 1. Clone the Repository
Open your Linux terminal and run:
```bash
git clone https://github.com/noimzip/Soul-Widgets-Manager.git
cd Soul-Widgets-Manager
```

### 2. Run the Installer
We provide an automated installer script to handle dependencies.
```bash
bash installer.sh
```
This script will:
- Install system packages: `nodejs`, `npm`, `playerctl`, `xdg-utils`, and required libraries for Electron (`libnss3`, etc.).
- Install Node.js dependencies (`npm install`).
- (Optional) Download the [AutoStart Extension](https://github.com/supechicken/ChromeOS-AutoStart) to help keep your Linux VM running.

### 3. Install the Chrome Extension
The extension is required for browser integration.
1.  Open Chrome and go to `chrome://extensions`.
2.  Enable **Developer mode** (toggle in the top-right corner).
3.  Click **Load unpacked**.
4.  Navigate to the `Soul-Widgets-Manager` directory and select the `chrome_extension` folder.
