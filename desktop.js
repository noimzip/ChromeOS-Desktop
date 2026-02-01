// ビルトインアイコンのURL定義
const builtinIconUrls = {
  'appicon-chrome': 'chrome://newtab',
  'appicon-files': 'chrome://file-manager',
  'appicon-settings': 'chrome://os-settings',
  'appicon-x': 'https://x.com'
};

document.getElementById('appicon-chrome').onclick = () => {
  openURL('chrome://newtab');
}

document.getElementById('appicon-files').onclick = () => {
  openURL('chrome://file-manager');
}

document.getElementById('appicon-settings').onclick = () => {
  openURL('chrome://os-settings');
}

document.addEventListener('keydown', function(e) {
  if(e.key === 'Escape'){
    escmenu_modal_overlay.style.display = 'flex';
  }
});

// 右下の設定ボタン
document.getElementById('settings_fab').onclick = () => {
  escmenu_modal_overlay.style.display = 'flex';
}

document.getElementById('close_menu_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
}

document.getElementById('open_settingsmenu_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
  settingsmenu_modal_overlay.style.display = 'flex';
}

document.getElementById('close_settingsmenu_modal').onclick = () => {
  settingsmenu_modal_overlay.style.display = 'none';
}

// グリッドモードの設定
const GRID_SIZE = 80; // グリッドのサイズ
const GRID_OFFSET = 20; // グリッドの開始位置（paddingに合わせる）
let isGridModeEnabled = false;
let isPositionChangeMode = false; // 位置変更モードの状態

// フォルダー機能
let draggedItem = null;
let folders = JSON.parse(localStorage.getItem('appFolders') || '{}');

// 編集機能用
let currentEditingApp = null;
let currentEditingIcon = null;

function snapToGrid(value) {
  // オフセットを考慮してスナップ（グリッド線の間に配置）
  return Math.round((value - GRID_OFFSET) / GRID_SIZE) * GRID_SIZE + GRID_OFFSET;
}

// アイコン同士の重なりを検出
function getOverlappingIcon(draggedEl) {
  const draggedRect = draggedEl.getBoundingClientRect();
  const icons = document.querySelectorAll('.appicon:not(.folder)');
  
  for (const icon of icons) {
    if (icon === draggedEl) continue;
    if (icon.id === 'appicon-add') continue; // 追加ボタンは除外
    
    const iconRect = icon.getBoundingClientRect();
    const overlapX = Math.max(0, Math.min(draggedRect.right, iconRect.right) - Math.max(draggedRect.left, iconRect.left));
    const overlapY = Math.max(0, Math.min(draggedRect.bottom, iconRect.bottom) - Math.max(draggedRect.top, iconRect.top));
    const overlapArea = overlapX * overlapY;
    const threshold = 1600; // 40x40ピクセル以上の重なり
    
    if (overlapArea > threshold) {
      return icon;
    }
  }
  return null;
}

// フォルダーとの重なりを検出
function getOverlappingFolder(draggedEl) {
  const draggedRect = draggedEl.getBoundingClientRect();
  const folderIcons = document.querySelectorAll('.appicon.folder');
  
  for (const folder of folderIcons) {
    if (folder === draggedEl) continue;
    
    const folderRect = folder.getBoundingClientRect();
    const overlapX = Math.max(0, Math.min(draggedRect.right, folderRect.right) - Math.max(draggedRect.left, folderRect.left));
    const overlapY = Math.max(0, Math.min(draggedRect.bottom, folderRect.bottom) - Math.max(draggedRect.top, folderRect.top));
    const overlapArea = overlapX * overlapY;
    const threshold = 1600;
    
    if (overlapArea > threshold) {
      return folder;
    }
  }
  return null;
}

// フォルダーを作成
function createFolder(icon1, icon2) {
  const folderId = 'folder-' + Date.now();
  const folderName = (localStorage.getItem('language') || 'ja') === 'ja' ? '新規フォルダー' : 'New Folder';
  
  // アイコンデータを取得
  const getIconData = (icon) => {
    const img = icon.querySelector('img');
    const name = icon.querySelector('p')?.textContent || '';
    const isBuiltin = !!icon.id && !icon.dataset.saveKey;
    
    // URLを取得（ビルトインアイコンの場合はbuiltinIconUrlsから取得）
    let url = icon._appUrl || '';
    if (isBuiltin && icon.id && builtinIconUrls[icon.id]) {
      url = builtinIconUrls[icon.id];
    }
    
    return {
      id: icon.id || icon.dataset.saveKey,
      name: name,
      icon: img?.src || '',
      url: url,
      isBuiltin: isBuiltin
    };
  };
  
  const icon1Data = getIconData(icon1);
  const icon2Data = getIconData(icon2);
  
  // フォルダーデータを保存
  folders[folderId] = {
    name: folderName,
    apps: [icon1Data, icon2Data]
  };
  localStorage.setItem('appFolders', JSON.stringify(folders));
  
  // フォルダーアイコンを作成
  const folderEl = createFolderIcon(folderId, folders[folderId]);
  
  // 位置を設定（icon1の位置）
  folderEl.style.position = 'absolute';
  folderEl.style.left = icon1.style.left || (icon1.offsetLeft + 'px');
  folderEl.style.top = icon1.style.top || (icon1.offsetTop + 'px');
  
  // 元のアイコンを非表示
  icon1.style.display = 'none';
  icon2.style.display = 'none';
  
  // フォルダーを追加
  const addBtn = document.getElementById('appicon-add');
  if (addBtn && addBtn.parentNode) {
    addBtn.parentNode.insertBefore(folderEl, addBtn);
  }
  
  // 位置変更モード中であれば、新しいフォルダーアイコンにもドラッグイベントを設定
  if (typeof setupDraggableItem === 'function') {
    setupDraggableItem(folderEl);
  }
  
  return folderEl;
}

// フォルダーアイコンを作成
function createFolderIcon(folderId, folderData) {
  const div = document.createElement('div');
  div.className = 'appicon folder';
  div.dataset.folderId = folderId;
  div.dataset.saveKey = folderId;
  
  // プレビュー用のグリッドを作成
  const previewDiv = document.createElement('div');
  previewDiv.className = 'folder-preview';
  
  // 最大4つのアイコンをプレビュー表示
  folderData.apps.slice(0, 4).forEach(app => {
    const img = document.createElement('img');
    img.src = app.icon;
    previewDiv.appendChild(img);
  });
  
  const nameP = document.createElement('p');
  nameP.textContent = folderData.name;
  
  div.appendChild(previewDiv);
  div.appendChild(nameP);
  
  // クリックでフォルダーを開く
  div.onclick = () => openFolder(folderId);
  
  // 右クリックでフォルダー名を変更
  div.oncontextmenu = (e) => {
    e.preventDefault();
    const lang = localStorage.getItem('language') || 'ja';
    // 最新のフォルダーデータから名前を取得
    const currentName = folders[folderId]?.name || '';
    const newName = prompt(lang === 'ja' ? 'フォルダー名を入力:' : 'Enter folder name:', currentName);
    if (newName && newName.trim()) {
      folders[folderId].name = newName.trim();
      localStorage.setItem('appFolders', JSON.stringify(folders));
      nameP.textContent = newName.trim();
    }
  };
  
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
  
  return div;
}

// 現在開いているフォルダーID
let currentOpenFolderId = null;

// フォルダーを開く
function openFolder(folderId) {
  const folderData = folders[folderId];
  if (!folderData) return;
  
  currentOpenFolderId = folderId;
  
  const modal = document.getElementById('folder_modal_overlay');
  const title = document.getElementById('folder_title');
  const titleInput = document.getElementById('folder_title_input');
  const contents = document.getElementById('folder_contents');
  
  title.textContent = folderData.name;
  title.style.display = '';
  titleInput.style.display = 'none';
  contents.innerHTML = '';
  
  // タイトルクリックで編集モードに
  title.onclick = () => {
    title.style.display = 'none';
    titleInput.style.display = '';
    titleInput.value = folderData.name;
    titleInput.focus();
    titleInput.select();
  };
  
  // 編集完了時の処理
  const saveTitle = () => {
    const newName = titleInput.value.trim();
    if (newName && newName !== folderData.name) {
      folderData.name = newName;
      title.textContent = newName;
      localStorage.setItem('appFolders', JSON.stringify(folders));
      
      // フォルダーアイコンの名前も更新
      const folderIcon = document.querySelector(`[data-save-key="${folderId}"]`);
      if (folderIcon) {
        const nameEl = folderIcon.querySelector('p');
        if (nameEl) nameEl.textContent = newName;
      }
    }
    titleInput.style.display = 'none';
    title.style.display = '';
  };
  
  titleInput.onblur = saveTitle;
  titleInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      titleInput.style.display = 'none';
      title.style.display = '';
    }
  };
  
  folderData.apps.forEach((app, index) => {
    const div = document.createElement('div');
    div.className = 'appicon folder-item';
    div.dataset.folderItemIndex = index;
    div.innerHTML = `
      <img src="${app.icon}" height="50" width="50" />
      <p>${app.name}</p>
    `;
    
    // ドラッグ用の変数
    let isDraggingFromFolder = false;
    let dragStartX, dragStartY;
    let dragClone = null;
    
    div.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      div.setPointerCapture(e.pointerId);
      isDraggingFromFolder = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };
    
    div.onpointermove = (e) => {
      if (!e.buttons) return;
      
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      // ドラッグ開始判定
      if (!isDraggingFromFolder && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        isDraggingFromFolder = true;
        
        // ドラッグ用のクローンを作成
        dragClone = div.cloneNode(true);
        dragClone.className = 'appicon folder-drag-clone';
        dragClone.style.position = 'fixed';
        dragClone.style.pointerEvents = 'none';
        dragClone.style.zIndex = '10000';
        dragClone.style.opacity = '0.8';
        dragClone.style.width = '80px';
        document.body.appendChild(dragClone);
      }
      
      if (isDraggingFromFolder && dragClone) {
        dragClone.style.left = (e.clientX - 40) + 'px';
        dragClone.style.top = (e.clientY - 40) + 'px';
        
        // モーダル外かどうかをチェック
        const modalRect = document.getElementById('folder_modal').getBoundingClientRect();
        const isOutsideModal = e.clientX < modalRect.left || e.clientX > modalRect.right ||
                               e.clientY < modalRect.top || e.clientY > modalRect.bottom;
        
        if (isOutsideModal) {
          dragClone.style.transform = 'scale(1.1)';
          dragClone.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
        } else {
          dragClone.style.transform = 'scale(1)';
          dragClone.style.boxShadow = '';
        }
      }
    };
    
    div.onpointerup = (e) => {
      if (e.pointerId !== undefined) {
        div.releasePointerCapture(e.pointerId);
      }
      
      if (isDraggingFromFolder && dragClone) {
        const modalRect = document.getElementById('folder_modal').getBoundingClientRect();
        const isOutsideModal = e.clientX < modalRect.left || e.clientX > modalRect.right ||
                               e.clientY < modalRect.top || e.clientY > modalRect.bottom;
        
        dragClone.remove();
        dragClone = null;
        
        if (isOutsideModal) {
          // フォルダから取り出す
          removeFromFolder(folderId, index);
          modal.style.display = 'none';
        }
      } else if (!isDraggingFromFolder) {
        // クリックとして処理
        handleFolderItemClick(app, modal);
      }
      
      isDraggingFromFolder = false;
    };
    
    // 長押しでフォルダーから取り出す
    div.oncontextmenu = (e) => {
      e.preventDefault();
      const lang = localStorage.getItem('language') || 'ja';
      const confirmMsg = lang === 'ja' ? `「${app.name}」をフォルダーから取り出しますか？` : `Remove "${app.name}" from folder?`;
      
      if (confirm(confirmMsg)) {
        removeFromFolder(folderId, index);
        modal.style.display = 'none';
      }
    };
    
    contents.appendChild(div);
  });
  
  modal.style.display = 'flex';
}

// フォルダ内アイテムのクリック処理
async function handleFolderItemClick(app, modal) {
  modal.style.display = 'none';
  
  // Linuxアプリの場合
  if (app.command || app.isLinuxApp) {
    let command = app.command;
    
    // ターミナルで実行する場合
    if (app.runInTerminal) {
      command = `xterm -hold -e "${app.command}"`;
    }
    
    console.log('Launching Linux app from folder:', command);
    const result = await launchLinuxApp(command);
    if (!result.success) {
      const lang = localStorage.getItem('language') || 'ja';
      const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
      alert(errorMsg);
    }
    return;
  }
  
  // URLがある場合は開く
  if (app.url) {
    if (app.url.startsWith('chrome://')) {
      if (typeof openURL === 'function') {
        openURL(app.url);
      }
    } else {
      window.open(app.url);
    }
  } else if (app.isBuiltin && app.id) {
    // ビルトインアイコンでURLがない場合（フォールバック）
    const builtinUrl = builtinIconUrls[app.id];
    if (builtinUrl) {
      if (builtinUrl.startsWith('chrome://')) {
        if (typeof openURL === 'function') {
          openURL(builtinUrl);
        }
      } else {
        window.open(builtinUrl);
      }
    }
  }
}

// フォルダーからアプリを取り出す
function removeFromFolder(folderId, appIndex) {
  const folderData = folders[folderId];
  if (!folderData) return;
  
  const app = folderData.apps[appIndex];
  folderData.apps.splice(appIndex, 1);
  
  // 元のアイコンを表示または再作成
  if (app.command || app.isLinuxApp) {
    // Linuxアプリは再作成
    createLinuxAppIcon({
      name: app.name,
      command: app.command,
      icon: app.icon,
      runInTerminal: app.runInTerminal || false
    });
  } else if (app.isBuiltin && app.id) {
    const el = document.getElementById(app.id);
    if (el) el.style.display = '';
  } else if (app.id) {
    let el = document.querySelector(`[data-save-key="${app.id}"]`);
    if (el) {
      el.style.display = '';
    } else if (app.url) {
      // カスタムアプリは再作成
      createDesktopIcon({
        name: app.name,
        url: app.url,
        icon: app.icon
      });
    }
  }
  
  // フォルダーが1つ以下になったら解散
  if (folderData.apps.length <= 1) {
    // 残りのアプリも表示または再作成
    if (folderData.apps.length === 1) {
      const remainingApp = folderData.apps[0];
      if (remainingApp.command || remainingApp.isLinuxApp) {
        createLinuxAppIcon({
          name: remainingApp.name,
          command: remainingApp.command,
          icon: remainingApp.icon,
          runInTerminal: remainingApp.runInTerminal || false
        });
      } else if (remainingApp.isBuiltin && remainingApp.id) {
        const el = document.getElementById(remainingApp.id);
        if (el) el.style.display = '';
      } else if (remainingApp.id) {
        let el = document.querySelector(`[data-save-key="${remainingApp.id}"]`);
        if (el) {
          el.style.display = '';
        } else if (remainingApp.url) {
          createDesktopIcon({
            name: remainingApp.name,
            url: remainingApp.url,
            icon: remainingApp.icon
          });
        }
      }
    }
    
    // フォルダーアイコンを削除
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderEl) folderEl.remove();
    
    delete folders[folderId];
  }
  
  localStorage.setItem('appFolders', JSON.stringify(folders));
  
  // フォルダーアイコンを更新
  updateFolderIcon(folderId);
}

// フォルダーにアプリを追加
function addToFolder(folderId, icon) {
  const folderData = folders[folderId];
  if (!folderData) return;
  
  const img = icon.querySelector('img');
  const name = icon.querySelector('p')?.textContent || '';
  const isBuiltin = !!icon.id && !icon.dataset.saveKey;
  const isLinuxApp = icon.classList.contains('linux-app');
  
  // URLを取得（ビルトインアイコンの場合はbuiltinIconUrlsから取得）
  let url = icon._appUrl || '';
  if (isBuiltin && icon.id && builtinIconUrls[icon.id]) {
    url = builtinIconUrls[icon.id];
  }
  
  const appData = {
    id: icon.id || icon.dataset.saveKey,
    name: name,
    icon: img?.src || '',
    url: url,
    isBuiltin: isBuiltin
  };
  
  // Linuxアプリの場合はcommandを追加
  if (isLinuxApp && icon._appCommand) {
    appData.command = icon._appCommand;
    appData.runInTerminal = icon._runInTerminal || false;
    appData.isLinuxApp = true;
  }
  
  folderData.apps.push(appData);
  localStorage.setItem('appFolders', JSON.stringify(folders));
  
  // アイコンを非表示ではなく削除（リロード時の重複を防ぐ）
  icon.remove();
  
  // フォルダーアイコンを更新
  updateFolderIcon(folderId);
}

// フォルダーアイコンを更新
function updateFolderIcon(folderId) {
  const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
  const folderData = folders[folderId];
  
  if (!folderEl || !folderData) return;
  
  const previewDiv = folderEl.querySelector('.folder-preview');
  if (previewDiv) {
    previewDiv.innerHTML = '';
    folderData.apps.slice(0, 4).forEach(app => {
      const img = document.createElement('img');
      img.src = app.icon;
      previewDiv.appendChild(img);
    });
  }
}

// 保存されたフォルダーを読み込み
function loadFolders() {
  Object.keys(folders).forEach(folderId => {
    const folderData = folders[folderId];
    const folderEl = createFolderIcon(folderId, folderData);
    
    // フォルダー内のアプリを非表示
    folderData.apps.forEach(app => {
      if (app.isBuiltin && app.id) {
        const el = document.getElementById(app.id);
        if (el) el.style.display = 'none';
      } else if (app.id) {
        const el = document.querySelector(`[data-save-key="${app.id}"]`);
        if (el) el.style.display = 'none';
      }
    });
    
    const addBtn = document.getElementById('appicon-add');
    if (addBtn && addBtn.parentNode) {
      addBtn.parentNode.insertBefore(folderEl, addBtn);
    }
  });
}

// フォルダーモーダルを閉じる
document.getElementById('close_folder_modal').onclick = () => {
  document.getElementById('folder_modal_overlay').style.display = 'none';
}

// 位置変更モードを有効にする
function enterPositionChangeMode() {
  if (isPositionChangeMode) return;
  isPositionChangeMode = true;
  
  change_widget_position_modal_overlay.style.display = 'flex';
  
  // 位置変更モード中はデスクトップアイコンのz-indexを上げる
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '5';
  }
  
  // グリッドモードのボタンの状態を復元
  isGridModeEnabled = localStorage.getItem('gridModeEnabled') === 'true';
  updateGridModeButton();
  
  // グリッド線の表示/非表示
  if (isGridModeEnabled) {
    change_widget_position_modal_overlay.classList.add('grid-mode');
  } else {
    change_widget_position_modal_overlay.classList.remove('grid-mode');
  }
}

// 位置変更モードを終了する（保存または閉じる時に呼ばれる）
function exitPositionChangeMode() {
  isPositionChangeMode = false;
  change_widget_position_modal_overlay.style.display = 'none';
  
  // z-indexを元に戻す
  document.getElementById('desktop_icons').style.zIndex = '';
}

document.getElementById('open_change_widget_position_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
  enterPositionChangeMode();
};

// アイテムにドラッグイベントを設定する関数（位置変更モード用）
function setupDraggableItem(item) {
  // 位置変更モード中はクリックイベントを無効化
  item.dataset.originalOnclick = item.onclick ? 'has-onclick' : '';
  item._savedOnclick = item.onclick;
  item.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // 右クリックイベントも保存
  item._savedOncontextmenu = item.oncontextmenu;
  
  // リンクタグのデフォルト動作も無効化
  const links = item.querySelectorAll('a');
  links.forEach(link => {
    link.dataset.originalHref = link.href;
    link.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
  });

  // 画像のドラッグを無効化
  const images = item.querySelectorAll('img');
  images.forEach(img => {
    img.draggable = false;
    img.style.pointerEvents = 'none';
  });

  // ポインターダウンでキャプチャを取得
  item.onpointerdown = function(event) {
    event.preventDefault();
    this.setPointerCapture(event.pointerId);
    this._isDragging = false;
    this._startX = event.clientX;
    this._startY = event.clientY;
    // 開始時の要素位置を記録
    this._startLeft = this.offsetLeft;
    this._startTop = this.offsetTop;
  };
  
  item.onpointermove = function(event){
    if(event.buttons){
      const dx = event.clientX - this._startX;
      const dy = event.clientY - this._startY;
      
      // ドラッグ開始の判定（少し動いたらドラッグ開始）
      if (!this._isDragging) {
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          this._isDragging = true;
        } else {
          return;
        }
      }
      
      // 開始位置からの相対移動で計算（より正確）
      let newLeft = this._startLeft + dx;
      let newTop = this._startTop + dy;
      
      // グリッドモードでも移動中はスムーズに動かす
      this.style.left = newLeft + 'px';
      this.style.top = newTop + 'px';
      this.style.position = 'absolute';
      this.draggable = false;
      
      // ドラッグ中のアイテムを記録
      draggedItem = this;
      
      // 他のアイコンとの重なりをチェック（フォルダー作成のヒント）
      if (!this.classList.contains('widget') && this.id !== 'appicon-add') {
        // すべてのハイライトをリセット
        document.querySelectorAll('.appicon.drag-over').forEach(el => {
          el.classList.remove('drag-over');
        });
        
        // 重なっているアイコンをハイライト
        const overlapping = getOverlappingIcon(this);
        if (overlapping) {
          overlapping.classList.add('drag-over');
        }
        
        // 重なっているフォルダーをハイライト
        const overlappingFolder = getOverlappingFolder(this);
        if (overlappingFolder) {
          overlappingFolder.classList.add('drag-over');
        }
      }
    }
  };
  
  // ドラッグ終了時の処理
  item.onpointerup = function(event) {
    // ポインターキャプチャを解放
    if (event && event.pointerId !== undefined) {
      this.releasePointerCapture(event.pointerId);
    }
    
    // ドラッグしていなかった場合は何もしない
    if (!this._isDragging) {
      this._isDragging = false;
      return;
    }
    this._isDragging = false;
    
    // ハイライトをリセット
    document.querySelectorAll('.appicon.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // フォルダー作成またはフォルダーへの追加をチェック
    if (!this.classList.contains('widget') && this.id !== 'appicon-add' && !this.classList.contains('folder')) {
      // フォルダーとの重なりをチェック
      const overlappingFolder = getOverlappingFolder(this);
      if (overlappingFolder) {
        const folderId = overlappingFolder.dataset.folderId;
        addToFolder(folderId, this);
        draggedItem = null;
        return;
      }
      
      // 他のアイコンとの重なりをチェック
      const overlapping = getOverlappingIcon(this);
      if (overlapping && !overlapping.classList.contains('folder')) {
        createFolder(overlapping, this);
        draggedItem = null;
        return;
      }
    }
    
    // グリッドモードが有効な場合、スナップ
    if (isGridModeEnabled && this.style.position === 'absolute') {
      this.style.left = snapToGrid(this.offsetLeft) + 'px';
      this.style.top = snapToGrid(this.offsetTop) + 'px';
    }
    
    draggedItem = null;
  };
}

// グリッドモードボタンのテキスト更新関数
function updateGridModeButton() {
  const gridModeBtn = document.getElementById('toggle_grid_mode');
  if (gridModeBtn) {
    const lang = localStorage.getItem('language') || 'ja';
    const key = isGridModeEnabled ? 'grid_mode_on' : 'grid_mode_off';
    gridModeBtn.textContent = translations[lang][key];
  }
}

// グリッドモードボタンのイベント
const gridModeBtn = document.getElementById('toggle_grid_mode');
if (gridModeBtn) {
  gridModeBtn.onclick = () => {
    isGridModeEnabled = !isGridModeEnabled;
    localStorage.setItem('gridModeEnabled', isGridModeEnabled);
    updateGridModeButton();
    
    // グリッド線の表示/非表示
    const overlay = document.getElementById('change_widget_position_modal_overlay');
    if (isGridModeEnabled) {
      overlay.classList.add('grid-mode');
    } else {
      overlay.classList.remove('grid-mode');
    }
    
    // グリッドモードが有効になったら、すべてのアイコンの位置をグリッドにスナップ
    if (isGridModeEnabled) {
      document.querySelectorAll(".appicon,.widget").forEach(item => {
        // 現在の位置を取得（absoluteでない場合はoffsetLeftを使用）
        const currentLeft = item.offsetLeft;
        const currentTop = item.offsetTop;
        
        // グリッドにスナップ
        item.style.position = 'absolute';
        item.style.left = snapToGrid(currentLeft) + 'px';
        item.style.top = snapToGrid(currentTop) + 'px';
      });
    }
  };
}

// 通常モードでのドラッグを設定する関数
function setupNormalModeDrag(item) {
  // 追加ボタンは除外
  if (item.id === 'appicon-add') return;
  
  item.onpointerdown = function(event) {
    // 左クリックのみ
    if (event.button !== 0) return;
    
    event.preventDefault();
    this.setPointerCapture(event.pointerId);
    this._isDragging = false;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this._startLeft = this.offsetLeft;
    this._startTop = this.offsetTop;
    this._normalModeDragStarted = false;
  };
  
  item.onpointermove = function(event) {
    if (!event.buttons) return;
    
    const dx = event.clientX - this._startX;
    const dy = event.clientY - this._startY;
    
    // ドラッグ開始の判定
    if (!this._isDragging) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this._isDragging = true;
        this._normalModeDragStarted = true;
        
        // 位置変更モードに入る
        enterPositionChangeMode();
        
        // このアイテムを位置変更モード用に設定
        document.querySelectorAll(".appicon,.widget").forEach(el => {
          if (el !== this) {
            setupDraggableItem(el);
          }
        });
        
        // 自分自身の設定も更新
        this._savedOnclick = this.onclick;
        this._savedOncontextmenu = this.oncontextmenu;
        this.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };
        
        const images = this.querySelectorAll('img');
        images.forEach(img => {
          img.draggable = false;
          img.style.pointerEvents = 'none';
        });
      } else {
        return;
      }
    }
    
    // 位置を更新
    let newLeft = this._startLeft + dx;
    let newTop = this._startTop + dy;
    
    this.style.left = newLeft + 'px';
    this.style.top = newTop + 'px';
    this.style.position = 'absolute';
    
    draggedItem = this;
    
    // フォルダー関連のハイライト
    if (!this.classList.contains('widget') && !this.classList.contains('folder')) {
      document.querySelectorAll('.appicon.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      const overlapping = getOverlappingIcon(this);
      if (overlapping) {
        overlapping.classList.add('drag-over');
      }
      
      const overlappingFolder = getOverlappingFolder(this);
      if (overlappingFolder) {
        overlappingFolder.classList.add('drag-over');
      }
    }
  };
  
  item.onpointerup = function(event) {
    if (event && event.pointerId !== undefined) {
      this.releasePointerCapture(event.pointerId);
    }
    
    // ドラッグしていなかった場合は通常のクリック処理
    if (!this._normalModeDragStarted) {
      this._isDragging = false;
      return;
    }
    
    // ハイライトをリセット
    document.querySelectorAll('.appicon.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // フォルダー処理
    if (!this.classList.contains('widget') && !this.classList.contains('folder')) {
      const overlappingFolder = getOverlappingFolder(this);
      if (overlappingFolder) {
        const folderId = overlappingFolder.dataset.folderId;
        addToFolder(folderId, this);
        draggedItem = null;
        this._isDragging = false;
        this._normalModeDragStarted = false;
        return;
      }
      
      const overlapping = getOverlappingIcon(this);
      if (overlapping && !overlapping.classList.contains('folder')) {
        createFolder(overlapping, this);
        draggedItem = null;
        this._isDragging = false;
        this._normalModeDragStarted = false;
        return;
      }
    }
    
    // グリッドモードでスナップ
    if (isGridModeEnabled && this.style.position === 'absolute') {
      this.style.left = snapToGrid(this.offsetLeft) + 'px';
      this.style.top = snapToGrid(this.offsetTop) + 'px';
    }
    
    draggedItem = null;
    this._isDragging = false;
    this._normalModeDragStarted = false;
  };
}

// すべてのアイコンに通常モードのドラッグを設定
function initNormalModeDrag() {
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    setupNormalModeDrag(item);
  });
}

// 位置をリセットする関数
function resetWidgetPositions() {
  // localStorageから位置データを削除
  localStorage.removeItem('widgetPositions');
  
  // すべてのアイコンとウィジェットの位置をリセット
  document.querySelectorAll('.appicon, .widget').forEach(el => {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
  });
  
  // モーダルを閉じる
  change_widget_position_modal_overlay.style.display = 'none';
  
  // z-indexを元に戻す
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '0';
  }
  
  // 位置変更モード終了時にクリックイベントを復元
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    if (item._savedOnclick) {
      item.onclick = item._savedOnclick;
    } else if (!item.dataset.originalOnclick) {
      item.onclick = null;
    }
    delete item._savedOnclick;
    delete item.dataset.originalOnclick;
    
    // 右クリックイベントを復元
    if (item._savedOncontextmenu) {
      item.oncontextmenu = item._savedOncontextmenu;
      delete item._savedOncontextmenu;
    }
    
    // リンクタグのクリックイベントを復元
    const links = item.querySelectorAll('a');
    links.forEach(link => {
      link.onclick = null;
    });
    
    // 画像のドラッグ設定を復元
    const images = item.querySelectorAll('img');
    images.forEach(img => {
      img.draggable = true;
      img.style.pointerEvents = '';
    });
    
    // ポインターイベントを削除
    item.onpointerdown = null;
    item.onpointermove = null;
    item.onpointerup = null;
    delete item._isDragging;
    delete item._startX;
    delete item._startY;
    delete item._startLeft;
    delete item._startTop;
  });
}

document.getElementById('reset_widget_position').onclick = () => {
  const lang = localStorage.getItem('language') || 'ja';
  const confirmMsg = lang === 'ja' ? 'すべてのウィジェットとアイコンの位置をリセットしますか？' : 'Reset all widget and icon positions?';
  if (confirm(confirmMsg)) {
    resetWidgetPositions();
  }
}

document.getElementById('save_change_widget_position').onclick = () => {
  const positions = {};
  document.querySelectorAll('.appicon, .widget').forEach(el => {
    const key = el.id || el.dataset.saveKey;
    if (key) {
      positions[key] = {
        left: el.style.left || (el.offsetLeft + 'px'),
        top: el.style.top || (el.offsetTop + 'px'),
        position: 'absolute'
      };
    }
  });
  localStorage.setItem('widgetPositions', JSON.stringify(positions));
  
  exitPositionChangeMode();
  
  // 位置変更モード終了時にクリックイベントを復元
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    if (item._savedOnclick) {
      item.onclick = item._savedOnclick;
    } else if (!item.dataset.originalOnclick) {
      item.onclick = null;
    }
    delete item._savedOnclick;
    delete item.dataset.originalOnclick;
    
    // 右クリックイベントを復元
    if (item._savedOncontextmenu) {
      item.oncontextmenu = item._savedOncontextmenu;
      delete item._savedOncontextmenu;
    }
    
    // リンクタグのクリックイベントを復元
    const links = item.querySelectorAll('a');
    links.forEach(link => {
      link.onclick = null;
    });
    
    // 画像のドラッグ設定を復元
    const images = item.querySelectorAll('img');
    images.forEach(img => {
      img.draggable = true;
      img.style.pointerEvents = '';
    });
    
    // ドラッグ関連のプロパティをクリア
    delete item._isDragging;
    delete item._startX;
    delete item._startY;
    delete item._startLeft;
    delete item._startTop;
    delete item._normalModeDragStarted;
  });
  
  // 通常モードのドラッグを再設定
  initNormalModeDrag();
}

document.getElementById('appicon-add').onclick = () => {
  add_app_type_modal_overlay.style.display = 'flex';
}

// アプリ追加タイプ選択
document.getElementById('add_web_app_btn').onclick = () => {
  add_app_type_modal_overlay.style.display = 'none';
  add_newapp_modal_overlay.style.display = 'flex';
}

document.getElementById('add_linux_app_btn').onclick = () => {
  add_app_type_modal_overlay.style.display = 'none';
  add_linuxapp_modal_overlay.style.display = 'flex';
}

document.getElementById('close_add_app_type_modal').onclick = () => {
  add_app_type_modal_overlay.style.display = 'none';
}

document.getElementById('close_add_newapp_modal').onclick = () => {
  add_newapp_modal_overlay.style.display = 'none';
}

developer_user_agent.textContent = window.navigator.userAgent.toLowerCase()

document.getElementById('refresh_page').onclick = () => {
  location.reload();
}

const translations = {
  ja: {
    files: "ファイル",
    settings: "設定",
    add_app: "アプリを追加",
    upload_image: "アプリ画像をアップロード",
    app_name: "アプリ名",
    url: "URL",
    close: "とじる",
    add: "追加",
    change_position: "位置の変更",
    refresh_dev: "リフレッシュ(開発者向け)",
    grid_mode: "グリッドモード",
    grid_mode_on: "ON",
    grid_mode_off: "OFF",
    save: "保存",
    reset_position: "位置をリセット",
    general: "一般",
    keyboard_shortcuts: "キーボードショートカット",
    design_style: "デザインとスタイル",
    security_privacy: "セキュリティとプライバシー",
    account: "アカウント",
    debug: "デバッグ",
    dev_settings: "開発者向け設定",
    about: "バージョン情報",
    user_agent: "ユーザーエージェント:",
    language: "言語",
    settings_button_label: "設定ボタン",
    show_settings_button: "表示",
    hide_settings_button: "非表示",
    select_app_type: "追加するアプリの種類を選択",
    web_app: "Webアプリ / URL",
    linux_app: "Linuxアプリ",
    add_linux_app: "Linuxアプリを追加",
    command: "コマンド",
    run_in_terminal: "ターミナルで実行",
    blur_effect: "ブラー効果",
    enabled: "有効",
    disabled: "無効",
    edit: "編集",
    delete: "削除",
    edit_app: "アプリを編集",
    edit_linux_app: "Linuxアプリを編集",
    change_image: "画像を変更"
  },
  en: {
    files: "Files",
    settings: "Settings",
    add_app: "Add an app",
    upload_image: "Upload app image",
    app_name: "App Name",
    url: "URL",
    close: "Close",
    add: "Add",
    change_position: "Change Position",
    refresh_dev: "Refresh (Dev)",
    grid_mode: "Grid Mode",
    grid_mode_on: "ON",
    grid_mode_off: "OFF",
    save: "Save",
    reset_position: "Reset Position",
    general: "General",
    keyboard_shortcuts: "Keyboard Shortcuts",
    design_style: "Design & Style",
    security_privacy: "Security & Privacy",
    account: "Account",
    debug: "Debug",
    dev_settings: "Developer Settings",
    about: "About",
    user_agent: "User Agent:",
    language: "Language",
    settings_button_label: "Settings Button",
    show_settings_button: "Show",
    hide_settings_button: "Hide",
    select_app_type: "Select app type to add",
    web_app: "Web App / URL",
    linux_app: "Linux App",
    add_linux_app: "Add Linux App",
    command: "Command",
    run_in_terminal: "Run in terminal",
    blur_effect: "Blur Effect",
    enabled: "Enabled",
    disabled: "Disabled",
    edit: "Edit",
    delete: "Delete",
    edit_app: "Edit App",
    edit_linux_app: "Edit Linux App",
    change_image: "Change Image"
  }
};

function updateLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  localStorage.setItem('language', lang);
}

const languageSelector = document.getElementById('language_selector');
if (languageSelector) {
  languageSelector.addEventListener('change', (e) => {
    updateLanguage(e.target.value);
  });
  
  const currentLang = localStorage.getItem('language') || 'ja';
  languageSelector.value = currentLang;
  updateLanguage(currentLang);
}

// 設定ボタン（FAB）の表示/非表示設定
const settingsFab = document.getElementById('settings_fab');
const toggleSettingsFabBtn = document.getElementById('toggle_settings_fab');

function updateSettingsFabVisibility(isVisible) {
  if (settingsFab) {
    settingsFab.style.display = isVisible ? 'flex' : 'none';
  }
  localStorage.setItem('showSettingsFab', isVisible);
  
  // ボタンのテキストを更新
  if (toggleSettingsFabBtn) {
    const lang = localStorage.getItem('language') || 'ja';
    const key = isVisible ? 'hide_settings_button' : 'show_settings_button';
    toggleSettingsFabBtn.textContent = translations[lang][key];
  }
}

if (toggleSettingsFabBtn) {
  // 保存された設定を復元（デフォルトは表示）
  const showFab = localStorage.getItem('showSettingsFab') !== 'false';
  updateSettingsFabVisibility(showFab);
  
  toggleSettingsFabBtn.onclick = () => {
    const currentlyVisible = settingsFab && settingsFab.style.display !== 'none';
    updateSettingsFabVisibility(!currentlyVisible);
  };
}

// ブラー効果の設定
const toggleBlurEffectBtn = document.getElementById('toggle_blur_effect');

function updateBlurEffect(isEnabled) {
  if (isEnabled) {
    document.body.classList.remove('no-blur');
  } else {
    document.body.classList.add('no-blur');
  }
  localStorage.setItem('blurEffectEnabled', isEnabled);
  
  // ボタンのテキストを更新
  if (toggleBlurEffectBtn) {
    const lang = localStorage.getItem('language') || 'ja';
    const key = isEnabled ? 'enabled' : 'disabled';
    toggleBlurEffectBtn.textContent = translations[lang][key];
  }
}

if (toggleBlurEffectBtn) {
  // 保存された設定を復元（デフォルトは有効）
  const blurEnabled = localStorage.getItem('blurEffectEnabled') !== 'false';
  updateBlurEffect(blurEnabled);
  
  toggleBlurEffectBtn.onclick = () => {
    const currentlyEnabled = !document.body.classList.contains('no-blur');
    updateBlurEffect(!currentlyEnabled);
  };
}

// New App Modal Logic
const newAppImageTrigger = document.getElementById('new_app_image_trigger');
const newAppFileInput = document.getElementById('new_app_image_file');
const newAppImagePreview = document.getElementById('new_app_image_preview');
let newAppIconDataUrl = './assets/settings.webp'; // Default icon

if (newAppImageTrigger && newAppFileInput) {
  newAppImageTrigger.onclick = () => newAppFileInput.click();
  newAppFileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        newAppIconDataUrl = evt.target.result;
        newAppImagePreview.src = newAppIconDataUrl;
        newAppImagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };
}

function createDesktopIcon(appData) {
  const div = document.createElement('div');
  div.className = 'appicon custom-app';
  div.dataset.saveKey = 'custom-app-' + appData.name;
  div._appUrl = appData.url; // フォルダー機能用にURLを保存
  div._appData = appData; // 編集用にデータを保存
  div.innerHTML = `
    <img src="${appData.icon}" height="50" width="50" />
    <p>${appData.name}</p>
  `;
  div.onclick = () => {
    if (appData.url.startsWith('chrome://')) {
      if (typeof openURL === 'function') openURL(appData.url);
    } else {
      window.open(appData.url);
    }
  };

  div.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, div, 'webapp');
  };
  
  const addBtn = document.getElementById('appicon-add');
  if (addBtn && addBtn.parentNode) {
    addBtn.parentNode.insertBefore(div, addBtn);
  }
  
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
}

const saveNewAppBtn = document.getElementById('save_new_app');
if (saveNewAppBtn) {
  saveNewAppBtn.onclick = () => {
    const name = document.getElementById('new_app_name').value;
    const url = document.getElementById('new_app_url').value;
    
    if (!name || !url) {
      alert('名前とURLを入力してください');
      return;
    }
    
    const newApp = {
      name: name,
      url: url,
      icon: newAppIconDataUrl
    };
    
    const customApps = JSON.parse(localStorage.getItem('customApps') || '[]');
    customApps.push(newApp);
    localStorage.setItem('customApps', JSON.stringify(customApps));
    
    createDesktopIcon(newApp);
    
    // Close modal and reset
    document.getElementById('add_newapp_modal_overlay').style.display = 'none';
    document.getElementById('new_app_name').value = '';
    document.getElementById('new_app_url').value = '';
    newAppImagePreview.style.display = 'none';
    newAppIconDataUrl = './assets/settings.webp';
  };
}

// Helper function to check if a custom app is in any folder
function isCustomAppInFolder(app) {
  for (const folderId in folders) {
    const folderData = folders[folderId];
    const found = folderData.apps.some(folderApp => 
      folderApp.url && folderApp.url === app.url && folderApp.name === app.name
    );
    if (found) return true;
  }
  return false;
}

// Load saved apps (skip those in folders)
const savedCustomApps = JSON.parse(localStorage.getItem('customApps') || '[]');
savedCustomApps.forEach(app => {
  if (!isCustomAppInFolder(app)) {
    createDesktopIcon(app);
  }
});

// Linuxアプリのアイコン作成
function createLinuxAppIcon(appData) {
  const div = document.createElement('div');
  div.className = 'appicon linux-app';
  div.dataset.saveKey = 'linux-app-' + appData.name.replace(/\s+/g, '-') + '-' + Date.now();
  div._appCommand = appData.command;
  div._runInTerminal = appData.runInTerminal || false;
  div._appData = appData; // 編集用にデータを保存
  
  div.innerHTML = `
    <img src="${appData.icon || './assets/settings.webp'}" height="50" width="50" />
    <p>${appData.name}</p>
  `;
  
  div.onclick = async () => {
    let command = appData.command;
    
    // ターミナルで実行する場合
    if (appData.runInTerminal) {
      // xterm を使用
      command = `xterm -hold -e "${appData.command}"`;
    }
    
    console.log('Launching Linux app:', command);
    const result = await launchLinuxApp(command);
    if (!result.success) {
      const lang = localStorage.getItem('language') || 'ja';
      const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
      alert(errorMsg);
    }
  };
  
  div.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, div, 'linuxapp');
  };
  
  const addBtn = document.getElementById('appicon-add');
  if (addBtn && addBtn.parentNode) {
    addBtn.parentNode.insertBefore(div, addBtn);
  }
  
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
  
  return div;
}

// Linuxアプリモーダルの処理
const linuxAppImageInput = document.getElementById('linux_app_image_file');
const linuxAppImageTrigger = document.getElementById('linux_app_image_trigger');
const linuxAppImagePreview = document.getElementById('linux_app_image_preview');
let linuxAppIconDataUrl = './assets/settings.webp';

if (linuxAppImageTrigger && linuxAppImageInput) {
  linuxAppImageTrigger.onclick = () => linuxAppImageInput.click();
  
  linuxAppImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        linuxAppIconDataUrl = e.target.result;
        linuxAppImagePreview.src = linuxAppIconDataUrl;
        linuxAppImagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };
}

document.getElementById('close_add_linuxapp_modal').onclick = () => {
  add_linuxapp_modal_overlay.style.display = 'none';
}

const saveLinuxAppBtn = document.getElementById('save_linux_app');
if (saveLinuxAppBtn) {
  saveLinuxAppBtn.onclick = () => {
    const name = document.getElementById('linux_app_name').value;
    const command = document.getElementById('linux_app_command').value;
    const runInTerminal = document.getElementById('linux_app_run_in_terminal').checked;
    
    if (!name || !command) {
      const lang = localStorage.getItem('language') || 'ja';
      alert(lang === 'ja' ? '名前とコマンドを入力してください' : 'Please enter name and command');
      return;
    }
    
    const newApp = {
      name: name,
      command: command,
      icon: linuxAppIconDataUrl,
      runInTerminal: runInTerminal
    };
    
    const linuxApps = JSON.parse(localStorage.getItem('linuxApps') || '[]');
    linuxApps.push(newApp);
    localStorage.setItem('linuxApps', JSON.stringify(linuxApps));
    
    createLinuxAppIcon(newApp);
    
    // Close modal and reset
    document.getElementById('add_linuxapp_modal_overlay').style.display = 'none';
    document.getElementById('linux_app_name').value = '';
    document.getElementById('linux_app_command').value = '';
    document.getElementById('linux_app_run_in_terminal').checked = false;
    linuxAppImagePreview.style.display = 'none';
    linuxAppIconDataUrl = './assets/settings.webp';
  };
}

// Load saved folders first (to know which apps are in folders)
loadFolders();

// Helper function to check if a Linux app is in any folder
function isLinuxAppInFolder(app) {
  for (const folderId in folders) {
    const folderData = folders[folderId];
    const found = folderData.apps.some(folderApp => 
      // commandが一致するか、またはisLinuxAppフラグがあってnameが一致する場合
      (folderApp.command && folderApp.command === app.command) ||
      (folderApp.isLinuxApp && folderApp.name === app.name)
    );
    if (found) return true;
  }
  return false;
}

// Load saved Linux apps (skip those in folders)
const savedLinuxApps = JSON.parse(localStorage.getItem('linuxApps') || '[]');
savedLinuxApps.forEach(app => {
  if (!isLinuxAppInFolder(app)) {
    createLinuxAppIcon(app);
  }
});

// Restore positions
const clockWidget = document.querySelector('.clock');
if (clockWidget && !clockWidget.id) clockWidget.id = 'widget-clock';

function restoreWidgetPositions() {
  const positions = JSON.parse(localStorage.getItem('widgetPositions') || '{}');
  Object.keys(positions).forEach(key => {
    let el = document.getElementById(key);
    if (!el) {
      el = document.querySelector(`[data-save-key="${key}"]`);
    }
    if (el) {
      el.style.position = positions[key].position;
      el.style.left = positions[key].left;
      el.style.top = positions[key].top;
    }
  });
}
restoreWidgetPositions();

// 通常モードのドラッグを初期化
initNormalModeDrag();

// ========================================
// コンテキストメニューと編集機能
// ========================================

const contextMenu = document.getElementById('app_context_menu');
let currentContextAppType = null;

// コンテキストメニューを表示
function showContextMenu(e, iconEl, appType) {
  currentEditingIcon = iconEl;
  currentEditingApp = iconEl._appData;
  currentContextAppType = appType;
  
  contextMenu.style.display = 'block';
  contextMenu.style.left = e.clientX + 'px';
  contextMenu.style.top = e.clientY + 'px';
  
  // 画面外にはみ出ないように調整
  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = (e.clientX - rect.width) + 'px';
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = (e.clientY - rect.height) + 'px';
  }
}

// コンテキストメニューを非表示
function hideContextMenu() {
  contextMenu.style.display = 'none';
}

// 画面クリックでコンテキストメニューを閉じる
document.addEventListener('click', hideContextMenu);

// 編集ボタン
document.getElementById('context_edit').onclick = (e) => {
  e.stopPropagation();
  hideContextMenu();
  
  if (currentContextAppType === 'webapp') {
    openEditWebappModal();
  } else if (currentContextAppType === 'linuxapp') {
    openEditLinuxappModal();
  }
};

// 削除ボタン
document.getElementById('context_delete').onclick = (e) => {
  e.stopPropagation();
  hideContextMenu();
  
  if (!currentEditingIcon || !currentEditingApp) return;
  
  const lang = localStorage.getItem('language') || 'ja';
  const confirmMsg = lang === 'ja' ? `「${currentEditingApp.name}」を削除しますか？` : `Delete "${currentEditingApp.name}"?`;
  
  if (confirm(confirmMsg)) {
    const saveKey = currentEditingIcon.dataset.saveKey;
    currentEditingIcon.remove();
    
    if (currentContextAppType === 'webapp') {
      const customApps = JSON.parse(localStorage.getItem('customApps') || '[]');
      const newApps = customApps.filter(a => !(a.name === currentEditingApp.name && a.url === currentEditingApp.url));
      localStorage.setItem('customApps', JSON.stringify(newApps));
    } else if (currentContextAppType === 'linuxapp') {
      const linuxApps = JSON.parse(localStorage.getItem('linuxApps') || '[]');
      const newApps = linuxApps.filter(a => !(a.name === currentEditingApp.name && a.command === currentEditingApp.command));
      localStorage.setItem('linuxApps', JSON.stringify(newApps));
    }
    
    // 位置データも削除
    const positions = JSON.parse(localStorage.getItem('widgetPositions') || '{}');
    if (positions[saveKey]) {
      delete positions[saveKey];
      localStorage.setItem('widgetPositions', JSON.stringify(positions));
    }
  }
};

// ========================================
// Webアプリ編集モーダル
// ========================================

let editWebappIconDataUrl = '';
const editWebappImageInput = document.getElementById('edit_webapp_image_file');
const editWebappImageTrigger = document.getElementById('edit_webapp_image_trigger');
const editWebappImagePreview = document.getElementById('edit_webapp_image_preview');

if (editWebappImageTrigger && editWebappImageInput) {
  editWebappImageTrigger.onclick = () => editWebappImageInput.click();
  editWebappImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        editWebappIconDataUrl = evt.target.result;
        editWebappImagePreview.src = editWebappIconDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };
}

function openEditWebappModal() {
  if (!currentEditingApp) return;
  
  document.getElementById('edit_webapp_name').value = currentEditingApp.name;
  document.getElementById('edit_webapp_url').value = currentEditingApp.url;
  editWebappImagePreview.src = currentEditingApp.icon;
  editWebappIconDataUrl = currentEditingApp.icon;
  
  document.getElementById('edit_webapp_modal_overlay').style.display = 'flex';
}

document.getElementById('close_edit_webapp_modal').onclick = () => {
  document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
};

document.getElementById('save_edit_webapp').onclick = () => {
  const name = document.getElementById('edit_webapp_name').value.trim();
  const url = document.getElementById('edit_webapp_url').value.trim();
  
  if (!name || !url) {
    const lang = localStorage.getItem('language') || 'ja';
    alert(lang === 'ja' ? '名前とURLを入力してください' : 'Please enter name and URL');
    return;
  }
  
  // localStorageを更新
  const customApps = JSON.parse(localStorage.getItem('customApps') || '[]');
  const index = customApps.findIndex(a => a.name === currentEditingApp.name && a.url === currentEditingApp.url);
  
  const updatedApp = {
    name: name,
    url: url,
    icon: editWebappIconDataUrl
  };
  
  if (index !== -1) {
    customApps[index] = updatedApp;
  }
  localStorage.setItem('customApps', JSON.stringify(customApps));
  
  // アイコンを更新
  if (currentEditingIcon) {
    currentEditingIcon.querySelector('img').src = editWebappIconDataUrl;
    currentEditingIcon.querySelector('p').textContent = name;
    currentEditingIcon._appUrl = url;
    currentEditingIcon._appData = updatedApp;
    
    // onclickも更新
    currentEditingIcon.onclick = () => {
      if (url.startsWith('chrome://')) {
        if (typeof openURL === 'function') openURL(url);
      } else {
        window.open(url);
      }
    };
  }
  
  document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
};

// ========================================
// Linuxアプリ編集モーダル
// ========================================

let editLinuxappIconDataUrl = '';
const editLinuxappImageInput = document.getElementById('edit_linuxapp_image_file');
const editLinuxappImageTrigger = document.getElementById('edit_linuxapp_image_trigger');
const editLinuxappImagePreview = document.getElementById('edit_linuxapp_image_preview');

if (editLinuxappImageTrigger && editLinuxappImageInput) {
  editLinuxappImageTrigger.onclick = () => editLinuxappImageInput.click();
  editLinuxappImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        editLinuxappIconDataUrl = evt.target.result;
        editLinuxappImagePreview.src = editLinuxappIconDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };
}

function openEditLinuxappModal() {
  if (!currentEditingApp) return;
  
  document.getElementById('edit_linuxapp_name').value = currentEditingApp.name;
  document.getElementById('edit_linuxapp_command').value = currentEditingApp.command;
  document.getElementById('edit_linuxapp_run_in_terminal').checked = currentEditingApp.runInTerminal || false;
  editLinuxappImagePreview.src = currentEditingApp.icon || './assets/settings.webp';
  editLinuxappIconDataUrl = currentEditingApp.icon || './assets/settings.webp';
  
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'flex';
}

document.getElementById('close_edit_linuxapp_modal').onclick = () => {
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
};

document.getElementById('save_edit_linuxapp').onclick = () => {
  const name = document.getElementById('edit_linuxapp_name').value.trim();
  const command = document.getElementById('edit_linuxapp_command').value.trim();
  const runInTerminal = document.getElementById('edit_linuxapp_run_in_terminal').checked;
  
  if (!name || !command) {
    const lang = localStorage.getItem('language') || 'ja';
    alert(lang === 'ja' ? '名前とコマンドを入力してください' : 'Please enter name and command');
    return;
  }
  
  // localStorageを更新
  const linuxApps = JSON.parse(localStorage.getItem('linuxApps') || '[]');
  const index = linuxApps.findIndex(a => a.name === currentEditingApp.name && a.command === currentEditingApp.command);
  
  const updatedApp = {
    name: name,
    command: command,
    icon: editLinuxappIconDataUrl,
    runInTerminal: runInTerminal
  };
  
  if (index !== -1) {
    linuxApps[index] = updatedApp;
  }
  localStorage.setItem('linuxApps', JSON.stringify(linuxApps));
  
  // アイコンを更新
  if (currentEditingIcon) {
    currentEditingIcon.querySelector('img').src = editLinuxappIconDataUrl;
    currentEditingIcon.querySelector('p').textContent = name;
    currentEditingIcon._appCommand = command;
    currentEditingIcon._runInTerminal = runInTerminal;
    currentEditingIcon._appData = updatedApp;
    
    // onclickも更新
    currentEditingIcon.onclick = async () => {
      let cmd = command;
      if (runInTerminal) {
        cmd = `xterm -hold -e "${command}"`;
      }
      console.log('Launching Linux app:', cmd);
      const result = await launchLinuxApp(cmd);
      if (!result.success) {
        const lang = localStorage.getItem('language') || 'ja';
        const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
        alert(errorMsg);
      }
    };
  }
  
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
};