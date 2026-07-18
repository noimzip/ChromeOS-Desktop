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
   * アプリ用コンテキストメニューを表示
   */
  showContextMenu(e, iconEl, appType) {
    const menu = document.getElementById('app_context_menu');
    const anchor = document.getElementById('context_menu_anchor');
    if (!menu || !anchor) return;

    window.ContextMenuManager.currentEditingIcon = iconEl;
    window.ContextMenuManager.currentContextAppType = appType;
    window.ContextMenuManager.currentEditingApp = iconEl._appData || null;

    // 削除メニューの制御
    const deleteItem = document.getElementById('context_delete');
    if (deleteItem) {
      if (appType === 'builtin') {
        deleteItem.style.display = 'none';
      } else {
        deleteItem.style.display = 'inline-block';
      }
    }

    this.hideContextMenu(); // 他のメニューを閉じる

    // アンカー位置を設定してメニューを表示
    anchor.style.left = e.clientX + 'px';
    anchor.style.top = e.clientY + 'px';
    menu.show(anchor);
  },

  /**
   * ウィジェット用コンテキストメニューを表示
   */
  showWidgetContextMenu(e, widgetEl) {
    const menu = document.getElementById('widget_context_menu');
    const anchor = document.getElementById('context_menu_anchor');
    if (!menu || !anchor) return;

    window.ContextMenuManager.currentEditingWidget = widgetEl;

    // 設定項目があるウィジェットのみ表示
    const settingsItem = document.getElementById('widget_context_settings');
    if (settingsItem) {
      const hasSettings = ['widget-clock', 'media_player_widget', 'weather_widget', 'gmail_widget', 'google_calendar_widget', 'github_contribution_widget'].includes(widgetEl.id);
      settingsItem.style.display = hasSettings ? 'inline-block' : 'none';
    }

    this.hideContextMenu(); // 他のメニューを閉じる

    anchor.style.left = e.clientX + 'px';
    anchor.style.top = e.clientY + 'px';
    menu.show(anchor);
  },

  /**
   * デスクトップ用コンテキストメニューを表示
   */
  showDesktopContextMenu(e) {
    const menu = document.getElementById('desktop_context_menu');
    const anchor = document.getElementById('context_menu_anchor');
    if (!menu || !anchor) return;

    this.hideContextMenu(); // 他のメニューを閉じる

    anchor.style.left = e.clientX + 'px';
    anchor.style.top = e.clientY + 'px';
    menu.show(anchor);
  },

  /**
   * メニューを非表示にする
   */
  hideContextMenu() {
    const appMenu = document.getElementById('app_context_menu');
    const widgetMenu = document.getElementById('widget_context_menu');
    const desktopMenu = document.getElementById('desktop_context_menu');
    if (appMenu && typeof appMenu.hide === 'function') appMenu.hide();
    if (widgetMenu && typeof widgetMenu.hide === 'function') widgetMenu.hide();
    if (desktopMenu && typeof desktopMenu.hide === 'function') desktopMenu.hide();
  }
};