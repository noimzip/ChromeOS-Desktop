/**
 * Soul Widgets Manager - Media Content Script
 * Extracts media information from various music streaming sites
 */

'use strict';

// 現在のサイトを判定
const hostname = window.location.hostname;

console.log('[Soul Widgets] Content script loaded on:', hostname);

// 時間文字列を秒数に変換
function parseTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

// サイト固有のセレクター定義
const SITE_SELECTORS = {
  'www.youtube.com': {
    title: () => {
      // 動画ページのタイトル
      return document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string')?.textContent ||
             document.querySelector('.ytp-title-link')?.textContent ||
             document.querySelector('h1.title')?.textContent ||
             document.title.replace(' - YouTube', '') || '';
    },
    artist: () => {
      return document.querySelector('#owner #channel-name a')?.textContent ||
             document.querySelector('ytd-channel-name yt-formatted-string a')?.textContent ||
             document.querySelector('.ytp-title-channel-link')?.textContent || '';
    },
    artUrl: () => {
      const videoId = new URLSearchParams(window.location.search).get('v');
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
    },
    isPlaying: () => {
      const video = document.querySelector('video');
      return video ? !video.paused : false;
    },
    shuffle: () => {
      const btn = document.querySelector('.ytp-shuffle-button');
      if (!btn) return '';
      return btn.getAttribute('aria-pressed') === 'true' ? 'On' : 'Off';
    },
    loop: () => {
      const btn = document.querySelector('.ytp-repeat-button');
      if (!btn) return '';
      return btn.getAttribute('aria-pressed') === 'true' ? 'Playlist' : 'None';
    },
    controls: {
      playPause: () => {
        const video = document.querySelector('video');
        if (video) {
          video.paused ? video.play() : video.pause();
        }
      },
      next: () => document.querySelector('.ytp-next-button')?.click(),
      previous: () => document.querySelector('.ytp-prev-button')?.click(),
      shuffle: (value) => {
        const btn = document.querySelector('.ytp-shuffle-button');
        if (!btn) return;
        if (value) {
          const currentState = btn.getAttribute('aria-pressed') === 'true' ? 'On' : 'Off';
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      },
      loop: (value) => {
        // YouTubeのループ制御は複雑なため、とりあえずクリックのみ（valueがあっても無視）
        document.querySelector('.ytp-repeat-button')?.click();
      }
    }
  },
  'music.youtube.com': {
    title: () => document.querySelector('.title.ytmusic-player-bar')?.textContent || '',
    artist: () => document.querySelector('.byline.ytmusic-player-bar a')?.textContent || '',
    artUrl: () => {
      const img = document.querySelector('img.image.ytmusic-player-bar');
      return img?.src?.replace(/w\d+-h\d+/, 'w300-h300') || '';
    },
    isPlaying: () => {
      const video = document.querySelector('video');
      return video ? !video.paused : false;
    },
    shuffle: () => {
      const btn = document.querySelector('ytmusic-player-bar .shuffle');
      if (!btn) return '';
      return btn.getAttribute('aria-pressed') === 'true' ? 'On' : 'Off';
    },
    loop: () => {
      const btn = document.querySelector('ytmusic-player-bar .repeat');
      if (!btn) return '';
      const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
      if (label.includes('one') || label.includes('1') || label.includes('単曲')) return 'Track';
      if (label.includes('all') || label.includes('playlist') || label.includes('全曲')) return 'Playlist';
      return 'None';
    },
    controls: {
      playPause: () => document.querySelector('#play-pause-button')?.click(),
      next: () => document.querySelector('.next-button')?.click(),
      previous: () => document.querySelector('.previous-button')?.click(),
      shuffle: (value) => {
        const btn = document.querySelector('ytmusic-player-bar .shuffle');
        if (!btn) return;
        if (value) {
          const currentState = btn.getAttribute('aria-pressed') === 'true' ? 'On' : 'Off';
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      },
      loop: (value) => {
        const btn = document.querySelector('ytmusic-player-bar .repeat');
        if (!btn) return;
        if (value) {
          let currentState = 'None';
          const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
          if (label.includes('one') || label.includes('1') || label.includes('単曲')) currentState = 'Track';
          else if (label.includes('all') || label.includes('playlist') || label.includes('全曲')) currentState = 'Playlist';
          
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      }
    }
  },
  'open.spotify.com': {
    title: () => {
      return document.querySelector('[data-testid="context-item-link"]')?.textContent ||
             document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]')?.textContent || '';
    },
    artist: () => {
      return document.querySelector('[data-testid="context-item-info-subtitles"] a')?.textContent || '';
    },
    artUrl: () => {
      return document.querySelector('[data-testid="CoverSlotCollapsed__container"] img')?.src ||
             document.querySelector('.cover-art img')?.src || '';
    },
    currentTime: () => {
      const el = document.querySelector('[data-testid="playback-position"]');
      return el ? parseTime(el.textContent) : null;
    },
    duration: () => {
      const el = document.querySelector('[data-testid="playback-duration"]');
      return el ? parseTime(el.textContent) : null;
    },
    isPlaying: () => {
      const btn = document.querySelector('[data-testid="control-button-playpause"]');
      return btn?.getAttribute('aria-label')?.includes('Pause') || false;
    },
    shuffle: () => {
      const btn = document.querySelector('[data-testid="control-button-shuffle"]');
      return btn ? (btn.getAttribute('aria-checked') === 'true' ? 'On' : 'Off') : '';
    },
    loop: () => {
      const btn = document.querySelector('[data-testid="control-button-repeat"]');
      const val = btn?.getAttribute('aria-checked');
      if (val === 'mixed') return 'Track';
      if (val === 'true') return 'Playlist';
      return btn ? 'None' : '';
    },
    controls: {
      playPause: () => document.querySelector('[data-testid="control-button-playpause"]')?.click(),
      next: () => document.querySelector('[data-testid="control-button-skip-forward"]')?.click(),
      previous: () => document.querySelector('[data-testid="control-button-skip-back"]')?.click(),
      shuffle: (value) => {
        const btn = document.querySelector('[data-testid="control-button-shuffle"]');
        if (!btn) return;
        if (value) {
          const currentState = btn.getAttribute('aria-checked') === 'true' ? 'On' : 'Off';
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      },
      loop: (value) => {
        const btn = document.querySelector('[data-testid="control-button-repeat"]');
        if (!btn) return;
        if (value) {
          const val = btn.getAttribute('aria-checked');
          let currentState = 'None';
          if (val === 'mixed') currentState = 'Track';
          else if (val === 'true') currentState = 'Playlist';
          
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      }
    }
  },
  'soundcloud.com': {
    title: () => document.querySelector('.playbackSoundBadge__titleLink span:nth-child(2)')?.textContent || '',
    artist: () => document.querySelector('.playbackSoundBadge__lightLink')?.textContent || '',
    artUrl: () => {
      const style = document.querySelector('.playbackSoundBadge .image span')?.style?.backgroundImage;
      return style ? style.replace(/url\(["']?|["']?\)/g, '').replace('50x50', '500x500') : '';
    },
    isPlaying: () => document.querySelector('.playControl')?.classList.contains('playing') || false,
    shuffle: () => {
      const btn = document.querySelector('.shuffleControl');
      return btn ? (btn.classList.contains('m-shuffling') ? 'On' : 'Off') : '';
    },
    loop: () => {
      const btn = document.querySelector('.repeatControl');
      if (!btn) return '';
      if (btn?.classList.contains('m-one')) return 'Track';
      if (btn?.classList.contains('m-all')) return 'Playlist';
      return 'None';
    },
    controls: {
      playPause: () => document.querySelector('.playControl')?.click(),
      next: () => document.querySelector('.skipControl__next')?.click(),
      previous: () => document.querySelector('.skipControl__previous')?.click(),
      shuffle: (value) => {
        const btn = document.querySelector('.shuffleControl');
        if (!btn) return;
        if (value) {
          const currentState = btn.classList.contains('m-shuffling') ? 'On' : 'Off';
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      },
      loop: (value) => {
        const btn = document.querySelector('.repeatControl');
        if (!btn) return;
        if (value) {
          let currentState = 'None';
          if (btn.classList.contains('m-one')) currentState = 'Track';
          else if (btn.classList.contains('m-all')) currentState = 'Playlist';
          
          if (value !== currentState) btn.click();
        } else {
          btn.click();
        }
      }
    }
  }
};

// Bandcampは動的にホスト名が変わるので別処理
function isBandcamp() {
  return hostname.endsWith('.bandcamp.com') || document.querySelector('meta[property="og:site_name"][content="Bandcamp"]');
}

const BANDCAMP_SELECTORS = {
  title: () => document.querySelector('.title_link span')?.textContent || document.querySelector('.trackTitle')?.textContent || '',
  artist: () => document.querySelector('.detail_item_link')?.textContent || document.querySelector('span[itemprop="byArtist"] a')?.textContent || '',
  artUrl: () => document.querySelector('.popupImage img')?.src || document.querySelector('#tralbumArt img')?.src || '',
  isPlaying: () => document.querySelector('.playbutton')?.classList.contains('playing') || false,
  controls: {
    playPause: () => document.querySelector('.playbutton, .play-btn')?.click(),
    next: () => document.querySelector('.nextbutton, .next-btn')?.click(),
    previous: () => document.querySelector('.prevbutton, .prev-btn')?.click()
  }
};

// 現在のサイト用のセレクターを取得
function getSelectors() {
  if (isBandcamp()) return BANDCAMP_SELECTORS;
  return SITE_SELECTORS[hostname] || null;
}

// メディア情報を取得
function getMediaInfo() {
  const selectors = getSelectors();
  if (!selectors) {
    console.log('[Soul Widgets] No selectors for this site');
    return null;
  }
  
  const title = typeof selectors.title === 'function' ? selectors.title() : '';
  const artist = typeof selectors.artist === 'function' ? selectors.artist() : '';
  const artUrl = typeof selectors.artUrl === 'function' ? selectors.artUrl() : '';
  const isPlaying = typeof selectors.isPlaying === 'function' ? selectors.isPlaying() : false;
  const shuffle = typeof selectors.shuffle === 'function' ? selectors.shuffle() : '';
  const loop = typeof selectors.loop === 'function' ? selectors.loop() : '';
  
  // 再生位置と長さを取得
  let currentTime = 0;
  let duration = 0;
  
  let customCurrentTime = null;
  let customDuration = null;
  
  if (typeof selectors.currentTime === 'function') customCurrentTime = selectors.currentTime();
  if (typeof selectors.duration === 'function') customDuration = selectors.duration();

  const video = document.querySelector('video') || document.querySelector('audio');
  
  if (customCurrentTime !== null) {
    currentTime = customCurrentTime;
  } else if (video) {
    currentTime = video.currentTime || 0;
  }
  
  if (customDuration !== null) {
    duration = customDuration;
  } else if (video) {
    duration = video.duration || 0;
    if (isNaN(duration)) duration = 0;
  }
  
  // タイトルがない場合は再生中でないと判断
  if (!title) {
    return {
      status: 'Stopped',
      title: '',
      artist: '',
      album: '',
      artUrl: '',
      currentTime: 0,
      duration: 0,
      source: hostname
    };
  }
  
  const info = {
    status: isPlaying ? 'Playing' : 'Paused',
    title: title.trim(),
    artist: artist.trim(),
    album: '',
    artUrl: artUrl,
    currentTime: currentTime,
    duration: duration,
    source: hostname,
    shuffle: shuffle,
    loop: loop
  };
  
  console.log('[Soul Widgets] Media info:', info);
  return info;
}

// シーク処理
function seekTo(seconds) {
  const video = document.querySelector('video') || document.querySelector('audio');
  if (video) {
    video.currentTime = seconds;
    console.log('[Soul Widgets] Seeked to:', seconds);
    return true;
  }
  return false;
}

// メディア制御を実行
function executeControl(action, value) {
  // シーク処理
  if (action === 'seek' && value !== undefined) {
    return seekTo(value);
  }
  
  const selectors = getSelectors();
  if (!selectors || !selectors.controls) {
    console.log('[Soul Widgets] No controls available');
    return;
  }

  // アクション名のマッピング（互換性のため）
  const actionMap = {
    'play-pause': 'playPause',
    'play_pause': 'playPause',
    'PlayPause': 'playPause',
    'shuffle': 'shuffle',
    'loop': 'loop'
  };
  const mappedAction = actionMap[action] || action;
  
  console.log('[Soul Widgets] Executing control:', action, '-> mapped to:', mappedAction);
  const controlFn = selectors.controls[mappedAction];
  if (typeof controlFn === 'function') {
    controlFn(value);
    console.log('[Soul Widgets] Control executed successfully');
  } else {
    console.log('[Soul Widgets] Control function not found for:', mappedAction);
  }
}

// バックグラウンドスクリプトからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Soul Widgets] Received message:', message);
  if (message.type === 'MEDIA_CONTROL') {
    executeControl(message.action, message.value);
    sendResponse({ success: true });
  } else if (message.type === 'GET_PAGE_MEDIA_INFO') {
    const info = getMediaInfo();
    sendResponse(info);
  }
  return true;
});

// 定期的にメディア情報を送信
let lastInfoStr = '';
let updateInterval = null;
let isContextValid = true;

// コンテキストが有効かチェックする関数
function checkContextValid() {
  try {
    // chrome.runtime.id にアクセスしてエラーが出ないか確認
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

function stopUpdates() {
  isContextValid = false;
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  console.log('[Soul Widgets] Updates stopped');
}

function sendMediaInfoUpdate() {
  // すでに無効とわかっている場合は即座に終了
  if (!isContextValid) return;
  
  // 拡張機能のコンテキストが有効かチェック
  if (!checkContextValid()) {
    stopUpdates();
    return;
  }
  
  let info;
  try {
    info = getMediaInfo();
  } catch (e) {
    return;
  }
  if (!info) return;
  
  // 変更があった場合のみ送信
  const infoStr = JSON.stringify(info);
  if (infoStr !== lastInfoStr) {
    lastInfoStr = infoStr;
    
    try {
      chrome.runtime.sendMessage({
        type: 'MEDIA_INFO_UPDATE',
        data: info
      }).then(response => {
        // 成功
      }).catch(err => {
        // 拡張機能が無効になった場合は更新を停止
        stopUpdates();
      });
    } catch (err) {
      stopUpdates();
    }
  }
}

// 1秒ごとにメディア情報をチェック
updateInterval = setInterval(sendMediaInfoUpdate, 1000);

// 初回送信
setTimeout(sendMediaInfoUpdate, 500);

console.log('[Soul Widgets] Content script initialized');
