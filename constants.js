/**
 * Soul Widgets Manager - Constants
 */

'use strict';

// ビルトインアイコン (index.html にある `appicon-...`) の既定 URL マップ
const builtinIconUrls = {
  'appicon-chrome': 'chrome://newtab',
  'appicon-files': 'chrome://file-manager',
  'appicon-settings': 'chrome://os-settings'
};

// localStorageで使用するキーを一元管理
const LS_KEYS = {
  WIDGET_POSITIONS: 'widgetPositions',
  CUSTOM_APPS: 'customApps',
  LINUX_APPS: 'linuxApps',
  FILE_SHORTCUTS: 'fileShortcuts',
  FOLDER_SHORTCUTS: 'folderShortcuts',
  APP_FOLDERS: 'appFolders',
  LANGUAGE: 'language',
  GRID_MODE_ENABLED: 'gridModeEnabled',
  ICON_SHAPE: 'iconShape',
  COLOR_SCHEME: 'colorScheme',
  CUSTOM_COLOR: 'customColor',
  SHOW_SETTINGS_FAB: 'showSettingsFab',
  BLUR_EFFECT_ENABLED: 'blurEffectEnabled',
  DARK_MODE_ENABLED: 'darkModeEnabled',
  DARK_MODE_SETTING: 'darkModeSetting',
  GITHUB_USERNAME: 'githubUsername',
  GOOGLE_CALENDAR_URL: 'googleCalendarUrl',
  WIDGET_VISIBILITY: 'widgetVisibility',
  WIDGET_SIZE_PREFIX: 'widgetSize:',
};