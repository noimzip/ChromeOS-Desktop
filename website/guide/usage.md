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
