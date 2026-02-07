/**
 * Soul Widgets Manager - App Manager
 */

'use strict';

window.AppManager = {
  /**
   * 基本的なアイコン要素を作成する共通ヘルパー (内部用)
   */
  _createBaseIcon(type, data, options = {}) {
    const div = document.createElement('div');
    div.className = `appicon ${type}`;
    
    const saveKey = data.saveKey || (`${type}-${data.name.replace(/\s+/g, '-')}-${Date.now()}`);
    div.dataset.saveKey = saveKey;
    
    div.innerHTML = `
      <img src="${data.icon || './assets/settings.webp'}" />
      <p>${data.name}</p>
    `;

    // データの紐付け
    if (options.dataProps) {
      Object.entries(options.dataProps).forEach(([key, value]) => {
        div[key] = value;
      });
    }
    div._appData = { ...data, saveKey };
    if (data.shape) {
      div.dataset.shape = data.shape;
    }

    // イベント
    div.onclick = options.onclick;
    div.oncontextmenu = (e) => {
      e.preventDefault();
      if (window.ContextMenuManager) {
        window.ContextMenuManager.showContextMenu(e, div, options.contextMenuType || type);
      }
    };

    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(div);
    }

    // 位置復元
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      div.style.position = positions[saveKey].position;
      div.style.left = positions[saveKey].left;
      div.style.top = positions[saveKey].top;
    }

    // 共通UI処理 (desktop.jsのグローバル関数に依存しているが、後で整理可能)
    if (typeof window.wrapIconWithShape === 'function') {
      window.wrapIconWithShape(div, data.shape || window.getCurrentIconShape());
    }

    if (typeof setupNormalModeDrag === 'function') {
      setupNormalModeDrag(div);
    }

    return div;
  },

    /**

     * Webアプリ（URL）ショートカットを作成

     */

    createDesktopIcon(appData) {

      const onclick = () => {

        if (appData.url.startsWith('chrome://')) {

          if (typeof window.openURL === 'function') window.openURL(appData.url);

        } else {

          window.open(appData.url);

        }

      };

  

      const icon = window.AppManager._createBaseIcon('custom-app', appData, {

        onclick,

        contextMenuType: 'webapp',

        dataProps: { _appUrl: appData.url }

      });

  

      if (!appData.saveKey) {

        const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');

        const index = customApps.findIndex(a => a.name === appData.name && a.url === appData.url);

        if (index !== -1) {

          customApps[index].saveKey = icon.dataset.saveKey;

          localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));

        }

      }

      return icon;

    },

  

    /**

     * Linuxアプリのアイコンを作成

     */

    createLinuxAppIcon(appData) {

      const onclick = async () => {

        let command = appData.command;

        if (appData.runInTerminal) {

          command = `xterm -hold -e "${appData.command}"`;

        }

        const result = await window.launchLinuxApp(command);

        if (!result.success) {

          const lang = getCurrentLanguage();

          const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;

          await window.UIUtils.showAlertDialog(errorMsg);

        }

      };

  

      const icon = window.AppManager._createBaseIcon('linux-app', appData, {

        onclick,

        contextMenuType: 'linuxapp',

        dataProps: { 

          _appCommand: appData.command,

          _runInTerminal: appData.runInTerminal || false

        }

      });

  

      if (!appData.saveKey) {

        const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');

        const index = linuxApps.findIndex(a => a.name === appData.name && a.command === appData.command);

        if (index !== -1) {

          linuxApps[index].saveKey = icon.dataset.saveKey;

          localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));

        }

      }

      return icon;

    },

  

    /**

     * ファイルショートカットのアイコンを作成

     */

    createFileShortcutIcon(fileData) {

      const onclick = async () => {

        const result = await window.electronAPI.openFileOrFolder(fileData.path);

        if (!result.success) {

          await window.UIUtils.showAlertDialog(i18n.t('open_failed') + ': ' + result.error);

        }

      };

  

      const iconSrc = fileData.icon || window.AppManager.getFileIcon(fileData.path, fileData.isDirectory);

      const icon = window.AppManager._createBaseIcon('file-shortcut', { ...fileData, icon: iconSrc }, {

        onclick,

        contextMenuType: 'file',

        dataProps: { 

          _filePath: fileData.path,

          _fileData: { ...fileData }

        }

      });

  

      if (!fileData.saveKey) {

        const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');

        const index = fileShortcuts.findIndex(f => f.path === fileData.path);

        if (index !== -1) {

          fileShortcuts[index].saveKey = icon.dataset.saveKey;

          localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));

        }

      }

      return icon;

    },

  

    /**

     * フォルダショートカットのアイコンを作成

     */

    createFolderShortcutIcon(folderData) {

      const onclick = async () => {

        const result = await window.electronAPI.openFileOrFolder(folderData.path);

        if (!result.success) {

          await window.UIUtils.showAlertDialog(i18n.t('open_failed') + ': ' + result.error);

        }

      };

  

      const iconSrc = folderData.icon || './assets/folder.svg';

      const icon = window.AppManager._createBaseIcon('folder-shortcut', { ...folderData, icon: iconSrc }, {

        onclick,

        dataProps: { 

          _filePath: folderData.path,

          _fileData: { ...folderData }

        }

      });

  

      if (!folderData.saveKey) {

        const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');

        const index = folderShortcuts.findIndex(f => f.path === folderData.path);

        if (index !== -1) {

          folderShortcuts[index].saveKey = icon.dataset.saveKey;

          localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));

        }

      }

      return icon;

    },

  

  /**
   * ファイルタイプに応じたアイコンを取得
   */
  getFileIcon(filePath, isDirectory) {
    return isDirectory ? './assets/folder.svg' : './assets/file.svg';
  },

  /**
   * アイコン要素からデータを取得
   */
  getIconData(icon) {
    const img = icon.querySelector('img');
    const name = icon.querySelector('p')?.textContent || '';
    const isBuiltin = !!icon.id && icon.id.startsWith('appicon-');
    const isLinuxApp = icon.classList.contains('linux-app');
    const isFileShortcut = icon.classList.contains('file-shortcut');
    const isFolderShortcut = icon.classList.contains('folder-shortcut');
    
    let url = icon._appUrl || '';
    if (isBuiltin && icon.id && builtinIconUrls[icon.id]) {
      url = builtinIconUrls[icon.id];
    }
    
    const data = {
      id: icon.id || icon.dataset.saveKey,
      name,
      icon: img?.src || '',
      url,
      isBuiltin,
      shape: icon.dataset.shape || ''
    };
    
    if (icon._appCommand) {
      data.command = icon._appCommand;
      data.runInTerminal = icon._runInTerminal || false;
      data.isLinuxApp = true;
    }

    if ((isFileShortcut || isFolderShortcut) && icon._filePath) {
      data.path = icon._filePath;
      data.isDirectory = isFolderShortcut;
    }
    
    return data;
  }
};


