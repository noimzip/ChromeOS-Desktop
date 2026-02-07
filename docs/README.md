<div align="center">

<img src="../chrome_extension/assets/soul-128.png" width="128px" height="128px">

# Soul Widgets Manager
## A Windows-like desktop experience for ChromeOS

[English](README.md) | [日本語](README_JA.md)

---

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/Version-0.1-green.svg)](https://github.com/noimzip/Soul-Widgets-Manager)

Soul Widgets Manager is an Electron-based transparent overlay that brings shortcuts and interactive widgets to your ChromeOS desktop. It bridges the gap between the web-centric ChromeOS and a traditional desktop environment by providing a customizable layer on top of your workspace.

</div>

---

## ✨ Features

### 🧩 Interactive Widgets
- **Clock Widget:** A stylish, modern clock with a unique 12-sided design.
- **Media Player:** Fully functional media controller supporting `playerctl` for Linux apps and Chrome media integration. Includes album art, seekbar, and playback controls.
- **GitHub Contribution:** Track your coding activity directly on your desktop with a contribution graph and streak statistics.
- **Google Calendar:** Keep track of your schedule with an embedded calendar view (Month, Week, or Agenda).

### 🚀 Desktop Management
- **Shortcuts:** Add shortcuts for Web Apps (URLs), Linux Apps, files, and folders.
- **Folders:** Group your shortcuts into customizable folders.
- **Customization:** Full Material Design 3 (M3) UI with support for:
    - Dark/Light/System themes.
    - Custom color schemes (with image-based color extraction).
    - Adjustable icon shapes and blur effects.
    - Multi-language support (English and Japanese).

### 🖥️ System Integration
- **Multi-Display Support:** Choose which screen to host your desktop overlay.
- **Virtual Desktops:** Support for multiple windows to span across different virtual desktops.
- **Chrome Integration:** Companion extension for seamless communication between the browser and the desktop layer.

---

## 🛠️ Installation

### Prerequisites
- ChromeOS with Linux (Crostini) enabled.
- `nodejs` and `npm` (installed automatically by the installer).

### Setup Steps
1. **Clone the repository:**
   ```shell
   git clone https://github.com/noimzip/Soul-Widgets-Manager.git
   cd Soul-Widgets-Manager
   ```

2. **Run the installer:**
   ```shell
   bash installer.sh
   ```
   *This will install dependencies and optionally set up the AutoStart extension.*

3. **Install the Chrome Extension:**
   - Sideload the integration extension located in `/chrome_extension`.
   - Refer to [this guide](https://github.com/supechicken/ChromeOS-LivePaper#installation) for detailed instructions on sideloading extensions in ChromeOS.

---

## 🚀 Usage

### Starting the Manager
Run the startup script to launch the application in the background:
```shell
bash startup.sh
```

### Configuration
- **Right-click** on the desktop to add apps, widgets, or open the **Settings** menu.
- **Drag and drop** icons and widgets to reposition them. Enable **Grid Mode** in settings for precise alignment.
- **Virtual Desktops:** If you use multiple virtual desktops, increase the "Window Count" in Settings and drag each window to a separate desktop.

---

## ⚙️ How it works
- **Electron Overlay:** A transparent, click-through-capable window created using Electron that sits above the wallpaper but below active windows.
- **WebSocket Communication:** Uses a local WebSocket server (port 25600) to communicate with the Chrome extension, allowing it to sync media info and launch system apps like `Files` and `Settings`.
- **M3 Ecosystem:** Built using the `@m3e` library for a consistent and beautiful Material Design 3 experience.

---

## 🤝 Contributing
This project is currently a **Work In Progress (WIP)**. Contributions, bug reports, and feature requests are welcome!

## 📜 License
This project is licensed under the **GPL-3.0 License**. See the [LICENSE](LICENSE) file for details.

---
<div align="center">
   <b>We pay tribute to Supechicken666, the original creator.</b>
</div>