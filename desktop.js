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
const GRID_SIZE = 100; // グリッドのサイズ（ピクセル）
let isGridModeEnabled = false;

function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

document.getElementById('open_change_widget_position_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
  change_widget_position_modal_overlay.style.display = 'flex';
  
  // グリッドモードのスイッチの状態を復元
  const gridSwitch = document.getElementById('grid_mode_switch');
  if (gridSwitch) {
    isGridModeEnabled = localStorage.getItem('gridModeEnabled') === 'true';
    gridSwitch.selected = isGridModeEnabled;
    
    // グリッド線の表示/非表示
    if (isGridModeEnabled) {
      change_widget_position_modal_overlay.classList.add('grid-mode');
    } else {
      change_widget_position_modal_overlay.classList.remove('grid-mode');
    }
  }

  document.querySelectorAll(".appicon,.widget").forEach(item => {
    // 位置変更モード中はクリックイベントを無効化
    item.dataset.originalOnclick = item.onclick ? 'has-onclick' : '';
    item._savedOnclick = item.onclick;
    item.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
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

    item.onpointermove = function(event){
      if(event.buttons){
        let newLeft = this.offsetLeft + event.movementX;
        let newTop = this.offsetTop + event.movementY;
        
        // グリッドモードが有効な場合はスナップ
        if (isGridModeEnabled) {
          newLeft = snapToGrid(newLeft);
          newTop = snapToGrid(newTop);
        }
        
        this.style.left = newLeft + 'px';
        this.style.top = newTop + 'px';
        this.style.position = 'absolute';
        this.draggable = false;
        this.setPointerCapture(event.pointerId);
      }
    };
    
    // グリッドモードが有効な場合、ドラッグ終了時にスナップ
    item.onpointerup = function() {
      if (isGridModeEnabled && this.style.position === 'absolute') {
        this.style.left = snapToGrid(this.offsetLeft) + 'px';
        this.style.top = snapToGrid(this.offsetTop) + 'px';
      }
    };
  });
}

// グリッドモードスイッチのイベント
const gridModeSwitch = document.getElementById('grid_mode_switch');
if (gridModeSwitch) {
  gridModeSwitch.addEventListener('change', (e) => {
    isGridModeEnabled = e.target.selected;
    localStorage.setItem('gridModeEnabled', isGridModeEnabled);
    
    // グリッド線の表示/非表示
    const overlay = document.getElementById('change_widget_position_modal_overlay');
    if (isGridModeEnabled) {
      overlay.classList.add('grid-mode');
    } else {
      overlay.classList.remove('grid-mode');
    }
    
    // グリッドモードが有効になったら、現在の位置をグリッドにスナップ
    if (isGridModeEnabled) {
      document.querySelectorAll(".appicon,.widget").forEach(item => {
        if (item.style.position === 'absolute') {
          item.style.left = snapToGrid(item.offsetLeft) + 'px';
          item.style.top = snapToGrid(item.offsetTop) + 'px';
        }
      });
    }
  });
}

document.getElementById('close_change_widget_position_modal').onclick = () => {
  change_widget_position_modal_overlay.style.display = 'none';
  
  // 位置変更モード終了時にクリックイベントを復元
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    if (item._savedOnclick) {
      item.onclick = item._savedOnclick;
    } else if (!item.dataset.originalOnclick) {
      item.onclick = null;
    }
    delete item._savedOnclick;
    delete item.dataset.originalOnclick;
    
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
    
    // ポインター移動イベントを削除
    item.onpointermove = null;
    item.onpointerup = null;
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
  
  // 位置変更モード終了時にクリックイベントを復元
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    if (item._savedOnclick) {
      item.onclick = item._savedOnclick;
    } else if (!item.dataset.originalOnclick) {
      item.onclick = null;
    }
    delete item._savedOnclick;
    delete item.dataset.originalOnclick;
    
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
    
    // ポインター移動イベントを削除
    item.onpointermove = null;
    item.onpointerup = null;
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
  change_widget_position_modal_overlay.style.display = 'none';
  
  // 位置変更モード終了時にクリックイベントを復元
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    if (item._savedOnclick) {
      item.onclick = item._savedOnclick;
    } else if (!item.dataset.originalOnclick) {
      item.onclick = null;
    }
    delete item._savedOnclick;
    delete item.dataset.originalOnclick;
    
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
    
    // ポインター移動イベントを削除
    item.onpointermove = null;
    item.onpointerup = null;
  });
}

document.getElementById('appicon-add').onclick = () => {
  add_newapp_modal_overlay.style.display = 'flex';
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
    hide_settings_button: "非表示"
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
    hide_settings_button: "Hide"
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
  div.className = 'appicon';
  div.dataset.saveKey = 'custom-app-' + appData.name;
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
    const lang = localStorage.getItem('language') || 'ja';
    const confirmMsg = lang === 'ja' ? `「${appData.name}」を削除しますか？` : `Delete "${appData.name}"?`;

    if (confirm(confirmMsg)) {
      div.remove();
      const customApps = JSON.parse(localStorage.getItem('customApps') || '[]');
      const newApps = customApps.filter(a => !(a.name === appData.name && a.url === appData.url));
      localStorage.setItem('customApps', JSON.stringify(newApps));

      const positions = JSON.parse(localStorage.getItem('widgetPositions') || '{}');
      if (positions[div.dataset.saveKey]) {
        delete positions[div.dataset.saveKey];
        localStorage.setItem('widgetPositions', JSON.stringify(positions));
      }
    }
  };
  
  const addBtn = document.getElementById('appicon-add');
  if (addBtn && addBtn.parentNode) {
    addBtn.parentNode.insertBefore(div, addBtn);
  }
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

// Load saved apps
const savedCustomApps = JSON.parse(localStorage.getItem('customApps') || '[]');
savedCustomApps.forEach(app => createDesktopIcon(app));

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