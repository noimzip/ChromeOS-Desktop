# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please **do not open a public issue**. Instead, please report it by:

1. Sending an email to the maintainers (if listed) or
2. Opening a private draft security advisory on GitHub if you have the permissions.

We will acknowledge your report and provide a timeline for a fix.

## Electron Security Best Practices

Soul Widgets Manager follows Electron security best practices to minimize the attack surface:

- **Context Isolation:** Enabled. The renderer process does not have direct access to Electron internal APIs or Node.js.
- **Sandbox Mode:** Enabled for all renderer processes.
- **Node Integration:** Disabled in renderer processes.
- **Navigation Restrictions:** The application prevents unexpected navigation to external URLs within the app window. External links are forced to open in the system's default browser via `shell.openExternal`.

## Security Modes

Soul Widgets Manager provides three security modes (Strict / Standard / None). These affect input sanitization, network restrictions, and session persistence.

- **Strict:** Allowlisted external domains only. Linux commands must be on an allowlist.
- **Standard:** Known-bad domains are blocked. HTML-heavy input is sanitized.
- **None:** No restrictions (developer/trusted environment only).

Settings are configurable from the Settings dialog under **Security & Privacy**.

## Local Communication (WebSockets)

- The application opens a WebSocket server on **port 25600**.
- This server is bound to `localhost` and is intended only for communication with the local Chrome Extension.
- Note: Any local application on your system can theoretically connect to this port. We recommend only running the manager in a trusted local environment.

## Command Execution (`exec`)

- This application allows users to create shortcuts that execute Linux commands.
- **Warning:** Never add commands or URLs from untrusted sources. Executing malicious commands can compromise your Linux container (Crostini) and potentially your files.
- Linux command execution is gated by an allowlist in **Strict** and **Standard** modes.
- File and folder opening uses Electron's `shell.openPath` (no shell interpolation).

## Data Privacy & Storage

### Sensitive Information
- **OAuth Tokens:** For widgets like Gmail, OAuth2 access and refresh tokens are stored in the browser's `localStorage`. These are used to communicate with Google APIs on your behalf.
- **Client Credentials:** Your Google Cloud Client ID and Secret are also stored in `localStorage`.
- **Location Data:** The Weather widget stores your latitude and longitude. To protect your privacy, these coordinates are rounded to two decimal places (approx. 1km accuracy) before being saved.

Ensure your Chromebook and the Linux container are kept secure, as anyone with access to your `userData` directory can theoretically retrieve these tokens.

## Chrome Extension

- The extension is loaded in "Developer Mode" (unpacked). 
- Ensure you only load the extension from the official source/repository.
- The extension requires permissions to access media metadata from various websites to sync with the desktop widget.
