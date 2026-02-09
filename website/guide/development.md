# Developer Guide

## Development Setup

To start hacking on Soul Widgets Manager:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run in Development Mode:**
    ```bash
    npm start
    ```
    This will launch the application and output logs directly to your terminal.

::: tip Debugging
To inspect the DOM or console errors, enable `autoOpenDevTools: true` in your `settings.json` or right-click the desktop and select "Settings" to toggle it.
:::

## Adding a New Widget

The widget system is designed to be extensible. Follow these steps to create a custom widget:

1.  **Create Directory:**
    Create a new folder in `widgets/` (e.g., `widgets/my_widget/`).

2.  **Create Files:**
    Add your logic and styles:
    - `my_widget.js`
    - `my_widget.css`

3.  **Register Widget:**
    Open `widgets/loader.js` and add your widget to the `registry` object:

    ```javascript
    'my_widget_id': {
      js: './widgets/my_widget/my_widget.js',
      css: './widgets/my_widget/my_widget.css'
    }
    ```

4.  **Implement Logic:**
    Write your widget code. You can access global utilities and the `M3` UI library provided by the main application.

## Coding Conventions

- **Style:** We follow Standard JS style. Please ensure your code is clean and formatted.
- **UI Components:** Use `modules/style_manager.js` and the `@m3e` library to ensure your widget matches the Material Design 3 aesthetic of the rest of the application.
