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

  const fetchLocationWeather = async (realLocationName, virtualLocationName = '') => {
    if (!realLocationName) {
      themeStore.showToast('请输入真实地名', 'error');
      return null;
    }

    themeStore.showLoading();
    try {
      // 1. Geocoding
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(realLocationName)}&format=json&limit=1&accept-language=zh`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(nominatimUrl)}`;
      const geoResponse = await fetch(proxyUrl);
      if (!geoResponse.ok) throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
      
      const proxyData = await geoResponse.json();
      const geoData = JSON.parse(proxyData.contents);
      if (!geoData || geoData.length === 0) {
        throw new Error('找不到该位置');
      }

      const result = geoData[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const city = result.display_name.split(',')[0] || realLocationName;
      const nameParts = result.display_name.split(',');
      const country = nameParts[nameParts.length - 1]?.trim() || '';

      // 2. Get Weather
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error(`Weather API failed: ${weatherResponse.statusText}`);
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
      themeStore.showToast(`获取信息失败: ${error.message}`, 'error');
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
