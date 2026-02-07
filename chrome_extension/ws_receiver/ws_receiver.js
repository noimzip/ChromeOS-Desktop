console.log('[Soul Widgets WS] ws_receiver.js loaded');

setInterval(() => {
  chrome.runtime.sendMessage("Communication for Service Worker Maintenance").catch(() => {});
}, 30 * 1000);

let wsConnection = null;

(async () => {
  const sw = (await navigator.serviceWorker.ready).active;
  const connect_websocket = () => {
    const ws = new WebSocket('ws://localhost:25600');
    wsConnection = ws;

    ws.onopen = () => {
      // 接続時にメディア情報をリクエスト
      chrome.runtime.sendMessage({ type: 'GET_MEDIA_INFO' }).then(info => {
        if (info && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'mediaInfo', data: info }));
        }
      }).catch((e) => {});
    };
    
    ws.onclose = () => {
      wsConnection = null;
      setTimeout(connect_websocket, 2000); // 再接続間隔を少し広げる
    };
    
    ws.onerror = (e) => {};

    ws.onmessage = e => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.request === 'getMediaInfo') {
          chrome.runtime.sendMessage({ type: 'GET_MEDIA_INFO' }).then(info => {
            if (info && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'mediaInfo', data: info }));
            }
          }).catch((e) => {});
          return;
        } else if (parsed.request === 'mediaControl') {
          chrome.runtime.sendMessage({ type: 'MEDIA_CONTROL', action: parsed.action, value: parsed.value });
          return;
        }
      } catch (err) {}
      
      sw.postMessage(e.data);
    };
  };

  connect_websocket();
})();

// Backgroundからのメディア情報更新を受信してWebSocketで送信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BROADCAST_MEDIA_INFO') {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({ type: 'mediaInfo', data: message.data }));
    }
  }
  sendResponse({ success: true });
  return true;
});