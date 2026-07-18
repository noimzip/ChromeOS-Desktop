/**
 * Soul Widgets Manager - Google Calendar Widget
 */

'use strict';

const googleCalendarWidget = document.getElementById('google_calendar_widget');
const googleCalendarIframe = document.getElementById('google_calendar_iframe');
const googleCalendarSetupPrompt = document.getElementById('google_calendar_setup_prompt');
const googleCalendarSettingsBtn = document.getElementById('google_calendar_settings_btn');
const googleCalendarSettingsModal = document.getElementById('google_calendar_settings_modal_overlay');
const googleCalendarUrlInput = document.getElementById('google_calendar_url_input');
const googleCalendarRefreshBtn = document.getElementById('google_calendar_refresh_btn');
const googleCalendarModeSelect = document.getElementById('google_calendar_mode_select');

/**
 * Google Calendarウィジェットを更新
 */
function updateGoogleCalendarWidget() {
  const calendarUrl = localStorage.getItem(LS_KEYS.GOOGLE_CALENDAR_URL);

  if (calendarUrl) {
    if (window.SecurityManager && !window.SecurityManager.isUrlAllowed(calendarUrl)) {
      if (googleCalendarSetupPrompt) googleCalendarSetupPrompt.style.display = 'flex';
      if (googleCalendarIframe) googleCalendarIframe.style.display = 'none';
      if (googleCalendarIframe) googleCalendarIframe.src = 'about:blank';
      return;
    }
    if (googleCalendarIframe && googleCalendarIframe.src !== calendarUrl) {
      googleCalendarIframe.src = calendarUrl;
    }
    if (googleCalendarSetupPrompt) googleCalendarSetupPrompt.style.display = 'none';
    if (googleCalendarIframe) googleCalendarIframe.style.display = 'block';
  } else {
    if (googleCalendarIframe) googleCalendarIframe.src = 'about:blank';
    if (googleCalendarSetupPrompt) googleCalendarSetupPrompt.style.display = 'flex';
    if (googleCalendarIframe) googleCalendarIframe.style.display = 'none';
  }
}

// 更新ボタンのイベント
if (googleCalendarRefreshBtn) {
  googleCalendarRefreshBtn.onpointerdown = (e) => e.stopPropagation();
  googleCalendarRefreshBtn.onclick = (e) => {
    e.stopPropagation();
    if (googleCalendarIframe && googleCalendarIframe.src && googleCalendarIframe.src !== 'about:blank') {
      // srcを再代入してリロード
      const currentSrc = googleCalendarIframe.src;
      googleCalendarIframe.src = 'about:blank';
      setTimeout(() => { googleCalendarIframe.src = currentSrc; }, 10);
    }
  };
}

// 設定ボタンのイベント
if (googleCalendarSettingsBtn) {
  googleCalendarSettingsBtn.onpointerdown = (e) => {
    e.stopPropagation();
  };
  googleCalendarSettingsBtn.onclick = (e) => {
    e.stopPropagation();
    if (typeof closeAllModals === 'function') closeAllModals();
    const url = localStorage.getItem(LS_KEYS.GOOGLE_CALENDAR_URL) || '';
    if (googleCalendarUrlInput) googleCalendarUrlInput.value = url;
    
    // 現在のモードを検出してセレクトボックスに反映
    let mode = 'MONTH';
    if (url.includes('mode=WEEK')) mode = 'WEEK';
    else if (url.includes('mode=AGENDA')) mode = 'AGENDA';
    if (googleCalendarModeSelect) window.setSelectValue(googleCalendarModeSelect, mode);
    
    if (googleCalendarSettingsModal) googleCalendarSettingsModal.style.display = 'flex';
  };
}

// 設定モーダルのイベント
document.getElementById('close_google_calendar_settings_modal')?.addEventListener('click', () => {
  if (googleCalendarSettingsModal) googleCalendarSettingsModal.style.display = 'none';
});

document.getElementById('save_google_calendar_settings')?.addEventListener('click', () => {
  let url = googleCalendarUrlInput?.value?.trim() || '';
  if (window.SecurityManager) {
    url = window.SecurityManager.sanitizeUrlInput(url);
  }
  
  // ユーザーが<iframe...>全体を貼り付けた場合、srcを抽出する
  if (url.startsWith('<iframe')) {
    const match = url.match(/src="([^"]+)"/);
    url = (match && match[1]) ? match[1].replace(/&amp;/g, '&') : '';
  }

  if (url) {
    if (window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
      if (window.UIUtils) {
        window.UIUtils.showAlertDialog(i18n.t('blocked_url'));
      }
      return;
    }
    // 表示モードをURLに適用
    const mode = googleCalendarModeSelect ? googleCalendarModeSelect.value : 'MONTH';
    // 既存のmodeパラメータを削除
    url = url.replace(/([?&])mode=[^&]*&?/, '$1').replace(/&$/, '').replace(/\?$/, '');
    // 新しいmodeパラメータを追加
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}mode=${mode}`;

    localStorage.setItem(LS_KEYS.GOOGLE_CALENDAR_URL, url);
  } else {
    localStorage.removeItem(LS_KEYS.GOOGLE_CALENDAR_URL);
  }
  if (googleCalendarSettingsModal) googleCalendarSettingsModal.style.display = 'none';
  updateGoogleCalendarWidget();
});

// Googleログインボタン
document.getElementById('google_login_btn')?.addEventListener('click', () => {
  if (window.electronAPI && window.electronAPI.openGoogleLogin) {
    window.electronAPI.openGoogleLogin();
  }
});

// 初期化時にカレンダーウィジェットを更新
setTimeout(updateGoogleCalendarWidget, 1000);
