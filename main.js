const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// 設定ファイルのパス
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// 設定を読み込む
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { windowCount: 1 };
}

// 設定を保存
function saveSettings(settings) {
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

// アプリを再起動するIPCハンドラ
ipcMain.handle('restart-app', async () => {
  app.relaunch();
  app.exit(0);
});

// ファイル/フォルダを開くIPCハンドラ
ipcMain.handle('open-file-or-folder', async (event, filePath) => {
  return new Promise((resolve) => {
    // xdg-openを使ってデフォルトアプリケーションで開く
    exec(`xdg-open "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Open error:', error.message);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
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
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Launch error:', error.message);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
  });
});

// メディア情報取得用IPCハンドラ
ipcMain.handle('get-media-info', async () => {
  return new Promise((resolve) => {
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
      resolve(results);
    });
  });
});

// メディア制御用IPCハンドラ
ipcMain.handle('media-control', async (event, action, value) => {
  return new Promise((resolve) => {
    // シーク操作の場合
    if (action === 'seek' && value !== undefined) {
      exec(`playerctl position ${value}`, (error) => {
        resolve({ success: !error, error: error?.message });
      });
      return;
    }
    
    // シャッフル・リピート操作
    if (action === 'shuffle' && value !== undefined) {
      exec(`playerctl shuffle ${value}`, (error) => {
        resolve({ success: !error, error: error?.message });
      });
      return;
    }
    if (action === 'loop' && value !== undefined) {
      exec(`playerctl loop ${value}`, (error) => {
        resolve({ success: !error, error: error?.message });
      });
      return;
    }
    
    const commands = {
      'play-pause': 'playerctl play-pause',
      'play': 'playerctl play',
      'pause': 'playerctl pause',
      'next': 'playerctl next',
      'previous': 'playerctl previous'
    };
    
    const cmd = commands[action];
    if (!cmd) {
      resolve({ success: false, error: 'Unknown action' });
      return;
    }
    
    exec(cmd, (error) => {
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
      webPreferences: {
        preload: path.join(process.cwd(), 'preload.js'),
        sandbox: false
      }
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    // ウィンドウIDを渡してロード
    win.loadFile('index.html', { query: { windowId: i.toString() } });
    
    // 最初のウィンドウのみDevToolsを開く
    if (i === 0) {
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
