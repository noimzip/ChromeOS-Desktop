# Configuration

You can configure Soul Widgets Manager via the graphical Settings menu (Right-click > Settings) or by directly editing the configuration file.

## Settings File

The configuration is stored in a JSON file located at:
`~/.config/Soul Widgets Manager/settings.json`

(Note: The exact path might vary slightly depending on your environment).

### Configuration Options

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `windowCount` | Number | `1` | The number of overlay windows to launch. Increase this if you use multiple virtual desktops. |
| `targetDisplayId` | String | `primary` | The ID of the display where the overlay should appear. Useful for multi-monitor setups. |
| `windowResizable` | Boolean | `true` | Whether the overlay windows can be resized (usually for debugging or specific setups). |
| `autoOpenDevTools` | Boolean | `false` | If `true`, the Chrome Developer Tools will open automatically on startup. |

## Environment Variables

The application is typically launched via `startup.sh`. This script sets specific flags for Electron:

```bash
electron . --ozone-platform-hint=wayland
```

- `--ozone-platform-hint=wayland`: **Required.** Forces Electron to use the Wayland backend, which supports transparent windows on ChromeOS (Linux). Without this, the background might be black instead of transparent.
