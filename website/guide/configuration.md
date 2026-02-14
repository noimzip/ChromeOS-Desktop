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
| `securityMode` | String | `standard` | Security level: `strict`, `standard`, or `none`. |
| `allowedBinaries` | String[] | `[]` | List of allowed Linux command paths (used in `strict` mode). |
| `allowedDomains` | String[] | `[]` | List of allowed domains for external requests (used in `strict` mode). |

## Widget Settings

Most widget-specific settings are stored in the browser's `localStorage` and can be configured directly through the UI by right-clicking a widget and selecting **Settings**.

### Weather Widget
- **Provider:** Choose between Open-Meteo or National Weather Service (NWS).
- **Location Mode:** Automatic (via IP/Browser) or Manual coordinates.
- **Units:** Celsius (°C) or Fahrenheit (°F).
- **Update Interval:** How often to refresh weather data and location.
- **Shape:** Customize the widget's appearance (e.g., Pill, Circle).

### Gmail Widget
The Gmail widget requires a **Google Cloud Project** to access your emails:
- **Client ID & Client Secret:** You must provide these from your Google Cloud Console.
- **Auth Flow:** Once configured, you can log in securely via OAuth2.
- **Scope:** The widget only requests `gmail.readonly` access to display your unread emails.

## Environment Variables

The application is typically launched via `startup.sh`. This script sets specific flags for Electron:

```bash
electron . --ozone-platform-hint=wayland
```

- `--ozone-platform-hint=wayland`: **Required.** Forces Electron to use the Wayland backend, which supports transparent windows on ChromeOS (Linux). Without this, the background might be black instead of transparent.
