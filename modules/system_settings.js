/**
 * Soul Widgets Manager - System Settings Manager
 */

'use strict';

window.SystemSettingsManager = {
  /**
   * ウィンドウ数セレクターの初期化
   */
  async initWindowCountSelector() {
    const selector = document.getElementById('window_count_selector');
    if (selector && window.electronAPI && window.electronAPI.getWindowCount) {
      try {
        const currentCount = await window.electronAPI.getWindowCount();
        selector.value = currentCount.toString();
      } catch (e) {
        console.error('Failed to get window count:', e);
      }
    }
  },

  /**
   * ディスプレイセレクターの初期化
   */
  async initDisplaySelector() {
    const selector = document.getElementById('display_selector');
    if (selector && window.electronAPI && window.electronAPI.getDisplays) {
      try {
        const displays = await window.electronAPI.getDisplays();
        const targetId = await window.electronAPI.getTargetDisplayId();
        
        selector.innerHTML = '';
        displays.forEach(display => {
          const option = document.createElement('option');
          option.value = display.id;
          option.textContent = display.label;
          selector.appendChild(option);
        });
        
        if (targetId) {
          selector.value = targetId;
        }
        
        selector.onchange = async (e) => {
          await window.electronAPI.setTargetDisplay(e.target.value);
        };
      } catch (e) {
        console.error('Failed to init display selector:', e);
      }
    }
  },

  /**
   * ウィンドウリサイズ設定の初期化
   */
  async initWindowResizableSwitch() {
    const btn = document.getElementById('toggle_window_resizable');
    if (btn && window.electronAPI && window.electronAPI.getWindowResizable) {
      try {
        const resizable = await window.electronAPI.getWindowResizable();
        if (typeof btn.selected !== 'undefined') {
          btn.selected = resizable;
        } else {
          btn.checked = resizable;
        }
        
        btn.addEventListener('change', async (e) => {
          const newState = typeof e.target.selected !== 'undefined' ? e.target.selected : e.target.checked;
          await window.electronAPI.setWindowResizable(newState);
        });
      } catch (e) {
        console.error('Failed to init window resizable switch:', e);
      }
    }
  }
};
