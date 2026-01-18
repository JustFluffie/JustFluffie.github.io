import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWeather } from '@/composables/useWeather';

export const useWeatherStore = defineStore('weather', () => {
  // 从 localStorage 加载状态
  const savedWeather = localStorage.getItem('homeScreenWeather');
  const homeScreenWeather = ref(savedWeather ? JSON.parse(savedWeather) : {
    city: '点击获取',
    temperature: '--',
    weatherDescription: '未知'
  });

  const { fetchLocationWeather } = useWeather();

  // Action: 更新主屏幕天气
  const updateHomeScreenWeather = async (locationName) => {
    const data = await fetchLocationWeather(locationName);
    if (data) {
      homeScreenWeather.value = {
        city: data.city,
        temperature: Math.round(data.temperature),
        weatherDescription: data.weatherDescription,
        lastUpdated: data.lastUpdated
      };
      // 保存到 localStorage
      localStorage.setItem('homeScreenWeather', JSON.stringify(homeScreenWeather.value));
    }
  };

  // 应用启动时，如果超过1小时未更新，则尝试自动更新
  const autoUpdateWeather = () => {
    const lastUpdated = homeScreenWeather.value.lastUpdated ? new Date(homeScreenWeather.value.lastUpdated) : null;
    if (lastUpdated) {
      const hoursDiff = (new Date() - lastUpdated) / (1000 * 60 * 60);
      if (hoursDiff > 1) {
        // 假设我们保存了上次的真实地名用于自动更新
        const lastLocation = localStorage.getItem('lastKnownLocation');
        if (lastLocation) {
          updateHomeScreenWeather(lastLocation);
        }
      }
    }
  };

  return {
    homeScreenWeather,
    updateHomeScreenWeather,
    autoUpdateWeather
  };
});
