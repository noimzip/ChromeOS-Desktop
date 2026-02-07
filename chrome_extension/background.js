function setUpOffscreen() {
  chrome.offscreen.createDocument({
    url: 'ws_receiver/wrapper.html',
    reasons: ['BLOBS'],
    justification: 'websocket listener',
  }).catch(e => {
    // 既に存在する場合は無視
    console.log('[Soul Widgets] Offscreen document may already exist:', e.message);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Soul Widgets] Extension installed');
  setUpOffscreen();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Soul Widgets] Extension started');
  setUpOffscreen();
});

// メディア情報を保存
let currentMediaInfo = {
  status: 'No player',
  title: '',
  artist: '',
  album: '',
  artUrl: '',
  source: '',
  tabId: null
};

// Content Scriptからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MEDIA_INFO_UPDATE') {
    currentMediaInfo = {
      ...message.data,
      tabId: sender.tab?.id,
      source: 'browser'
    };
    // WebSocket経由でElectronに送信
    broadcastMediaInfo();
    sendResponse({ success: true });
  } else if (message.type === 'GET_MEDIA_INFO') {
    sendResponse(currentMediaInfo);
  } else if (message.type === 'MEDIA_CONTROL') {
    handleMediaControl(message.action, message.value);
    sendResponse({ success: true });
  } else if (message === 'Communication for Service Worker Maintenance') {
    sendResponse({ success: true });
  }
  return true;
});

// メディア制御を実行
async function handleMediaControl(action, value) {
  if (!currentMediaInfo.tabId) return;
  
  try {
    await chrome.tabs.sendMessage(currentMediaInfo.tabId, {
      type: 'MEDIA_CONTROL',
      action: action,
      value: value
    });
  } catch (e) {
    // タブが閉じられている等のエラー
  }
}

// WebSocket経由でメディア情報をブロードキャスト
function broadcastMediaInfo() {
  // offscreen document経由でWebSocketに送信
  chrome.runtime.sendMessage({
    type: 'BROADCAST_MEDIA_INFO',
    data: currentMediaInfo
  }).catch((e) => {
    // Offscreen document is likely not ready
  });
}

self.onmessage = e => {
  const data = JSON.parse(e.data);
  console.log('[Soul Widgets BG] Received WS request:', data);
  
  if (data.request === 'openURL') {
    if (data.url == 'chrome://newtab') {
      chrome.windows.create({ url: data.url });
    } else {
      chrome.windows.create({ url: data.url, type: 'popup' }, win => chrome.windows.remove(win.id));
    }
  } else if (data.request === 'getMediaInfo') {
    // メディア情報を返す
    broadcastMediaInfo();
  } else if (data.request === 'mediaControl') {
    handleMediaControl(data.action, data.value);
  }
};