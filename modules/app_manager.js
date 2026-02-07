/**
 * Soul Widgets Manager - App Manager
 */

'use strict';

window.AppManager = {
  /**
   * Webアプリ（URL）ショートカットを作成
   */
  createDesktopIcon(appData) {
    const div = document.createElement('div');
    div.className = 'appicon custom-app';
    const saveKey = appData.saveKey || ('custom-app-' + appData.name.replace(/\s+/g, '-') + '-' + Date.now());
    div.dataset.saveKey = saveKey;
    div._appUrl = appData.url;
    div._appData = { ...appData, saveKey };
    
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
      if (window.ContextMenuManager) {
        window.ContextMenuManager.showContextMenu(e, div, 'webapp');
      } else {
        showContextMenu(e, div, 'webapp');
      }
    };
    
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(div);
    }
    
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      div.style.position = positions[saveKey].position;
      div.style.left = positions[saveKey].left;
      div.style.top = positions[saveKey].top;
    }
    
    if (typeof wrapIconWithShape === 'function') {
      wrapIconWithShape(div, getCurrentIconShape());
    }
    
    if (typeof setupNormalModeDrag === 'function') {
      setupNormalModeDrag(div);
    }
    return div;
  },

  /**
   * Linuxアプリのアイコンを作成
   */
  createLinuxAppIcon(appData) {
    const div = document.createElement('div');
    div.className = 'appicon linux-app';
    const saveKey = appData.saveKey || ('linux-app-' + appData.name.replace(/\s+/g, '-') + '-' + Date.now());
    div.dataset.saveKey = saveKey;
    div._appCommand = appData.command;
    div._runInTerminal = appData.runInTerminal || false;
    div._appData = { ...appData, saveKey };
    
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
      if (appData.runInTerminal) {
        command = `xterm -hold -e "${appData.command}"`;
      }
      
      const result = await launchLinuxApp(command);
      if (!result.success) {
        const lang = getCurrentLanguage();
        const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
        await window.UIUtils.showAlertDialog(errorMsg);
      }
    };
    
    div.oncontextmenu = (e) => {
      e.preventDefault();
      if (window.ContextMenuManager) {
        window.ContextMenuManager.showContextMenu(e, div, 'linuxapp');
      } else {
        showContextMenu(e, div, 'linuxapp');
      }
    };
    
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(div);
    }
    
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      div.style.position = positions[saveKey].position;
      div.style.left = positions[saveKey].left;
      div.style.top = positions[saveKey].top;
    }
    
    if (typeof wrapIconWithShape === 'function') {
      wrapIconWithShape(div, getCurrentIconShape());
    }
    
    if (typeof setupNormalModeDrag === 'function') {
      setupNormalModeDrag(div);
    }
    
    return div;
  },

  /**
   * ファイルショートカットのアイコンを作成
   */
  createFileShortcutIcon(fileData) {
    const div = document.createElement('div');
    div.className = 'appicon file-shortcut';
    const saveKey = fileData.saveKey || ('file-shortcut-' + fileData.name.replace(/\s+/g, '-') + '-' + Date.now());
    div.dataset.saveKey = saveKey;
    div._filePath = fileData.path;
    div._fileData = { ...fileData, saveKey };
    
    if (!fileData.saveKey) {
      const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
      const index = fileShortcuts.findIndex(f => f.path === fileData.path);
      if (index !== -1) {
        fileShortcuts[index].saveKey = saveKey;
        localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));
      }
    }
    
    const iconSrc = fileData.icon || this.getFileIcon(fileData.path, fileData.isDirectory);
    
    div.innerHTML = `
      <img src="${iconSrc}" />
      <p>${fileData.name}</p>
    `;
    
    div.onclick = async () => {
      const result = await openFileOrFolder(fileData.path);
      if (!result.success) {
        await window.UIUtils.showAlertDialog(i18n.t('open_failed') + ': ' + result.error);
      }
    };
    
    div.oncontextmenu = (e) => {
      e.preventDefault();
      if (window.ContextMenuManager) {
        window.ContextMenuManager.showContextMenu(e, div, 'file');
      } else {
        showContextMenu(e, div, 'file');
      }
    };
    
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(div);
    }
    
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      div.style.position = positions[saveKey].position;
      div.style.left = positions[saveKey].left;
      div.style.top = positions[saveKey].top;
    }
    
    if (typeof wrapIconWithShape === 'function') {
      wrapIconWithShape(div, getCurrentIconShape());
    }
    
    if (typeof setupNormalModeDrag === 'function') {
      setupNormalModeDrag(div);
    }
    return div;
  },

  /**
   * フォルダショートカットのアイコンを作成
   */
  createFolderShortcutIcon(folderData) {
    const div = document.createElement('div');
    div.className = 'appicon folder-shortcut';
    const saveKey = folderData.saveKey || ('folder-shortcut-' + folderData.name.replace(/\s+/g, '-') + '-' + Date.now());
    div.dataset.saveKey = saveKey;
    div._filePath = folderData.path;
    div._fileData = { ...folderData, saveKey };
    
    if (!folderData.saveKey) {
      const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
      const index = folderShortcuts.findIndex(f => f.path === folderData.path);
      if (index !== -1) {
        folderShortcuts[index].saveKey = saveKey;
        localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));
      }
    }
    
    const iconSrc = folderData.icon || './assets/folder.svg';
    
    div.innerHTML = `
      <img src="${iconSrc}" />
      <p>${folderData.name}</p>
    `;
    
    div.onclick = async () => {
      const result = await openFileOrFolder(folderData.path);
      if (!result.success) {
        await window.UIUtils.showAlertDialog(i18n.t('open_failed') + ': ' + result.error);
      }
    };
    
    div.oncontextmenu = (e) => {
      e.preventDefault();
      if (window.ContextMenuManager) {
        window.ContextMenuManager.showContextMenu(e, div, 'folder-shortcut');
      } else {
        showContextMenu(e, div, 'folder-shortcut');
      }
    };
    
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(div);
    }
    
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      div.style.position = positions[saveKey].position;
      div.style.left = positions[saveKey].left;
      div.style.top = positions[saveKey].top;
    }
    
    if (typeof wrapIconWithShape === 'function') {
      wrapIconWithShape(div, getCurrentIconShape());
    }
    
    if (typeof setupNormalModeDrag === 'function') {
      setupNormalModeDrag(div);
    }
    return div;
  },

  /**
   * ファイルタイプに応じたアイコンを取得
   */
  getFileIcon(filePath, isDirectory) {
    if (isDirectory) {
      return './assets/folder.svg';
    }
    return './assets/file.svg';
  }
};
