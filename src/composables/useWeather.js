import { useThemeStore } from '@/stores/themeStore';

const weatherCodes = {
  0: '晴朗', 1: '大部晴朗', 2: '多云', 3: '阴天', 45: '雾', 48: '霜雾',
  51: '小毛毛雨', 53: '中等毛毛雨', 55: '大毛毛雨', 56: '小冰冻毛毛雨', 57: '大冰冻毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 66: '小冻雨', 67: '大冻雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
  80: '小阵雨', 81: '中阵雨', 82: '大阵雨',
  85: '小雪阵', 86: '大雪阵',
  95: '雷暴', 96: '带小冰雹的雷暴', 99: '带大冰雹的雷暴'
};

export function useWeather() {
  const themeStore = useThemeStore();

  // 带超时的 fetch 函数
  const fetchWithTimeout = async (url, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      throw error;
    }
  };

  // 重试函数
  const fetchWithRetry = async (url, retries = 2, timeout = 10000) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fetchWithTimeout(url, timeout);
      } catch (error) {
        if (i === retries) throw error;
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // silentError: 是否静默错误（不显示 toast）
  const fetchLocationWeather = async (realLocationName, virtualLocationName = '', showLoading = false, silentError = false) => {
    if (!realLocationName) {
      if (!silentError) {
        themeStore.showToast('请输入真实地名', 'error');
      }
      return null;
    }

    // 只在明确要求时才显示加载遮罩
    if (showLoading) {
      themeStore.showLoading();
    }
    
    try {
      // 1. Geocoding (使用 Open-Meteo Geocoding API)
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(realLocationName)}&count=1&language=zh&format=json`;
      
      let geoResponse;
      try {
        geoResponse = await fetchWithRetry(geocodingUrl);
      } catch (error) {
        if (error.message.includes('超时')) {
          throw new Error('网络连接超时，请检查网络设置');
        }
        throw new Error('无法连接到天气服务，请检查网络连接');
      }
      
      if (!geoResponse.ok) {
        throw new Error(`地理位置查询失败 (${geoResponse.status})`);
      }
      
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('找不到该位置，请检查地名是否正确');
      }

      const result = geoData.results[0];
      const lat = result.latitude;
      const lon = result.longitude;
      const city = result.name || realLocationName;
      const country = result.country || '';

      // 2. Get Weather
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;
      
      let weatherResponse;
      try {
        weatherResponse = await fetchWithRetry(weatherUrl);
      } catch (error) {
        if (error.message.includes('超时')) {
          throw new Error('天气数据获取超时，请稍后重试');
        }
        throw new Error('无法获取天气数据，请检查网络连接');
      }
      
      if (!weatherResponse.ok) {
        throw new Error(`天气数据获取失败 (${weatherResponse.status})`);
      }
      
      const weatherData = await weatherResponse.json();
      
      const { current, timezone } = weatherData;
      const weatherDescription = weatherCodes[current.weather_code] || '未知天气';
      
      // 3. Format local time
      const localTime = new Date().toLocaleString("en-US", { timeZone: timezone });
      const formattedTime = new Date(localTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

      // 4. Generate display strings
      const displayLocation = virtualLocationName || realLocationName;
      const weatherInfo = `${weatherDescription}，气温 ${current.temperature_2m}°C，湿度 ${current.relative_humidity_2m}%，风速 ${Math.round(current.wind_speed_10m)} km/h`;
      
      const promptText = `【环境信息】\n位置：${displayLocation}\n当地时间：${formattedTime}\n天气：${weatherInfo}`;
      const shortDisplayText = `${city}, ${country} (${timezone})`;

      // 5. Return structured data
      return {
        real: realLocationName,
        virtual: virtualLocationName,
        display: promptText,
        shortDisplay: shortDisplayText,
        city: city,
        country: country,
        lat: lat,
        lon: lon,
        timezone: timezone,
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        weatherDescription: weatherDescription,
        lastWeather: weatherInfo,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to fetch location weather:', error);
      if (!silentError) {
        themeStore.showToast(`获取信息失败: ${error.message}`, 'error');
      }
      return null;
    } finally {
      themeStore.hideLoading();
    }
  };

  return {
    fetchLocationWeather,
    weatherCodes
  };
}
