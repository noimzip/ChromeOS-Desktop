document.getElementById('appicon-chrome').onclick = () => {
  openURL('chrome://newtab');
}

document.getElementById('appicon-files').onclick = () => {
  openURL('chrome://file-manager');
}

document.getElementById('appicon-settings').onclick = () => {
  openURL('chrome://os-settings');
}

document.getElementById('appicon-x').onclick = () => {
  window.open('https://x.com');
}

document.addEventListener('keydown', function(e) {
  if(e.key === 'Escape'){
    escmenu_modal_overlay.style.display = 'flex';
  }
});

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

document.getElementById('open_change_widget_position_modal').onclick = () => {
  escmenu_modal_overlay.style.display = 'none';
  change_widget_position_modal_overlay.style.display = 'flex';

  document.querySelectorAll(".appicon,.widget").forEach(item => {
    item.onpointermove = function(event){
      if(event.buttons){
          this.style.left     = this.offsetLeft + event.movementX + 'px'
          this.style.top      = this.offsetTop  + event.movementY + 'px'
          this.style.position = 'absolute'
          this.draggable      = false
        this.setPointerCapture(event.pointerId)
    }
  }
});
}

document.getElementById('close_change_widget_position_modal').onclick = () => {
  change_widget_position_modal_overlay.style.display = 'none';
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
    general: "一般",
    keyboard_shortcuts: "キーボードショートカット",
    design_style: "デザインとスタイル",
    security_privacy: "セキュリティとプライバシー",
    account: "アカウント",
    debug: "デバッグ",
    dev_settings: "開発者向け設定",
    about: "バージョン情報",
    user_agent: "ユーザーエージェント:",
    language: "言語"
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
    general: "General",
    keyboard_shortcuts: "Keyboard Shortcuts",
    design_style: "Design & Style",
    security_privacy: "Security & Privacy",
    account: "Account",
    debug: "Debug",
    dev_settings: "Developer Settings",
    about: "About",
    user_agent: "User Agent:",
    language: "Language"
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