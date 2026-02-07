const { contextBridge, ipcRenderer } = require('electron');
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 25600 });

let sendRequestToChrome;
let wsClient = null;

// ブラウザからのメディア情報を保存
let browserMediaInfo = {
  status: 'No player',
  title: '',
  artist: '',
  album: '',
  artUrl: '',
  source: ''
};

wss.on('connection', ws => {
  window.wsConnected = true;
  wsClient = ws;
  console.log('[Soul Widgets] Extension connected!');

  ws.on('error', (e) => console.error('[Soul Widgets] WebSocket error:', e));
  
  ws.on('message', data => {
    console.log('[Soul Widgets] Received from extension:', data.toString());
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'mediaInfo' && parsed.data) {
        console.log('[Soul Widgets] Updating browser media info:', parsed.data);
        browserMediaInfo = parsed.data;
        // メディア情報更新イベントを発火
        if (window.onBrowserMediaUpdate) {
          console.log('[Soul Widgets] Triggering onBrowserMediaUpdate callback');
          window.onBrowserMediaUpdate(browserMediaInfo);
        } else {
          console.log('[Soul Widgets] No onBrowserMediaUpdate callback registered');
        }
      }
    } catch (e) {
      // JSON以外のメッセージは無視
      console.log('[Soul Widgets] Parse error:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('[Soul Widgets] Extension disconnected');
    wsClient = null;
    window.wsConnected = false;
  });

  sendRequestToChrome = data => {
    ws.send(JSON.stringify(data));
  };
  
  // 接続時にメディア情報をリクエスト
  console.log('[Soul Widgets] Requesting initial media info...');
  ws.send(JSON.stringify({ request: 'getMediaInfo' }));
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
  restartApp: () => ipcRenderer.invoke('restart-app'),
  openGoogleLogin: () => ipcRenderer.invoke('open-google-login'),
  // ブラウザメディア用API
  getBrowserMediaInfo: () => browserMediaInfo,
  browserMediaControl: (action, value) => {
    if (wsClient && wsClient.readyState === 1) {
      wsClient.send(JSON.stringify({ request: 'mediaControl', action: action, value: value }));
      return { success: true };
    }
    return { success: false };
  },
  requestBrowserMediaInfo: () => {
    if (wsClient && wsClient.readyState === 1) {
      wsClient.send(JSON.stringify({ request: 'getMediaInfo' }));
    }
  }
});

window.addEventListener('DOMContentLoaded', () => {
  contextBridge.exposeInMainWorld('openURL', url => {
    if (!window.wsConnected) {
      alert('Cannot communicate with the integration extension. (wait a few seconds and try again?)');
    } else {
      sendRequestToChrome({request: 'openURL', url: url});
    }
  });
})