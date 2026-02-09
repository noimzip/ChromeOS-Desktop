const { contextBridge, ipcRenderer } = require('electron');

// ブラウザからのメディア情報を保存
let browserMediaInfo = {
  status: 'No player',
  title: '',
  artist: '',
  album: '',
  artUrl: '',
  source: ''
};

// Listen for updates from Main process (broadcasted from WS)
ipcRenderer.on('browser-media-update', (event, parsed) => {
  if (parsed.type === 'mediaInfo' && parsed.data) {
    // console.log('[Soul Widgets] Updating browser media info:', parsed.data);
    browserMediaInfo = parsed.data;
    // Note: The callback is handled via the exposed API below
  }
});

// Linuxアプリ起動用関数をグローバルに公開
contextBridge.exposeInMainWorld('electronAPI', {
  launchLinuxApp: (command) => ipcRenderer.invoke('launch-linux-app', command),
  getMediaInfo: () => ipcRenderer.invoke('get-media-info'),
  mediaControl: (action, value) => ipcRenderer.invoke('media-control', action, value),
  // ファイル/フォルダ用API
  openFileOrFolder: (filePath) => ipcRenderer.invoke('open-file-or-folder', filePath),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  // ウィンドウ数設定用API
  getWindowCount: () => ipcRenderer.invoke('get-window-count'),
  setWindowCount: (count) => ipcRenderer.invoke('set-window-count', count),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  getTargetDisplayId: () => ipcRenderer.invoke('get-target-display-id'),
  setTargetDisplay: (displayId) => ipcRenderer.invoke('set-target-display', displayId),
  getWindowResizable: () => ipcRenderer.invoke('get-window-resizable'),
  setWindowResizable: (resizable) => ipcRenderer.invoke('set-window-resizable', resizable),
  getAutoOpenDevTools: () => ipcRenderer.invoke('get-auto-open-devtools'),
  setAutoOpenDevTools: (autoOpen) => ipcRenderer.invoke('set-auto-open-devtools', autoOpen),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  openDevTools: () => ipcRenderer.invoke('open-devtools'),
  openGoogleLogin: () => ipcRenderer.invoke('open-google-login'),
  getSecurityMode: () => ipcRenderer.invoke('get-security-mode'),
  setSecurityMode: (mode) => ipcRenderer.invoke('set-security-mode', mode),
  getAllowedBinaries: () => ipcRenderer.invoke('get-allowed-binaries'),
  setAllowedBinaries: (list) => ipcRenderer.invoke('set-allowed-binaries', list),
  getAllowedDomains: async () => {
    try {
      return await ipcRenderer.invoke('get-allowed-domains');
    } catch (e) {
      console.warn('get-allowed-domains not available:', e);
      return [];
    }
  },
  setAllowedDomains: async (list) => {
    try {
      return await ipcRenderer.invoke('set-allowed-domains', list);
    } catch (e) {
      console.warn('set-allowed-domains not available:', e);
      return [];
    }
  },
  
  // ブラウザメディア用API
  getBrowserMediaInfo: () => browserMediaInfo,
  
  // Register callback for updates
  onBrowserMediaUpdate: (callback) => {
      ipcRenderer.on('browser-media-update', (event, parsed) => {
          if (parsed.type === 'mediaInfo' && parsed.data) {
              callback(parsed.data);
          }
      });
  },

  onLinuxMediaUpdate: (callback) => {
      ipcRenderer.on('linux-media-update', (event, info) => {
          callback(info);
      });
  },

  browserMediaControl: (action, value) => {
    // Send to Main -> WS
    return ipcRenderer.invoke('send-to-browser', { request: 'mediaControl', action: action, value: value });
  },
  
  requestBrowserMediaInfo: () => {
    // Send to Main -> WS
    ipcRenderer.invoke('send-to-browser', { request: 'getMediaInfo' });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  contextBridge.exposeInMainWorld('openURL', url => {
      // Send to Main -> WS
      ipcRenderer.invoke('send-to-browser', {request: 'openURL', url: url});
  });
})
