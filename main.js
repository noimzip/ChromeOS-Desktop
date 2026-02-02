const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

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
    // playerctlでメディア情報を取得
    const commands = {
      status: 'playerctl status 2>/dev/null || echo "No player"',
      title: 'playerctl metadata title 2>/dev/null || echo ""',
      artist: 'playerctl metadata artist 2>/dev/null || echo ""',
      album: 'playerctl metadata album 2>/dev/null || echo ""',
      artUrl: 'playerctl metadata mpris:artUrl 2>/dev/null || echo ""',
      position: 'playerctl position 2>/dev/null || echo "0"',
      length: 'playerctl metadata mpris:length 2>/dev/null || echo "0"',
      player: 'playerctl -l 2>/dev/null | head -1 || echo ""'
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(commands).length;
    
    for (const [key, cmd] of Object.entries(commands)) {
      exec(cmd, (error, stdout) => {
        results[key] = stdout.trim();
        completed++;
        if (completed === total) {
          resolve(results);
        }
      });
    }
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

app.whenReady().then(() => {
  const { screen } = require('electron');
  // Create a window that fills the screen's available work area.
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize;

  console.log(width, height);

  const win = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(process.cwd(), 'preload.js'),
      sandbox: false
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools()
})
