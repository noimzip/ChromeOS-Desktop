/**
 * Soul Widgets Manager - Widget Loader
 * Handles dynamic loading of widget resources (JS/CSS)
 */

'use strict';

window.WidgetLoader = {
  // ウィジェットのリソース定義
  registry: {
    'widget-clock': {
      js: './widgets/clock.js',
      css: './widgets/clock.css'
    },
    'media_player_widget': {
      js: './widgets/media_player.js',
      css: './widgets/media_player.css'
    },
    'github_contribution_widget': {
      js: './widgets/github_widget.js',
      css: './widgets/github_widget.css'
    },
    'google_calendar_widget': {
      js: './widgets/google_calendar.js',
      css: './widgets/google_calendar.css'
    }
  },

  // 読み込み済みリソースのキャッシュ
  loaded: new Set(),

  /**
   * 指定されたウィジェットIDのリソースを読み込む
   * @param {string} widgetId 
   * @returns {Promise<void>}
   */
  async load(widgetId) {
    if (this.loaded.has(widgetId)) {
      return; // 既に読み込み済み
    }

    const config = this.registry[widgetId];
    if (!config) {
      console.warn(`Widget configuration not found for: ${widgetId}`);
      return;
    }

    console.log(`[WidgetLoader] Loading resources for ${widgetId}...`);

    const promises = [];

    // CSSの読み込み
    if (config.css) {
      promises.push(new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = config.css;
        link.onload = resolve;
        link.onerror = () => {
          console.error(`Failed to load CSS for ${widgetId}`);
          // CSS失敗は致命的ではないのでresolveする
          resolve(); 
        };
        document.head.appendChild(link);
      }));
    }

    // JSの読み込み
    if (config.js) {
      promises.push(new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = config.js;
        script.defer = true;
        script.onload = resolve;
        script.onerror = (e) => {
          console.error(`Failed to load JS for ${widgetId}`, e);
          reject(e);
        };
        document.body.appendChild(script);
      }));
    }

    try {
      await Promise.all(promises);
      this.loaded.add(widgetId);
      console.log(`[WidgetLoader] Successfully loaded ${widgetId}`);
    } catch (e) {
      console.error(`[WidgetLoader] Error loading ${widgetId}`, e);
    }
  }
};
