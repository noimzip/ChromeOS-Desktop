/**
 * Soul Widgets Manager - UI Utilities
 */

'use strict';

window.UIUtils = {
  sanitizeHtml(input) {
    if (typeof input !== 'string') return '';
    const template = document.createElement('template');
    template.innerHTML = input;

    const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'SPAN', 'DIV', 'A', 'UL', 'OL', 'LI']);
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      if (!allowedTags.has(node.tagName)) {
        node.replaceWith(document.createTextNode(node.textContent || ''));
        return;
      }
      [...node.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          node.removeAttribute(attr.name);
          return;
        }
        if (node.tagName === 'A' && name === 'href') {
          try {
            const url = new URL(attr.value, window.location.href);
            if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
              node.removeAttribute(attr.name);
            }
          } catch {
            node.removeAttribute(attr.name);
          }
          return;
        }
        if (name !== 'href' && name !== 'class') {
          node.removeAttribute(attr.name);
        }
      });
    });

    return template.innerHTML;
  },
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
      dialogContent.innerHTML = window.UIUtils.sanitizeHtml(message);
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
      dialogContent.innerHTML = window.UIUtils.sanitizeHtml(message);
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
  },

  /**
   * 画像からドミナントカラー（主要な色）を抽出する
   */
  getDominantColor(imageSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);
        const { data } = ctx.getImageData(0, 0, 64, 64);
        
        const colorCounts = {};
        let maxCount = 0;
        let dominantColor = null;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          if (a < 128) continue;
          
          const q = 20;
          const rQ = Math.round(r / q) * q, gQ = Math.round(g / q) * q, bQ = Math.round(b / q) * q;
          const key = `${rQ},${gQ},${bQ}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
          
          if (colorCounts[key] > maxCount) {
            maxCount = colorCounts[key];
            dominantColor = { r: rQ, g: gQ, b: bQ };
          }
        }
        
        if (dominantColor) {
          const toHex = c => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
          resolve(`#${toHex(dominantColor.r)}${toHex(dominantColor.g)}${toHex(dominantColor.b)}`);
        } else {
          resolve('#4285f4');
        }
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }
};
