/**
 * Soul Widgets Manager - Desktop Module
 * @version 2.0.0
 * @description ChromeOSスタイルのデスクトップウィジェットマネージャー
 */

'use strict';

// =============================
// テスト用: 要素取得チェック関数
// =============================
window.__test_checkElementExists = function(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element with id '${id}' not found`);
  return true;
};

// テスト用: localStorageデータ検証
window.__test_checkFoldersData = function() {
  try {
    const folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
    if (typeof folders !== 'object' || Array.isArray(folders)) throw new Error('folders is not an object');
    Object.keys(folders).forEach(fid => {
      if (!folders[fid].apps || !Array.isArray(folders[fid].apps)) throw new Error(`folder ${fid} has invalid apps`);
    });
    return true;
  } catch (e) {
    throw new Error('Invalid folders data: ' + e.message);
  }
};

// DOM 要素参照は後で初期化するためのプレースホルダ
let iconShapeSelector = null;

// Constants are defined in constants.js

// ========================================
// ダイアログヘルパー関数 (UIUtilsより取得)
// ========================================

const { showAlertDialog, showConfirmDialog, resizeImage, hexToRgb, getContrastColor } = window.UIUtils;

// ========================================
// アイコン形状の設定
window.getCurrentIconShape = function() {
  return localStorage.getItem(LS_KEYS.ICON_SHAPE) || 'circle';
};

window.getCurrentClockShape = function() {
  return localStorage.getItem(LS_KEYS.CLOCK_SHAPE) || '12-sided-cookie';
};



window.wrapIconWithShape = function(appiconEl, shape) {
  if (!appiconEl) return;
  const img = appiconEl.querySelector('img');
  if (!img) return;

  const parent = img.parentElement;
  const parentTag = parent && parent.tagName && parent.tagName.toLowerCase();

  // square/circle は CSS の border-radius で処理する — m3e-shape が不要
  if (shape === 'square' || shape === 'circle') {
    if (parentTag === 'm3e-shape' || (parent && parent.classList.contains('custom-shape-wrapper'))) {
      parent.replaceWith(img);
    }
    img.style.borderRadius = shape === 'circle' ? '50%' : 'var(--radius-sm)';
    return;
  }

  // カスタムシェイプのチェック
  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  if (customShapes[shape]) {
    if (parent && parent.classList.contains('custom-shape-wrapper')) {
      parent.style.clipPath = customShapes[shape];
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-shape-wrapper';
    wrapper.style.clipPath = customShapes[shape];
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  // もし custom-shape-wrapper でラップされていれば m3e-shape に戻すために置換準備
  if (parent && parent.classList.contains('custom-shape-wrapper')) {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    parent.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  // カスタム形状: 既に m3e-shape でラップされているかチェック
  if (parentTag === 'm3e-shape') {
    const wrapper = img.parentElement;
    if (wrapper.getAttribute('name') === shape) {
      return; // 既に正しい形状
    }
    // 形状が違う場合は属性を更新
    wrapper.setAttribute('name', shape);
    return;
  }

  // img を m3e-shape でラップする
  try {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    // move the image into wrapper
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
  } catch (e) {
    // 何か失敗したらフォールバックで何もしない
    console.warn('Failed to wrap icon with m3e-shape:', e);
  }
};


window.wrapImageWithShape = function(img, shape) {
  if (!img) return;
  const parent = img.parentElement;
  const parentTag = parent && parent.tagName && parent.tagName.toLowerCase();

  if (shape === 'square' || shape === 'circle') {
    if (parentTag === 'm3e-shape' || (parent && parent.classList.contains('custom-shape-wrapper'))) {
      parent.replaceWith(img);
    }
    img.style.borderRadius = shape === 'circle' ? '50%' : 'var(--radius-sm)';
    return;
  }

  // カスタムシェイプのチェック
  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  if (customShapes[shape]) {
    if (parent && parent.classList.contains('custom-shape-wrapper')) {
      parent.style.clipPath = customShapes[shape];
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-shape-wrapper';
    wrapper.style.clipPath = customShapes[shape];
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  if (parent && parent.classList.contains('custom-shape-wrapper')) {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    parent.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  if (parentTag === 'm3e-shape') {
    const wrapper = img.parentElement;
    if (wrapper.getAttribute('name') === shape) return;
    wrapper.setAttribute('name', shape);
    return;
  }

  try {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
  } catch (e) {
    console.warn('Failed to wrap preview img with m3e-shape:', e);
  }
};


// 全アイコンに形状を適用する
window.applyShapeToAll = function(shape) {
  // 通常のアイコンとフォルダ内アイテム（モーダル）
  const icons = document.querySelectorAll('.appicon:not(.folder)');
  icons.forEach(icon => {
    // 個別設定がある場合はそれを優先、なければグローバル設定
    const targetShape = icon.dataset.shape || shape;
    window.wrapIconWithShape(icon, targetShape);
  });

  // フォルダアイコンのプレビュー画像
  const folderImages = document.querySelectorAll('.appicon.folder .folder-preview img');
  folderImages.forEach(img => {
    const folderEl = img.closest('.appicon.folder');
    const targetShape = folderEl?.dataset.shape || shape;
    window.wrapImageWithShape(img, targetShape);
  });
};

// 時計に形状を適用する
window.applyClockShape = function(shape) {
  let clockBg = document.querySelector('.clock-background');
  if (!clockBg) return;

  // 初期化
  clockBg.style.clipPath = '';
  clockBg.style.borderRadius = '';

  if (shape === 'square' || shape === 'circle') {
    if (clockBg.tagName === 'M3E-SHAPE' || clockBg.classList.contains('custom-shape-wrapper')) {
      const surface = clockBg.querySelector('.clock-surface');
      if (surface) {
        const newDiv = document.createElement('div');
        newDiv.className = 'clock-background';
        newDiv.style.overflow = 'hidden';
        newDiv.appendChild(surface);
        clockBg.replaceWith(newDiv);
        clockBg = newDiv;
      }
    }
    
    if (shape === 'circle') {
      clockBg.style.setProperty('border-radius', '50%', 'important');
    } else {
      clockBg.style.setProperty('border-radius', 'var(--radius-md)', 'important');
    }
    return;
  }

  // カスタムシェイプのチェック
  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  if (customShapes[shape]) {
    const surface = clockBg.querySelector('.clock-surface');
    if (!surface) return;

    if (clockBg.classList.contains('custom-shape-wrapper')) {
      clockBg.style.clipPath = customShapes[shape];
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'clock-background custom-shape-wrapper';
      wrapper.style.clipPath = customShapes[shape];
      clockBg.replaceWith(wrapper);
      wrapper.appendChild(surface);
    }
    return;
  }

  // もし custom-shape-wrapper でラップされていれば m3e-shape に戻す
  if (clockBg.classList.contains('custom-shape-wrapper')) {
    const surface = clockBg.querySelector('.clock-surface');
    if (surface) {
      const wrapper = document.createElement('m3e-shape');
      wrapper.className = 'clock-background';
      wrapper.setAttribute('name', shape);
      clockBg.replaceWith(wrapper);
      wrapper.appendChild(surface);
    }
    return;
  }

  if (clockBg.tagName === 'M3E-SHAPE') {
    clockBg.setAttribute('name', shape);
  } else {
    const surface = clockBg.querySelector('.clock-surface');
    if (surface) {
      const wrapper = document.createElement('m3e-shape');
      wrapper.className = 'clock-background';
      wrapper.setAttribute('name', shape);
      clockBg.replaceWith(wrapper);
      wrapper.appendChild(surface);
    }
  }
};


/**
 * アイコン形状を更新
 */
const updateIconShape = window.StyleManager.updateIconShape.bind(window.StyleManager);

window.launchLinuxApp = async function(command) {
  if (window.electronAPI && window.electronAPI.launchLinuxApp) {
    return await window.electronAPI.launchLinuxApp(command);
  }
  return { success: false, error: 'Electron API not available' };
};


// ========================================
// ウィジェット管理
// ========================================

const availableWidgets = {
  'widget-clock': { name: '時計', element: document.getElementById('widget-clock') },
  'media_player_widget': { name: 'メディアプレイヤー', element: document.getElementById('media_player_widget') },
  'github_contribution_widget': { name: 'GitHub Contributions', element: document.getElementById('github_contribution_widget') },
  'google_calendar_widget': { name: 'Google Calendar', element: document.getElementById('google_calendar_widget') },
  'gmail_widget': { name: 'Gmail', element: document.getElementById('gmail_widget') },
  'weather_widget': { name: window.i18n ? window.i18n.t('weather') : 'Weather', element: document.getElementById('weather_widget') }
};

let widgetVisibility = {};

function loadWidgetVisibility() {
  const saved = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_VISIBILITY) || '{}');
  const defaults = {};
  Object.keys(availableWidgets).forEach(id => {
    // 時計と天気のみデフォルトで表示
    defaults[id] = (id === 'widget-clock' || id === 'weather_widget');
  });
  widgetVisibility = { ...defaults, ...saved };
}

async function applyWidgetVisibility() {
  for (const widgetId in availableWidgets) {
    const widget = availableWidgets[widgetId].element;
    const isVisible = widgetVisibility[widgetId];
    if (widget) {
      if (isVisible) {
        // 表示する前にリソースを読み込む
        if (window.WidgetLoader) {
          await window.WidgetLoader.load(widgetId);
        }
        widget.style.display = '';
      } else {
        widget.style.display = 'none';
      }
    }
  }
}

async function setWidgetVisibility(widgetId, isVisible) {
  const widget = availableWidgets[widgetId]?.element;
  if (widget) {
    if (isVisible) {
      // 表示する前にリソースを読み込む
      if (window.WidgetLoader) {
        await window.WidgetLoader.load(widgetId);
      }
      widget.style.display = '';
    } else {
      widget.style.display = 'none';
    }
    widgetVisibility[widgetId] = isVisible;
    localStorage.setItem(LS_KEYS.WIDGET_VISIBILITY, JSON.stringify(widgetVisibility));
  }
}

// デフォルトアイコン表示設定
function setDefaultIconVisibility(iconId, isVisible, key) {
  const icon = document.getElementById(iconId);
  if (icon) {
    // フォルダ内にある場合は、設定に関わらず非表示を維持する
    if (isVisible && typeof isAppInFolder === 'function' && isAppInFolder(app => app.isBuiltin && app.id === iconId)) {
      icon.style.display = 'none';
    } else {
      icon.style.display = isVisible ? 'flex' : 'none';
    }
    localStorage.setItem(key, isVisible);
  }
}

function loadDefaultIconVisibility() {
  const icons = {
    'appicon-chrome': LS_KEYS.SHOW_CHROME_ICON,
    'appicon-files': LS_KEYS.SHOW_FILES_ICON,
    'appicon-settings': LS_KEYS.SHOW_SETTINGS_ICON
  };

  for (const iconId in icons) {
    const key = icons[iconId];
    const isVisible = localStorage.getItem(key) !== 'false'; // Default to true
    const toggle = document.getElementById(`toggle_${iconId.split('-')[1]}_icon`);

    const icon = document.getElementById(iconId);
    if (icon) {
      // フォルダ内にある場合は常に非表示にする
      if (typeof isAppInFolder === 'function' && isAppInFolder(app => app.isBuiltin && app.id === iconId)) {
        icon.style.display = 'none';
      } else {
        icon.style.display = isVisible ? 'flex' : 'none';
      }
    }

    if (toggle) {
      if (typeof toggle.selected !== 'undefined') {
        toggle.selected = isVisible;
      } else {
        toggle.checked = isVisible;
      }
    }
  }
}


// すべてのモーダルを閉じる関数

window.closeAllModals = function() {

  // すべてのオーバーレイを非表示

  const overlays = document.querySelectorAll('.modal_overlay');

  overlays.forEach(el => {

    el.style.display = 'none';

    el.classList.remove('fade-out');

  });



  // フォルダーの状態をリセット

  window.currentOpenFolderId = null;

  const folderModal = document.getElementById('folder_modal');

  if (folderModal) {

    folderModal.classList.remove('folder-opening', 'folder-closing');

  }



  // 位置変更モードを終了
  if (window.isPositionChangeMode) {
    exitPositionChangeMode();
  }



  hideContextMenu();

};



// ========================================
// ビルトインアイコンのクリックイベント
// ========================================

/** アイコンクリックハンドラを設定 */
function setupBuiltinIconClick(id, url) {
  const el = document.getElementById(id);
  if (el) el.onclick = () => {
    if (typeof window.openURL === 'function') window.openURL(url);
  };
}


setupBuiltinIconClick('appicon-chrome', 'chrome://newtab');
setupBuiltinIconClick('appicon-files', 'chrome://file-manager');
setupBuiltinIconClick('appicon-settings', 'chrome://os-settings');

document.addEventListener('keydown', function(e) {
  if(e.key === 'Escape'){
    closeAllModals();
    document.getElementById('escmenu_modal_overlay').style.display = 'flex';
  }
});

// 右下の設定ボタン
document.getElementById('settings_fab').onclick = () => {
  closeAllModals();
  document.getElementById('escmenu_modal_overlay').style.display = 'flex';
}

document.getElementById('close_menu_modal').onclick = () => {
  closeAllModals();
}

document.getElementById('open_settingsmenu_modal').onclick = () => {
  closeAllModals();
  initDisplaySelector(); // 設定メニューを開くたびにディスプレイ情報を更新
  initWindowResizableSwitch();
  initAutoOpenDevToolsSwitch();
  document.getElementById('settingsmenu_modal_overlay').style.display = 'flex';
}

document.getElementById('close_settingsmenu_modal').onclick = () => {
  closeAllModals();
}

// ========================================
// アプリケーション状態
// ========================================

window.isGridModeEnabled = localStorage.getItem(LS_KEYS.GRID_MODE_ENABLED) === 'true';
window.isMovementLocked = localStorage.getItem(LS_KEYS.LOCK_MOVEMENT) === 'true';
window.isPositionChangeMode = false;
window.draggedItem = null;
window.folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
window.currentOpenFolderId = null;
window.currentFolderPage = 0;

function updateLockMovementUI() {
  const toggle = document.getElementById('toggle_lock_movement_position_modal');
  if (toggle) {
    if (typeof toggle.selected !== 'undefined') {
      toggle.selected = window.isMovementLocked;
    } else {
      toggle.checked = window.isMovementLocked;
    }
  }
}

// 初期化時にUIを更新
updateLockMovementUI();

// トグルイベントの設定
const lockMovementToggle = document.getElementById('toggle_lock_movement_position_modal');
if (lockMovementToggle) {
  lockMovementToggle.addEventListener('change', (e) => {
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    window.isMovementLocked = newState;
    localStorage.setItem(LS_KEYS.LOCK_MOVEMENT, newState);
  });
}

// ドラッグ開始判定に使う閾値（ピクセル）
const DRAG_THRESHOLD = 8;


// 編集機能用 (ContextMenuManagerと同期)
Object.defineProperty(window, 'currentEditingApp', { 
  get: () => window.ContextMenuManager?.currentEditingApp, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentEditingApp = v; } 
});
Object.defineProperty(window, 'currentEditingIcon', { 
  get: () => window.ContextMenuManager?.currentEditingIcon, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentEditingIcon = v; } 
});
Object.defineProperty(window, 'currentContextAppType', { 
  get: () => window.ContextMenuManager?.currentContextAppType, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentContextAppType = v; } 
});
Object.defineProperty(window, 'currentEditingWidget', { 
  get: () => window.ContextMenuManager?.currentEditingWidget, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentEditingWidget = v; } 
});

// ========================================
// ユーティリティ関数
// ========================================

/**
 * フォルダーデータを保存
 */
function saveFolders() {
  localStorage.setItem(LS_KEYS.APP_FOLDERS, JSON.stringify(window.folders));
}


/**
 * 現在の言語を取得
 * @returns {string} 言語コード ('ja' または 'en')
 */
function getCurrentLanguage() {
  return localStorage.getItem(LS_KEYS.LANGUAGE) || 'ja';
}

const getDominantColor = window.UIUtils.getDominantColor;

// 他のモジュールから関数を取得
const { 
  snapToGrid, 
  calculateOverlapArea, 
  cacheIconRects, 
  getOverlappingIcon, 
  getOverlappingFolder, 
  isOverlappingAny, 
  findNearestEmptyPosition,
  setupDraggableItem,
  setupNormalModeDrag
} = window.DragManager;




// ========================================
// フォルダー機能
// ========================================

const { 
  getIconData, 
  createDesktopIcon, 
  createLinuxAppIcon, 
  createFileShortcutIcon, 
  createFolderShortcutIcon, 
  getFileIcon 
} = window.AppManager;

const { 
  createFolder, 
  createFolderIcon, 
  updateFolderIcon, 
  closeFolder, 
  openFolder, 
  applyFolderStyle, 
  renderFolderPage, 
  updateFolderModalPosition,
  loadFolders,
  isAppInFolder,
  removeFromFolder
} = window.FolderManager;


// フォルダーモーダルを閉じる
document.getElementById('close_folder_modal').onclick = () => {
  closeFolder();
}


// オーバーレイクリックで閉じる
document.getElementById('folder_modal_overlay').onclick = (e) => {
  if (e.target.id === 'folder_modal_overlay') {
    closeFolder();
  }
};

// 位置変更モードを有効にする
function enterPositionChangeMode() {
  closeAllModals();
  if (window.isPositionChangeMode) return;
  window.isPositionChangeMode = true;
  
  document.getElementById('change_widget_position_modal_overlay').style.display = 'flex';
  
  // 位置変更モード中はデスクトップアイコンのz-indexを上げる
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '5';
  }

  // すべてのアイコンにドラッグイベントを設定
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    setupDraggableItem(item);
    if (item.classList.contains('widget')) {
      item.style.zIndex = '15'; // オーバーレイ(10)より上
    }
  });
  
  // グリッドモードのスイッチの状態を復元
  window.isGridModeEnabled = localStorage.getItem(LS_KEYS.GRID_MODE_ENABLED) === 'true';
  updateGridModeSwitch();
  updateGridSizeUI();
  
  // グリッド線の表示/非表示
  if (window.isGridModeEnabled) {
    document.getElementById('change_widget_position_modal_overlay').classList.add('grid-mode');
  } else {
    document.getElementById('change_widget_position_modal_overlay').classList.remove('grid-mode');
  }
}

/**
 * グリッド設定のUIとCSS変数を更新
 */
function updateGridSizeUI() {
  const xSlider = document.getElementById('grid_size_x_slider');
  const ySlider = document.getElementById('grid_size_y_slider');
  const iconSlider = document.getElementById('icon_size_slider');
  const xValue = document.getElementById('grid_size_x_value');
  const yValue = document.getElementById('grid_size_y_value');
  const iconValue = document.getElementById('icon_size_value');
  const overlay = document.getElementById('change_widget_position_modal_overlay');

  if (xSlider && xValue) {
    const thumb = xSlider.querySelector('m3e-slider-thumb');
    if (thumb) thumb.value = GRID_SIZE_X;
    xValue.textContent = GRID_SIZE_X;
  }
  if (ySlider && yValue) {
    const thumb = ySlider.querySelector('m3e-slider-thumb');
    if (thumb) thumb.value = GRID_SIZE_Y;
    yValue.textContent = GRID_SIZE_Y;
  }
  if (iconSlider && iconValue) {
    const thumb = iconSlider.querySelector('m3e-slider-thumb');
    if (thumb) thumb.value = ICON_SIZE;
    iconValue.textContent = ICON_SIZE;
  }

  if (overlay) {
    overlay.style.setProperty('--grid-size-x', GRID_SIZE_X + 'px');
    overlay.style.setProperty('--grid-size-y', GRID_SIZE_Y + 'px');
    overlay.style.setProperty('--grid-offset', GRID_OFFSET + 'px');
  }
  
  // アイコンサイズを適用
  document.documentElement.style.setProperty('--icon-size-x', ICON_SIZE + 'px');
  document.documentElement.style.setProperty('--icon-size-y', (ICON_SIZE + 10) + 'px'); // 少し高めに設定
  document.documentElement.style.setProperty('--icon-img-size', (ICON_SIZE * 0.6) + 'px');
  document.documentElement.style.setProperty('--icon-font-size', Math.max(0.6, Math.min(1.2, ICON_SIZE / 80 * 0.8)) + 'rem');
}

// アイコンサイズスライダーのイベント
document.getElementById('icon_size_slider')?.addEventListener('input', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  ICON_SIZE = newValue;
  document.getElementById('icon_size_value').textContent = newValue;
  updateGridSizeUI();
});

document.getElementById('icon_size_slider')?.addEventListener('change', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  localStorage.setItem(LS_KEYS.ICON_SIZE, newValue);
});

/**
 * すべてのアイテムを現在のグリッドにスナップさせる
 */
function reSnapAllToGrid() {
  if (!window.isGridModeEnabled) return;
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    const currentLeft = item.offsetLeft;
    const currentTop = item.offsetTop;
    item.style.position = 'absolute';
    item.style.left = snapToGrid(currentLeft, 'x') + 'px';
    item.style.top = snapToGrid(currentTop, 'y') + 'px';
  });
}

// グリッドサイズスライダーのイベント
document.getElementById('grid_size_x_slider')?.addEventListener('input', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  GRID_SIZE_X = newValue;
  document.getElementById('grid_size_x_value').textContent = newValue;
  updateGridSizeUI();
});

document.getElementById('grid_size_x_slider')?.addEventListener('change', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  localStorage.setItem(LS_KEYS.GRID_SIZE_X, newValue);
});

document.getElementById('grid_size_y_slider')?.addEventListener('input', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 90);
  GRID_SIZE_Y = newValue;
  document.getElementById('grid_size_y_value').textContent = newValue;
  updateGridSizeUI();
});

document.getElementById('grid_size_y_slider')?.addEventListener('change', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 90);
  localStorage.setItem(LS_KEYS.GRID_SIZE_Y, newValue);
});

// 位置変更モードを終了する（保存または閉じる時に呼ばれる）
function exitPositionChangeMode() {
  if (!window.isPositionChangeMode) return;
  window.isPositionChangeMode = false;
  
  document.getElementById('change_widget_position_modal_overlay').style.display = 'none';
  
  // z-indexを元に戻す
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '';
  }
  document.querySelectorAll('.widget').forEach(w => {
    w.style.zIndex = '';
  });
  
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
    
    // ポインターイベントをクリア（initNormalModeDragで再設定される）
    item.onpointerdown = null;
    item.onpointermove = null;
    item.onpointerup = null;
    
    // ドラッグ関連のプロパティもクリア
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


document.getElementById('open_change_widget_position_modal').onclick = () => {
  enterPositionChangeMode();
};

// グリッドモードスイッチの状態更新関数 (m3e-switchのプロパティを考慮)

function updateGridModeSwitch() {
  const gridModeSwitch = document.getElementById('toggle_grid_mode');
  if (gridModeSwitch) {
    // m3e-switch は 'selected' プロパティを使用するが、念のため 'checked' も考慮
    if (typeof gridModeSwitch.selected !== 'undefined') {
      gridModeSwitch.selected = window.isGridModeEnabled;
    } else {
      gridModeSwitch.checked = window.isGridModeEnabled;
    }
  }
}

// グリッドモードスイッチのイベント
const gridModeSwitch = document.getElementById('toggle_grid_mode');
if (gridModeSwitch) {
  gridModeSwitch.addEventListener('change', (e) => {
    // m3e-switch は 'selected' プロパティで状態を公開するが、念のため 'checked' も考慮
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    window.isGridModeEnabled = newState;
    localStorage.setItem(LS_KEYS.GRID_MODE_ENABLED, window.isGridModeEnabled);
    
    // グリッド線の表示/非表示
    const overlay = document.getElementById('change_widget_position_modal_overlay');
    if (window.isGridModeEnabled) {
      overlay.classList.add('grid-mode');
    } else {
      overlay.classList.remove('grid-mode');
    }
    
    // 自動スナップは行わない（ユーザーの操作を尊重）
  });
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
  localStorage.removeItem(LS_KEYS.WIDGET_POSITIONS);
  
  // すべてのアイコンとウィジェットの位置をリセット
  document.querySelectorAll('.appicon, .widget').forEach(el => {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
  });
  
  // モーダルを閉じる
  exitPositionChangeMode();
}

document.getElementById('reset_widget_position').onclick = () => {
  (async () => {
    const lang = getCurrentLanguage();
    const confirmMsg = lang === 'ja' ? 'すべてのウィジェットとアイコンの位置をリセットしますか？' : 'Reset all widget and icon positions?';
    if (await showConfirmDialog(confirmMsg)) {
      resetWidgetPositions();
    }
  })();
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
  localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
  
  exitPositionChangeMode();
}

// アプリ追加タイプ選択
document.getElementById('add_web_app_btn').onclick = () => {
  closeAllModals();
  document.getElementById('add_newapp_modal_overlay').style.display = 'flex';
}

document.getElementById('add_linux_app_btn').onclick = () => {
  closeAllModals();
  document.getElementById('add_linuxapp_modal_overlay').style.display = 'flex';
}

document.getElementById('close_add_app_type_modal').onclick = () => {
  document.getElementById('add_app_type_modal_overlay').style.display = 'none';
}

document.getElementById('close_add_newapp_modal').onclick = () => {
  document.getElementById('add_newapp_modal_overlay').style.display = 'none';
}

const developerUserAgent = document.getElementById('developer_user_agent');
if (developerUserAgent) {
  developerUserAgent.textContent = window.navigator.userAgent.toLowerCase();
}

const openDevToolsBtn = document.getElementById('open_devtools_btn');
if (openDevToolsBtn) {
  openDevToolsBtn.onclick = () => {
    if (window.electronAPI && window.electronAPI.openDevTools) {
      window.electronAPI.openDevTools();
    }
  };
}

document.getElementById('refresh_page').onclick = () => {
  location.reload();
}

// Translations and language selector logic have been moved to i18n.js

// ========================================
// カラースキーム設定
// ========================================

const colorSchemes = window.StyleManager.colorSchemes;
const updateColorScheme = window.StyleManager.updateColorScheme.bind(window.StyleManager);
const applyCustomColor = window.StyleManager.applyCustomColor.bind(window.StyleManager);
const rgbToHsl = window.StyleManager.rgbToHsl.bind(window.StyleManager);
const hslToHex = window.StyleManager.hslToHex.bind(window.StyleManager);
const resetCustomColorVars = window.StyleManager.resetCustomColorVars.bind(window.StyleManager);

// カラーパレットの初期化
const colorPalette = document.getElementById('color_palette');
const customColorPicker = document.getElementById('custom_color_picker');

if (colorPalette) {
  colorPalette.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (swatch && swatch.dataset.color && !swatch.classList.contains('color-picker-swatch')) {
      // カスタムカラーのCSS変数をリセット
      resetCustomColorVars();
      updateColorScheme(swatch.dataset.color);
    }
  });
  
  // 保存された設定を復元
  const savedScheme = localStorage.getItem(LS_KEYS.COLOR_SCHEME) || 'blue';
  const savedCustomColor = localStorage.getItem(LS_KEYS.CUSTOM_COLOR);
  
  if (savedScheme === 'custom' && savedCustomColor) {
    if (customColorPicker) {
      customColorPicker.value = savedCustomColor;
    }
    updateColorScheme('custom', savedCustomColor);
  } else {
    updateColorScheme(savedScheme);
  }
}

if (customColorPicker) {
  customColorPicker.addEventListener('input', (e) => {
    updateColorScheme('custom', e.target.value);
  });
}

// 画像から色抽出
const extractColorBtn = document.getElementById('extract_color_btn');
const colorSchemeImageInput = document.getElementById('color_scheme_image_input');

if (extractColorBtn && colorSchemeImageInput) {
  extractColorBtn.onclick = () => colorSchemeImageInput.click();
  
  colorSchemeImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const color = await getDominantColor(evt.target.result);
          // カスタムカラーとして適用
          if (customColorPicker) {
            customColorPicker.value = color;
          }
          updateColorScheme('custom', color);
        } catch (err) {
          console.error("Failed to extract color:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

// 設定ボタン（FAB）の表示/非表示設定
const settingsFab = document.getElementById('settings_fab');
const toggleSettingsFabBtn = document.getElementById('toggle_settings_fab');

function updateSettingsFabVisibility(isVisible) {
  if (settingsFab) {
    settingsFab.style.display = isVisible ? 'flex' : 'none';
  }
  if (toggleSettingsFabBtn) {
    if (typeof toggleSettingsFabBtn.selected !== 'undefined') {
      toggleSettingsFabBtn.selected = isVisible;
    } else {
      toggleSettingsFabBtn.checked = isVisible;
    }
  }
  localStorage.setItem(LS_KEYS.SHOW_SETTINGS_FAB, isVisible);
}

if (toggleSettingsFabBtn) {
  // 保存された設定を復元（デフォルトは非表示）
  const showFab = localStorage.getItem(LS_KEYS.SHOW_SETTINGS_FAB) === 'true';
  updateSettingsFabVisibility(showFab);
  
  toggleSettingsFabBtn.addEventListener('change', (e) => {
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    updateSettingsFabVisibility(newState);
  });
}

// ブラー効果の設定
const toggleBlurEffectBtn = document.getElementById('toggle_blur_effect');
const updateBlurEffect = window.StyleManager.updateBlurEffect.bind(window.StyleManager);

if (toggleBlurEffectBtn) {
  // 保存された設定を復元（デフォルトは無効）
  const blurEnabled = localStorage.getItem(LS_KEYS.BLUR_EFFECT_ENABLED) === 'true';
  updateBlurEffect(blurEnabled);
  
  toggleBlurEffectBtn.addEventListener('change', (e) => {
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    updateBlurEffect(newState);
  });
}

// テーマ設定
const darkModeSelector = document.getElementById('dark_mode_selector');
const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = window.StyleManager.applyTheme.bind(window.StyleManager);

if (darkModeSelector) {
  // 保存された設定を読み込み
  let savedMode = localStorage.getItem(LS_KEYS.DARK_MODE_SETTING);
  
  // 以前の設定からの移行
  if (!savedMode) {
    const oldEnabled = localStorage.getItem(LS_KEYS.DARK_MODE_ENABLED);
    if (oldEnabled !== null) {
      savedMode = oldEnabled === 'true' ? 'dark' : 'light';
    } else {
      savedMode = 'system';
    }
  }
  
  // セレクターの初期値を設定
  darkModeSelector.value = savedMode;
  applyTheme(savedMode);
  
  darkModeSelector.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });
  
  // システム設定の変更監視
  systemDarkMode.addEventListener('change', (e) => {
    const currentMode = localStorage.getItem(LS_KEYS.DARK_MODE_SETTING) || 'system';
    if (currentMode === 'system') {
      applyTheme('system');
    }
  });
}

// アイコン形状の設定: 初期状態を適用
// ウィンドウ数の設定
const windowCountSelector = document.getElementById('window_count_selector');
const applyWindowCountBtn = document.getElementById('apply_window_count');

// ウィンドウ数セレクターの初期化
const initWindowCountSelector = window.SystemSettingsManager.initWindowCountSelector.bind(window.SystemSettingsManager);

// 初期化実行
initWindowCountSelector();
updateGridSizeUI();

// ディスプレイセレクターの初期化
const initDisplaySelector = window.SystemSettingsManager.initDisplaySelector.bind(window.SystemSettingsManager);

// ウィンドウリサイズ設定の初期化
const initWindowResizableSwitch = window.SystemSettingsManager.initWindowResizableSwitch.bind(window.SystemSettingsManager);

// デベロッパーツール自動起動設定の初期化
const initAutoOpenDevToolsSwitch = window.SystemSettingsManager.initAutoOpenDevToolsSwitch.bind(window.SystemSettingsManager);

// 適用ボタンのイベント
if (applyWindowCountBtn && windowCountSelector) {
  applyWindowCountBtn.onclick = async () => {
    const newCount = parseInt(windowCountSelector.value, 10);
    const lang = getCurrentLanguage();
    
    if (await showConfirmDialog(i18n.t('confirm_restart'))) {
      if (window.electronAPI && window.electronAPI.setWindowCount) {
        await window.electronAPI.setWindowCount(newCount);
      }
      if (window.electronAPI && window.electronAPI.restartApp) {
        await window.electronAPI.restartApp();
      }
    }
  };
}

// フォルダー一括設定
const applyFolderStyleAllBtn = document.getElementById('apply_folder_style_all');
if (applyFolderStyleAllBtn) {
  applyFolderStyleAllBtn.onclick = async () => {
    const color = document.getElementById('global_folder_bg_color').value;
    const opacitySlider = document.getElementById('global_folder_bg_opacity');
    const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
    
    Object.keys(window.folders).forEach(folderId => {
      window.folders[folderId].style = { color, opacity };
    });
    Object.keys(window.folders).forEach(folderId => updateFolderIcon(folderId));
    saveFolders();
    
    // 開いているフォルダーがあれば更新
    if (window.currentOpenFolderId) {
      applyFolderStyle(window.currentOpenFolderId);
    }
    
    const lang = getCurrentLanguage();
    await showAlertDialog(lang === 'ja' ? 'すべてのフォルダーに適用しました' : 'Applied to all folders');
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
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          newAppIconDataUrl = resizedDataUrl;
          newAppImagePreview.src = newAppIconDataUrl;
          newAppImagePreview.style.display = 'block';
        } catch (err) {
          console.error("Failed to resize image:", err);
          newAppIconDataUrl = evt.target.result;
          newAppImagePreview.src = newAppIconDataUrl;
          newAppImagePreview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

// 全データ削除機能
const deleteAllDataBtn = document.getElementById('delete_all_data_btn');
if (deleteAllDataBtn) {
  deleteAllDataBtn.onclick = async () => {
    const lang = getCurrentLanguage();
    const confirmMsg = i18n.t('confirm_delete_all_data');
    
    if (await showConfirmDialog(confirmMsg)) {
      // localStorageの全データを削除
      localStorage.clear();
      
      // 削除完了メッセージを表示してページをリロード
      await showAlertDialog(i18n.t('data_deleted'));
      location.reload();
    }
  };
}

const saveNewAppBtn = document.getElementById('save_new_app');

if (saveNewAppBtn) {
  saveNewAppBtn.onclick = async () => {
    let name = document.getElementById('new_app_name').value;
    let url = document.getElementById('new_app_url').value;
    if (window.SecurityManager) {
      name = await window.SecurityManager.sanitizeInput(name);
      url = window.SecurityManager.sanitizeUrlInput(url);
    }
    
    if (!name || !url) {
      const lang = getCurrentLanguage();
      await showAlertDialog(i18n.t('enter_name_and_url'));
      return;
    }
    if (!url.startsWith('chrome://') && window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
      await showAlertDialog(i18n.t('blocked_url'));
      return;
    }
    
    const newApp = {
      name: name,
      url: url,
      icon: newAppIconDataUrl,
      saveKey: 'custom-app-' + name.replace(/\s+/g, '-') + '-' + Date.now()
    };
    
    const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
    customApps.push(newApp);
    localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
    
    createDesktopIcon(newApp);
    if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedDomain === 'function') {
      window.SecurityManager.ensureAllowedDomain(url);
    }
    
    // Close modal and reset
    document.getElementById('add_newapp_modal_overlay').style.display = 'none';
    document.getElementById('new_app_name').value = '';
    document.getElementById('new_app_url').value = '';
    newAppImagePreview.style.display = 'none';
    newAppIconDataUrl = './assets/settings.webp';
  };
}

// Load saved apps (skip those in folders)

const savedCustomApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
savedCustomApps.forEach(app => {
  if (!isAppInFolder(folderApp => folderApp.url && folderApp.url === app.url && folderApp.name === app.name)) {
    createDesktopIcon(app);
  }
});

// Linuxアプリのアイコン作成

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
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          linuxAppIconDataUrl = resizedDataUrl;
          linuxAppImagePreview.src = linuxAppIconDataUrl;
          linuxAppImagePreview.style.display = 'block';
        } catch (err) {
          console.error("Failed to resize image:", err);
          linuxAppIconDataUrl = evt.target.result;
          linuxAppImagePreview.src = linuxAppIconDataUrl;
          linuxAppImagePreview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

document.getElementById('close_add_linuxapp_modal').onclick = () => {
  document.getElementById('add_linuxapp_modal_overlay').style.display = 'none';
}

const saveLinuxAppBtn = document.getElementById('save_linux_app');
if (saveLinuxAppBtn) {
  saveLinuxAppBtn.onclick = async () => {
    let name = document.getElementById('linux_app_name').value;
    let command = document.getElementById('linux_app_command').value;
    if (window.SecurityManager) {
      name = await window.SecurityManager.sanitizeInput(name);
      command = window.SecurityManager.sanitizeCommandInput(command);
    }
    const runInTerminal = document.getElementById('linux_app_run_in_terminal').checked;
    
    if (!name || !command) {
      const lang = getCurrentLanguage();
      await showAlertDialog(lang === 'ja' ? '名前とコマンドを入力してください' : 'Please enter name and command');
      return;
    }
    
    const newApp = {
      name: name,
      command: command,
      icon: linuxAppIconDataUrl,
      runInTerminal: runInTerminal,
      saveKey: 'linux-app-' + name.replace(/\s+/g, '-') + '-' + Date.now()
    };
    
    const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
    linuxApps.push(newApp);
    localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
    
    createLinuxAppIcon(newApp);
    if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedForCommand === 'function') {
      window.SecurityManager.ensureAllowedForCommand(command);
    }
    
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

// Hide builtin icons if they are already in folders
['appicon-chrome', 'appicon-files', 'appicon-settings'].forEach(id => {
  if (isAppInFolder(app => app.isBuiltin && app.id === id)) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
});

// Load saved Linux apps (skip those in folders)
const savedLinuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
savedLinuxApps.forEach(app => {
  if (!isAppInFolder(folderApp => (folderApp.command && folderApp.command === app.command) || (folderApp.isLinuxApp && folderApp.name === app.name))) {
    createLinuxAppIcon(app);
  }
});


// Restore positions
const clockWidget = document.querySelector('.clock');
if (clockWidget && !clockWidget.id) clockWidget.id = 'widget-clock';

const mediaPlayerWidgetEl = document.querySelector('.media-player');
if (mediaPlayerWidgetEl && !mediaPlayerWidgetEl.id) mediaPlayerWidgetEl.id = 'widget-media-player';

function restoreWidgetPositions() {
  const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
  
  const screenWidth = window.innerWidth;
  const padding = 20;

  // 時計ウィジェットのデフォルト位置 (データがない場合のみ設定)
  if (!positions['widget-clock']) {
    positions['widget-clock'] = {
      left: (screenWidth - 220 - padding) + 'px',
      top: padding + 'px',
      position: 'absolute'
    };
  }
  
  // 天気ウィジェットのデフォルト位置 (データがない場合のみ設定)
  if (!positions['weather_widget']) {
    positions['weather_widget'] = {
      left: (screenWidth - 220 - padding) + 'px',
      top: (padding + 260) + 'px',
      position: 'absolute'
    };
  }

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

// 起動時に保存された形状を全アイコン（およびフォルダ内プレビュー）に適用
try {
  // ビルトインアイコンの個別形状を復元
  const builtinShapes = JSON.parse(localStorage.getItem('builtin_icon_shapes') || '{}');
  Object.keys(builtinShapes).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.dataset.shape = builtinShapes[id];
    }
  });

  window.StyleManager.updateIconShape(getCurrentIconShape());
  window.StyleManager.updateClockShape(getCurrentClockShape());
} catch (e) {
  console.warn('Failed to apply shapes on init:', e);
}

// ========================================
// コンテキストメニューと編集機能
// ========================================

/**
 * コンテキストメニューを表示
 */
const showContextMenu = window.ContextMenuManager.showContextMenu.bind(window.ContextMenuManager);

/**
 * メニューを非表示にする
 */
const hideContextMenu = window.ContextMenuManager.hideContextMenu.bind(window.ContextMenuManager);

// 画面クリックでコンテキストメニューを閉じる
document.addEventListener('click', hideContextMenu);

// デスクトップのコンテキストメニュー
const desktopIconsContainer = document.getElementById('desktop_icons');
const desktopContextMenu = document.getElementById('desktop_context_menu');

if (desktopIconsContainer && desktopContextMenu) {
  desktopIconsContainer.addEventListener('contextmenu', (e) => {
    // アイコンやウィジェットの上で右クリックされた場合は、その要素のコンテキストメニューを優先
    if (e.target.closest('.appicon, .widget')) {
      return;
    }
    e.preventDefault();
    hideContextMenu(); // 他のメニューを隠す
    
    desktopContextMenu.style.display = 'block';
    desktopContextMenu.style.left = e.clientX + 'px';
    desktopContextMenu.style.top = e.clientY + 'px';

    // 画面外にはみ出ないように調整
    const rect = desktopContextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      desktopContextMenu.style.left = (e.clientX - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      desktopContextMenu.style.top = (e.clientY - rect.height) + 'px';
    }
  });

  document.getElementById('desktop_context_add_app').onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    document.getElementById('add_app_type_modal_overlay').style.display = 'flex';
  };
  document.getElementById('desktop_context_add_widget').onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    openAddWidgetModal();
  };
  document.getElementById('desktop_context_settings').onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    document.getElementById('settingsmenu_modal_overlay').style.display = 'flex';
  };
  document.getElementById('desktop_context_change_position').onclick = (e) => {
    e.stopPropagation();
    // closeAllModals is called inside enterPositionChangeMode
    enterPositionChangeMode();
  };
}

// ========================================
// ウィジェット追加モーダル
// ========================================
const addWidgetModalOverlay = document.getElementById('add_widget_modal_overlay');
const closeAddWidgetModalBtn = document.getElementById('close_add_widget_modal');
const widgetListContainer = document.getElementById('widget_list');

function openAddWidgetModal() {
  if (!widgetListContainer || !addWidgetModalOverlay) return;

  widgetListContainer.innerHTML = ''; // リストをクリア

  for (const widgetId in availableWidgets) {
    const widgetInfo = availableWidgets[widgetId];
    const btn = document.createElement('m3e-button');
    btn.variant = 'outlined';
    btn.textContent = widgetInfo.name;
    btn.dataset.widgetId = widgetId;
    btn.disabled = widgetVisibility[widgetId]; // 既に表示されている場合は無効化
    btn.style.width = '100%';

    btn.onclick = async () => {
      await setWidgetVisibility(widgetId, true);
      addWidgetModalOverlay.style.display = 'none';
    };
    widgetListContainer.appendChild(btn);
  }

  addWidgetModalOverlay.style.display = 'flex';
}

if (closeAddWidgetModalBtn) {
  closeAddWidgetModalBtn.onclick = () => {
    if (addWidgetModalOverlay) addWidgetModalOverlay.style.display = 'none';
  };
}

// ========================================
// ウィジェットのコンテキストメニュー
// ========================================
const widgetContextMenu = document.getElementById('widget_context_menu');

/**
 * ウィジェット用コンテキストメニューを表示
 */
const showWidgetContextMenu = window.ContextMenuManager.showWidgetContextMenu.bind(window.ContextMenuManager);

// 編集ボタン
document.getElementById('context_edit').onclick = async (e) => {
  e.stopPropagation();
  hideContextMenu();
  
  if (currentContextAppType === 'webapp' || currentContextAppType === 'folder-item-webapp') {
    openEditWebappModal();
  } else if (currentContextAppType === 'folder') {
    openFolderSettingsModal(currentEditingIcon._folderId);
  } else if (currentContextAppType === 'linuxapp' || currentContextAppType === 'folder-item-linuxapp') {
    openEditLinuxappModal();
  } else if (currentContextAppType === 'file' || currentContextAppType === 'folder-shortcut') {
    // ファイル/フォルダショートカットは編集不可（パスは変更できない）
    const lang = getCurrentLanguage();
    const msg = lang === 'ja' ? 'ファイル/フォルダのショートカットは編集できません。削除して再度追加してください。' : 'File/folder shortcuts cannot be edited. Please delete and add again.';
    await showAlertDialog(msg);
  }
};

document.getElementById('context_shape').onclick = (e) => {
  e.stopPropagation();
  hideContextMenu();
  if (currentEditingIcon) {
    openIconIndividualShapeModal(currentEditingIcon);
  }
};

function openIconIndividualShapeModal(iconEl) {
  const containerId = 'icon_individual_shape_buttons';
  const currentShape = iconEl.dataset.shape || '';
  const imgSrc = iconEl.querySelector('img')?.src;

  setupShapeButtons(containerId, currentShape, (s) => {
    updateIndividualIconShape(iconEl, s);
  }, imgSrc);

  document.getElementById('icon_individual_shape_modal_overlay').style.display = 'flex';
}

document.getElementById('close_icon_individual_shape_modal').onclick = () => {
  document.getElementById('icon_individual_shape_modal_overlay').style.display = 'none';
};

document.getElementById('reset_individual_shape').onclick = () => {
  if (currentEditingIcon) {
    updateIndividualIconShape(currentEditingIcon, '');
    document.getElementById('icon_individual_shape_modal_overlay').style.display = 'none';
  }
};

function updateIndividualIconShape(iconEl, shape) {
  if (shape) {
    iconEl.dataset.shape = shape;
    window.wrapIconWithShape(iconEl, shape);
  } else {
    delete iconEl.dataset.shape;
    window.wrapIconWithShape(iconEl, window.getCurrentIconShape());
  }

  // データを保存
  saveIconShape(iconEl, shape);
  
  // フォルダ内のプレビュー画像も更新が必要な場合
  if (iconEl.classList.contains('folder')) {
    const folderImages = iconEl.querySelectorAll('.folder-preview img');
    folderImages.forEach(img => window.wrapImageWithShape(img, shape || window.getCurrentIconShape()));
  }
}

function saveIconShape(iconEl, shape) {
  const appData = window.AppManager.getIconData(iconEl);
  appData.shape = shape;
  
  const type = currentContextAppType || '';
  
  if (type === 'webapp' || iconEl.classList.contains('custom-app')) {
    const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
    const index = customApps.findIndex(a => a.saveKey === iconEl.dataset.saveKey || (a.name === appData.name && a.url === appData.url));
    if (index !== -1) {
      customApps[index].shape = shape;
      localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
    }
  } else if (type === 'linuxapp' || iconEl.classList.contains('linux-app')) {
    const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
    const index = linuxApps.findIndex(a => a.saveKey === iconEl.dataset.saveKey || (a.name === appData.name && a.command === appData.command));
    if (index !== -1) {
      linuxApps[index].shape = shape;
      localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
    }
  } else if (type === 'file' || iconEl.classList.contains('file-shortcut')) {
    const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
    const index = fileShortcuts.findIndex(f => f.saveKey === iconEl.dataset.saveKey || f.path === iconEl._filePath);
    if (index !== -1) {
      fileShortcuts[index].shape = shape;
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));
    }
  } else if (type === 'folder-shortcut' || iconEl.classList.contains('folder-shortcut')) {
    const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
    const index = folderShortcuts.findIndex(f => f.saveKey === iconEl.dataset.saveKey || f.path === iconEl._filePath);
    if (index !== -1) {
      folderShortcuts[index].shape = shape;
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));
    }
  } else if (type === 'folder' || iconEl.classList.contains('folder')) {
    const folderId = iconEl._folderId;
    if (window.folders[folderId]) {
      window.folders[folderId].shape = shape;
      saveFolders();
    }
  } else if (type.startsWith('folder-item')) {
    const folderId = iconEl._folderId;
    const index = iconEl._folderIndex;
    if (window.folders[folderId] && window.folders[folderId].apps[index]) {
      window.folders[folderId].apps[index].shape = shape;
      saveFolders();
    }
  } else if (iconEl.id && iconEl.id.startsWith('appicon-')) {
    // ビルトインアイコンの形状保存
    const builtinShapes = JSON.parse(localStorage.getItem('builtin_icon_shapes') || '{}');
    if (shape) {
      builtinShapes[iconEl.id] = shape;
    } else {
      delete builtinShapes[iconEl.id];
    }
    localStorage.setItem('builtin_icon_shapes', JSON.stringify(builtinShapes));
  }
}

document.getElementById('context_delete').onclick = async (e) => {
  e.stopPropagation();
  hideContextMenu();
  
  if (!currentEditingIcon) return;
  
  const lang = getCurrentLanguage();
  const appName = currentEditingApp?.name || currentEditingIcon._fileData?.name || 'Unknown';
  const confirmMsg = lang === 'ja' ? `「${appName}」を削除しますか？` : `Delete "${appName}"?`;
  
  // フォルダー内アイテムの場合
  if (currentContextAppType && currentContextAppType.startsWith('folder-item')) {
    const folderConfirmMsg = lang === 'ja' ? `「${appName}」をフォルダーから取り出しますか？` : `Remove "${appName}" from folder?`;
    if (await showConfirmDialog(folderConfirmMsg)) {
      const folderId = currentEditingIcon._folderId;
      const index = currentEditingIcon._folderIndex;
      removeFromFolder(folderId, index);
      if (window.folders[folderId]) renderFolderPage(folderId);
      else closeFolder();
    }
    return;
  }
  
  // フォルダーの場合
  if (currentContextAppType === 'folder') {
    if (await showConfirmDialog(confirmMsg)) {
      const folderId = currentEditingIcon._folderId;
      delete window.folders[folderId];
      saveFolders();
      currentEditingIcon.remove();
    }
    return;
  }

  
  if (await showConfirmDialog(confirmMsg)) {
    const saveKey = currentEditingIcon.dataset.saveKey;
    currentEditingIcon.remove();
    
    if (currentContextAppType === 'webapp') {
      const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
      const newApps = customApps.filter(a => !(a.name === currentEditingApp.name && a.url === currentEditingApp.url));
      localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(newApps));
    } else if (currentContextAppType === 'linuxapp') {
      const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
      const newApps = linuxApps.filter(a => !(a.name === currentEditingApp.name && a.command === currentEditingApp.command));
      localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(newApps));
    } else if (currentContextAppType === 'file') {
      const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
      const newShortcuts = fileShortcuts.filter(f => f.path !== currentEditingIcon._filePath);
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(newShortcuts));
    } else if (currentContextAppType === 'folder-shortcut') {
      const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
      const newShortcuts = folderShortcuts.filter(f => f.path !== currentEditingIcon._filePath);
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(newShortcuts));
    }
    
    // 位置データも削除
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      delete positions[saveKey];
      localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
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
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          editWebappIconDataUrl = resizedDataUrl;
          editWebappImagePreview.src = editWebappIconDataUrl;
        } catch (err) {
          console.error("Failed to resize image:", err);
          editWebappIconDataUrl = evt.target.result;
          editWebappImagePreview.src = editWebappIconDataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

function openEditWebappModal() {
  closeAllModals();
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

document.getElementById('save_edit_webapp').onclick = async () => {
  let name = document.getElementById('edit_webapp_name').value.trim();
  let url = document.getElementById('edit_webapp_url').value.trim();
  if (window.SecurityManager) {
    name = await window.SecurityManager.sanitizeInput(name);
    url = window.SecurityManager.sanitizeUrlInput(url);
  }
  
  if (!name || !url) {
    const lang = getCurrentLanguage();
    await showAlertDialog(lang === 'ja' ? '名前とURLを入力してください' : 'Please enter name and URL');
    return;
  }
  if (!url.startsWith('chrome://') && window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
    await showAlertDialog(i18n.t('blocked_url'));
    return;
  }
  
  // フォルダー内アイテムの場合
  if (currentContextAppType === 'folder-item-webapp') {
    const folderId = currentEditingIcon._folderId;
    const index = currentEditingIcon._folderIndex;
    const folder = window.folders[folderId];
    
    if (folder && folder.apps[index]) {
      folder.apps[index].name = name;
      folder.apps[index].url = url;
      folder.apps[index].icon = editWebappIconDataUrl;
      saveFolders();
      updateFolderIcon(folderId);
      renderFolderPage(folderId);
    }
    document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
    return;
  }

  
  // localStorageを更新
  const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
  const index = customApps.findIndex(a => a.name === currentEditingApp.name && a.url === currentEditingApp.url);
  
  const updatedApp = {
    name: name,
    url: url,
    icon: editWebappIconDataUrl
  };
  
  if (index !== -1) {
    customApps[index] = updatedApp;
  }
  localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
  if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedDomain === 'function') {
    window.SecurityManager.ensureAllowedDomain(url);
  }
  
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
      } else if (window.AppManager && typeof window.AppManager._openUrl === 'function') {
        window.AppManager._openUrl(url);
      } else {
        window.open(url);
      }
    };
  }
  
  document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
};

// ========================================
// フォルダー設定モーダル
// ========================================

let currentSettingsFolderId = null;

function openFolderSettingsModal(folderId) {
  const folderData = window.folders[folderId];
  if (!folderData) return;
  
  currentSettingsFolderId = folderId;

  
  // デフォルトスタイル
  if (!folderData.style) {
    const isDark = document.body.classList.contains('dark-mode');
    folderData.style = { color: isDark ? '#1f1f1f' : '#ffffff', opacity: 1.0 };
  }
  
  document.getElementById('folder_settings_name').value = folderData.name;
  document.getElementById('folder_settings_color').value = folderData.style.color;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const thumb = opacitySlider.querySelector('m3e-slider-thumb');
  if (thumb) thumb.value = folderData.style.opacity;
  
  document.getElementById('folder_settings_modal_overlay').style.display = 'flex';
}

// フォルダー内の設定ボタン
document.getElementById('folder_style_btn').onclick = (e) => {
  e.stopPropagation();
  if (window.currentOpenFolderId) {
    openFolderSettingsModal(window.currentOpenFolderId);
  }
};


document.getElementById('close_folder_settings_modal').onclick = () => {
  document.getElementById('folder_settings_modal_overlay').style.display = 'none';
  // プレビューで変更されたスタイルを元に戻すために再適用（保存されていない場合）
  if (currentSettingsFolderId) {
    applyFolderStyle(currentSettingsFolderId);
  }
  if (currentSettingsFolderId) updateFolderIcon(currentSettingsFolderId);
  currentSettingsFolderId = null;
};

document.getElementById('save_folder_settings').onclick = () => {
  if (!currentSettingsFolderId || !window.folders[currentSettingsFolderId]) return;
  
  const name = document.getElementById('folder_settings_name').value.trim();
  const color = document.getElementById('folder_settings_color').value;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
  
  const folderData = window.folders[currentSettingsFolderId];
  folderData.name = name || folderData.name;
  folderData.style = { color, opacity };
  
  saveFolders();
  applyFolderStyle(currentSettingsFolderId);
  
  // フォルダーアイコンの名前更新
  const folderIcon = document.querySelector(`[data-folder-id="${currentSettingsFolderId}"]`);
  if (folderIcon) {
    const nameEl = folderIcon.querySelector('p');
    if (nameEl) nameEl.textContent = folderData.name;
  }
  
  // 開いているフォルダーのタイトル更新
  if (window.currentOpenFolderId === currentSettingsFolderId) {
    const title = document.getElementById('folder_title');
    if (title) title.textContent = folderData.name;
  }
  
  updateFolderIcon(currentSettingsFolderId);
  
  document.getElementById('folder_settings_modal_overlay').style.display = 'none';
  currentSettingsFolderId = null;
};


// 設定モーダルでのライブプレビュー（フォルダーが開いている場合）
function updateFolderPreview() {
  const color = document.getElementById('folder_settings_color').value;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
  const rgb = hexToRgb(color);

  if (currentSettingsFolderId && window.currentOpenFolderId === currentSettingsFolderId) {
    // 一時的にスタイル適用（保存はしない）
    const modal = document.getElementById('folder_modal');
    if (rgb && modal) {
      modal.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      const textColor = getContrastColor(rgb.r, rgb.g, rgb.b);
      modal.style.setProperty('--on-surface', textColor);
      modal.style.setProperty('--on-surface-variant', textColor);
    }
  }

  
  // アイコンのプレビューも更新
  if (currentSettingsFolderId && rgb) {
    const folderEl = document.querySelector(`[data-folder-id="${currentSettingsFolderId}"]`);
    const previewDiv = folderEl?.querySelector('.folder-preview');
    if (previewDiv) {
      previewDiv.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
  }
}

document.getElementById('folder_settings_color').addEventListener('input', updateFolderPreview);
document.getElementById('folder_settings_opacity').addEventListener('input', updateFolderPreview);

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
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          editLinuxappIconDataUrl = resizedDataUrl;
          editLinuxappImagePreview.src = editLinuxappIconDataUrl;
        } catch (err) {
          console.error("Failed to resize image:", err);
          editLinuxappIconDataUrl = evt.target.result;
          editLinuxappImagePreview.src = editLinuxappIconDataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

function openEditLinuxappModal() {
  closeAllModals();
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

// ========================================
// GitHub Contribution ウィジェット
// ========================================
// Moved to widgets/github_widget.js

// ========================================
// Google Calendar Widget
// ========================================
// Moved to widgets/google_calendar.js

document.getElementById('save_edit_linuxapp').onclick = async () => {
  let name = document.getElementById('edit_linuxapp_name').value.trim();
  let command = document.getElementById('edit_linuxapp_command').value.trim();
  if (window.SecurityManager) {
    name = await window.SecurityManager.sanitizeInput(name);
    command = window.SecurityManager.sanitizeCommandInput(command);
  }
  const runInTerminal = document.getElementById('edit_linuxapp_run_in_terminal').checked;
  
  if (!name || !command) {
    const lang = getCurrentLanguage();
    await showAlertDialog(lang === 'ja' ? '名前とコマンドを入力してください' : 'Please enter name and command');
    return;
  }
    
    // フォルダー内アイテムの場合
    if (currentContextAppType === 'folder-item-linuxapp') {
      const folderId = currentEditingIcon._folderId;
      const index = currentEditingIcon._folderIndex;
      const folder = window.folders[folderId];
      
      if (folder && folder.apps[index]) {
        folder.apps[index].name = name;
        folder.apps[index].command = command;
        folder.apps[index].runInTerminal = runInTerminal;
        folder.apps[index].icon = editLinuxappIconDataUrl;
        saveFolders();
        updateFolderIcon(folderId);
        renderFolderPage(folderId);
      }
      if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedForCommand === 'function') {
        window.SecurityManager.ensureAllowedForCommand(command);
      }
      document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
      return;
    }

  
  // localStorageを更新
  const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
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
  localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
  if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedForCommand === 'function') {
    window.SecurityManager.ensureAllowedForCommand(command);
  }
  
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
        const lang = getCurrentLanguage();
        const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
        await showAlertDialog(errorMsg);
      }
    };
  }
  
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
};

// ========================================
// ファイル/フォルダショートカット機能
// ========================================

/**
 * ファイルまたはフォルダを開く
 */
const openFileOrFolder = window.electronAPI.openFileOrFolder;


// ファイル追加ボタンのイベント

document.getElementById('add_file_btn')?.addEventListener('click', async () => {
  closeAllModals();
  
  // ファイル選択ダイアログを開く
  if (window.electronAPI && window.electronAPI.selectFile) {
    const result = await window.electronAPI.selectFile();
    if (!result.canceled) {
      const fileData = {
        name: result.name,
        path: result.path,
        isDirectory: result.isDirectory,
        saveKey: 'file-shortcut-' + result.name.replace(/\s+/g, '-') + '-' + Date.now()
      };
      
      // localStorageに保存
      const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
      fileShortcuts.push(fileData);
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));
      
      // アイコンを作成
      createFileShortcutIcon(fileData);
    }
  }
});

// フォルダ追加ボタンのイベント
document.getElementById('add_folder_btn')?.addEventListener('click', async () => {
  closeAllModals();
  
  // フォルダ選択ダイアログを開く
  if (window.electronAPI && window.electronAPI.selectFolder) {
    const result = await window.electronAPI.selectFolder();
    if (!result.canceled) {
      const folderData = {
        name: result.name,
        path: result.path,
        isDirectory: true,
        saveKey: 'folder-shortcut-' + result.name.replace(/\s+/g, '-') + '-' + Date.now()
      };
      
      // localStorageに保存
      const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
      folderShortcuts.push(folderData);
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));
      
      // アイコンを作成
      createFolderShortcutIcon(folderData);
    }
  }
});

// 保存されたファイルショートカットを読み込み
const savedFileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
savedFileShortcuts.forEach(file => {
  if (!isAppInFolder(folderApp => folderApp.path && folderApp.path === file.path)) {
    createFileShortcutIcon(file);
  }
});

// 保存されたフォルダショートカットを読み込み
const savedFolderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
savedFolderShortcuts.forEach(folder => {
  if (!isAppInFolder(folderApp => folderApp.path && folderApp.path === folder.path)) {
    createFolderShortcutIcon(folder);
  }
});


// ウィジェットのリサイズ機能を有効化
function applySavedWidgetSizes() {
  document.querySelectorAll('.widget').forEach(w => {
    const id = w.id || w.dataset.widgetKey;
    if (!id) return;
    const raw = localStorage.getItem(`${LS_KEYS.WIDGET_SIZE_PREFIX}${id}`);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.w) w.style.width = s.w + 'px';
      if (s.h) w.style.height = s.h + 'px';
    } catch (e) {}
  });
}

function enableWidgetResizers() {
  document.querySelectorAll('.widget').forEach(widget => {
    if (widget.querySelector('.widget-resizer')) return; // 既に追加済み

    // widget に一意キーがなければ自動付与
    if (!widget.id) {
      if (!widget.dataset.widgetKey) widget.dataset.widgetKey = 'w-' + Math.random().toString(36).slice(2,9);
    }

    const res = document.createElement('div');
    res.className = 'widget-resizer';
    // リサイズ操作はリサイズハンドラで完結させる（親にイベント伝播させない）
    res.addEventListener('pointerdown', function(e) {
      e.stopPropagation(); e.preventDefault();
      const widgetEl = widget;
      widgetEl._isResizing = true;
      widgetEl.classList.add('resizing');
      widgetEl.setPointerCapture(e.pointerId);

      // アンカーを左上に固定し、絶対配置にする
      const rect = widgetEl.getBoundingClientRect();
      const desktopIcons = document.getElementById('desktop_icons');
      const containerRect = desktopIcons ? desktopIcons.getBoundingClientRect() : {left: 0, top: 0};
      
      widgetEl.style.position = 'absolute';
      widgetEl.style.left = (rect.left - containerRect.left) + 'px';
      widgetEl.style.top = (rect.top - containerRect.top) + 'px';
      widgetEl.style.right = 'auto';
      widgetEl.style.bottom = 'auto';

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = widgetEl.offsetWidth;
      const startH = widgetEl.offsetHeight;
      const minW = 120; const minH = 48;
      
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      function onMove(ev) {
        ev.preventDefault();
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newW = Math.max(minW, Math.round(startW + dx));
        let newH = Math.max(minH, Math.round(startH + dy));
        // グリッドモードが有効なら幅・高さをグリッドサイズにスナップ
        if (window.isGridModeEnabled) {
          newW = Math.max(minW, Math.round(newW / GRID_SIZE_X) * GRID_SIZE_X);
          newH = Math.max(minH, Math.round(newH / GRID_SIZE_Y) * GRID_SIZE_Y);
        }

        
        // 画面外にはみ出さないように制限
        if (rect.left + newW > screenWidth) {
          newW = Math.max(minW, screenWidth - rect.left);
        }
        if (rect.top + newH > screenHeight) {
          newH = Math.max(minH, screenHeight - rect.top);
        }
        
        widgetEl.style.width = newW + 'px';
        widgetEl.style.height = newH + 'px';
      }

      function onUp(ev) {
        try { widgetEl.releasePointerCapture(e.pointerId); } catch (err) {}
        widgetEl._isResizing = false;
        widgetEl.classList.remove('resizing');
        // 永続化
        const id = widgetEl.id || widgetEl.dataset.widgetKey;
        if (id) {
          const w = widgetEl.offsetWidth;
          const h = widgetEl.offsetHeight;
          localStorage.setItem(`${LS_KEYS.WIDGET_SIZE_PREFIX}${id}`, JSON.stringify({w,h}));
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    widget.appendChild(res);
  });
}

// 起動時に適用
setTimeout(() => { applySavedWidgetSizes(); enableWidgetResizers(); }, 500);

// ウィジェットサイズをリセット（保存されたサイズを削除し、inline スタイルをクリア）
function resetWidgetSizes() {
  // localStorage キーを削除
  Object.keys(localStorage).forEach(k => {
    if (k && k.startsWith(LS_KEYS.WIDGET_SIZE_PREFIX)) localStorage.removeItem(k);
  });

  // 要素のサイズをクリア
  document.querySelectorAll('.widget').forEach(w => {
    w.style.width = '';
    w.style.height = '';
    // 自動付与した widgetKey は残しておく（不要なら削除可能）
  });

  // 再適用（リサイズハンドラ等がある場合に備えて）
  setTimeout(() => { applySavedWidgetSizes(); }, 50);
}

// アイコン形状選択UIの生成
function setupShapeButtons(containerId, currentShape, onSelect, previewImgSrc = './assets/settings.webp') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  let selectedBtn = null;
  function markSelected(btn) {
    if (selectedBtn) selectedBtn.classList.remove('selected');
    selectedBtn = btn;
    if (selectedBtn) selectedBtn.classList.add('selected');
  }

  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  const allShapes = [...SHAPES, ...Object.keys(customShapes)];

  allShapes.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shape-button';
    btn.title = s;
    
    if (customShapes[s]) {
      // カスタムシェイプのプレビュー
      const preview = document.createElement('div');
      preview.className = 'custom-shape-wrapper';
      preview.style.clipPath = customShapes[s];
      preview.style.width = '32px';
      preview.style.height = '32px';
      
      const img = document.createElement('img');
      img.src = previewImgSrc;
      img.alt = s;
      preview.appendChild(img);
      btn.appendChild(preview);
      
      // 右クリックで削除
      btn.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm(`Delete custom shape "${s}"?`)) {
          delete customShapes[s];
          localStorage.setItem(LS_KEYS.CUSTOM_SHAPES, JSON.stringify(customShapes));
          setupShapeButtons(containerId, currentShape, onSelect, previewImgSrc);
        }
      };
    } else {
      // ビルトインシェイプ
      const preview = document.createElement('m3e-shape');
      preview.setAttribute('name', s);
      const img = document.createElement('img');
      img.src = previewImgSrc;
      img.alt = s;
      preview.appendChild(img);
      btn.appendChild(preview);
    }

    btn.addEventListener('click', () => {
      onSelect(s);
      markSelected(btn);
    });

    if (s === currentShape) {
      markSelected(btn);
    }
    container.appendChild(btn);
  });

  // 追加ボタン
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-shape-button';
  addBtn.innerHTML = '<m3e-icon name="add"></m3e-icon>';
  addBtn.title = 'Add Custom Shape';
  addBtn.onclick = () => openAddCustomShapeModal(() => {
      // 全てのシェイプボタンを更新
      const iconShapes = document.getElementById('icon_shape_buttons');
      if (iconShapes) setupShapeButtons('icon_shape_buttons', window.getCurrentIconShape(), (s) => window.StyleManager.updateIconShape(s));
      
      const clockShapes = document.getElementById('clock_shape_buttons');
      if (clockShapes) setupShapeButtons('clock_shape_buttons', window.getCurrentClockShape(), (s) => window.StyleManager.updateClockShape(s));
      
      const individualShapes = document.getElementById('icon_individual_shape_buttons');
      if (individualShapes && currentEditingIcon) {
          setupShapeButtons('icon_individual_shape_buttons', currentEditingIcon.dataset.shape || '', (s) => updateIndividualIconShape(currentEditingIcon, s), currentEditingIcon.querySelector('img')?.src);
      }
  });
  container.appendChild(addBtn);
}

function openAddCustomShapeModal(onSaved) {
  const modal = document.getElementById('add_custom_shape_modal_overlay');
  const nameInput = document.getElementById('custom_shape_name');
  const pathInput = document.getElementById('custom_shape_path');
  const saveBtn = document.getElementById('save_custom_shape');
  const closeBtn = document.getElementById('close_add_custom_shape_modal');

  nameInput.value = '';
  pathInput.value = '';
  modal.style.display = 'flex';

  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };

  saveBtn.onclick = () => {
    const name = nameInput.value.trim();
    const path = pathInput.value.trim();
    if (!name || !path) {
      alert('Please enter both name and path.');
      return;
    }
    
    const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
    customShapes[name] = path;
    localStorage.setItem(LS_KEYS.CUSTOM_SHAPES, JSON.stringify(customShapes));
    
    modal.style.display = 'none';
    if (onSaved) onSaved();
  };
}

// 設定画面のリセットボタンにハンドラを追加
document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('reset_widget_sizes_btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const lang = getCurrentLanguage();
      if (!await showConfirmDialog(i18n.t('reset_widget_sizes_confirm'))) return;
      resetWidgetSizes();
      await showAlertDialog(i18n.t('widget_sizes_reset'));
    });
  }

  setupShapeButtons('icon_shape_buttons', getCurrentIconShape(), (s) => {
    window.StyleManager.updateIconShape(s);
  });

  setupShapeButtons('clock_shape_buttons', getCurrentClockShape(), (s) => {
    window.StyleManager.updateClockShape(s);
  });

  // メディアプレーヤーの設定トグル
  function initMediaPlayerToggles() {
    const configs = [
      { id: 'toggle_media_seekbar', key: LS_KEYS.MEDIA_PLAYER_SHOW_SEEKBAR, part: 'seekbar' },
      { id: 'toggle_media_shuffle', key: LS_KEYS.MEDIA_PLAYER_SHOW_SHUFFLE, part: 'shuffle' },
      { id: 'toggle_media_repeat', key: LS_KEYS.MEDIA_PLAYER_SHOW_REPEAT, part: 'repeat' }
    ];

    configs.forEach(config => {
      const toggle = document.getElementById(config.id);
      if (toggle) {
        const isVisible = localStorage.getItem(config.key) !== 'false';
        if (typeof toggle.selected !== 'undefined') toggle.selected = isVisible;
        else toggle.checked = isVisible;

        // 初期状態適用
        window.StyleManager.updateMediaPlayerVisibility(config.part, isVisible);

        toggle.addEventListener('change', (e) => {
          const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
          window.StyleManager.updateMediaPlayerVisibility(config.part, newState);
        });
      }
    });
  }
  initMediaPlayerToggles();

  // ウィジェットのコンテキストメニューを設定
  Object.values(availableWidgets).forEach(widgetInfo => {
    if (widgetInfo.element) {
      widgetInfo.element.addEventListener('contextmenu', (e) => showWidgetContextMenu(e, widgetInfo.element));
    }
  });

  // ウィジェット非表示ボタンの処理
  document.getElementById('widget_context_hide').onclick = async (e) => {
    e.stopPropagation();
    hideContextMenu();
    if (currentEditingWidget) {
      const widgetId = currentEditingWidget.id;
      if (widgetId) {
        await setWidgetVisibility(widgetId, false);
      }
    }
  };

  // ウィジェット設定ボタンの処理
  document.getElementById('widget_context_settings').onclick = (e) => {
    e.stopPropagation();
    hideContextMenu();
    if (currentEditingWidget) {
      openWidgetSettingsModal(currentEditingWidget);
    }
  };

  function openWidgetSettingsModal(widgetEl) {
    const clockContent = document.getElementById('clock_settings_content');
    const mediaContent = document.getElementById('media_player_settings_content');
    const weatherContent = document.getElementById('weather_widget_settings_content');
    const title = document.getElementById('widget_settings_title');
    
    // 全て非表示にリセット
    clockContent.style.display = 'none';
    mediaContent.style.display = 'none';
    if (weatherContent) weatherContent.style.display = 'none';
    
    const widgetId = widgetEl.id;
    if (widgetId === 'widget-clock') {
      clockContent.style.display = 'block';
      title.textContent = i18n.t('clock_settings') || '時計設定';
    } else if (widgetId === 'media_player_widget') {
      mediaContent.style.display = 'block';
      title.textContent = i18n.t('media_player_settings') || 'メディアプレーヤー設定';
    } else if (widgetId === 'gmail_widget') {
      // Gmailは専用のモーダルがあるのでそちらを開く
      if (typeof gmailSettingsBtn?.onclick === 'function') {
        gmailSettingsBtn.onclick(new MouseEvent('click'));
      }
      return; // 共通モーダルは開かない
    } else if (widgetId === 'google_calendar_widget') {
      if (typeof googleCalendarSettingsBtn?.onclick === 'function') {
        googleCalendarSettingsBtn.onclick(new MouseEvent('click'));
      }
      return;
    } else if (widgetId === 'github_contribution_widget') {
      if (typeof githubSettingsBtn?.onclick === 'function') {
        githubSettingsBtn.onclick(new MouseEvent('click'));
      }
      return;
    } else if (widgetId === 'weather_widget') {
      if (weatherContent) {
        weatherContent.style.display = 'block';
        title.textContent = i18n.t('weather_settings') || '天気設定';
        
        // 保存された設定を表示
        const latInput = document.getElementById('weather_lat_input');
        const lonInput = document.getElementById('weather_lon_input');
        const intervalSelect = document.getElementById('weather_location_interval_select');
        const modeSelect = document.getElementById('weather_location_mode_select');
        const providerSelect = document.getElementById('weather_provider_select');
        const unitSelect = document.getElementById('weather_unit_select');
        
        const mode = localStorage.getItem('weather_location_mode') || 'auto';
        if (modeSelect) modeSelect.value = mode;
        
        const provider = localStorage.getItem('weather_provider') || 'open-meteo';
        if (providerSelect) providerSelect.value = provider;

        const unit = localStorage.getItem('weather_unit') || 'c';
        if (unitSelect) unitSelect.value = unit;
        
        if (latInput) {
          latInput.value = mode === 'auto' 
            ? (localStorage.getItem('weather_lat') || '35.6895')
            : (localStorage.getItem('weather_lat_manual') || '35.6895');
        }
        if (lonInput) {
          lonInput.value = mode === 'auto' 
            ? (localStorage.getItem('weather_lon') || '139.6917')
            : (localStorage.getItem('weather_lon_manual') || '139.6917');
        }
        
        if (intervalSelect) intervalSelect.value = localStorage.getItem('weather_location_interval') || '60';
        
        // モード変更時の入力可否切り替え
        const updateInputState = () => {
          const isManual = modeSelect.value === 'manual';
          latInput.readOnly = !isManual;
          lonInput.readOnly = !isManual;
          latInput.style.opacity = isManual ? '1' : '0.5';
          lonInput.style.opacity = isManual ? '1' : '0.5';
        };
        if (modeSelect) modeSelect.onchange = updateInputState;
        updateInputState();
        
        // 形状選択ボタンの初期化
        const currentShape = localStorage.getItem('weather_shape') || 'pill';
        setupShapeButtons('weather_shape_buttons', currentShape, (s) => {
          localStorage.setItem('weather_shape', s);
          if (window.applyWeatherShape) window.applyWeatherShape(s);
        }, './assets/weather/light/cloudy.svg');
        
        // 保存ボタンのイベント
        const saveBtn = document.getElementById('save_weather_settings');
        if (saveBtn) {
          saveBtn.onclick = () => {
            const lat = document.getElementById('weather_lat_input').value;
            const lon = document.getElementById('weather_lon_input').value;
            const interval = document.getElementById('weather_location_interval_select').value;
            const mode = document.getElementById('weather_location_mode_select').value;
            const provider = document.getElementById('weather_provider_select').value;
            const unit = document.getElementById('weather_unit_select').value;
            
            localStorage.setItem('weather_location_mode', mode);
            localStorage.setItem('weather_provider', provider);
            localStorage.setItem('weather_unit', unit);
            if (mode === 'manual') {
              localStorage.setItem('weather_lat_manual', lat);
              localStorage.setItem('weather_lon_manual', lon);
            }
            localStorage.setItem('weather_location_interval', interval);
            
            if (window.setupWeatherLocationTimer) window.setupWeatherLocationTimer();
            if (window.updateWeather) window.updateWeather();
            
            document.getElementById('widget_settings_modal_overlay').style.display = 'none';
          };
        }
      }
    } else {
      // 他のウィジェットにはまだ設定がない場合
      title.textContent = i18n.t('widget_settings');
    }
    
    document.getElementById('widget_settings_modal_overlay').style.display = 'flex';
  }

  document.getElementById('close_widget_settings_modal').onclick = () => {
    document.getElementById('widget_settings_modal_overlay').style.display = 'none';
  };

  loadWidgetVisibility();
  await applyWidgetVisibility();

  loadDefaultIconVisibility();

  const chromeToggle = document.getElementById('toggle_chrome_icon');
  if (chromeToggle) {
    chromeToggle.addEventListener('change', (e) => {
      const isVisible = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
      setDefaultIconVisibility('appicon-chrome', isVisible, LS_KEYS.SHOW_CHROME_ICON);
    });
  }

  const filesToggle = document.getElementById('toggle_files_icon');
  if (filesToggle) {
    filesToggle.addEventListener('change', (e) => {
      const isVisible = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
      setDefaultIconVisibility('appicon-files', isVisible, LS_KEYS.SHOW_FILES_ICON);
    });
  }

  const settingsToggle = document.getElementById('toggle_settings_icon');
  if (settingsToggle) {
    settingsToggle.addEventListener('change', (e) => {
      const isVisible = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
      setDefaultIconVisibility('appicon-settings', isVisible, LS_KEYS.SHOW_SETTINGS_ICON);
    });
  }

  // アップデートチェックの初期化
  if (window.UpdateManager) {
    // 起動時にチェック (3秒後)
    setTimeout(() => window.UpdateManager.checkForUpdates(), 3000);

    // 手動チェックボタン
    const checkBtn = document.getElementById('check_updates_btn');
    if (checkBtn) {
      checkBtn.onclick = () => window.UpdateManager.checkForUpdates(true);
    }
    
    // バージョン表示の更新
    const versionDisplay = document.getElementById('app_version_display');
    if (versionDisplay) {
      versionDisplay.textContent = 'v' + window.UpdateManager.CURRENT_VERSION;
    }

    // チャンネルセレクターの初期化
    const channelSelector = document.getElementById('update_channel_selector');
    if (channelSelector) {
      channelSelector.value = window.UpdateManager.getChannel();
      channelSelector.addEventListener('change', (e) => {
        localStorage.setItem(LS_KEYS.UPDATE_CHANNEL, e.target.value);
      });
    }
  }
});
