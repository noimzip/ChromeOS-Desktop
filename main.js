const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// Linuxアプリを起動するIPCハンドラ
ipcMain.handle('launch-linux-app', async (event, command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error launching app: ${error.message}`);
        reject(error.message);
        return;
      }
      console.log(`App launched: ${command}`);
      resolve({ stdout, stderr });
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
