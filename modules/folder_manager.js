/**
 * Soul Widgets Manager - Folder Manager
 */

'use strict';

window.FolderManager = {
  /**
   * フォルダーを作成
   */
  createFolder(icon1, icon2) {
    const folderId = 'folder-' + Date.now();
    const lang = getCurrentLanguage();
    const folderName = lang === 'ja' ? '新規フォルダー' : 'New Folder';
    
    const icon1Data = window.AppManager.getIconData(icon1);
    const icon2Data = window.AppManager.getIconData(icon2);
    
    window.folders[folderId] = {
      name: folderName,
      apps: [icon1Data, icon2Data]
    };
    saveFolders();
    
    const folderEl = window.FolderManager.createFolderIcon(folderId, window.folders[folderId]);
    
    folderEl.style.position = 'absolute';
    folderEl.style.left = icon1.style.left || (icon1.offsetLeft + 'px');
    folderEl.style.top = icon1.style.top || (icon1.offsetTop + 'px');
    
    icon1.style.display = 'none';
    icon2.style.display = 'none';
    
    const desktopIcons = document.getElementById('desktop_icons');
    if (desktopIcons) {
      desktopIcons.appendChild(folderEl);
    }
    
    if (window.isPositionChangeMode && typeof window.DragManager.setupDraggableItem === 'function') {
      window.DragManager.setupDraggableItem(folderEl);
    }
    
    return folderEl;
  },

  /**
   * フォルダーアイコンを作成
   */
  createFolderIcon(folderId, folderData) {
    const div = document.createElement('div');
    div.className = 'appicon folder';
    div.dataset.folderId = folderId;
    div.dataset.saveKey = folderId;
    
    if (folderData.shape) {
      div.dataset.shape = folderData.shape;
    }
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'folder-preview';
    
    if (folderData.style) {
      const { color, opacity } = folderData.style;
      const rgb = window.UIUtils.hexToRgb(color);
      if (rgb) {
        previewDiv.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      }
    }
    
    folderData.apps.slice(0, 4).forEach(app => {
      const img = document.createElement('img');
      img.src = app.icon;
      previewDiv.appendChild(img);
      if (!app.path && typeof window.wrapImageWithShape === 'function') {
        window.wrapImageWithShape(img, folderData.shape || window.getCurrentIconShape());
      }
    });
    
    const nameP = document.createElement('p');
    nameP.textContent = folderData.name;
    
    div.appendChild(previewDiv);
    div.appendChild(nameP);
    
    div.onclick = () => window.FolderManager.openFolder(folderId);
    
    div.oncontextmenu = (e) => {
      e.preventDefault();
      div._folderId = folderId;
      if (window.ContextMenuManager) {
        window.ContextMenuManager.showContextMenu(e, div, 'folder');
      }
    };
    
    if (typeof window.wrapIconWithShape === 'function') {
      window.wrapIconWithShape(div, folderData.shape || window.getCurrentIconShape());
    }
    if (typeof window.DragManager.setupNormalModeDrag === 'function') {
      window.DragManager.setupNormalModeDrag(div);
    }
    
    return div;
  },

  /**
   * フォルダーアイコンを更新
   */
  updateFolderIcon(folderId) {
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
    const folderData = window.folders[folderId];
    
    if (!folderEl || !folderData) return;
    
    if (folderData.shape) {
      folderEl.dataset.shape = folderData.shape;
      if (typeof window.wrapIconWithShape === 'function') {
        window.wrapIconWithShape(folderEl, folderData.shape);
      }
    } else {
      delete folderEl.dataset.shape;
      if (typeof window.wrapIconWithShape === 'function') {
        window.wrapIconWithShape(folderEl, window.getCurrentIconShape());
      }
    }

    const previewDiv = folderEl.querySelector('.folder-preview');
    if (previewDiv) {
      if (folderData.style) {
        const { color, opacity } = folderData.style;
        const rgb = window.UIUtils.hexToRgb(color);
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
        if (!app.path && typeof window.wrapImageWithShape === 'function') {
          window.wrapImageWithShape(img, folderData.shape || window.getCurrentIconShape());
        }
      });
    }
  },

  /**
   * フォルダのスタイルを適用
   */
  applyFolderStyle(folderId) {
    const folderData = window.folders[folderId];
    if (!folderData || !folderData.style) return;
    
    const modal = document.getElementById('folder_modal');
    const { color, opacity } = folderData.style;
    
    const rgb = window.UIUtils.hexToRgb(color);
    if (rgb) {
      modal.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      const textColor = window.UIUtils.getContrastColor(rgb.r, rgb.g, rgb.b);
      modal.style.setProperty('--on-surface', textColor);
      modal.style.setProperty('--on-surface-variant', textColor);
    }
  },

  /**
   * フォルダーを閉じる（アニメーション付き）
   */
  closeFolder() {
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
      window.currentOpenFolderId = null;
    };
    
    const timer = setTimeout(onAnimationEnd, 200);
    modalContent?.addEventListener('animationend', () => { clearTimeout(timer); onAnimationEnd(); }, { once: true });
  },

  /**
   * フォルダーを開く
   */
  openFolder(folderId) {
    if (typeof window.closeAllModals === 'function') window.closeAllModals();
    const folderData = window.folders[folderId];
    if (!folderData) return;
    
    window.currentOpenFolderId = folderId;
    window.currentFolderPage = 0;
    
    const title = document.getElementById('folder_title');
    const titleInput = document.getElementById('folder_title_input');
    
    title.textContent = folderData.name;
    title.style.display = '';
    titleInput.style.display = 'none';
    
    if (!folderData.style) {
      const isDark = document.body.classList.contains('dark-mode');
      folderData.style = { color: isDark ? '#1f1f1f' : '#ffffff', opacity: 1.0 };
    }
    
    window.FolderManager.applyFolderStyle(folderId);
    window.FolderManager.renderFolderPage(folderId);
  },

  /**
   * フォルダ内のページを描画
   */
  renderFolderPage(folderId) {
    const folderData = window.folders[folderId];
    if (!folderData) return;

    const modal = document.getElementById('folder_modal_overlay');
    const modalContent = document.getElementById('folder_modal');
    const contents = document.getElementById('folder_contents');
    
    contents.innerHTML = '';
    
    const itemsPerPage = 9;
    const totalApps = folderData.apps.length;
    const totalPages = Math.ceil(totalApps / itemsPerPage) || 1;
    
    if (window.currentFolderPage >= totalPages) window.currentFolderPage = totalPages - 1;
    if (window.currentFolderPage < 0) window.currentFolderPage = 0;
    
    const startIdx = window.currentFolderPage * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalApps);
    const pageApps = folderData.apps.slice(startIdx, endIdx);
    
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
      
      const img = div.querySelector('img');
      if (img) img.ondragstart = (e) => e.preventDefault();
      
      let isDraggingFromFolder = false;
      let ignoreClick = false;
      let dragStartX, dragStartY, dragClone = null;
      
      div.onpointerdown = (e) => {
        if (e.button !== 0) return;
        div.setPointerCapture(e.pointerId);
        isDraggingFromFolder = false; ignoreClick = false;
        dragStartX = e.clientX; dragStartY = e.clientY;
      };
      
      div.onpointermove = (e) => {
        if (!e.buttons) return;
        const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
        if (!isDraggingFromFolder && (Math.abs(dx) > 16 || Math.abs(dy) > 16)) {
          isDraggingFromFolder = true; ignoreClick = true;
          dragClone = div.cloneNode(true);
          dragClone.className = 'appicon folder-drag-clone';
          dragClone.style.position = 'fixed'; dragClone.style.pointerEvents = 'none';
          dragClone.style.zIndex = '10000'; dragClone.style.opacity = '0.8';
          dragClone.style.width = '80px';
          document.body.appendChild(dragClone);
        }
        
        if (isDraggingFromFolder && dragClone) {
          dragClone.style.left = (e.clientX - 40) + 'px';
          dragClone.style.top = (e.clientY - 40) + 'px';
          const modalRect = document.getElementById('folder_modal').getBoundingClientRect();
          const isOutsideModal = e.clientX < modalRect.left || e.clientX > modalRect.right ||
                                 e.clientY < modalRect.top || e.clientY > modalRect.bottom;
          document.querySelectorAll('.folder-item.reorder-target').forEach(el => el.classList.remove('reorder-target'));
          if (isOutsideModal) {
            dragClone.style.transform = 'scale(1.1)';
            dragClone.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
          } else {
            dragClone.style.transform = 'scale(1)';
            dragClone.style.boxShadow = '';
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const targetItem = elements.find(el => el.classList.contains('folder-item') && el !== div);
            if (targetItem) targetItem.classList.add('reorder-target');
          }
        }
      };
      
      div.onpointerup = (e) => {
        if (e.pointerId !== undefined) div.releasePointerCapture(e.pointerId);
        if (isDraggingFromFolder && dragClone) {
          const modalRect = document.getElementById('folder_modal').getBoundingClientRect();
          const isOutsideModal = e.clientX < modalRect.left || e.clientX > modalRect.right ||
                                 e.clientY < modalRect.top || e.clientY > modalRect.bottom;
          dragClone.remove(); dragClone = null;
          document.querySelectorAll('.folder-item.reorder-target').forEach(el => el.classList.remove('reorder-target'));
          if (isOutsideModal) {
            window.FolderManager.removeFromFolder(folderId, index, e.clientX, e.clientY);
            window.FolderManager.closeFolder();
          } else {
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const targetItem = elements.find(el => el.classList.contains('folder-item'));
            if (targetItem) {
              const targetIndex = parseInt(targetItem.dataset.folderItemIndex);
              if (!isNaN(targetIndex) && targetIndex !== index) {
                const item = folderData.apps[index];
                folderData.apps.splice(index, 1);
                folderData.apps.splice(targetIndex, 0, item);
                saveFolders();
                window.FolderManager.updateFolderIcon(folderId);
                window.FolderManager.renderFolderPage(folderId);
              }
            }
          }
        }
        isDraggingFromFolder = false;
      };

      div.onclick = (e) => {
        if (ignoreClick) { e.stopPropagation(); return; }
        window.FolderManager.handleFolderItemClick(app, modal);
      };
      
      div.oncontextmenu = (e) => {
        e.preventDefault();
        let type = 'folder-item';
        if (app.command) type = 'folder-item-linuxapp';
        else if (app.url) type = 'folder-item-webapp';
        div._appData = app; div._folderId = folderId; div._folderIndex = index;
        if (app.shape) div.dataset.shape = app.shape;
        if (window.ContextMenuManager) window.ContextMenuManager.showContextMenu(e, div, type);
      };
      
      contents.appendChild(div);
      if (!app.path && typeof window.wrapIconWithShape === 'function') {
        window.wrapIconWithShape(div, app.shape || window.getCurrentIconShape());
        const wrapper = div.querySelector('m3e-shape');
        if (wrapper) {
          wrapper.style.width = '50px'; wrapper.style.height = '50px';
          wrapper.style.display = 'inline-block';
        }
      }
    });

    const existingPagination = modalContent.querySelector('.folder-pagination');
    if (existingPagination) existingPagination.remove();
    if (totalPages > 1) {
      const paginationDiv = document.createElement('div');
      paginationDiv.className = 'folder-pagination';
      for (let p = 0; p < totalPages; p++) {
        const dot = document.createElement('div');
        dot.className = 'folder-pagination-dot';
        if (p === window.currentFolderPage) dot.classList.add('active');
        dot.onclick = (e) => { e.stopPropagation(); window.currentFolderPage = p; window.FolderManager.renderFolderPage(folderId); };
        paginationDiv.appendChild(dot);
      }
      modalContent.appendChild(paginationDiv);
    }
    window.FolderManager.updateFolderModalPosition(folderId);
  },

  /**
   * ドロップ座標にアイコンを配置して保存
   */
  positionCreatedIcon(el, clientX, clientY) {
    if (!el) return;
    const desktop = document.getElementById('desktop_icons');
    const containerRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0 };
    const elRect = el.getBoundingClientRect();
    const startX = clientX - containerRect.left - (elRect.width / 2);
    const startY = clientY - containerRect.top - (elRect.height / 2);
    const pos = window.DragManager.findNearestEmptyPosition(el, startX, startY);
    el.style.position = 'absolute'; el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
    try {
      const saveKey = el.dataset.saveKey;
      if (saveKey) {
        const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
        positions[saveKey] = { position: 'absolute', left: el.style.left, top: el.style.top };
        localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
      }
    } catch (e) {}
  },

  /**
   * フォルダーからアプリを取り出す
   */
  removeFromFolder(folderId, appIndex, dropX, dropY) {
    const folderData = window.folders[folderId];
    if (!folderData) return;
    const app = folderData.apps[appIndex];
    folderData.apps.splice(appIndex, 1);
    let created = null;
    if (app.command || app.isLinuxApp) created = window.AppManager.createLinuxAppIcon(app);
    else if (app.path) {
      if (app.isDirectory) created = window.AppManager.createFolderShortcutIcon(app);
      else created = window.AppManager.createFileShortcutIcon(app);
    } else if (app.isBuiltin && app.id) {
      created = document.getElementById(app.id); if (created) created.style.display = '';
    } else if (app.id) {
      created = document.querySelector(`[data-save-key="${app.id}"]`);
      if (created) created.style.display = '';
      else if (app.url) created = window.AppManager.createDesktopIcon(app);
    }
    if (created && dropX !== undefined && dropY !== undefined) window.FolderManager.positionCreatedIcon(created, dropX, dropY);
    if (folderData.apps.length <= 1) {
      if (folderData.apps.length === 1) {
        const remaining = folderData.apps[0];
        if (remaining.command || remaining.isLinuxApp) window.AppManager.createLinuxAppIcon(remaining);
        else if (remaining.isBuiltin && remaining.id) {
          const el = document.getElementById(remaining.id); if (el) el.style.display = '';
        } else if (remaining.id) {
          const el = document.querySelector(`[data-save-key="${remaining.id}"]`);
          if (el) {
            el.style.display = '';
          } else if (remaining.url) {
            window.AppManager.createDesktopIcon(remaining);
          }
        }
      }
      const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
      if (folderEl) folderEl.remove();
      delete window.folders[folderId];
    }
    saveFolders(); window.FolderManager.updateFolderIcon(folderId);
  },

  /**
   * フォルダーにアプリを追加
   */
  addToFolder(folderId, icon) {
    const folderData = window.folders[folderId];
    if (!folderData) return;
    const appData = window.AppManager.getIconData(icon);
    folderData.apps.push(appData);
    saveFolders();
    if (appData.isBuiltin) icon.style.display = 'none';
    else icon.remove();
    window.FolderManager.updateFolderIcon(folderId);
  },

  /**
   * フォルダ内アイテムのクリック処理
   */
  async handleFolderItemClick(app, modal) {
    window.FolderManager.closeFolder();
    if (app.command || app.isLinuxApp) {
      let command = app.command;
      if (app.runInTerminal) command = `xterm -hold -e "${app.command}"`;
      const result = await window.launchLinuxApp(command);
      if (!result.success) {
        const lang = getCurrentLanguage();
        const errorMsg = lang === 'ja' ? `アプリの起動に失敗しました: ${result.error}` : `Failed to launch app: ${result.error}`;
        await window.UIUtils.showAlertDialog(errorMsg);
      }
      return;
    }
    if (app.path) {
      const result = await window.electronAPI.openFileOrFolder(app.path);
      if (!result.success) await window.UIUtils.showAlertDialog(i18n.t('open_failed') + ': ' + result.error);
      return;
    }
    if (app.url) {
      if (app.url.startsWith('chrome://')) { if (typeof window.openURL === 'function') window.openURL(app.url); }
      else window.open(app.url);
    } else if (app.isBuiltin && app.id) {
      const builtinUrl = builtinIconUrls[app.id];
      if (builtinUrl) {
        if (builtinUrl.startsWith('chrome://')) { if (typeof window.openURL === 'function') window.openURL(builtinUrl); }
        else window.open(builtinUrl);
      }
    }
  },

  /**
   * 保存されたフォルダーを読み込み
   */
  loadFolders() {
    Object.keys(window.folders).forEach(folderId => {
      const folderData = window.folders[folderId];
      const folderEl = window.FolderManager.createFolderIcon(folderId, folderData);
      folderData.apps.forEach(app => {
        if (app.isBuiltin && app.id) {
          const el = document.getElementById(app.id); if (el) el.style.display = 'none';
        } else if (app.id) {
          const el = document.querySelector(`[data-save-key="${app.id}"]`); if (el) el.style.display = 'none';
        }
      });
      const desktopIcons = document.getElementById('desktop_icons');
      if (desktopIcons) desktopIcons.appendChild(folderEl);
    });
  },

  /**
   * アプリが既にいずれかのフォルダーに含まれているかチェック
   */
  isAppInFolder(predicate) {
    for (const folderId in window.folders) {
      if (window.folders[folderId].apps.some(predicate)) return true;
    }
    return false;
  },

  updateFolderModalPosition(folderId) {
    const modal = document.getElementById('folder_modal_overlay');
    const modalContent = document.getElementById('folder_modal');
    const folderIcon = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderIcon && modalContent) {
      const rect = folderIcon.getBoundingClientRect();
      if (modal.style.display === 'none') {
        modalContent.classList.remove('folder-closing');
        modalContent.classList.add('folder-opening');
      }
      modal.style.display = 'block'; modalContent.style.position = 'absolute';
      const modalWidth = modalContent.offsetWidth;
      let left = rect.left + (rect.width / 2) - (modalWidth / 2);
      if (left < 10) left = 10;
      if (left + modalWidth > window.innerWidth - 10) left = window.innerWidth - modalWidth - 10;
      modalContent.style.left = `${left}px`;
      if (rect.top > window.innerHeight / 2) {
        modalContent.style.top = 'auto'; modalContent.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      } else {
        modalContent.style.bottom = 'auto'; modalContent.style.top = (rect.bottom + 10) + 'px';
      }
    }
  }
};
