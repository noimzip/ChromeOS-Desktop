<div align="center">

<img src="../chrome_extension/assets/soul-128.png" width="128px" height="128px">

# Soul Widgets Manager
## A Windows-like desktop experience for ChromeOS

[English](README.md) | [日本語](README_JA.md)

---

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/Version-0.1-green.svg)](https://github.com/noimzip/Soul-Widgets-Manager)

</div>

---

## 📖 Project Overview

### Purpose
Soul Widgets Manager aims to bridge the gap between the web-centric ChromeOS and traditional desktop environments like Windows or macOS. Using Electron-based transparent overlay technology, it provides a customizable layer that sits on top of your wallpaper, allowing you to place shortcuts and interactive widgets.

### Key Features
- **Interactive Widgets:**
  - **Clock:** Modern 12-sided design.
  - **Weather:** Real-time updates with multiple providers (e.g., NWS), geolocation, and unit conversion (C/F).
  - **Gmail:** Check your unread emails and stay updated directly from your desktop.
  - **Media Player:** Unified control for Linux (via playerctl) and Chrome browser media.
  - **GitHub:** Contribution graph and streak display.
  - **Google Calendar:** Embedded schedule view.
- **Desktop Management:**
  - Create shortcuts for Web Apps, Linux Apps, and files.
  - Group shortcuts into folders.
  - Drag & Drop with grid snapping support.
- **System Integration:**
  - Multi-display support.
  - Virtual Desktop support (Multi-window mode).
  - Beautiful UI based on Material Design 3 (M3).

---

## 🛠️ Installation

### Prerequisites
- **OS:** ChromeOS with Linux (Crostini) enabled.
- **GPU:** "Crostini GPU Support" enabled in `chrome://flags` (Recommended).
- **Software:** `git` (if not pre-installed).

### Steps
1. **Clone the repository:**
   ```shell
   git clone https://github.com/noimzip/Soul-Widgets-Manager.git
   cd Soul-Widgets-Manager
   ```

2. **Run the installer:**
   ```shell
   bash installer.sh
   ```
   This script automatically handles:
   - System packages (`nodejs`, `npm`, `playerctl`, `libnss3`, etc.).
   - pnpm package installation.
   - (Optional) Setup of the Linux VM AutoStart extension.

3. **Install the Chrome Extension:**
   - Open `chrome://extensions` in Chrome.
   - Enable "Developer mode" in the top right.
   - Click "Load unpacked" and select the `chrome_extension` folder within this project.

---

## 🚀 Usage

### Basic Commands
To start the application, run the following script:
```shell
bash startup.sh
```

### Operation Options
Once the desktop overlay is running:
- **Right-Click:** Open the context menu to add apps, widgets, folders, or access settings.
- **Drag & Drop:** Move icons and widgets.
- **Click:** Launch shortcuts or interact with widgets.

---

## ⚙️ Configuration

Settings can be changed via the GUI (Right-click > Settings), but are stored in the following file.

### Settings File
- **Path:** `~/.config/Soul Widgets Manager/settings.json` (May vary by environment)

| Key | Type | Description | Default |
| --- | --- | --- | --- |
| `windowCount` | Number | Number of overlay windows to launch (for virtual desktops) | `1` |
| `targetDisplayId` | String | ID of the display to show the overlay on | `primary` |
| `windowResizable` | Boolean | Allow window resizing | `true` |
| `autoOpenDevTools` | Boolean | Automatically open DevTools on startup | `false` |
| `securityMode` | String | Security mode: `strict`, `standard`, `none` | `standard` |
| `allowedBinaries` | String[] | Allowlist for Linux app execution | `[]` |

### Security Mode
- **Strict:** Highest safety. Only allowlisted Linux commands are executable. Input is sanitized aggressively and external requests are limited to an allowlist.
- **Standard:** Balanced. HTML-heavy input is sanitized and known-bad domains are blocked.
- **None:** No restrictions. Intended for trusted environments only.

The allowlist is maintained in the Settings UI under **Security & Privacy**. When you add or edit a Linux app, its command is automatically added to the allowlist so that apps can still run in Strict mode.

### Environment Variables
- **Electron Flags:** `startup.sh` sets `--ozone-platform-hint=wayland`. This is mandatory for displaying transparent windows correctly on ChromeOS.

---

## 💻 Development

### Setup
```shell
# Install dependencies
pnpm install
```

### Running in Development Mode
```shell
# Start the application (Logs output to terminal)
pnpm start
```
For debugging, setting `autoOpenDevTools: true` in the settings menu or `settings.json` is useful.

### How to Add a Widget
1. Create a new folder in `widgets/` (e.g., `my_widget`).
2. Create JS and CSS files.
3. Register it in the `registry` within `widgets/loader.js`.

### Coding Conventions
- **Style:** Follow existing code styles (Standard JS compliant).
- **UI:** It is recommended to use `modules/style_manager.js` and the `@m3e` library to follow Material Design 3 guidelines.

---

## 🤝 Contribution
Contributions, bug reports, and feature requests are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for details on how to get involved.

---

## 📜 License
This project is licensed under the **GPL-3.0 License**. See the [LICENSE](../LICENSE) file for details. For security concerns, please refer to [SECURITY.md](../SECURITY.md).

---

## 📞 Contact

### Repository
[https://github.com/noimzip/Soul-Widgets-Manager](https://github.com/noimzip/Soul-Widgets-Manager)

### Developer
- Please use GitHub Issues or Discussions.

---
<div align="center">
   <b>We pay tribute to Supechicken666, the original creator.</b>
</div>
