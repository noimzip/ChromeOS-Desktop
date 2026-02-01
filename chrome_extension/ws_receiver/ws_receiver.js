console.log('[Soul Widgets WS] ws_receiver.js loaded');

setInterval(() => {
  chrome.runtime.sendMessage("Communication for Service Worker Maintenance");
}, 25 * 1000);

let wsConnection = null;

(async () => {
  const sw = (await navigator.serviceWorker.ready).active;
  const connect_websocket = () => {
    console.log('[Soul Widgets WS] Attempting to connect to WebSocket...');
    const ws = new WebSocket('ws://localhost:25600');
    wsConnection = ws;

    ws.onopen = () => {
      console.log('[Soul Widgets WS] Connection opened!');
      // 接続時にメディア情報をリクエスト
      chrome.runtime.sendMessage({ type: 'GET_MEDIA_INFO' }).then(info => {
        console.log('[Soul Widgets WS] Got initial media info:', info);
        if (info && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'mediaInfo', data: info }));
        }
      }).catch((e) => {
        console.log('[Soul Widgets WS] Failed to get initial media info:', e);
      });
    };
    
    ws.onclose = () => {
      console.log('[Soul Widgets WS] Connection closed, will reconnect after 1 second...');
      wsConnection = null;
      setTimeout(connect_websocket, 1000);
    };
    
    ws.onerror = (e) => {
      console.log('[Soul Widgets WS] WebSocket error:', e);
    };

    ws.onmessage = e => {
      const data = e.data;
      console.log('[Soul Widgets WS] Received from Electron:', data);
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.request === 'getMediaInfo') {
          // メディア情報を要求された
          console.log('[Soul Widgets WS] Media info requested');
          chrome.runtime.sendMessage({ type: 'GET_MEDIA_INFO' }).then(info => {
            console.log('[Soul Widgets WS] Sending media info to Electron:', info);
            if (info && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'mediaInfo', data: info }));
            }
          }).catch((e) => {
            console.log('[Soul Widgets WS] Failed to get media info:', e);
          });
          return;
        } else if (parsed.request === 'mediaControl') {
          // メディア制御
          console.log('[Soul Widgets WS] Media control:', parsed.action, 'value:', parsed.value);
          chrome.runtime.sendMessage({ type: 'MEDIA_CONTROL', action: parsed.action, value: parsed.value });
          return;
        }
      } catch (err) {
        // JSONパースエラーは無視
      }
      
      // 従来の処理（URLを開く等）
      sw.postMessage(data);
    };
  };

  connect_websocket();
})();

// Backgroundからのメディア情報更新を受信してWebSocketで送信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Soul Widgets WS] Received message from background:', message.type);
  if (message.type === 'BROADCAST_MEDIA_INFO') {
    console.log('[Soul Widgets WS] Broadcasting to Electron:', message.data);
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({ type: 'mediaInfo', data: message.data }));
      console.log('[Soul Widgets WS] Sent successfully');
    } else {
      console.log('[Soul Widgets WS] WebSocket not connected, state:', wsConnection?.readyState);
    }
  }
  sendResponse({ success: true });
  return true;
});