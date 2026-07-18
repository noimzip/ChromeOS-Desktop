const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec, execFile, spawn } = require('child_process');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const sanitizeHtml = require('sanitize-html');

function splitCommandLine(input) {
  const parts = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escaping = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }
    if (ch === '\\') {
      escaping = true;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && !inDouble && /\s/.test(ch)) {
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }

  if (current.length > 0) parts.push(current);
  return parts;
}

// WebSocket Server for Chrome Extension
let wsClient = null;
const wss = new WebSocketServer({
  port: 25600,
  host: '127.0.0.1',
  maxPayload: 64 * 1024
});

wss.on('connection', ws => {
  wsClient = ws;
  console.log('[Main] Chrome Extension connected!');

  ws.on('message', data => {
    // Broadcast to all windows
    try {
      const parsed = JSON.parse(data.toString());
      windows.forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('browser-media-update', parsed);
        }
      });
    } catch (e) {
      console.error('[Main] WS Parse error:', e);
    }
  });

  ws.on('close', () => {
    wsClient = null;
    console.log('[Main] Chrome Extension disconnected');
    windows.forEach(win => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('browser-connection-status', false);
        }
    });
  });
});

// IPC: Send data to Chrome Extension
ipcMain.handle('send-to-browser', async (event, payload) => {
  if (wsClient && wsClient.readyState === 1) {
    wsClient.send(JSON.stringify(payload));
    return { success: true };
  }
  return { success: false };
});

// 設定ファイルのパス
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
let cachedSettings = null;

// 設定を読み込む
function loadSettings() {
  if (cachedSettings) return cachedSettings;
  try {
    if (fs.existsSync(settingsPath)) {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const defaults = { windowCount: 1, securityMode: 'standard', allowedBinaries: [], allowedDomains: [] };
      cachedSettings = { ...defaults, ...parsed };
      return cachedSettings;
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  cachedSettings = { windowCount: 1, securityMode: 'standard', allowedBinaries: [], allowedDomains: [] };
  return cachedSettings;
}

// 設定を保存
function saveSettings(settings) {
  cachedSettings = settings;
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// ウィンドウ数を取得するIPCハンドラ
ipcMain.handle('get-window-count', async () => {
  const settings = loadSettings();
  return settings.windowCount || 1;
});

ipcMain.handle('get-security-mode', async () => {
  const settings = loadSettings();
  return settings.securityMode || 'standard';
});

ipcMain.handle('set-security-mode', async (event, mode) => {
  const settings = loadSettings();
  const allowed = new Set(['strict', 'standard', 'none']);
  settings.securityMode = allowed.has(mode) ? mode : 'standard';
  saveSettings(settings);
  return settings.securityMode;
});

ipcMain.handle('get-allowed-binaries', async () => {
  const settings = loadSettings();
  return Array.isArray(settings.allowedBinaries) ? settings.allowedBinaries : [];
});

ipcMain.handle('set-allowed-binaries', async (event, list) => {
  const settings = loadSettings();
  if (Array.isArray(list)) {
    settings.allowedBinaries = list.filter(v => typeof v === 'string' && v.trim().length > 0);
  } else {
    settings.allowedBinaries = [];
  }
  saveSettings(settings);
  return settings.allowedBinaries;
});

ipcMain.handle('get-allowed-domains', async () => {
  const settings = loadSettings();
  return Array.isArray(settings.allowedDomains) ? settings.allowedDomains : [];
});

ipcMain.handle('set-allowed-domains', async (event, list) => {
  const settings = loadSettings();
  if (Array.isArray(list)) {
    settings.allowedDomains = list.filter(v => typeof v === 'string' && v.trim().length > 0);
  } else {
    settings.allowedDomains = [];
  }
  saveSettings(settings);
  return settings.allowedDomains;
});

ipcMain.handle('sanitize-html', (event, text) => {
  return sanitizeHtml(text);
});

// ウィンドウ数を設定するIPCハンドラ
ipcMain.handle('set-window-count', async (event, count) => {
  const settings = loadSettings();
  settings.windowCount = Math.max(1, Math.min(10, count)); // 1-10の範囲に制限
  saveSettings(settings);
  return settings.windowCount;
});

// ディスプレイ情報を取得するIPCハンドラ
ipcMain.handle('get-displays', async () => {
  const { screen } = require('electron');
  return screen.getAllDisplays().map((d, index) => ({
    id: d.id.toString(),
    label: d.label || `Display ${index + 1}`,
    bounds: d.bounds
  }));
});

// ターゲットディスプレイIDを取得するIPCハンドラ
ipcMain.handle('get-target-display-id', async () => {
  const settings = loadSettings();
  return settings.targetDisplayId || '';
});

// ターゲットディスプレイを設定するIPCハンドラ
ipcMain.handle('set-target-display', async (event, displayId) => {
  const settings = loadSettings();
  settings.targetDisplayId = displayId;
  saveSettings(settings);

  const { screen } = require('electron');
  const targetDisplay = screen.getAllDisplays().find(d => d.id.toString() === displayId) || screen.getPrimaryDisplay();
  const { x, y, width, height } = targetDisplay.workArea;

  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.setBounds({ x, y, width, height });
    }
  }
});

// ウィンドウのリサイズ設定を取得
ipcMain.handle('get-window-resizable', async () => {
  const settings = loadSettings();
  return settings.windowResizable !== undefined ? settings.windowResizable : true;
});

// ウィンドウのリサイズ設定を保存
ipcMain.handle('set-window-resizable', async (event, resizable) => {
  const settings = loadSettings();
  settings.windowResizable = resizable;
  saveSettings(settings);
  
  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.setResizable(resizable);
    }
  }
});

// デベロッパーツールの自動起動設定を取得
ipcMain.handle('get-auto-open-devtools', async () => {
  const settings = loadSettings();
  return settings.autoOpenDevTools !== undefined ? settings.autoOpenDevTools : false;
});

// デベロッパーツールの自動起動設定を保存
ipcMain.handle('set-auto-open-devtools', async (event, autoOpen) => {
  const settings = loadSettings();
  settings.autoOpenDevTools = autoOpen;
  saveSettings(settings);
});

// 設定のエクスポート/インポート用
ipcMain.handle('get-all-system-settings', async () => {
  return loadSettings();
});

ipcMain.handle('save-settings-to-file', async (event, data) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: '設定をエクスポート',
    defaultPath: 'soul-settings.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return { canceled: true };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return { success: true };
});

ipcMain.handle('load-settings-from-file', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: '設定をインポート',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || filePaths.length === 0) return { canceled: true };
  
  try {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { success: true, data: JSON.parse(content) };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('import-system-settings', async (event, settings) => {
  saveSettings(settings);
  return { success: true };
});

// アプリを再起動するIPCハンドラ
ipcMain.handle('restart-app', async () => {
  app.relaunch();
  app.exit(0);
});

// 開発者ツールを開くIPCハンドラ
ipcMain.handle('open-devtools', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.webContents.openDevTools();
  }
});

// ファイル/フォルダを開くIPCハンドラ
ipcMain.handle('open-file-or-folder', async (event, filePath) => {
  const result = await shell.openPath(filePath);
  if (result) {
    console.error('Open error:', result);
    return { success: false, error: result };
  }
  return { success: true };
});

// ファイル選択ダイアログ
ipcMain.handle('select-file', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: 'ファイルを選択'
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  
  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  return {
    canceled: false,
    path: filePath,
    name: path.basename(filePath),
    isDirectory: stats.isDirectory()
  };
});

// フォルダ選択ダイアログ
ipcMain.handle('select-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'フォルダを選択'
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  
  const folderPath = result.filePaths[0];
  return {
    canceled: false,
    path: folderPath,
    name: path.basename(folderPath),
    isDirectory: true
  };
});

// Linuxアプリ起動用IPCハンドラ
ipcMain.handle('launch-linux-app', async (event, command) => {
  return new Promise((resolve) => {
    if (typeof command !== 'string' || command.trim().length === 0) {
      resolve({ success: false, error: 'Invalid command' });
      return;
    }

    const parts = splitCommandLine(command);
    if (parts.length === 0) {
      resolve({ success: false, error: 'Empty command' });
      return;
    }

    const bin = parts[0];
    const args = parts.slice(1);
    const settings = loadSettings();
    const mode = settings.securityMode || 'standard';
    const allowedBinaries = Array.isArray(settings.allowedBinaries) ? settings.allowedBinaries : [];

    if (mode !== 'none') {
      if (/[|&;><`$\n\r]/.test(command)) {
        resolve({ success: false, error: 'Command contains forbidden characters' });
        return;
      }
      if (allowedBinaries.length === 0) {
        resolve({ success: false, error: 'Allowlist is empty' });
        return;
      }
      let isAllowed = allowedBinaries.includes(bin);
      if (bin === 'xterm') {
        isAllowed = false;
        const execIndex = args.indexOf('-e');
        if (execIndex !== -1 && args[execIndex + 1]) {
          const nestedParts = splitCommandLine(args[execIndex + 1]);
          const nestedBin = nestedParts[0];
          if (nestedBin && allowedBinaries.includes(nestedBin)) {
            isAllowed = true;
          }
        }
      }
      if (!isAllowed) {
        resolve({ success: false, error: 'Command not in allowlist' });
        return;
      }
    }

    const child = spawn(bin, args, { shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => {
      console.error('Launch error:', error.message);
      resolve({ success: false, error: error.message });
    });
    child.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr });
    });
  });
});

// メディア情報取得用IPCハンドラ (キャッシュ済みデータを返す)
let cachedMediaInfo = { status: 'No player', title: '', artist: '', album: '', artUrl: '', position: '0', length: '0', player: '', shuffle: '', loop: '' };
let lastSentMediaJson = '';

function updateMediaInfo() {
  // playerctlでメディア情報を一括取得 (軽量化)
  const cmd = `
    STATUS=$(playerctl status 2>/dev/null)
    if [ -n "$STATUS" ]; then
      echo "Status:$STATUS"
      playerctl metadata --format 'Metadata:{{title}};;{{artist}};;{{album}};;{{mpris:artUrl}};;{{mpris:length}};;{{playerName}}' 2>/dev/null
      POS=$(playerctl position 2>/dev/null)
      echo "Position:$POS"
      SHUFFLE=$(playerctl shuffle 2>/dev/null)
      echo "Shuffle:$SHUFFLE"
      LOOP=$(playerctl loop 2>/dev/null)
      echo "Loop:$LOOP"
    else
      echo "Status:No player"
    fi
  `;

  exec(cmd, (error, stdout) => {
    const results = { status: 'No player', title: '', artist: '', album: '', artUrl: '', position: '0', length: '0', player: '', shuffle: '', loop: '' };
    if (!error && stdout) {
      const lines = stdout.trim().split('\n');
      lines.forEach(line => {
        if (line.startsWith('Status:')) results.status = line.substring(7).trim();
        else if (line.startsWith('Metadata:')) {
          const parts = line.substring(9).split(';;');
          if (parts.length >= 6) {
            results.title = parts[0]; results.artist = parts[1]; results.album = parts[2];
            results.artUrl = parts[3]; results.length = parts[4]; results.player = parts[5];
          }
        }
        else if (line.startsWith('Position:')) results.position = line.substring(9).trim();
        else if (line.startsWith('Shuffle:')) results.shuffle = line.substring(8).trim();
        else if (line.startsWith('Loop:')) results.loop = line.substring(5).trim();
      });
    }
    
    cachedMediaInfo = results;

    // 変化があった場合のみ通知 (Push型)
    const currentJson = JSON.stringify(results);
    if (currentJson !== lastSentMediaJson) {
      lastSentMediaJson = currentJson;
      windows.forEach(win => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('linux-media-update', results);
        }
      });
    }
  });
}

let mediaPollingInterval = 1000;
let mediaPollingTimer = null;
let isMediaPollingActive = true;

function startMediaPolling() {
  if (mediaPollingTimer) {
    clearInterval(mediaPollingTimer);
    mediaPollingTimer = null;
  }
  if (mediaPollingInterval > 0 && isMediaPollingActive) {
    mediaPollingTimer = setInterval(updateMediaInfo, mediaPollingInterval);
  }
}

// 起動時にポーリングを開始
startMediaPolling();

ipcMain.handle('set-media-polling-interval', async (event, interval) => {
  mediaPollingInterval = parseInt(interval);
  if (isNaN(mediaPollingInterval) || mediaPollingInterval < 0) {
    mediaPollingInterval = 1000;
  }
  startMediaPolling();
  return mediaPollingInterval;
});

ipcMain.handle('set-media-polling-active', async (event, active) => {
  isMediaPollingActive = !!active;
  startMediaPolling();
  return isMediaPollingActive;
});

ipcMain.handle('get-media-info', async () => {
  return cachedMediaInfo;
});

// パフォーマンス向上のためのスイッチ
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128'); // ウィジェットなのでメモリ制限


// メディア制御用IPCハンドラ
ipcMain.handle('media-control', async (event, action, value) => {
  return new Promise((resolve) => {
    // シーク操作の場合
    if (action === 'seek' && value !== undefined) {
      const position = Number(value);
      if (!Number.isFinite(position) || position < 0) {
        resolve({ success: false, error: 'Invalid position' });
        return;
      }
      execFile('playerctl', ['position', String(position)], (error) => {
        resolve({ success: !error, error: error?.message });
      });
      return;
    }
    
    // シャッフル・リピート操作
    if (action === 'shuffle' && value !== undefined) {
      const shuffle = String(value);
      execFile('playerctl', ['shuffle', shuffle], (error) => {
        resolve({ success: !error, error: error?.message });
      });
      return;
    }
    if (action === 'loop' && value !== undefined) {
      const loop = String(value);
      execFile('playerctl', ['loop', loop], (error) => {
        resolve({ success: !error, error: error?.message });
      });
      return;
    }
    
    const commands = {
      'play-pause': ['playerctl', 'play-pause'],
      'play': ['playerctl', 'play'],
      'pause': ['playerctl', 'pause'],
      'next': ['playerctl', 'next'],
      'previous': ['playerctl', 'previous']
    };
    
    const cmd = commands[action];
    if (!cmd) {
      resolve({ success: false, error: 'Unknown action' });
      return;
    }
    
    execFile(cmd[0], cmd.slice(1), (error) => {
      resolve({ success: !error, error: error?.message });
    });
  });
});

// Googleログイン用IPCハンドラ
ipcMain.handle('open-google-login', async () => {
  const loginWin = new BrowserWindow({
    width: 500,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  loginWin.loadURL('https://accounts.google.com/ServiceLogin?continue=https://calendar.google.com/');
});

// Gmail OAuth2 Flow
ipcMain.handle('gmail-start-auth', async (event, { clientId }) => {
  const redirectUri = 'http://localhost';
  const scope = 'https://www.googleapis.com/auth/gmail.readonly';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  const authWin = new BrowserWindow({
    width: 600,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  return new Promise((resolve) => {
    const handleNavigation = (url) => {
      if (url.startsWith(redirectUri)) {
        const urlParams = new URL(url).searchParams;
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        if (code || error) {
          resolve({ code, error });
          authWin.close();
          return true;
        }
      }
      return false;
    };

    authWin.webContents.on('will-navigate', (event, url) => {
      if (handleNavigation(url)) {
        event.preventDefault();
      }
    });

    authWin.webContents.on('will-redirect', (event, url) => {
      if (handleNavigation(url)) {
        event.preventDefault();
      }
    });

    authWin.on('closed', () => {
      resolve({ error: 'closed' });
    });

    authWin.loadURL(authUrl);
  });
});

ipcMain.handle('gmail-exchange-code', async (event, { clientId, clientSecret, code }) => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'http://localhost',
        grant_type: 'authorization_code'
      })
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gmail-refresh-token', async (event, { clientId, clientSecret, refreshToken }) => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

const windows = [];

app.whenReady().then(() => {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  
  // 設定からターゲットディスプレイを取得
  const settings = loadSettings();
  let targetDisplay = primaryDisplay;
  if (settings.targetDisplayId) {
    const found = screen.getAllDisplays().find(d => d.id.toString() === settings.targetDisplayId);
    if (found) targetDisplay = found;
  }

  const { x, y, width, height } = targetDisplay.workArea;
  console.log('Target Display:', targetDisplay.id, 'Bounds:', x, y, width, height);

  // 設定からウィンドウ数を取得
  const windowCount = settings.windowCount || 1;
  const windowResizable = settings.windowResizable !== undefined ? settings.windowResizable : true;
  const autoOpenDevTools = settings.autoOpenDevTools !== undefined ? settings.autoOpenDevTools : false;
  
  console.log('Creating', windowCount, 'window(s)');
  // 複数のウィンドウを作成
  for (let i = 0; i < windowCount; i++) {
    const win = new BrowserWindow({
      x: x,
      y: y,
      width: width,
      height: height,
      frame: false,
      transparent: true,
      resizable: windowResizable,
      show: false, // 準備ができるまで表示しない
      webPreferences: {
        preload: path.join(process.cwd(), 'preload.js'),
        sandbox: true,
        contextIsolation: true,
        backgroundThrottling: false // ウィジェットが非表示でも止まらないようにする
      }
    });

    win.once('ready-to-show', () => {
      win.show();
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    // ウィンドウIDを渡してロード
    win.loadFile('index.html', { query: { windowId: i.toString() } });
    
    // DevToolsの自動起動設定に従う（最初のウィンドウのみ）
    if (i === 0 && autoOpenDevTools) {
      win.webContents.openDevTools();
    }
    
    windows.push(win);
  }

  // ディスプレイの解像度変更を監視
  screen.on('display-metrics-changed', (event, display, changedMetrics) => {
    const currentSettings = loadSettings();
    let targetId = currentSettings.targetDisplayId;
    if (!targetId) {
      targetId = screen.getPrimaryDisplay().id.toString();
    }

    // ターゲットディスプレイの作業領域が変更された場合
    if (display.id.toString() === targetId && (changedMetrics.includes('workArea') || changedMetrics.includes('bounds'))) {
      console.log('Target display metrics changed. Resizing windows.');
      const { x, y, width, height } = display.workArea;
      for (const win of windows) {
        if (win && !win.isDestroyed()) {
          win.setBounds({ x, y, width, height });
        }
      }
    }
  });
});
