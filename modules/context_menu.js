/**
 * Soul Widgets Manager - Context Menu Manager
 */

'use strict';

window.ContextMenuManager = {
  currentEditingApp: null,
  currentEditingIcon: null,
  currentEditingWidget: null,
  currentContextAppType: null,

  /**
   * コンテキストメニューを表示
   */
  showContextMenu(e, iconEl, appType) {
    const menu = document.getElementById('app_context_menu');
    if (!menu) return;

    this.currentEditingIcon = iconEl;
    this.currentContextAppType = appType;
    
    // アイコンに保存されているデータを取得
    this.currentEditingApp = iconEl._appData || null;

    menu.style.display = 'block';
    
    // 位置調整
    let x = e.clientX;
    let y = e.clientY;
    
    // 画面端での回り込み
    const menuWidth = menu.offsetWidth || 160;
    const menuHeight = menu.offsetHeight || 100;
    
    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // 削除メニューの制御（ビルトインは削除不可などのロジックがあればここで）
    const deleteItem = document.getElementById('context_delete');
    if (deleteItem) {
      if (appType === 'builtin') {
        deleteItem.style.display = 'none';
      } else {
        deleteItem.style.display = 'flex';
      }
    }

    // イベントリスナーを一度だけ設定するためにグローバルなクリックで閉じる処理
    const closeMenu = () => {
      menu.style.display = 'none';
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('contextmenu', closeMenu);
    };
    
    setTimeout(() => {
      window.addEventListener('click', closeMenu);
      window.addEventListener('contextmenu', closeMenu);
    }, 10);
  },

  /**
   * ウィジェット用コンテキストメニューを表示
   */
  showWidgetContextMenu(e, widgetEl) {
    const menu = document.getElementById('widget_context_menu');
    if (!menu) return;

    this.currentEditingWidget = widgetEl;

    menu.style.display = 'block';
    
    let x = e.clientX;
    let y = e.clientY;
    
    const menuWidth = menu.offsetWidth || 160;
    const menuHeight = menu.offsetHeight || 50;
    
    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const closeMenu = () => {
      menu.style.display = 'none';
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('contextmenu', closeMenu);
    };
    
    setTimeout(() => {
      window.addEventListener('click', closeMenu);
      window.addEventListener('contextmenu', closeMenu);
    }, 10);
  },

  /**
   * メニューを非表示にする
   */
  hideContextMenu() {
    const appMenu = document.getElementById('app_context_menu');
    const widgetMenu = document.getElementById('widget_context_menu');
    const desktopMenu = document.getElementById('desktop_context_menu');
    if (appMenu) appMenu.style.display = 'none';
    if (widgetMenu) widgetMenu.style.display = 'none';
    if (desktopMenu) desktopMenu.style.display = 'none';
  }
};
