/**
 * Soul Widgets Manager - Data Manager Module
 * Handles export/import of settings and widget data
 */

'use strict';

window.DataManager = {
  /**
   * すべての設定データをエクスポートする
   */
  async exportData() {
    try {
      // 1. localStorage データを収集
      const localData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localData[key] = localStorage.getItem(key);
      }

      // 2. メインプロセスの設定を取得
      let systemSettings = {};
      if (window.electronAPI && window.electronAPI.getAllSystemSettings) {
        systemSettings = await window.electronAPI.getAllSystemSettings();
      }

      // 3. データを統合
      const exportBundle = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        localData: localData,
        systemSettings: systemSettings
      };

      // 4. ファイルに保存
      if (window.electronAPI && window.electronAPI.saveSettingsToFile) {
        const result = await window.electronAPI.saveSettingsToFile(exportBundle);
        if (result.success) {
          const lang = localStorage.getItem('language') || 'ja';
          const msg = window.i18n ? window.i18n.t('export_success') : 'Settings exported successfully.';
          if (window.UIUtils && window.UIUtils.showAlertDialog) {
            await window.UIUtils.showAlertDialog(msg);
          } else {
            alert(msg);
          }
        }
      }
    } catch (e) {
      console.error('Failed to export data:', e);
    }
  },

  /**
   * 設定データをインポートする
   */
  async importData() {
    try {
      if (!window.electronAPI || !window.electronAPI.loadSettingsFromFile) return;

      // 1. ファイルを選択して読み込み
      const result = await window.electronAPI.loadSettingsFromFile();
      if (result.canceled || !result.data) return;

      const bundle = result.data;

      // 基本的なバリデーション
      if (!bundle.localData || !bundle.systemSettings) {
        throw new Error('Invalid settings file format');
      }

      // 2. 確認ダイアログを表示
      const confirmMsg = window.i18n ? window.i18n.t('import_confirm') : 'Import settings and restart the app?';
      let confirmed = false;
      if (window.UIUtils && window.UIUtils.showConfirmDialog) {
        confirmed = await window.UIUtils.showConfirmDialog(confirmMsg);
      } else {
        confirmed = confirm(confirmMsg);
      }

      if (!confirmed) return;

      // 3. localStorage を更新
      // 一旦クリアするか、上書きするか。安全のため一旦クリアしてから適用。
      // ただし、完全にクリアすると language なども消えるので注意。
      localStorage.clear();
      for (const key in bundle.localData) {
        localStorage.setItem(key, bundle.localData[key]);
      }

      // 4. メインプロセスの設定を更新
      if (window.electronAPI.importSystemSettings) {
        await window.electronAPI.importSystemSettings(bundle.systemSettings);
      }

      // 5. アプリを再起動
      if (window.electronAPI.restartApp) {
        await window.electronAPI.restartApp();
      } else {
        location.reload();
      }

    } catch (e) {
      console.error('Failed to import data:', e);
      const msg = window.i18n ? window.i18n.t('import_failed') : 'Import failed.';
      if (window.UIUtils && window.UIUtils.showAlertDialog) {
        await window.UIUtils.showAlertDialog(`${msg}\n${e.message}`);
      } else {
        alert(`${msg}\n${e.message}`);
      }
    }
  },

  /**
   * UIイベントの初期化
   */
  initUI() {
    const exportBtn = document.getElementById('export_settings_btn');
    const importBtn = document.getElementById('import_settings_btn');

    if (exportBtn) {
      exportBtn.onclick = () => this.exportData();
    }

    if (importBtn) {
      importBtn.onclick = () => this.importData();
    }
  }
};
