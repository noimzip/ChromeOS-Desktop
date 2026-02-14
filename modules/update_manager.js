/**
 * Soul Widgets Manager - Update Manager
 */

'use strict';

window.UpdateManager = {
  CURRENT_VERSION: '0.1', // package.jsonのバージョンと合わせる
  REPO_URL: 'https://github.com/noimzip/Soul-Widgets-Manager',
  BASE_API_URL: 'https://api.github.com/repos/noimzip/Soul-Widgets-Manager',

  /**
   * 現在のチャンネルを取得
   */
  getChannel() {
    return localStorage.getItem(LS_KEYS.UPDATE_CHANNEL) || 'stable';
  },

  /**
   * アップデートをチェック
   */
  async checkForUpdates(manual = false) {
    const channel = this.getChannel();
    console.log(`[UpdateManager] Checking for updates on ${channel} channel...`);
    
    let apiUrl = `${this.BASE_API_URL}/releases/latest`;
    if (channel === 'develop') {
      apiUrl = `${this.BASE_API_URL}/releases`;
    }

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('[UpdateManager] No releases found on GitHub.');
          return;
        }
        throw new Error('Failed to fetch from GitHub API');
      }
      
      let data = await response.json();
      
      // Develop(releases一覧)の場合は最初の要素を取得
      if (channel === 'develop' && Array.isArray(data)) {
        data = data[0];
      }

      if (!data || !data.tag_name) {
        console.warn('[UpdateManager] Invalid release data received.');
        return;
      }

      const latestVersion = data.tag_name.replace('v', '');
      console.log(`[UpdateManager] Current version: ${this.CURRENT_VERSION}, Latest version: ${latestVersion}`);
      
      if (this.isNewerVersion(this.CURRENT_VERSION, latestVersion)) {
        this.showUpdateDialog(latestVersion, data.html_url);
      } else if (manual) {
        if (window.UIUtils) {
          window.UIUtils.showAlertDialog(i18n.t('up_to_date'));
        }
      }
    } catch (error) {
      console.error('[UpdateManager] Update check failed:', error);
      if (manual && window.UIUtils) {
        window.UIUtils.showAlertDialog(i18n.t('update_check_failed'));
      }
    }
  },

  /**
   * バージョン比較 (simple semantic versioning check)
   */
  isNewerVersion(current, latest) {
    const cParts = current.split('.').map(v => parseInt(v, 10) || 0);
    const lParts = latest.split('.').map(v => parseInt(v, 10) || 0);
    
    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
      const c = cParts[i] || 0;
      const l = lParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  },

  /**
   * アップデートダイアログを表示
   */
  async showUpdateDialog(version, url) {
    const title = i18n.t('update_available');
    const msg = i18n.t('new_version_desc', { version: version });
    
    if (await window.UIUtils.showConfirmDialog(msg, title)) {
      window.open(url);
    }
  }
};
