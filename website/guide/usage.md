# Usage

## Starting the Application

To launch Soul Widgets Manager, run the startup script from your terminal:

```bash
bash startup.sh
```

::: tip Note
The script automatically adds the `--ozone-platform-hint=wayland` flag, which is crucial for proper transparency support on ChromeOS.
:::

## Basic Operations

Once the application is running, you interact with the desktop overlay just like a standard desktop.

### Context Menu
**Right-click** anywhere on the desktop background to open the menu.
- **Add App:** Create a shortcut for a URL or a Linux command.
- **Add Widget:** Select from the available widgets (Clock, Media Player, etc.) to place on your desktop.
- **Add Folder:** Create a container to group your shortcuts.
- **Settings:** Open the configuration panel.

### Arrange Items
- **Drag & Drop:** Click and hold any icon or widget to move it.
- **Grid Mode:** Enable "Grid Mode" in settings to have items snap neatly to a grid.

### Multi-Window Mode
If you use Virtual Desktops on ChromeOS:
1.  Go to **Settings**.
2.  Increase the **Window Count**.
3.  New overlay windows will appear.
4.  Enter "Overview Mode" (three-finger swipe up) and drag the new windows to your other virtual desktops.

## Security Mode

Open **Settings → Security & Privacy** to select a security mode:

- **Strict:** Only allowlisted Linux commands can be executed. External requests are limited to an allowlist.
- **Standard:** Blocks known-bad domains and sanitizes HTML-heavy input.
- **None:** No restrictions (for trusted environments only).

When you add or edit a Linux app, its command is automatically added to the allowlist so apps still run in Strict mode.

## Setting up Widgets

### Weather Widget
After adding the weather widget, right-click it and select **Settings** to:
- Choose your preferred weather provider.
- Set your location (Automatic or Manual).
- Change temperature units.

### Gmail Widget
To use the Gmail widget, you need to provide your own Google Cloud credentials:
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project and enable the **Gmail API**.
3.  Configure the **OAuth consent screen** (Internal or External).
4.  Create **OAuth 2.0 Client IDs** (Application type: "Web application" or "Desktop app" depending on your preference, but the widget handles the flow).
5.  In the widget's settings on your desktop, enter the **Client ID** and **Client Secret**.
6.  Click **Login** and follow the authentication steps in your browser.

