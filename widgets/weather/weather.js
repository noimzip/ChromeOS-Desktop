/**
 * Soul Widgets Manager - Weather Widget
 */

'use strict';

(function() {
  const weatherTemp = document.getElementById('weather_temp');
  const weatherIcon = document.getElementById('weather_icon');

  /**
   * 天気情報を更新する (現在はモック)
   */
  function updateWeather() {
    // スクリーンショットに合わせて10度に設定
    const temp = 10;
    if (weatherTemp) {
      weatherTemp.textContent = `${temp}°`;
    }
    
    // アイコンはデフォルトでcloudy.svgを使用 (HTMLに記述済み)
  }

  // 初期表示
  updateWeather();

  // 30分ごとに更新 (モックなのであまり意味はないが構造として)
  setInterval(updateWeather, 30 * 60 * 1000);
})();
