# Architecture

Soul Widgets Manager uses a tri-layer architecture to provide a seamless experience on ChromeOS.

## 1. Electron Host (`main.js`)
This is the core of the application running in the Linux container.
- **Transparent Windows:** Creates frameless, click-through capable windows that overlay the desktop.
- **WebSocket Server:** Runs a local server on port `25600` to communicate with the Chrome Extension.
- **System Operations:** Handles low-level tasks like executing shell commands (`exec`), launching apps, and opening files (`xdg-open`).
- **Media Polling:** Uses `playerctl` to fetch media status from other Linux applications.

## 2. Desktop Layer (`index.html` + `modules/`)
This is the visual front-end rendered within the Electron windows.
- **Material Design 3:** Built using the `@m3e` library for consistent styling.
- **App Manager:** Manages the state and persistence of shortcuts and widgets (CRUD operations).
- **Style Manager:** Handles dynamic theming and visual effects.

## 3. Chrome Extension (`chrome_extension/`)
Since the main app runs in the Linux container, it cannot directly access browser information. The extension bridges this gap.
- **Media Capture:** Reads metadata (Title, Artist, Artwork) from supported sites like YouTube and Spotify.
- **Data Forwarding:** Sends this data to the Electron host via the WebSocket connection.

## Diagram
```mermaid
graph TD
    Browser[Chrome Browser] <-->|Extension API| Ext[Chrome Extension]
    Ext <-->|WebSocket :25600| Electron[Electron Host (Linux)]
    Electron <-->|IPC| UI[Desktop UI (Renderer)]
    Electron -->|playerctl| LinuxApps[Linux Media Apps]
    Electron -->|exec| System[System Commands]
```
