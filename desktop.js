/**
 * Soul Widgets Manager - Desktop Module
 * @version 2.0.0
 * @description ChromeOSスタイルのデスクトップウィジェットマネージャー
 */

'use strict';

// DOM 要素参照は後で初期化するためのプレースホルダ
let iconShapeSelector = null;

// Constants are defined in constants.js

// ========================================
// ダイアログヘルパー関数
// ========================================

async function showAlertDialog(message, title = '', options = {}) {
  const dialog = document.getElementById('global_dialog');
  if (!dialog) {
    return new Promise(resolve => {
      alert(message);
      resolve();
    });
  }
  
  const dialogTitle = document.getElementById('global_dialog_title');
  const dialogIcon = document.getElementById('global_dialog_icon');
  const dialogContent = document.getElementById('global_dialog_content');
  const cancelBtn = document.getElementById('global_dialog_cancel');
  const okBtn = document.getElementById('global_dialog_ok');
  
  dialogTitle.textContent = title;
  
  if (options.html) {
    dialogContent.innerHTML = message;
  } else {
    dialogContent.textContent = message;
  }

  if (dialogIcon) {
    dialogIcon.style.display = options.icon ? '' : 'none';
    if (options.icon) dialogIcon.name = options.icon;
    if (options.iconColor) dialogIcon.style.color = options.iconColor;
  }

  cancelBtn.style.display = 'none';
  okBtn.textContent = 'OK';
  
  const handleOk = () => dialog.hide('ok');
  okBtn.onclick = handleOk;
  
  dialog.returnValue = '';
  dialog.open = true;
  
  return new Promise((resolve) => {
    const closeHandler = () => {
      dialog.removeEventListener('closed', closeHandler);
      okBtn.onclick = null;
      resolve();
    };
    dialog.addEventListener('closed', closeHandler);
  });
}

async function showConfirmDialog(message, title = '', options = {}) {
  const dialog = document.getElementById('global_dialog');
  if (!dialog) {
    return new Promise(resolve => {
      resolve(confirm(message));
    });
  }
  
  const dialogTitle = document.getElementById('global_dialog_title');
  const dialogIcon = document.getElementById('global_dialog_icon');
  const dialogContent = document.getElementById('global_dialog_content');
  const cancelBtn = document.getElementById('global_dialog_cancel');
  const okBtn = document.getElementById('global_dialog_ok');
  
  const lang = getCurrentLanguage();
  cancelBtn.textContent = i18n.t('cancel');
  okBtn.textContent = 'OK';
  
  dialogTitle.textContent = title;
  
  if (options.html) {
    dialogContent.innerHTML = message;
  } else {
    dialogContent.textContent = message;
  }

  if (dialogIcon) {
    dialogIcon.style.display = options.icon ? '' : 'none';
    if (options.icon) dialogIcon.name = options.icon;
    if (options.iconColor) dialogIcon.style.color = options.iconColor;
  }

  cancelBtn.style.display = '';
  
  const handleOk = () => dialog.hide('ok');
  const handleCancel = () => dialog.hide('cancel');
  
  okBtn.onclick = handleOk;
  cancelBtn.onclick = handleCancel;
  
  dialog.returnValue = '';
  dialog.open = true;
  
  return new Promise((resolve) => {
    const closeHandler = () => {
      dialog.removeEventListener('closed', closeHandler);
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(dialog.returnValue === 'ok');
    };
    dialog.addEventListener('closed', closeHandler);
  });
}

// ========================================
// アイコン形状の設定
function getCurrentIconShape() {
  return localStorage.getItem(LS_KEYS.ICON_SHAPE) || 'square';
}

function wrapIconWithShape(appiconEl, shape) {
  if (!appiconEl) return;
  const img = appiconEl.querySelector('img');
  if (!img) return;

  const parentTag = img.parentElement && img.parentElement.tagName && img.parentElement.tagName.toLowerCase();

  // square/circle は CSS の border-radius で処理する — m3e-shape が不要
  if (shape === 'square' || shape === 'circle') {
    // もし m3e-shape でラップされていればアンラップする
    if (parentTag === 'm3e-shape') {
      const wrapper = img.parentElement;
      wrapper.replaceWith(img);
    }
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
    appiconEl.replaceChild(wrapper, img);
    wrapper.appendChild(img);
  } catch (e) {
    // 何か失敗したらフォールバックで何もしない
    console.warn('Failed to wrap icon with m3e-shape:', e);
  }
}

// 単一の img 要素を形状でラップする（フォルダプレビュー用）
function wrapImageWithShape(img, shape) {
  if (!img) return;
  const parentTag = img.parentElement && img.parentElement.tagName && img.parentElement.tagName.toLowerCase();

  if (shape === 'square' || shape === 'circle') {
    // アンラップが必要ならアンラップ
    if (parentTag === 'm3e-shape') {
      const wrapper = img.parentElement;
      wrapper.replaceWith(img);
    }
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
}

// 全アイコンに形状を適用する
function applyShapeToAll(shape) {
  // 通常のアイコンとフォルダ内アイテム（モーダル）
  const icons = document.querySelectorAll('.appicon:not(.folder)');
  icons.forEach(icon => wrapIconWithShape(icon, shape));

  // フォルダアイコンのプレビュー画像
  const folderImages = document.querySelectorAll('.appicon.folder .folder-preview img');
  folderImages.forEach(img => wrapImageWithShape(img, shape));

  // 時計の背景形状
  const clockBg = document.querySelector('.clock-background');
  if (clockBg && clockBg.tagName === 'M3E-SHAPE') {
    clockBg.setAttribute('name', shape);
  }
}

function updateIconShape(shape) {
  // 既存の shape クラスを削除
  document.body.classList.remove('icon-shape-circle', 'icon-shape-square', 'icon-shape-custom');

  if (shape === 'square' || shape === 'circle') {
    document.body.classList.add(`icon-shape-${shape}`);
    // アンラップまたは border-radius 適用
    applyShapeToAll(shape);
  } else {
    // カスタム形状: 追加のクラスで状態を識別
    document.body.classList.add('icon-shape-custom');
    applyShapeToAll(shape);
  }

  localStorage.setItem(LS_KEYS.ICON_SHAPE, shape);

  // セレクターの値を更新（実際の要素は後で代入される）
  if (typeof iconShapeSelector !== 'undefined' && iconShapeSelector && iconShapeSelector.value !== undefined) {
    iconShapeSelector.value = shape;
  }
}

async function launchLinuxApp(command) {
  if (window.electronAPI && window.electronAPI.launchLinuxApp) {
    return await window.electronAPI.launchLinuxApp(command);
  }
  return { success: false, error: 'Electron API not available' };
}

// ========================================
// メディアプレイヤー機能
// ========================================

// メディアソース: 'linux' (playerctl) または 'browser' (Chrome拡張機能)
let currentMediaSource = 'linux';
let browserMediaInfo = null;

/**
 * Linuxメディア情報を取得する（playerctl）
 * @returns {Promise<Object>}
 */
async function getLinuxMediaInfo() {
  if (window.electronAPI && window.electronAPI.getMediaInfo) {
    return await window.electronAPI.getMediaInfo();
  }
  return null;
}

/**
 * ブラウザメディア情報を取得する
 * @returns {Object}
 */
function getBrowserMediaInfo() {
  if (window.electronAPI && window.electronAPI.getBrowserMediaInfo) {
    return window.electronAPI.getBrowserMediaInfo();
  }
  return null;
}

/**
 * 最適なメディアソースを選択してメディア情報を取得する
 * @returns {Promise<Object>}
 */
async function getMediaInfo() {
  // ブラウザのメディア情報を取得
  const browserInfo = getBrowserMediaInfo();
  const hasBrowserMedia = browserInfo && 
    browserInfo.status !== 'No player' && 
    browserInfo.status !== 'Stopped' &&
    browserInfo.title;
  
  // Linuxのメディア情報を取得
  const linuxInfo = await getLinuxMediaInfo();
  const hasLinuxMedia = linuxInfo && 
    linuxInfo.status !== 'No player' && 
    linuxInfo.player !== '';
  
  // 再生中のソースを優先
  if (hasBrowserMedia && browserInfo.status === 'Playing') {
    currentMediaSource = 'browser';
    return { ...browserInfo, source: 'browser' };
  }
  
  if (hasLinuxMedia && linuxInfo.status === 'Playing') {
    currentMediaSource = 'linux';
    return { ...linuxInfo, source: 'linux' };
  }
  
  // どちらも再生中でない場合、情報がある方を返す
  if (hasBrowserMedia) {
    currentMediaSource = 'browser';
    return { ...browserInfo, source: 'browser' };
  }
  
  if (hasLinuxMedia) {
    currentMediaSource = 'linux';
    return { ...linuxInfo, source: 'linux' };
  }
  
  // どちらもない場合
  currentMediaSource = 'none';
  return { status: 'No player', title: '', artist: '', artUrl: '', source: 'none' };
}

/**
 * メディアを制御する
 * @param {string} action - 'play-pause', 'next', 'previous', 'seek'
 * @param {number} value - シークの場合の秒数
 * @returns {Promise<{success: boolean}>}
 */
async function mediaControl(action, value) {
  // 現在のメディアソースに応じて制御
  if (currentMediaSource === 'browser') {
    if (window.electronAPI && window.electronAPI.browserMediaControl) {
      return window.electronAPI.browserMediaControl(action, value);
    }
  } else {
    if (window.electronAPI && window.electronAPI.mediaControl) {
      return await window.electronAPI.mediaControl(action, value);
    }
  }
  return { success: false };
}

// メディアプレイヤーUI要素
const mediaPlayerWidget = document.getElementById('media_player_widget');
const mediaTitle = document.getElementById('media_title');
const mediaArtist = document.getElementById('media_artist');
const mediaArt = document.getElementById('media_art');
const mediaPlayIcon = document.getElementById('media_play_icon');
const mediaPrevBtn = document.getElementById('media_prev');
const mediaPlayPauseBtn = document.getElementById('media_play_pause');
const mediaNextBtn = document.getElementById('media_next');
const mediaShuffleBtn = document.getElementById('media_shuffle');
const mediaRepeatBtn = document.getElementById('media_repeat');
const mediaSeekbar = document.getElementById('media_seekbar');
const mediaTimeCurrent = document.getElementById('media_time_current');
const mediaTimeTotal = document.getElementById('media_time_total');

let currentMediaStatus = 'Stopped';
let currentDuration = 0; // 曲の長さ（秒）
let currentShuffle = 'Off';
let currentLoop = 'None';
let isSeeking = false; // シーク中フラグ

/**
 * 秒数を mm:ss 形式にフォーマット
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * メディアプレイヤーUIを更新
 */
async function updateMediaPlayer() {
  const info = await getMediaInfo();
  if (!info) return;
  
  const hasPlayer = info.status !== 'No player' && info.source !== 'none';
  
  if (mediaPlayerWidget) {
    mediaPlayerWidget.classList.toggle('no-player', !hasPlayer);
    // ソースに応じてスタイルを変更（オプション）
    mediaPlayerWidget.dataset.source = info.source || 'none';
  }
  
  if (!hasPlayer) {
    const lang = getCurrentLanguage();
    if (mediaTitle) mediaTitle.textContent = i18n.t('no_music_playing');
    if (mediaArtist) mediaArtist.textContent = '';
    if (mediaArt) mediaArt.style.display = 'none';
    if (mediaPlayIcon) mediaPlayIcon.setAttribute('name', 'play_arrow');
    document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'block');
    return;
  }
  
  // タイトルとアーティストを更新
  if (mediaTitle) {
    mediaTitle.textContent = info.title || 'Unknown Title';
  }
  if (mediaArtist) {
    // ソース情報を表示（オプション）
    const sourceLabel = info.source === 'browser' ? '' : '';
    mediaArtist.textContent = (info.artist || '') + sourceLabel;
  }
  
  // アルバムアートを更新
  if (mediaArt && info.artUrl) {
    mediaArt.src = info.artUrl;
    mediaArt.style.display = 'block';
    mediaArt.onerror = () => {
      mediaArt.style.display = 'none';
      document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'block');
    };
    document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'none');
  } else if (mediaArt) {
    mediaArt.style.display = 'none';
    document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'block');
  }
  
  // 再生状態に応じてアイコンを更新
  currentMediaStatus = info.status;
  if (mediaPlayIcon) {
    mediaPlayIcon.setAttribute('name', info.status === 'Playing' ? 'pause' : 'play_arrow');
  }
  
  // シークバーを更新（シーク中でない場合のみ）
  if (!isSeeking) {
    // position と length を取得（Linuxの場合）
    let position = 0;
    let duration = 0;
    
    if (info.position !== undefined) {
      position = parseFloat(info.position) || 0;
    }
    if (info.length !== undefined) {
      // mpris:length はマイクロ秒
      duration = parseFloat(info.length) / 1000000 || 0;
    }
    if (info.duration !== undefined) {
      // ブラウザからの場合は秒
      duration = parseFloat(info.duration) || 0;
    }
    if (info.currentTime !== undefined) {
      position = parseFloat(info.currentTime) || 0;
    }
    
    currentDuration = duration;
    
    // シークバーの値を更新
    if (mediaSeekbar && duration > 0) {
      const percent = (position / duration) * 100;
      const thumb = mediaSeekbar.querySelector('m3e-slider-thumb');
      if (thumb) thumb.value = percent;
      mediaSeekbar.disabled = false;
    } else if (mediaSeekbar) {
      const thumb = mediaSeekbar.querySelector('m3e-slider-thumb');
      if (thumb) thumb.value = 0;
      mediaSeekbar.disabled = true;
    }
    
    // 時間表示を更新
    if (mediaTimeCurrent) {
      mediaTimeCurrent.textContent = formatTime(position);
    }
    if (mediaTimeTotal) {
      mediaTimeTotal.textContent = formatTime(duration);
    }
    
    // シャッフル・リピート状態の更新
    if (info.shuffle) {
      currentShuffle = info.shuffle;
      if (mediaShuffleBtn) {
        mediaShuffleBtn.classList.toggle('active', currentShuffle === 'On');
        mediaShuffleBtn.title = currentShuffle === 'On' ? 'Shuffle: On' : 'Shuffle: Off';
        mediaShuffleBtn.disabled = false;
      }
    } else if (mediaShuffleBtn) {
      mediaShuffleBtn.disabled = true;
      mediaShuffleBtn.classList.remove('active');
      mediaShuffleBtn.title = 'Shuffle';
    }

    if (info.loop) {
      currentLoop = info.loop;
      if (mediaRepeatBtn) {
        const loopStatus = currentLoop.toLowerCase();
        const isTrack = loopStatus === 'track' || loopStatus === 'one';
        const isPlaylist = loopStatus === 'playlist' || loopStatus === 'all';
        const isActive = isTrack || isPlaylist;
        
        mediaRepeatBtn.classList.toggle('active', isActive);
        mediaRepeatBtn.classList.toggle('repeat-one', isTrack);
        
        const icon = mediaRepeatBtn.querySelector('m3e-icon');
        if (icon) {
          const iconName = isTrack ? 'repeat_one' : 'repeat';
          icon.setAttribute('name', iconName);
          icon.name = iconName; // プロパティも更新
        }
        
        // ツールチップ更新
        let title = 'Repeat: Off';
        if (isPlaylist) title = 'Repeat: All';
        if (isTrack) title = 'Repeat: One';
        mediaRepeatBtn.title = title;
        
        mediaRepeatBtn.disabled = false;
      }
    } else if (mediaRepeatBtn) {
      mediaRepeatBtn.disabled = true;
      mediaRepeatBtn.classList.remove('active');
      mediaRepeatBtn.classList.remove('repeat-one');
      mediaRepeatBtn.title = 'Repeat';
    }
  }
}

// メディアコントロールボタンのイベント
// ドラッグイベントと干渉しないように pointerdown + pointerup で処理
function setupMediaButton(btn, action) {
  if (!btn) return;
  
  let isPointerDown = false;
  let startX, startY;
  
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); // ウィジェットのドラッグを防止
    isPointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
  });
  
  btn.addEventListener('pointerup', async (e) => {
    e.stopPropagation();
    if (!isPointerDown) return;
    isPointerDown = false;
    
    // ドラッグでないことを確認（5px以内の移動ならクリックとみなす）
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 5 || dy > 5) return;
    
    // アクションを実行
    if (typeof action === 'function') {
      await action();
    }
    setTimeout(updateMediaPlayer, 300);
  });
  
  btn.addEventListener('pointercancel', () => {
    isPointerDown = false;
  });
}

setupMediaButton(mediaPrevBtn, async () => {
  await mediaControl('previous');
});

setupMediaButton(mediaPlayPauseBtn, async () => {
  if (currentMediaSource === 'browser') {
    await mediaControl('playPause');
  } else {
    await mediaControl('play-pause');
  }
});

setupMediaButton(mediaNextBtn, async () => {
  await mediaControl('next');
});

setupMediaButton(mediaShuffleBtn, async () => {
  const newValue = currentShuffle === 'On' ? 'Off' : 'On';
  await mediaControl('shuffle', newValue);
});

setupMediaButton(mediaRepeatBtn, async () => {
  let newValue = 'None';
  if (currentLoop === 'None') newValue = 'Playlist';
  else if (currentLoop === 'Playlist') newValue = 'Track';
  else newValue = 'None';
  
  await mediaControl('loop', newValue);
});

// シークバーのイベント
if (mediaSeekbar) {
  // ドラッグ中はUIの自動更新を止める
  mediaSeekbar.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); // ウィジェットのドラッグを防止
    isSeeking = true;
  });

  // スライド操作中もイベントの伝播を止める
  mediaSeekbar.addEventListener('pointermove', (e) => {
    e.stopPropagation();
  });

  // シーク中の値変更（リアルタイムプレビュー）
  mediaSeekbar.addEventListener('input', (e) => {
    e.stopPropagation();
    if (currentDuration > 0 && mediaTimeCurrent) {
      const position = (e.target.value / 100) * currentDuration;
      mediaTimeCurrent.textContent = formatTime(position);
    }
  });

  // シーク完了（実際にシーク）
  mediaSeekbar.addEventListener('change', async (e) => {
    e.stopPropagation();
    if (currentDuration > 0) {
      const seekPosition = (e.target.value / 100) * currentDuration;
      await mediaControl('seek', seekPosition);
    }
    isSeeking = false;
    setTimeout(updateMediaPlayer, 300);
  });
}

// ブラウザからのメディア更新を受信
if (window.electronAPI && window.electronAPI.onBrowserMediaUpdate) {
  window.electronAPI.onBrowserMediaUpdate((info) => {
    browserMediaInfo = info;
    updateMediaPlayer();
  });
}

// 定期的にメディア情報を更新（2秒ごと）
setInterval(updateMediaPlayer, 1000);
// 初回更新
setTimeout(updateMediaPlayer, 500);
// ブラウザメディア情報をリクエスト
setTimeout(() => {
  if (window.electronAPI && window.electronAPI.requestBrowserMediaInfo) {
    window.electronAPI.requestBrowserMediaInfo();
  }
}, 1000);

// ========================================
// ウィジェット管理
// ========================================

const availableWidgets = {
  'widget-clock': { name: '時計', element: document.getElementById('widget-clock') },
  'media_player_widget': { name: 'メディアプレイヤー', element: document.getElementById('media_player_widget') },
  'github_contribution_widget': { name: 'GitHub Contributions', element: document.getElementById('github_contribution_widget') },
  'google_calendar_widget': { name: 'Google Calendar', element: document.getElementById('google_calendar_widget') }
};

let widgetVisibility = {};

function loadWidgetVisibility() {
  const saved = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_VISIBILITY) || '{}');
  const defaults = {};
  Object.keys(availableWidgets).forEach(id => {
    defaults[id] = true; // デフォルトはすべて表示
  });
  widgetVisibility = { ...defaults, ...saved };
}

function applyWidgetVisibility() {
  for (const widgetId in availableWidgets) {
    const widget = availableWidgets[widgetId].element;
    if (widget) {
      widget.style.display = widgetVisibility[widgetId] ? '' : 'none';
    }
  }
}

function setWidgetVisibility(widgetId, isVisible) {
  const widget = availableWidgets[widgetId]?.element;
  if (widget) {
    widget.style.display = isVisible ? '' : 'none';
    widgetVisibility[widgetId] = isVisible;
    localStorage.setItem(LS_KEYS.WIDGET_VISIBILITY, JSON.stringify(widgetVisibility));
  }
}

// すべてのモーダルを閉じる関数
function closeAllModals() {
  // すべてのオーバーレイを非表示
  const overlays = document.querySelectorAll('.modal_overlay');
  overlays.forEach(el => {
    el.style.display = 'none';
    el.classList.remove('fade-out');
  });

  // フォルダーの状態をリセット
  currentOpenFolderId = null;
  const folderModal = document.getElementById('folder_modal');
  if (folderModal) {
    folderModal.classList.remove('folder-opening', 'folder-closing');
  }

  // 位置変更モードを終了
  if (isPositionChangeMode) {
    isPositionChangeMode = false;
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) desktopIcons.style.zIndex = '';
  }

  hideContextMenu();
}

// ========================================
// ビルトインアイコンのクリックイベント
// ========================================

/** アイコンクリックハンドラを設定 */
function setupBuiltinIconClick(id, url) {
  const el = document.getElementById(id);
  if (el) el.onclick = () => openURL(url);
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
  document.getElementById('settingsmenu_modal_overlay').style.display = 'flex';
}

document.getElementById('close_settingsmenu_modal').onclick = () => {
  closeAllModals();
}

// ========================================
// アプリケーション状態
// ========================================

let isGridModeEnabled = localStorage.getItem(LS_KEYS.GRID_MODE_ENABLED) === 'true';
let isPositionChangeMode = false;
let draggedItem = null;
let folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
let currentOpenFolderId = null;
let currentFolderPage = 0;

// グリッドモードのデフォルト設定
// アイコンサイズ (80x90) とギャップ (20px) に合わせる
const GRID_SIZE_X = 80;
const GRID_SIZE_Y = 90;
const GRID_OFFSET = 20;
// ドラッグ開始判定に使う閾値（ピクセル）
const DRAG_THRESHOLD = 8;
// 最小オーバーラップ面積（ピクセル）: これを超えたら重なりと判定
const OVERLAP_THRESHOLD = 800;

// 編集機能用
let currentEditingApp = null;
let currentEditingIcon = null;
let currentContextAppType = null;

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 画像を指定されたサイズにリサイズする
 * @param {string} dataUrl - 元の画像のData URL
 * @param {number} targetWidth - ターゲットの幅
 * @param {number} targetHeight - ターゲットの高さ
 * @returns {Promise<string>} リサイズされた画像のData URL
 */
function resizeImage(dataUrl, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      resolve(canvas.toDataURL());
    };
    img.onerror = (err) => {
      console.error("Image loading failed for resizing", err);
      reject(err);
    };
    img.src = dataUrl;
  });
}
/**
 * 値をグリッドにスナップさせる
 * @param {number} value - 元の値
 * @returns {number} スナップされた値
 */
function snapToGrid(value, axis = 'x') {
  const size = axis === 'y' ? GRID_SIZE_Y : GRID_SIZE_X;
  return Math.round((value - GRID_OFFSET) / size) * size + GRID_OFFSET;
}

/**
 * フォルダーデータを保存
 */
function saveFolders() {
  localStorage.setItem(LS_KEYS.APP_FOLDERS, JSON.stringify(folders));
}

/**
 * 現在の言語を取得
 * @returns {string} 言語コード ('ja' または 'en')
 */
function getCurrentLanguage() {
  return localStorage.getItem(LS_KEYS.LANGUAGE) || 'ja';
}

/**
 * 2つの要素の重なり面積を計算
 * @param {DOMRect} rect1 - 要素1の矩形
 * @param {DOMRect} rect2 - 要素2の矩形
 * @returns {number} 重なり面積
 */
function calculateOverlapArea(rect1, rect2) {
  const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
  const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
  return overlapX * overlapY;
}

// アイコンの矩形情報をキャッシュする（ドラッグ中の負荷軽減）
function cacheIconRects(excludeEl) {
  window.cachedIconRects = [];
  document.querySelectorAll('.appicon:not(.folder)').forEach(el => {
    if (el !== excludeEl && el.style.display !== 'none') {
      window.cachedIconRects.push({ element: el, rect: el.getBoundingClientRect() });
    }
  });
  window.cachedFolderRects = [];
  document.querySelectorAll('.appicon.folder').forEach(el => {
    if (el !== excludeEl && el.style.display !== 'none') {
      window.cachedFolderRects.push({ element: el, rect: el.getBoundingClientRect() });
    }
  });
}

/**
 * 画像からドミナントカラー（主要な色）を抽出する
 * @param {string} imageSrc - 画像のソース (URL or Data URL)
 * @returns {Promise<string>} 抽出された色のHEXコード
 */
function getDominantColor(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // 処理高速化のために小さくリサイズ
      canvas.width = 64;
      canvas.height = 64;
      ctx.drawImage(img, 0, 0, 64, 64);
      const { data } = ctx.getImageData(0, 0, 64, 64);
      
      const colorCounts = {};
      let maxCount = 0;
      let dominantColor = null;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        
        if (a < 128) continue; // 透明度が高いピクセルは無視
        
        // 色空間を量子化（似た色をまとめる）
        const q = 20;
        const rQ = Math.round(r / q) * q;
        const gQ = Math.round(g / q) * q;
        const bQ = Math.round(b / q) * q;
        
        const key = `${rQ},${gQ},${bQ}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
        
        if (colorCounts[key] > maxCount) {
          maxCount = colorCounts[key];
          dominantColor = { r: rQ, g: gQ, b: bQ };
        }
      }
      
      if (dominantColor) {
        // HEXに変換
        const toHex = c => {
            const hex = Math.min(255, Math.max(0, c)).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        resolve(`#${toHex(dominantColor.r)}${toHex(dominantColor.g)}${toHex(dominantColor.b)}`);
      } else {
        resolve('#4285f4'); // フォールバック
      }
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

/**
 * ドラッグ中のアイコンと重なっているアイコンを検出
 * @param {HTMLElement} draggedEl - ドラッグ中の要素
 * @returns {HTMLElement|null} 重なっているアイコン
 */
function getOverlappingIcon(draggedEl) {
  const draggedRect = draggedEl.getBoundingClientRect();
  
  // キャッシュがあればそれを使用
  if (window.cachedIconRects) {
    for (const item of window.cachedIconRects) {
      if (item.element === draggedEl) continue;
      const overlapArea = calculateOverlapArea(draggedRect, item.rect);
      if (overlapArea > OVERLAP_THRESHOLD) return item.element;
    }
    return null;
  }

  const icons = document.querySelectorAll('.appicon:not(.folder)');
  for (const icon of icons) {
    if (icon === draggedEl) continue;
    const overlapArea = calculateOverlapArea(draggedRect, icon.getBoundingClientRect());
    if (overlapArea > OVERLAP_THRESHOLD) return icon;
  }
  return null;
}

/**
 * ドラッグ中のアイコンと重なっているフォルダーを検出
 * @param {HTMLElement} draggedEl - ドラッグ中の要素
 * @returns {HTMLElement|null} 重なっているフォルダー
 */
function getOverlappingFolder(draggedEl) {
  const draggedRect = draggedEl.getBoundingClientRect();
  
  // キャッシュがあればそれを使用
  if (window.cachedFolderRects) {
    for (const item of window.cachedFolderRects) {
      if (item.element === draggedEl) continue;
      const overlapArea = calculateOverlapArea(draggedRect, item.rect);
      if (overlapArea > OVERLAP_THRESHOLD) return item.element;
    }
    return null;
  }

  const folderIcons = document.querySelectorAll('.appicon.folder');
  for (const folder of folderIcons) {
    if (folder === draggedEl) continue;
    const overlapArea = calculateOverlapArea(draggedRect, folder.getBoundingClientRect());
    if (overlapArea > OVERLAP_THRESHOLD) return folder;
  }
  return null;
}

// ========================================
// フォルダー機能
// ========================================

/**
 * アイコン要素からデータを取得
 * @param {HTMLElement} icon - アイコン要素
 * @returns {Object} アイコンデータ
 */
function getIconData(icon) {
  const img = icon.querySelector('img');
  const name = icon.querySelector('p')?.textContent || '';
  const isBuiltin = !!icon.id && icon.id.startsWith('appicon-');
  const isLinuxApp = icon.classList.contains('linux-app');
  const isFileShortcut = icon.classList.contains('file-shortcut');
  const isFolderShortcut = icon.classList.contains('folder-shortcut');
  
  // URLを取得
  let url = icon._appUrl || '';
  if (isBuiltin && icon.id && builtinIconUrls[icon.id]) {
    url = builtinIconUrls[icon.id];
  }
  
  const data = {
    id: icon.id || icon.dataset.saveKey,
    name,
    icon: img?.src || '',
    url,
    isBuiltin
  };
  
  // Linuxアプリの場合は追加情報
  if (isLinuxApp && icon._appCommand) {
    data.command = icon._appCommand;
    data.runInTerminal = icon._runInTerminal || false;
    data.isLinuxApp = true;
  }

  // ファイル/フォルダショートカットの場合
  if ((isFileShortcut || isFolderShortcut) && icon._filePath) {
    data.path = icon._filePath;
    data.isDirectory = isFolderShortcut;
  }
  
  return data;
}

/**
 * フォルダーを作成
 * @param {HTMLElement} icon1 - 1つ目のアイコン
 * @param {HTMLElement} icon2 - 2つ目のアイコン
 * @returns {HTMLElement} 作成されたフォルダー要素
 */
function createFolder(icon1, icon2) {
  const folderId = 'folder-' + Date.now();
  const lang = getCurrentLanguage();
  const folderName = lang === 'ja' ? '新規フォルダー' : 'New Folder';
  
  const icon1Data = getIconData(icon1);
  const icon2Data = getIconData(icon2);
  
  // フォルダーデータを保存
  folders[folderId] = {
    name: folderName,
    apps: [icon1Data, icon2Data]
  };
  saveFolders();
  
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
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.appendChild(folderEl);
  }
  
  // 位置変更モード中であれば、新しいフォルダーアイコンにもドラッグイベントを設定
  if (isPositionChangeMode && typeof setupDraggableItem === 'function') {
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
  
  // スタイルを適用
  if (folderData.style) {
    const { color, opacity } = folderData.style;
    const rgb = hexToRgb(color);
    if (rgb) {
      previewDiv.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
  }
  
  // 最大4つのアイコンをプレビュー表示
  folderData.apps.slice(0, 4).forEach(app => {
    const img = document.createElement('img');
    img.src = app.icon;
    previewDiv.appendChild(img);
    if (!app.path) {
      // フォルダ内プレビュー画像に形状を適用
      wrapImageWithShape(img, getCurrentIconShape());
    }
  });
  
  const nameP = document.createElement('p');
  nameP.textContent = folderData.name;
  
  div.appendChild(previewDiv);
  div.appendChild(nameP);
  
  // クリックでフォルダーを開く
  div.onclick = () => openFolder(folderId);
  
  // 右クリックでコンテキストメニューを表示
  div.oncontextmenu = (e) => {
    e.preventDefault();
    div._folderId = folderId;
    showContextMenu(e, div, 'folder');
  };
  
  // アイコン形状を適用してからドラッグを設定
  wrapIconWithShape(div, getCurrentIconShape());
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
  
  return div;
}

// フォルダーを閉じる（アニメーション付き）
function closeFolder() {
  const modal = document.getElementById('folder_modal_overlay');
  const modalContent = document.getElementById('folder_modal');
  
  if (!modal || modal.style.display === 'none') return;

  modal.classList.add('fade-out');
  if (modalContent) {
    modalContent.classList.remove('folder-opening');
    modalContent.classList.add('folder-closing');
  }
  
  const onAnimationEnd = () => {
    modal.style.display = 'none';
    modal.classList.remove('fade-out');
    if (modalContent) {
      modalContent.classList.remove('folder-closing');
    }
    currentOpenFolderId = null;
  };
  
  // アニメーション終了を待つ
  // アニメーションイベントが発火しない場合の保険としてsetTimeoutも併用
  const timer = setTimeout(onAnimationEnd, 200);
  modalContent?.addEventListener('animationend', () => { clearTimeout(timer); onAnimationEnd(); }, { once: true });
}

// フォルダーを開く
function openFolder(folderId) {
  closeAllModals();
  const folderData = folders[folderId];
  if (!folderData) return;
  
  currentOpenFolderId = folderId;
  currentFolderPage = 0;
  
  const title = document.getElementById('folder_title');
  const titleInput = document.getElementById('folder_title_input');
  
  title.textContent = folderData.name;
  title.style.display = '';
  titleInput.style.display = 'none';
  
  // スタイルデータがない場合はデフォルト値を設定
  if (!folderData.style) {
    const isDark = document.body.classList.contains('dark-mode');
    folderData.style = { color: isDark ? '#1f1f1f' : '#ffffff', opacity: 1.0 };
  }
  
  applyFolderStyle(folderId);
  
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
      saveFolders();
      
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
  
  // タイトルクリックで編集モードに
  title.onclick = () => {
    title.style.display = 'none';
    titleInput.style.display = '';
    titleInput.value = folderData.name;
    titleInput.onblur = saveTitle; // 編集モードに入るときにだけblurハンドラを設定
    titleInput.focus();
    titleInput.select();
  };
  
  // キー入力の処理は一度だけ設定
  titleInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleInput.blur(); // Enterでblurを発火させて保存
    } else if (e.key === 'Escape') {
      e.preventDefault();
      titleInput.onblur = null; // Escapeでは保存しないようにblurハンドラを解除
      titleInput.style.display = 'none';
      title.style.display = '';
    }
  };
  
  renderFolderPage(folderId);
}

// フォルダーのスタイルを適用
function applyFolderStyle(folderId) {
  const folderData = folders[folderId];
  if (!folderData || !folderData.style) return;
  
  const modal = document.getElementById('folder_modal');
  const { color, opacity } = folderData.style;
  
  const rgb = hexToRgb(color);
  if (rgb) {
    modal.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    
    // 背景色に合わせて文字色を調整
    const textColor = getContrastColor(rgb.r, rgb.g, rgb.b);
    modal.style.setProperty('--on-surface', textColor);
    modal.style.setProperty('--on-surface-variant', textColor);
  }
}

function renderFolderPage(folderId) {
  const folderData = folders[folderId];
  if (!folderData) return;

  const modal = document.getElementById('folder_modal_overlay');
  const modalContent = document.getElementById('folder_modal');
  const contents = document.getElementById('folder_contents');
  
  contents.innerHTML = '';
  
  // ページネーション計算
  const itemsPerPage = 9;
  const totalApps = folderData.apps.length;
  const totalPages = Math.ceil(totalApps / itemsPerPage) || 1;
  
  if (currentFolderPage >= totalPages) currentFolderPage = totalPages - 1;
  if (currentFolderPage < 0) currentFolderPage = 0;
  
  const startIdx = currentFolderPage * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalApps);
  const pageApps = folderData.apps.slice(startIdx, endIdx);
  
  // グリッドレイアウト決定: 4つまでは2列、それ以上は3列
  const columns = totalApps > 4 ? 3 : 2;
  
  contents.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  
  pageApps.forEach((app, i) => {
    const index = startIdx + i;
    const div = document.createElement('div');
    div.className = 'appicon folder-item';
    div.dataset.folderItemIndex = index;
    div.innerHTML = `
      <img src="${app.icon}" />
      <p>${app.name}</p>
    `;
    
    // 画像のドラッグを防止
    const img = div.querySelector('img');
    if (img) {
      img.ondragstart = (e) => e.preventDefault();
    }
    
    // ドラッグ用の変数
    let isDraggingFromFolder = false;
    let ignoreClick = false;
    let dragStartX, dragStartY;
    let dragClone = null;
    
    div.onpointerdown = (e) => {
      if (e.button !== 0) return;
      div.setPointerCapture(e.pointerId);
      isDraggingFromFolder = false;
      ignoreClick = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };
    
    div.onpointermove = (e) => {
      if (!e.buttons) return;
      
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      // ドラッグ開始判定
      if (!isDraggingFromFolder && (Math.abs(dx) > DRAG_THRESHOLD * 2 || Math.abs(dy) > DRAG_THRESHOLD * 2)) {
        isDraggingFromFolder = true;
        ignoreClick = true;
        
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
        
        // ハイライトをリセット
        document.querySelectorAll('.folder-item.reorder-target').forEach(el => el.classList.remove('reorder-target'));
        
        if (isOutsideModal) {
          dragClone.style.transform = 'scale(1.1)';
          dragClone.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
        } else {
          dragClone.style.transform = 'scale(1)';
          dragClone.style.boxShadow = '';
          
          // 並べ替えターゲットの検出
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const targetItem = elements.find(el => el.classList.contains('folder-item') && el !== div);
          if (targetItem) {
            targetItem.classList.add('reorder-target');
          }
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
        
        // ハイライトをリセット
        document.querySelectorAll('.folder-item.reorder-target').forEach(el => el.classList.remove('reorder-target'));
        
        if (isOutsideModal) {
          // フォルダから取り出す（ドロップ座標を渡す）
          removeFromFolder(folderId, index, e.clientX, e.clientY);
          closeFolder();
        } else {
          // 並べ替え処理
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const targetItem = elements.find(el => el.classList.contains('folder-item'));
          
          if (targetItem) {
            const targetIndex = parseInt(targetItem.dataset.folderItemIndex);
            if (!isNaN(targetIndex) && targetIndex !== index) {
              // 配列を並べ替え
              const item = folderData.apps[index];
              folderData.apps.splice(index, 1);
              folderData.apps.splice(targetIndex, 0, item);
              
              saveFolders();
              updateFolderIcon(folderId);
              renderFolderPage(folderId);
            }
          }
        }
      }
      
      isDraggingFromFolder = false;
    };

    div.onclick = (e) => {
      if (ignoreClick) {
        e.stopPropagation();
        return;
      }
      handleFolderItemClick(app, modal);
    };
    
    // コンテキストメニュー表示
    div.oncontextmenu = (e) => {
      e.preventDefault();
      
      // アプリタイプを判定
      let type = 'folder-item';
      if (app.isLinuxApp || app.command) {
        type = 'folder-item-linuxapp';
      } else if (app.url) {
        type = 'folder-item-webapp';
      }
      
      // 編集用データを添付
      div._appData = app;
      div._folderId = folderId;
      div._folderIndex = index;
      
      showContextMenu(e, div, type);
    };
    
    contents.appendChild(div);

    // 形状を適用（モーダル内のアイテムは後から生成されるため明示的にラップする）
    if (!app.path) {
      try {
        wrapIconWithShape(div, getCurrentIconShape());
        // フォルダ内のアイテムは通常プレビューより大きめに表示
        const wrapper = div.querySelector('m3e-shape');
        if (wrapper) {
          wrapper.style.width = '50px';
          wrapper.style.height = '50px';
          // ensure slotted img fills wrapper
          wrapper.style.display = 'inline-block';
        }
      } catch (e) {
        console.warn('Failed to apply shape to folder item:', e);
      }
    }
  });
  
  // ページネーション表示
  const existingPagination = modalContent.querySelector('.folder-pagination');
  if (existingPagination) existingPagination.remove();
  
  if (totalPages > 1) {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'folder-pagination';
    
    for (let p = 0; p < totalPages; p++) {
      const dot = document.createElement('div');
      dot.className = 'folder-pagination-dot';
      if (p === currentFolderPage) dot.classList.add('active');
      
      dot.onclick = (e) => {
        e.stopPropagation();
        currentFolderPage = p;
        renderFolderPage(folderId);
      };
      paginationDiv.appendChild(dot);
    }
    modalContent.appendChild(paginationDiv);
  }
  
  updateFolderModalPosition(folderId);
}

function updateFolderModalPosition(folderId) {
  const modal = document.getElementById('folder_modal_overlay');
  const modalContent = document.getElementById('folder_modal');
  const folderIcon = document.querySelector(`[data-folder-id="${folderId}"]`);
  
  if (folderIcon && modalContent) {
    const rect = folderIcon.getBoundingClientRect();
    
    // アニメーションクラスを追加（まだ表示されていない場合）
    if (modal.style.display === 'none') {
      modalContent.classList.remove('folder-closing');
      modalContent.classList.add('folder-opening');
    }
    
    modal.style.display = 'block'; // absolute配置のためにblockにする
    modalContent.style.position = 'absolute';
    modalContent.style.margin = '0';
    
    // サイズを計測
    const modalWidth = modalContent.offsetWidth;
    
    // 横位置（アイコンの中央に合わせる）
    let left = rect.left + (rect.width / 2) - (modalWidth / 2);
    if (left < 10) left = 10;
    if (left + modalWidth > window.innerWidth - 10) left = window.innerWidth - modalWidth - 10;
    modalContent.style.left = `${left}px`;
    
    // 縦位置（画面の下半分にある場合は上に表示）
    if (rect.top > window.innerHeight / 2) {
      modalContent.style.top = 'auto';
      modalContent.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      modalContent.style.transformOrigin = 'bottom center';
    } else {
      modalContent.style.bottom = 'auto';
      modalContent.style.top = (rect.bottom + 10) + 'px';
      modalContent.style.transformOrigin = 'top center';
    }
  } else {
    modal.style.display = 'flex';
    if (modalContent) {
      modalContent.style.position = '';
      modalContent.style.margin = '';
      modalContent.style.left = '';
      modalContent.style.top = '';
      modalContent.style.bottom = '';
    }
  }
}

// フォルダ内アイテムのクリック処理
async function handleFolderItemClick(app, modal) {
  closeFolder();
  
  // Linuxアプリの場合
  if (app.command || app.isLinuxApp) {
    let command = app.command;
    
    // ターミナルで実行する場合
    if (app.runInTerminal) {
      command = `xterm -hold -e "${app.command}"`;
    }
    
    const result = await launchLinuxApp(command);
    if (!result.success) {
      const lang = getCurrentLanguage();
      const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
      await showAlertDialog(errorMsg);
    }
    return;
  }
  
  // ファイル/フォルダの場合
  if (app.path) {
    const result = await openFileOrFolder(app.path);
    if (!result.success) {
      const lang = getCurrentLanguage();
      await showAlertDialog(i18n.t('open_failed') + ': ' + result.error);
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
function removeFromFolder(folderId, appIndex, dropX, dropY) {
  const folderData = folders[folderId];
  if (!folderData) return;
  
  const app = folderData.apps[appIndex];
  folderData.apps.splice(appIndex, 1);
  
  // 元のアイコンを表示または再作成
  if (app.command || app.isLinuxApp) {
    // Linuxアプリは再作成
    const created = createLinuxAppIcon({
      name: app.name,
      command: app.command,
      icon: app.icon,
      runInTerminal: app.runInTerminal || false
    });
    try { wrapIconWithShape(created, getCurrentIconShape()); } catch (e) {}
    if (created && dropX !== undefined && dropY !== undefined) {
      positionCreatedIcon(created, dropX, dropY);
    }
  } else if (app.path) {
    if (app.isDirectory) {
      const created = createFolderShortcutIcon({
        name: app.name,
        path: app.path,
        icon: app.icon,
        saveKey: app.id
      });
      if (created && dropX !== undefined && dropY !== undefined) positionCreatedIcon(created, dropX, dropY);
      try { wrapIconWithShape(created, getCurrentIconShape()); } catch (e) {}
    } else {
      const created = createFileShortcutIcon({
        name: app.name,
        path: app.path,
        icon: app.icon,
        isDirectory: false,
        saveKey: app.id
      });
      try { wrapIconWithShape(created, getCurrentIconShape()); } catch (e) {}
      if (created && dropX !== undefined && dropY !== undefined) positionCreatedIcon(created, dropX, dropY);
    }
  } else if (app.isBuiltin && app.id) {
    const el = document.getElementById(app.id);
    if (el) el.style.display = '';
    if (el && dropX !== undefined && dropY !== undefined) positionCreatedIcon(el, dropX, dropY);
  } else if (app.id) {
    let el = document.querySelector(`[data-save-key="${app.id}"]`);
    if (el) {
      el.style.display = '';
        try { wrapIconWithShape(el, getCurrentIconShape()); } catch (e) {}
        if (dropX !== undefined && dropY !== undefined) positionCreatedIcon(el, dropX, dropY);
    } else if (app.url) {
      // カスタムアプリは再作成
      const created = createDesktopIcon({
        name: app.name,
        url: app.url,
        icon: app.icon
      });
      try { wrapIconWithShape(created, getCurrentIconShape()); } catch (e) {}
      if (created && dropX !== undefined && dropY !== undefined) positionCreatedIcon(created, dropX, dropY);
    }
  }
  
  // フォルダーが1つ以下になったら解散
  if (folderData.apps.length <= 1) {
    // 残りのアプリも表示または再作成
    if (folderData.apps.length === 1) {
      const remainingApp = folderData.apps[0];
      if (remainingApp.command || remainingApp.isLinuxApp) {
          const created = createLinuxAppIcon({
            name: remainingApp.name,
            command: remainingApp.command,
            icon: remainingApp.icon,
            runInTerminal: remainingApp.runInTerminal || false
          });
          try { wrapIconWithShape(created, getCurrentIconShape()); } catch (e) {}
      } else if (remainingApp.isBuiltin && remainingApp.id) {
        const el = document.getElementById(remainingApp.id);
        if (el) el.style.display = '';
      } else if (remainingApp.id) {
        let el = document.querySelector(`[data-save-key="${remainingApp.id}"]`);
        if (el) {
          el.style.display = '';
        } else if (remainingApp.url) {
          const created = createDesktopIcon({
            name: remainingApp.name,
            url: remainingApp.url,
            icon: remainingApp.icon
          });
          try { wrapIconWithShape(created, getCurrentIconShape()); } catch (e) {}
        }
      }
    }
    
    // フォルダーアイコンを削除
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderEl) folderEl.remove();
    
    delete folders[folderId];
  }
  
  saveFolders();
  
  // フォルダーアイコンを更新
  updateFolderIcon(folderId);
}

// ドロップ座標（クライアント座標）に作成済み要素を配置して位置を保存
function positionCreatedIcon(el, clientX, clientY) {
  if (!el) return;
  const desktop = document.getElementById('desktop_icons');
  const containerRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0 };
  const elRect = el.getBoundingClientRect();
  // 中心を合わせる
  const startX = clientX - containerRect.left - (elRect.width / 2);
  const startY = clientY - containerRect.top - (elRect.height / 2);
  
  // グリッドスナップと重なり回避を適用
  const pos = findNearestEmptyPosition(el, startX, startY);
  
  el.style.position = 'absolute';
  el.style.left = pos.x + 'px';
  el.style.top = pos.y + 'px';

  // 保存（widgetPositions）
  try {
    const saveKey = el.dataset.saveKey;
    if (saveKey) {
      const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
      positions[saveKey] = { position: 'absolute', left: el.style.left, top: el.style.top };
      localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
    }
  } catch (e) {
    console.warn('Failed to save widget position', e);
  }
}

// フォルダーにアプリを追加
function addToFolder(folderId, icon) {
  const folderData = folders[folderId];
  if (!folderData) return;
  
  const img = icon.querySelector('img');
  const name = icon.querySelector('p')?.textContent || '';
  const isBuiltin = !!icon.id && icon.id.startsWith('appicon-');
  const isLinuxApp = icon.classList.contains('linux-app');
  const isFileShortcut = icon.classList.contains('file-shortcut');
  const isFolderShortcut = icon.classList.contains('folder-shortcut');
  
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

  // ファイル/フォルダショートカットの場合
  if ((isFileShortcut || isFolderShortcut) && icon._filePath) {
    appData.path = icon._filePath;
    appData.isDirectory = isFolderShortcut;
  }
  
  folderData.apps.push(appData);
  saveFolders();
  
  // アイコンを非表示ではなく削除（リロード時の重複を防ぐ）
  // ビルトインアプリは削除すると復元できないため非表示にする
  if (isBuiltin) {
    icon.style.display = 'none';
  } else {
    icon.remove();
  }
  
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
    // スタイルを適用
    if (folderData.style) {
      const { color, opacity } = folderData.style;
      const rgb = hexToRgb(color);
      if (rgb) {
        previewDiv.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      }
    } else {
      previewDiv.style.background = '';
    }

    previewDiv.innerHTML = '';
    folderData.apps.slice(0, 4).forEach(app => {
      const img = document.createElement('img');
      img.src = app.icon;
      previewDiv.appendChild(img);
      if (!app.path) {
        wrapImageWithShape(img, getCurrentIconShape());
      }
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
    
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(folderEl);
    }
  });
}

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
  if (isPositionChangeMode) return;
  isPositionChangeMode = true;
  
  document.getElementById('change_widget_position_modal_overlay').style.display = 'flex';
  
  // 位置変更モード中はデスクトップアイコンのz-indexを上げる
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '5';
  }

  // すべてのアイコンにドラッグイベントを設定
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    setupDraggableItem(item);
  });
  
  // グリッドモードのスイッチの状態を復元
  isGridModeEnabled = localStorage.getItem(LS_KEYS.GRID_MODE_ENABLED) === 'true';
  updateGridModeSwitch();
  
  // グリッド線の表示/非表示
  if (isGridModeEnabled) {
    document.getElementById('change_widget_position_modal_overlay').classList.add('grid-mode');
  } else {
    document.getElementById('change_widget_position_modal_overlay').classList.remove('grid-mode');
  }
}

// 位置変更モードを終了する（保存または閉じる時に呼ばれる）
function exitPositionChangeMode() {
  isPositionChangeMode = false;
  document.getElementById('change_widget_position_modal_overlay').style.display = 'none';
  
  // z-indexを元に戻す
  document.getElementById('desktop_icons').style.zIndex = '';
}

document.getElementById('open_change_widget_position_modal').onclick = () => {
  enterPositionChangeMode();
};

/**
 * 指定された位置で他の要素と重なるかチェック
 * @param {HTMLElement} element - 対象の要素
 * @param {number} x - 左位置
 * @param {number} y - 上位置
 * @returns {boolean} 重なっている場合はtrue
 */
function isOverlappingAny(element, x, y) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  
  // 少し余裕を持たせる（境界線での接触を許容するため）
  const margin = 2;
  
  const rect1 = {
    left: x + margin,
    top: y + margin,
    right: x + width - margin,
    bottom: y + height - margin
  };
  
  const allItems = document.querySelectorAll('.appicon, .widget');
  for (const item of allItems) {
    if (item === element || item.style.display === 'none') continue;
    
    // appicon-add は無視
    if (item.id === 'appicon-add') continue;
    
    const itemLeft = item.offsetLeft;
    const itemTop = item.offsetTop;
    const itemWidth = item.offsetWidth;
    const itemHeight = item.offsetHeight;
    
    const rect2 = {
      left: itemLeft + margin,
      top: itemTop + margin,
      right: itemLeft + itemWidth - margin,
      bottom: itemTop + itemHeight - margin
    };
    
    if (rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top) {
      return true;
    }
  }
  return false;
}

/**
 * 最も近い空き位置を探す
 * @param {HTMLElement} element - 対象の要素
 * @param {number} startX - 開始X座標
 * @param {number} startY - 開始Y座標
 * @returns {{x: number, y: number}} 空き位置
 */
function findNearestEmptyPosition(element, startX, startY) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const elWidth = element.offsetWidth;
  const elHeight = element.offsetHeight;

  let x = startX;
  let y = startY;
  
  // 画面内に収まるようにクランプ
  x = Math.max(0, Math.min(x, screenWidth - elWidth));
  y = Math.max(0, Math.min(y, screenHeight - elHeight));
  
  // グリッドモードならスナップ
  if (isGridModeEnabled) {
    x = snapToGrid(x, 'x');
    y = snapToGrid(y, 'y');
    
    // スナップ後に画面外に出た場合は調整
    if (x + elWidth > screenWidth) x -= GRID_SIZE_X;
    if (y + elHeight > screenHeight) y -= GRID_SIZE_Y;
    x = Math.max(0, x);
    y = Math.max(0, y);
  }
  
  // 重なりがなければそのまま返す
  if (!isOverlappingAny(element, x, y)) {
    return { x, y };
  }
  
  // 重なっている場合、周囲を探索
  // 探索ステップ: グリッドサイズまたはアイコンサイズ
  const stepX = isGridModeEnabled ? GRID_SIZE_X : 80;
  const stepY = isGridModeEnabled ? GRID_SIZE_Y : 95;
  
  // 渦巻き状に探索
  let radius = 1;
  const maxRadius = 20; // 無限ループ防止
  
  while (radius < maxRadius) {
    // 候補位置をチェックするヘルパー
    const check = (cx, cy) => {
      if (cx >= 0 && cy >= 0 && 
          cx + elWidth <= screenWidth && cy + elHeight <= screenHeight && 
          !isOverlappingAny(element, cx, cy)) {
        return true;
      }
      return false;
    };

    // 上辺
    for (let i = -radius; i <= radius; i++) {
      const checkX = x + (i * stepX);
      const checkY = y - (radius * stepY);
      if (check(checkX, checkY)) return { x: checkX, y: checkY };
    }
    // 右辺
    for (let i = -radius + 1; i <= radius; i++) {
      const checkX = x + (radius * stepX);
      const checkY = y + (i * stepY);
      if (check(checkX, checkY)) return { x: checkX, y: checkY };
    }
    // 下辺
    for (let i = radius - 1; i >= -radius; i--) {
      const checkX = x + (i * stepX);
      const checkY = y + (radius * stepY);
      if (check(checkX, checkY)) return { x: checkX, y: checkY };
    }
    // 左辺
    for (let i = radius - 1; i > -radius; i--) {
      const checkX = x - (radius * stepX);
      const checkY = y + (i * stepY);
      if (check(checkX, checkY)) return { x: checkX, y: checkY };
    }
    
    radius++;
  }
  
  // 見つからない場合は元の位置（重なったまま）
  return { x, y };
}

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
    // 矩形情報をキャッシュ
    cacheIconRects(this);
  };
  
  item.onpointermove = function(event){
    if (this._isResizing) return; // リサイズ中は移動処理を無視
    if (!this.hasPointerCapture(event.pointerId)) return;
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
      
      // ドラッグ中は滑らかに移動（スナップはドロップ時に行う）
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
    
    // 自動位置調整（重なり防止）
    if (this.style.position === 'absolute') {
      const newPos = findNearestEmptyPosition(this, this.offsetLeft, this.offsetTop);
      this.style.left = newPos.x + 'px';
      this.style.top = newPos.y + 'px';
    }
    
    draggedItem = null;
    // キャッシュをクリア
    window.cachedIconRects = null;
    window.cachedFolderRects = null;
  };
}

// グリッドモードスイッチの状態更新関数 (m3e-switchのプロパティを考慮)
function updateGridModeSwitch() {
  const gridModeSwitch = document.getElementById('toggle_grid_mode');
  if (gridModeSwitch) {
    // m3e-switch は 'selected' プロパティを使用するが、念のため 'checked' も考慮
    if (typeof gridModeSwitch.selected !== 'undefined') {
      gridModeSwitch.selected = isGridModeEnabled;
    } else {
      gridModeSwitch.checked = isGridModeEnabled;
    }
  }
}

// グリッドモードスイッチのイベント
const gridModeSwitch = document.getElementById('toggle_grid_mode');
if (gridModeSwitch) {
  gridModeSwitch.addEventListener('change', (e) => {
    // m3e-switch は 'selected' プロパティで状態を公開するが、念のため 'checked' も考慮
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    isGridModeEnabled = newState;
    localStorage.setItem(LS_KEYS.GRID_MODE_ENABLED, isGridModeEnabled);
    
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
        item.style.left = snapToGrid(currentLeft, 'x') + 'px';
        item.style.top = snapToGrid(currentTop, 'y') + 'px';
      });
    }
  });
}

// 通常モードでのドラッグを設定する関数
function setupNormalModeDrag(item) {
  // 画像のドラッグを防止
  const img = item.querySelector('img');
  if (img) {
    img.ondragstart = (e) => e.preventDefault();
  }

  // クリックイベントの制御（重複登録防止）
  if (!item._clickListenerAttached) {
    item.addEventListener('click', function(e) {
      if (this._ignoreClick) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }, true);
    item._clickListenerAttached = true;
  }

  item.onpointerdown = function(event) {
    // 左クリックのみ
    if (event.button !== 0) return;
    
    this.setPointerCapture(event.pointerId);
    this._isDragging = false;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this._startLeft = this.offsetLeft;
    this._startTop = this.offsetTop;
    this._normalModeDragStarted = false;
    this._ignoreClick = false;
    // 矩形情報をキャッシュ
    cacheIconRects(this);
  };
  
  item.onpointermove = function(event) {
    if (this._isResizing) return; // リサイズ中は移動処理を無視
    if (!event.buttons) return;
    if (!this.hasPointerCapture(event.pointerId)) return;
    
    const dx = event.clientX - this._startX;
    const dy = event.clientY - this._startY;
    
    // ドラッグ開始の判定
    if (!this._isDragging) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this._isDragging = true;
        this._normalModeDragStarted = true;
        this._ignoreClick = true; // クリックを無視するフラグ
        
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
    
    // ドラッグ中は滑らかに移動（スナップはドロップ時に行う）
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
      this._ignoreClick = false;
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
        setTimeout(() => { this._ignoreClick = false; }, 50);
        return;
      }
      
      const overlapping = getOverlappingIcon(this);
      if (overlapping && !overlapping.classList.contains('folder')) {
        createFolder(overlapping, this);
        draggedItem = null;
        this._isDragging = false;
        this._normalModeDragStarted = false;
        setTimeout(() => { this._ignoreClick = false; }, 50);
        return;
      }
    }
    
    // 自動位置調整（重なり防止）
    if (this.style.position === 'absolute') {
      const newPos = findNearestEmptyPosition(this, this.offsetLeft, this.offsetTop);
      this.style.left = newPos.x + 'px';
      this.style.top = newPos.y + 'px';
    }
    
    // 位置を保存
    const key = this.id || this.dataset.saveKey;
    if (key) {
      try {
        const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
        positions[key] = {
          left: this.style.left,
          top: this.style.top,
          position: 'absolute'
        };
        localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
      } catch (e) {}
    }
    
    const images = this.querySelectorAll('img');
    images.forEach(img => {
      img.draggable = true;
      img.style.pointerEvents = '';
    });
    
    draggedItem = null;
    this._isDragging = false;
    this._normalModeDragStarted = false;
    setTimeout(() => { this._ignoreClick = false; }, 50);
    // キャッシュをクリア
    window.cachedIconRects = null;
    window.cachedFolderRects = null;
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
  localStorage.removeItem(LS_KEYS.WIDGET_POSITIONS);
  
  // すべてのアイコンとウィジェットの位置をリセット
  document.querySelectorAll('.appicon, .widget').forEach(el => {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
  });
  
  // モーダルを閉じる
  document.getElementById('change_widget_position_modal_overlay').style.display = 'none';
  
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
    
    // 位置変更モードで設定されたポインターイベントを削除
    item.onpointerdown = null;
    item.onpointermove = null;
    item.onpointerup = null;
    
    // ドラッグ関連のプロパティもクリア
    delete item._isDragging;
    delete item._startX;
    delete item._startY;
    delete item._startLeft;
    delete item._startTop;
  });
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

document.getElementById('refresh_page').onclick = () => {
  location.reload();
}

// Translations and language selector logic have been moved to i18n.js

// ========================================
// カラースキーム設定
// ========================================

const colorSchemes = ['blue', 'red', 'green', 'purple', 'orange', 'teal', 'pink'];

function updateColorScheme(scheme, customColor = null) {
  // 既存のカラースキームクラスを削除
  colorSchemes.forEach(s => {
    document.body.classList.remove(`color-scheme-${s}`);
  });
  document.body.classList.remove('color-scheme-custom');
  
  if (scheme === 'custom' && customColor) {
    // カスタムカラーを適用
    document.body.classList.add('color-scheme-custom');
    applyCustomColor(customColor);
    localStorage.setItem(LS_KEYS.COLOR_SCHEME, 'custom');
    localStorage.setItem(LS_KEYS.CUSTOM_COLOR, customColor);
  } else {
    // プリセットカラースキームを適用
    document.body.classList.add(`color-scheme-${scheme}`);
    localStorage.setItem(LS_KEYS.COLOR_SCHEME, scheme);
  }
  
  // パレットの選択状態を更新
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    if (scheme === 'custom') {
      swatch.classList.toggle('selected', swatch.classList.contains('color-picker-swatch'));
    } else {
      swatch.classList.toggle('selected', swatch.dataset.color === scheme);
    }
  });
}

// カスタムカラーから派生色を生成して適用
function applyCustomColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return;
  
  // HSLに変換
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // 派生色を生成
  const primaryLight = hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.min(hsl.l + 15, 85));
  const primaryDark = hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 15, 15));
  const clockPrimary = hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.min(hsl.l + 10, 70));
  const clockSecondary = hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 20));
  const clockAccent = hslToHex(hsl.h, Math.max(hsl.s - 30, 20), Math.min(hsl.l + 30, 90));
  const clockBackground = hslToHex(hsl.h, Math.max(hsl.s - 20, 10), Math.max(hsl.l - 40, 10));
  const primaryContainer = hslToHex(hsl.h, Math.max(hsl.s - 40, 20), 90);
  
  // 時計背景の明るさに応じて文字色を決定
  const bgRgb = hexToRgb(clockBackground);
  const clockTextColor = getContrastColor(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // プライマリカラーの明るさに応じてボタン文字色を決定
  const onPrimaryColor = getContrastColor(rgb.r, rgb.g, rgb.b);
  
  // プライマリコンテナの明るさに応じて文字色を決定
  const containerRgb = hexToRgb(primaryContainer);
  const onPrimaryContainerColor = getContrastColor(containerRgb.r, containerRgb.g, containerRgb.b);
  
  // CSS変数を設定
  document.documentElement.style.setProperty('--md-sys-color-primary', hexColor);
  document.documentElement.style.setProperty('--md-sys-color-on-primary', onPrimaryColor);
  document.documentElement.style.setProperty('--md-sys-color-tertiary', primaryDark);
  document.documentElement.style.setProperty('--md-sys-color-primary-container', primaryContainer);
  document.documentElement.style.setProperty('--md-sys-color-on-primary-container', onPrimaryContainerColor);
  document.documentElement.style.setProperty('--primary-color', hexColor);
  document.documentElement.style.setProperty('--primary-dark', primaryDark);
  document.documentElement.style.setProperty('--primary-light', primaryLight);
  document.documentElement.style.setProperty('--clock-primary', clockPrimary);
  document.documentElement.style.setProperty('--clock-secondary', clockSecondary);
  document.documentElement.style.setProperty('--clock-accent', clockAccent);
  document.documentElement.style.setProperty('--clock-background', clockBackground);
  document.documentElement.style.setProperty('--clock-text-color', clockTextColor);
  
  // カスタムスウォッチの背景色を更新
  const pickerSwatch = document.querySelector('.color-picker-swatch');
  if (pickerSwatch) {
    pickerSwatch.style.setProperty('--custom-color', hexColor);
    pickerSwatch.style.background = hexColor;
  }
}

// 背景色の明るさに応じてコントラスト色（黒/白）を返す
function getContrastColor(r, g, b) {
  // 相対輝度を計算（WCAG基準）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f1f1f' : '#ffffff';
}

// 色変換ユーティリティ
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

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

// カスタムカラー変数をリセット
function resetCustomColorVars() {
  const vars = [
    '--md-sys-color-primary', '--md-sys-color-on-primary', '--md-sys-color-tertiary', 
    '--md-sys-color-primary-container', '--md-sys-color-on-primary-container',
    '--primary-color', '--primary-dark', '--primary-light',
    '--clock-primary', '--clock-secondary', '--clock-accent', '--clock-background', '--clock-text-color'
  ];
  vars.forEach(v => document.documentElement.style.removeProperty(v));
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
  // 保存された設定を復元（デフォルトは表示）
  const showFab = localStorage.getItem(LS_KEYS.SHOW_SETTINGS_FAB) !== 'false';
  updateSettingsFabVisibility(showFab);
  
  toggleSettingsFabBtn.addEventListener('change', (e) => {
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    updateSettingsFabVisibility(newState);
  });
}

// ブラー効果の設定
const toggleBlurEffectBtn = document.getElementById('toggle_blur_effect');

function updateBlurEffect(isEnabled) {
  if (isEnabled) {
    document.body.classList.remove('no-blur');
  } else {
    document.body.classList.add('no-blur');
  }
  if (toggleBlurEffectBtn) {
    if (typeof toggleBlurEffectBtn.selected !== 'undefined') {
      toggleBlurEffectBtn.selected = isEnabled;
    } else {
      toggleBlurEffectBtn.checked = isEnabled;
    }
  }
  localStorage.setItem(LS_KEYS.BLUR_EFFECT_ENABLED, isEnabled);
}

if (toggleBlurEffectBtn) {
  // 保存された設定を復元（デフォルトは有効）
  const blurEnabled = localStorage.getItem(LS_KEYS.BLUR_EFFECT_ENABLED) !== 'false';
  updateBlurEffect(blurEnabled);
  
  toggleBlurEffectBtn.addEventListener('change', (e) => {
    const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
    updateBlurEffect(newState);
  });
}

// テーマ設定
const darkModeSelector = document.getElementById('dark_mode_selector');
const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(mode) {
  let isDark = false;
  if (mode === 'system') {
    isDark = systemDarkMode.matches;
  } else if (mode === 'dark') {
    isDark = true;
  } else {
    isDark = false;
  }

  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  localStorage.setItem(LS_KEYS.DARK_MODE_SETTING, mode);
}

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

// アイコン形状の設定: DOM 準備後に要素を取得して初期化する
iconShapeSelector = document.getElementById('icon_shape_selector');
if (iconShapeSelector) {
  const savedShape = getCurrentIconShape();
  updateIconShape(savedShape);
  iconShapeSelector.onchange = () => {
    updateIconShape(iconShapeSelector.value);
  };
}

// ウィンドウ数の設定
const windowCountSelector = document.getElementById('window_count_selector');
const applyWindowCountBtn = document.getElementById('apply_window_count');

// ウィンドウ数セレクターの初期化
async function initWindowCountSelector() {
  if (windowCountSelector && window.electronAPI && window.electronAPI.getWindowCount) {
    try {
      const currentCount = await window.electronAPI.getWindowCount();
      windowCountSelector.value = currentCount.toString();
    } catch (e) {
      console.error('Failed to get window count:', e);
    }
  }
}

// 初期化実行
initWindowCountSelector();

// ディスプレイセレクターの初期化
const displaySelector = document.getElementById('display_selector');

async function initDisplaySelector() {
  if (displaySelector && window.electronAPI && window.electronAPI.getDisplays) {
    try {
      const displays = await window.electronAPI.getDisplays();
      const targetId = await window.electronAPI.getTargetDisplayId();
      
      displaySelector.innerHTML = '';
      displays.forEach(display => {
        const option = document.createElement('option');
        option.value = display.id;
        option.textContent = display.label;
        displaySelector.appendChild(option);
      });
      
      if (targetId) {
        displaySelector.value = targetId;
      }
      
      displaySelector.onchange = async (e) => {
        await window.electronAPI.setTargetDisplay(e.target.value);
      };
    } catch (e) {
      console.error('Failed to init display selector:', e);
    }
  }
}

// ウィンドウリサイズ設定の初期化
const toggleWindowResizableBtn = document.getElementById('toggle_window_resizable');

async function initWindowResizableSwitch() {
  if (toggleWindowResizableBtn && window.electronAPI && window.electronAPI.getWindowResizable) {
    try {
      const resizable = await window.electronAPI.getWindowResizable();
      if (typeof toggleWindowResizableBtn.selected !== 'undefined') {
        toggleWindowResizableBtn.selected = resizable;
      } else {
        toggleWindowResizableBtn.checked = resizable;
      }
      
      toggleWindowResizableBtn.addEventListener('change', async (e) => {
        const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
        await window.electronAPI.setWindowResizable(newState);
      });
    } catch (e) {
      console.error('Failed to init window resizable switch:', e);
    }
  }
}

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
    
    Object.keys(folders).forEach(folderId => {
      folders[folderId].style = { color, opacity };
    });
    Object.keys(folders).forEach(folderId => updateFolderIcon(folderId));
    saveFolders();
    
    // 開いているフォルダーがあれば更新
    if (currentOpenFolderId) {
      applyFolderStyle(currentOpenFolderId);
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

function createDesktopIcon(appData) {
  const div = document.createElement('div');
  div.className = 'appicon custom-app';
  // saveKeyが既にある場合はそれを使用、ない場合は新規作成
  const saveKey = appData.saveKey || ('custom-app-' + appData.name.replace(/\s+/g, '-') + '-' + Date.now());
  div.dataset.saveKey = saveKey;
  div._appUrl = appData.url; // フォルダー機能用にURLを保存
  div._appData = { ...appData, saveKey }; // saveKeyも含めて保存
  
  // saveKeyがなかった場合はlocalStorageを更新
  if (!appData.saveKey) {
    const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
    const index = customApps.findIndex(a => a.name === appData.name && a.url === appData.url);
    if (index !== -1) {
      customApps[index].saveKey = saveKey;
      localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
    }
  }
  
  div.innerHTML = `
    <img src="${appData.icon}" />
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
  
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.appendChild(div);
  }
  
  // 保存された位置を復元
  const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
  if (positions[saveKey]) {
    div.style.position = positions[saveKey].position;
    div.style.left = positions[saveKey].left;
    div.style.top = positions[saveKey].top;
  }
  
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
  return div;
}

const saveNewAppBtn = document.getElementById('save_new_app');
if (saveNewAppBtn) {
  saveNewAppBtn.onclick = async () => {
    const name = document.getElementById('new_app_name').value;
    const url = document.getElementById('new_app_url').value;
    
    if (!name || !url) {
      const lang = getCurrentLanguage();
      await showAlertDialog(i18n.t('enter_name_and_url'));
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
const savedCustomApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
savedCustomApps.forEach(app => {
  if (!isCustomAppInFolder(app)) {
    createDesktopIcon(app);
  }
});

// Linuxアプリのアイコン作成
function createLinuxAppIcon(appData) {
  const div = document.createElement('div');
  div.className = 'appicon linux-app';
  // saveKeyが既にある場合はそれを使用、ない場合は新規作成
  const saveKey = appData.saveKey || ('linux-app-' + appData.name.replace(/\s+/g, '-') + '-' + Date.now());
  div.dataset.saveKey = saveKey;
  div._appCommand = appData.command;
  div._runInTerminal = appData.runInTerminal || false;
  div._appData = { ...appData, saveKey }; // saveKeyも含めて保存
  
  // saveKeyがなかった場合はlocalStorageを更新
  if (!appData.saveKey) {
    const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
    const index = linuxApps.findIndex(a => a.name === appData.name && a.command === appData.command);
    if (index !== -1) {
      linuxApps[index].saveKey = saveKey;
      localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
    }
  }
  
  div.innerHTML = `
    <img src="${appData.icon || './assets/settings.webp'}" />
    <p>${appData.name}</p>
  `;
  
  div.onclick = async () => {
    let command = appData.command;
    
    // ターミナルで実行する場合
    if (appData.runInTerminal) {
      // xterm を使用
      command = `xterm -hold -e "${appData.command}"`;
    }
    
    const result = await launchLinuxApp(command);
    if (!result.success) {
      const lang = getCurrentLanguage();
      const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
      await showAlertDialog(errorMsg);
    }
  };
  
  div.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, div, 'linuxapp');
  };
  
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.appendChild(div);
  }
  
  // 保存された位置を復元
  const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
  if (positions[saveKey]) {
    div.style.position = positions[saveKey].position;
    div.style.left = positions[saveKey].left;
    div.style.top = positions[saveKey].top;
  }
  
  // アイコン形状を適用
  wrapIconWithShape(div, getCurrentIconShape());
  
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
    const name = document.getElementById('linux_app_name').value;
    const command = document.getElementById('linux_app_command').value;
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
const savedLinuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
savedLinuxApps.forEach(app => {
  if (!isLinuxAppInFolder(app)) {
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
  applyShapeToAll(getCurrentIconShape());
} catch (e) {
  console.warn('Failed to apply shapes on init:', e);
}

// ========================================
// コンテキストメニューと編集機能
// ========================================

const contextMenu = document.getElementById('app_context_menu');

// コンテキストメニューを表示
function showContextMenu(e, iconEl, appType) {
  hideContextMenu();
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
  document.querySelectorAll('.context-menu').forEach(menu => {
    menu.style.display = 'none';
  });
}

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

    btn.onclick = () => {
      setWidgetVisibility(widgetId, true);
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
let currentEditingWidget = null;

function showWidgetContextMenu(e, widgetEl) {
  e.preventDefault();
  e.stopPropagation();
  hideContextMenu(); // 他のメニューを隠す
  currentEditingWidget = widgetEl;

  widgetContextMenu.style.display = 'block';
  widgetContextMenu.style.left = e.clientX + 'px';
  widgetContextMenu.style.top = e.clientY + 'px';
}

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
      if (folders[folderId]) renderFolderPage(folderId);
      else closeFolder();
    }
    return;
  }
  
  // フォルダーの場合
  if (currentContextAppType === 'folder') {
    if (await showConfirmDialog(confirmMsg)) {
      const folderId = currentEditingIcon._folderId;
      delete folders[folderId];
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
  const name = document.getElementById('edit_webapp_name').value.trim();
  const url = document.getElementById('edit_webapp_url').value.trim();
  
  if (!name || !url) {
    const lang = getCurrentLanguage();
    await showAlertDialog(lang === 'ja' ? '名前とURLを入力してください' : 'Please enter name and URL');
    return;
  }
  
  // フォルダー内アイテムの場合
  if (currentContextAppType === 'folder-item-webapp') {
    const folderId = currentEditingIcon._folderId;
    const index = currentEditingIcon._folderIndex;
    const folder = folders[folderId];
    
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
// フォルダー設定モーダル
// ========================================

let currentSettingsFolderId = null;

function openFolderSettingsModal(folderId) {
  const folderData = folders[folderId];
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
  if (currentOpenFolderId) {
    openFolderSettingsModal(currentOpenFolderId);
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
  if (!currentSettingsFolderId || !folders[currentSettingsFolderId]) return;
  
  const name = document.getElementById('folder_settings_name').value.trim();
  const color = document.getElementById('folder_settings_color').value;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
  
  const folderData = folders[currentSettingsFolderId];
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
  if (currentOpenFolderId === currentSettingsFolderId) {
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

  if (currentSettingsFolderId && currentOpenFolderId === currentSettingsFolderId) {
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

const googleCalendarWidget = document.getElementById('google_calendar_widget');
const googleCalendarIframe = document.getElementById('google_calendar_iframe');
const googleCalendarSetupPrompt = document.getElementById('google_calendar_setup_prompt');
const googleCalendarSettingsBtn = document.getElementById('google_calendar_settings_btn');
const googleCalendarSettingsModal = document.getElementById('google_calendar_settings_modal_overlay');
const googleCalendarUrlInput = document.getElementById('google_calendar_url_input');
const googleCalendarRefreshBtn = document.getElementById('google_calendar_refresh_btn');
const googleCalendarModeSelect = document.getElementById('google_calendar_mode_select');

/**
 * Google Calendarウィジェットを更新
 */
function updateGoogleCalendarWidget() {
  const calendarUrl = localStorage.getItem(LS_KEYS.GOOGLE_CALENDAR_URL);

  if (calendarUrl) {
    if (googleCalendarIframe.src !== calendarUrl) {
      googleCalendarIframe.src = calendarUrl;
    }
    googleCalendarSetupPrompt.style.display = 'none';
    googleCalendarIframe.style.display = 'block';
  } else {
    googleCalendarIframe.src = 'about:blank';
    googleCalendarSetupPrompt.style.display = 'flex';
    googleCalendarIframe.style.display = 'none';
  }
}

// 更新ボタンのイベント
if (googleCalendarRefreshBtn) {
  googleCalendarRefreshBtn.onpointerdown = (e) => e.stopPropagation();
  googleCalendarRefreshBtn.onclick = (e) => {
    e.stopPropagation();
    if (googleCalendarIframe.src && googleCalendarIframe.src !== 'about:blank') {
      // srcを再代入してリロード
      const currentSrc = googleCalendarIframe.src;
      googleCalendarIframe.src = 'about:blank';
      setTimeout(() => { googleCalendarIframe.src = currentSrc; }, 10);
    }
  };
}

// 設定ボタンのイベント
if (googleCalendarSettingsBtn) {
  googleCalendarSettingsBtn.onpointerdown = (e) => {
    e.stopPropagation();
  };
  googleCalendarSettingsBtn.onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    const url = localStorage.getItem(LS_KEYS.GOOGLE_CALENDAR_URL) || '';
    googleCalendarUrlInput.value = url;
    
    // 現在のモードを検出してセレクトボックスに反映
    let mode = 'MONTH';
    if (url.includes('mode=WEEK')) mode = 'WEEK';
    else if (url.includes('mode=AGENDA')) mode = 'AGENDA';
    if (googleCalendarModeSelect) googleCalendarModeSelect.value = mode;
    
    googleCalendarSettingsModal.style.display = 'flex';
  };
}

// 設定モーダルのイベント
document.getElementById('close_google_calendar_settings_modal')?.addEventListener('click', () => {
  googleCalendarSettingsModal.style.display = 'none';
});

document.getElementById('save_google_calendar_settings')?.addEventListener('click', () => {
  let url = googleCalendarUrlInput.value.trim();
  
  // ユーザーが<iframe...>全体を貼り付けた場合、srcを抽出する
  if (url.startsWith('<iframe')) {
    const match = url.match(/src="([^"]+)"/);
    url = (match && match[1]) ? match[1].replace(/&amp;/g, '&') : '';
  }

  if (url) {
    // 表示モードをURLに適用
    const mode = googleCalendarModeSelect ? googleCalendarModeSelect.value : 'MONTH';
    // 既存のmodeパラメータを削除
    url = url.replace(/([?&])mode=[^&]*&?/, '$1').replace(/&$/, '').replace(/\?$/, '');
    // 新しいmodeパラメータを追加
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}mode=${mode}`;

    localStorage.setItem(LS_KEYS.GOOGLE_CALENDAR_URL, url);
  } else {
    localStorage.removeItem(LS_KEYS.GOOGLE_CALENDAR_URL);
  }
  googleCalendarSettingsModal.style.display = 'none';
  updateGoogleCalendarWidget();
});

// Googleログインボタン
document.getElementById('google_login_btn')?.addEventListener('click', () => {
  if (window.electronAPI && window.electronAPI.openGoogleLogin) {
    window.electronAPI.openGoogleLogin();
  }
});

// 初期化時にカレンダーウィジェットを更新
setTimeout(updateGoogleCalendarWidget, 1000);

document.getElementById('save_edit_linuxapp').onclick = async () => {
  const name = document.getElementById('edit_linuxapp_name').value.trim();
  const command = document.getElementById('edit_linuxapp_command').value.trim();
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
      const folder = folders[folderId];
      
      if (folder && folder.apps[index]) {
        folder.apps[index].name = name;
        folder.apps[index].command = command;
        folder.apps[index].runInTerminal = runInTerminal;
        folder.apps[index].icon = editLinuxappIconDataUrl;
        saveFolders();
        updateFolderIcon(folderId);
        renderFolderPage(folderId);
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
 * @param {string} filePath - ファイル/フォルダのパス
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function openFileOrFolder(filePath) {
  if (window.electronAPI && window.electronAPI.openFileOrFolder) {
    return await window.electronAPI.openFileOrFolder(filePath);
  }
  return { success: false, error: 'Electron API not available' };
}

/**
 * ファイルショートカットのアイコンを作成
 * @param {Object} fileData - ファイルデータ
 */
function createFileShortcutIcon(fileData) {
  const div = document.createElement('div');
  div.className = 'appicon file-shortcut';
  const saveKey = fileData.saveKey || ('file-shortcut-' + fileData.name.replace(/\s+/g, '-') + '-' + Date.now());
  div.dataset.saveKey = saveKey;
  div._filePath = fileData.path;
  div._fileData = { ...fileData, saveKey };
  
  // saveKeyがなかった場合はlocalStorageを更新
  if (!fileData.saveKey) {
    const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
    const index = fileShortcuts.findIndex(f => f.path === fileData.path);
    if (index !== -1) {
      fileShortcuts[index].saveKey = saveKey;
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));
    }
  }
  
  // ファイルタイプに応じたアイコンを設定
  const iconSrc = fileData.icon || getFileIcon(fileData.path, fileData.isDirectory);
  
  div.innerHTML = `
    <img src="${iconSrc}" />
    <p>${fileData.name}</p>
  `;
  
  div.onclick = async () => {
    const result = await openFileOrFolder(fileData.path);
    if (!result.success) {
      const lang = getCurrentLanguage();
      await showAlertDialog(i18n.t('open_failed') + ': ' + result.error);
    }
  };
  
  div.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, div, 'file');
  };
  
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.appendChild(div);
  }
  
  // 保存された位置を復元
  const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
  if (positions[saveKey]) {
    div.style.position = positions[saveKey].position;
    div.style.left = positions[saveKey].left;
    div.style.top = positions[saveKey].top;
  }
  
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
  return div;
}

/**
 * フォルダショートカットのアイコンを作成
 * @param {Object} folderData - フォルダデータ
 */
function createFolderShortcutIcon(folderData) {
  const div = document.createElement('div');
  div.className = 'appicon folder-shortcut';
  const saveKey = folderData.saveKey || ('folder-shortcut-' + folderData.name.replace(/\s+/g, '-') + '-' + Date.now());
  div.dataset.saveKey = saveKey;
  div._filePath = folderData.path;
  div._fileData = { ...folderData, saveKey };
  
  // saveKeyがなかった場合はlocalStorageを更新
  if (!folderData.saveKey) {
    const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
    const index = folderShortcuts.findIndex(f => f.path === folderData.path);
    if (index !== -1) {
      folderShortcuts[index].saveKey = saveKey;
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));
    }
  }
  
  // フォルダアイコン
  const iconSrc = folderData.icon || './assets/folder.svg';
  
  div.innerHTML = `
    <img src="${iconSrc}" />
    <p>${folderData.name}</p>
  `;
  
  div.onclick = async () => {
    const result = await openFileOrFolder(folderData.path);
    if (!result.success) {
      const lang = getCurrentLanguage();
      await showAlertDialog(i18n.t('open_failed') + ': ' + result.error);
    }
  };
  
  div.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, div, 'folder-shortcut');
  };
  
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.appendChild(div);
  }
  
  // 保存された位置を復元
  const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
  if (positions[saveKey]) {
    div.style.position = positions[saveKey].position;
    div.style.left = positions[saveKey].left;
    div.style.top = positions[saveKey].top;
  }
  
  // 通常モードのドラッグを設定
  setupNormalModeDrag(div);
  return div;
}

/**
 * ファイルの拡張子からアイコンを取得
 * @param {string} filePath - ファイルパス
 * @param {boolean} isDirectory - ディレクトリかどうか
 * @returns {string} アイコンのパス
 */
function getFileIcon(filePath, isDirectory) {
  if (isDirectory) {
    return './assets/folder.svg';
  }
  
  // デフォルトはファイルアイコン
  return './assets/file.svg';
}

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

// Helper function to check if a file shortcut is in any folder
function isFileShortcutInFolder(file) {
  for (const folderId in folders) {
    const folderData = folders[folderId];
    const found = folderData.apps.some(folderApp => 
      folderApp.path && folderApp.path === file.path
    );
    if (found) return true;
  }
  return false;
}

// Helper function to check if a folder shortcut is in any folder
function isFolderShortcutInFolder(folder) {
  for (const folderId in folders) {
    const folderData = folders[folderId];
    const found = folderData.apps.some(folderApp => 
      folderApp.path && folderApp.path === folder.path
    );
    if (found) return true;
  }
  return false;
}

// 保存されたファイルショートカットを読み込み
const savedFileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
savedFileShortcuts.forEach(file => {
  if (!isFileShortcutInFolder(file)) {
    createFileShortcutIcon(file);
  }
});

// 保存されたフォルダショートカットを読み込み
const savedFolderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
savedFolderShortcuts.forEach(folder => {
  if (!isFolderShortcutInFolder(folder)) {
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
        if (isGridModeEnabled) {
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

// 設定画面のリセットボタンにハンドラを追加
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reset_widget_sizes_btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const lang = getCurrentLanguage();
      if (!await showConfirmDialog(i18n.t('reset_widget_sizes_confirm'))) return;
      resetWidgetSizes();
      await showAlertDialog(i18n.t('widget_sizes_reset'));
    });
  }

  // アイコン形状選択UIの生成
  const shapeButtonContainer = document.getElementById('icon_shape_buttons');
  if (shapeButtonContainer) {
    const shapes = [
      "square", "circle", "rounded", "cut",
      "4-leaf-clover", "4-sided-cookie", "6-sided-cookie", "7-sided-cookie", "8-leaf-clover", "9-sided-cookie", "12-sided-cookie",
      "arch", "arrow", "boom", "bun", "burst", "diamond", "fan", "flower", "gem", "ghost-ish", "heart", "hexagon", "oval", "pentagon", "pill", "pixel-circle", "pixel-triangle", "puffy", "puffy-diamond", "semicircle", "slanted", "soft-boom", "soft-burst", "sunny", "triangle", "very-sunny"
    ];
    const currentShape = getCurrentIconShape();

    let selectedBtn = null;
    function markSelected(btn) {
      if (selectedBtn) selectedBtn.classList.remove('selected');
      selectedBtn = btn;
      if (selectedBtn) selectedBtn.classList.add('selected');
    }

    shapes.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = s;
      
      const preview = document.createElement('m3e-shape');
      preview.setAttribute('name', s);
      const img = document.createElement('img');
      img.src = './assets/settings.webp';
      img.alt = s;
      preview.appendChild(img);
      btn.appendChild(preview);

      btn.addEventListener('click', () => {
        updateIconShape(s);
        markSelected(btn);
      });

      if (s === currentShape) {
        markSelected(btn);
      }
      shapeButtonContainer.appendChild(btn);
    });
  }

  // ウィジェットのコンテキストメニューを設定
  Object.values(availableWidgets).forEach(widgetInfo => {
    if (widgetInfo.element) {
      widgetInfo.element.addEventListener('contextmenu', (e) => showWidgetContextMenu(e, widgetInfo.element));
    }
  });

  // ウィジェット非表示ボタンの処理
  document.getElementById('widget_context_hide').onclick = (e) => {
    e.stopPropagation();
    hideContextMenu();
    if (currentEditingWidget) {
      const widgetId = currentEditingWidget.id;
      if (widgetId) {
        setWidgetVisibility(widgetId, false);
      }
    }
  };

  loadWidgetVisibility();
  applyWidgetVisibility();
});