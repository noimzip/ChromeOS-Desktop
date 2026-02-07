/**
 * Soul Widgets Manager - UI Utilities
 */

'use strict';

window.UIUtils = {
  /**
   * アラートダイアログを表示
   */
  async showAlertDialog(message, title = '', options = {}) {
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
  },

  /**
   * 確認ダイアログを表示
   */
  async showConfirmDialog(message, title = '', options = {}) {
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
  },

  /**
   * 画像を指定サイズにリサイズ
   */
  resizeImage(dataUrl, targetWidth, targetHeight) {
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
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
  },

  /**
   * 色のコントラスト（黒か白）を判定
   */
  getContrastColor(r, g, b) {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  },

  /**
   * HEX色をRGBに変換
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
};
