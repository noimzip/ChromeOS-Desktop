/**
 * Soul Widgets Manager - Weather Widget
 */

'use strict';

(function() {
  const weatherTemp = document.getElementById('weather_temp');
  const weatherIcon = document.getElementById('weather_icon');

  // WMO Weather interpretation codes (WW)
  const weatherMap = {
    0: { day: 'clear_day.svg', night: 'clear_night.svg' },
    1: { day: 'mostly_clear_day.svg', night: 'mostly_clear_night.svg' },
    2: { day: 'partly_cloudy_day.svg', night: 'partly_cloudy_night.svg' },
    3: { day: 'cloudy.svg', night: 'cloudy.svg' },
    45: { day: 'haze_fog_dust_smoke.svg', night: 'haze_fog_dust_smoke.svg' },
    48: { day: 'haze_fog_dust_smoke.svg', night: 'haze_fog_dust_smoke.svg' },
    51: { day: 'drizzle.svg', night: 'drizzle.svg' },
    53: { day: 'drizzle.svg', night: 'drizzle.svg' },
    55: { day: 'drizzle.svg', night: 'drizzle.svg' },
    61: { 
      day: { light: 'sunny_with_rain_light.svg', dark: 'sunny_with_rain_dark.svg' }, 
      night: { light: 'cloudy_with_rain_light.svg', dark: 'cloudy_with_rain_dark.svg' } 
    },
    63: { day: 'showers_rain.svg', night: 'showers_rain.svg' },
    65: { day: 'heavy_rain.svg', night: 'heavy_rain.svg' },
    71: { 
      day: { light: 'sunny_with_snow_light.svg', dark: 'sunny_with_snow_dark.svg' }, 
      night: { light: 'cloudy_with_snow_light.svg', dark: 'cloudy_with_snow_dark.svg' } 
    },
    73: { day: 'showers_snow.svg', night: 'showers_snow.svg' },
    75: { day: 'heavy_snow.svg', night: 'heavy_snow.svg' },
    80: { day: 'scattered_showers_day.svg', night: 'scattered_showers_night.svg' },
    81: { day: 'showers_rain.svg', night: 'showers_rain.svg' },
    82: { day: 'heavy_rain.svg', night: 'heavy_rain.svg' },
    95: { day: 'isolated_scattered_thunderstorms_day.svg', night: 'isolated_scattered_thunderstorms_night.svg' },
    96: { day: 'strong_thunderstorms.svg', night: 'strong_thunderstorms.svg' },
    99: { day: 'strong_thunderstorms.svg', night: 'strong_thunderstorms.svg' },
  };

  let lastWeatherData = null;

  /**
   * 天気形状を適用する
   */
  window.applyWeatherShape = function(shape) {
    const weatherBg = document.querySelector('.weather-background');
    if (!weatherBg) return;

    if (shape === 'square' || shape === 'circle') {
      if (weatherBg.tagName === 'M3E-SHAPE' || weatherBg.classList.contains('custom-shape-wrapper')) {
        const surface = weatherBg.querySelector('.weather-surface');
        if (surface) {
          const newDiv = document.createElement('div');
          newDiv.className = 'weather-background';
          if (shape === 'circle') newDiv.style.borderRadius = '50%';
          newDiv.appendChild(surface);
          weatherBg.replaceWith(newDiv);
        }
      }
      return;
    }

    const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
    if (customShapes[shape]) {
      const surface = weatherBg.querySelector('.weather-surface');
      if (!surface) return;

      if (weatherBg.classList.contains('custom-shape-wrapper')) {
        weatherBg.style.clipPath = customShapes[shape];
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'weather-background custom-shape-wrapper';
        wrapper.style.clipPath = customShapes[shape];
        weatherBg.replaceWith(wrapper);
        wrapper.appendChild(surface);
      }
      return;
    }

    if (weatherBg.classList.contains('custom-shape-wrapper')) {
      const surface = weatherBg.querySelector('.weather-surface');
      if (surface) {
        const wrapper = document.createElement('m3e-shape');
        wrapper.className = 'weather-background';
        wrapper.setAttribute('name', shape);
        weatherBg.replaceWith(wrapper);
        wrapper.appendChild(surface);
      }
      return;
    }

    if (weatherBg.tagName === 'M3E-SHAPE') {
      weatherBg.setAttribute('name', shape);
    } else {
      const surface = weatherBg.querySelector('.weather-surface');
      if (surface) {
        const wrapper = document.createElement('m3e-shape');
        wrapper.className = 'weather-background';
        wrapper.setAttribute('name', shape);
        weatherBg.replaceWith(wrapper);
        wrapper.appendChild(surface);
      }
    }
  };

  /**
   * 現在の表示を更新する (APIリクエストは行わない)
   */
  function refreshDisplay() {
    if (!lastWeatherData) return;
    
    const current = lastWeatherData.current_weather;
    const isDay = current.is_day === 1;
    const isDarkMode = document.body.classList.contains('dark-mode');
    const theme = isDarkMode ? 'dark' : 'light';
    
    if (weatherTemp) {
      weatherTemp.textContent = `${Math.round(current.temperature)}°`;
    }
    
    if (weatherIcon && weatherMap[current.weathercode]) {
      let iconName = isDay ? weatherMap[current.weathercode].day : weatherMap[current.weathercode].night;
      
      // テーマ分岐がある場合
      if (typeof iconName === 'object') {
        iconName = iconName[theme];
      }
      
      weatherIcon.src = `./assets/weather/${iconName}`;
    }
  }

  /**
   * 実際の天気情報を取得する
   */
  async function updateWeather() {
    try {
      const mode = localStorage.getItem('weather_location_mode') || 'auto';
      const provider = localStorage.getItem('weather_provider') || 'open-meteo';
      let lat, lon;

      if (mode === 'auto') {
        lat = localStorage.getItem('weather_lat') || 35.6895;
        lon = localStorage.getItem('weather_lon') || 139.6917;
      } else {
        lat = localStorage.getItem('weather_lat_manual') || 35.6895;
        lon = localStorage.getItem('weather_lon_manual') || 139.6917;
      }
      
      if (provider === 'open-meteo') {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (!response.ok) throw new Error('Open-Meteo fetch failed');
        lastWeatherData = await response.json();
      } else if (provider === 'nws') {
        // NWS requires two steps: get grid point then get forecast
        const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
        if (!pointsRes.ok) throw new Error('NWS points fetch failed');
        const pointsData = await pointsRes.json();
        
        const forecastRes = await fetch(pointsData.properties.forecastHourly);
        if (!forecastRes.ok) throw new Error('NWS forecast fetch failed');
        const forecastData = await forecastRes.json();
        
        const current = forecastData.properties.periods[0];
        // Open-Meteo形式に変換して共通のrefreshDisplayを使えるようにする
        lastWeatherData = {
          current_weather: {
            temperature: current.temperature,
            weathercode: mapNWSToWMO(current.shortForecast, current.isDaytime),
            is_day: current.isDaytime ? 1 : 0
          }
        };
      }
      
      refreshDisplay();
    } catch (error) {
      console.error('Failed to update weather:', error);
    }
  }

  /**
   * NWSのテキスト予報をWMOコードに簡易マッピング
   */
  function mapNWSToWMO(forecast, isDay) {
    const f = forecast.toLowerCase();
    if (f.includes('sunny') || f.includes('clear')) return 0;
    if (f.includes('mostly sunny') || f.includes('mostly clear')) return 1;
    if (f.includes('partly')) return 2;
    if (f.includes('cloudy') || f.includes('overcast')) return 3;
    if (f.includes('fog')) return 45;
    if (f.includes('drizzle')) return 51;
    if (f.includes('rain')) return 63;
    if (f.includes('snow')) return 73;
    if (f.includes('thunderstorm')) return 95;
    return 3; // Default to cloudy
  }

  // テーマ変更を監視して表示を更新
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        refreshDisplay();
      }
    });
  });
  observer.observe(document.body, { attributes: true });

  let locationIntervalId = null;

  /**
   * 位置情報の更新タイマーを設定する
   */
  window.setupWeatherLocationTimer = function() {
    if (locationIntervalId) {
      clearInterval(locationIntervalId);
      locationIntervalId = null;
    }

    const mode = localStorage.getItem('weather_location_mode') || 'auto';
    if (mode !== 'auto') return;

    if (window.electronAPI && window.electronAPI.getLocation) {
      const intervalMinutes = parseInt(localStorage.getItem('weather_location_interval') || '60');
      
      // 最初の一回を実行
      window.electronAPI.getLocation();

      if (intervalMinutes > 0) {
        locationIntervalId = setInterval(() => {
          window.electronAPI.getLocation();
        }, intervalMinutes * 60 * 1000);
      }
    }
  };

  // Electron環境かつ拡張機能連携が有効な場合、リスナーを設定
  if (window.electronAPI && window.electronAPI.getLocation && window.electronAPI.onLocationUpdate) {
    window.electronAPI.onLocationUpdate((data) => {
      const mode = localStorage.getItem('weather_location_mode') || 'auto';
      if (mode !== 'auto') return;

      console.log('Location updated from extension:', data);
      localStorage.setItem('weather_lat', data.latitude);
      localStorage.setItem('weather_lon', data.longitude);
      
      // 設定画面が開いている場合は入力値を更新
      const latInput = document.getElementById('weather_lat_input');
      const lonInput = document.getElementById('weather_lon_input');
      if (latInput) latInput.value = data.latitude;
      if (lonInput) lonInput.value = data.longitude;
      
      updateWeather();
    });
    
    window.setupWeatherLocationTimer();
  }

  // 初期化時に形状を適用
  const savedShape = localStorage.getItem('weather_shape') || 'pill';
  window.applyWeatherShape(savedShape);

  // 初期表示
  updateWeather();

  // 30分ごとに更新
  setInterval(updateWeather, 30 * 60 * 1000);

  // 他のモジュールから呼び出せるように公開
  window.updateWeather = updateWeather;
})();
