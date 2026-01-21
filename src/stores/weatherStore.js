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

  // 加载自动更新失败计数状态
  const savedAutoRetryState = localStorage.getItem('weatherAutoRetryState');
  const autoRetryState = ref(savedAutoRetryState ? JSON.parse(savedAutoRetryState) : {
    failCount: 0,        // 当天失败次数
    lastFailDate: null,  // 最后失败日期（用于重置每日计数）
    hasShownError: false // 是否已显示过错误提示
  });

  const { fetchLocationWeather } = useWeather();

  // 获取今天的日期字符串 (YYYY-MM-DD)
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 检查是否应该重置每日计数
  const checkAndResetDailyCount = () => {
    const today = getTodayDateString();
    if (autoRetryState.value.lastFailDate !== today) {
      // 新的一天，重置计数
      autoRetryState.value = {
        failCount: 0,
        lastFailDate: null,
        hasShownError: false
      };
      saveAutoRetryState();
    }
  };

  // 保存自动重试状态
  const saveAutoRetryState = () => {
    localStorage.setItem('weatherAutoRetryState', JSON.stringify(autoRetryState.value));
  };

  // 记录自动更新失败
  const recordAutoUpdateFailure = () => {
    const today = getTodayDateString();
    autoRetryState.value.failCount++;
    autoRetryState.value.lastFailDate = today;
    saveAutoRetryState();
  };

  // 检查是否可以自动重试
  const canAutoRetry = () => {
    checkAndResetDailyCount();
    return autoRetryState.value.failCount < 3;
  };

  // 检查是否已显示过错误
  const hasShownErrorToday = () => {
    checkAndResetDailyCount();
    return autoRetryState.value.hasShownError;
  };

  // 标记已显示错误
  const markErrorShown = () => {
    autoRetryState.value.hasShownError = true;
    saveAutoRetryState();
  };

  // 重置自动重试状态（用户手动点击时调用）
  const resetAutoRetryState = () => {
    autoRetryState.value = {
      failCount: 0,
      lastFailDate: null,
      hasShownError: false
    };
    saveAutoRetryState();
  };

  // Action: 更新主屏幕天气
  // isManual: 是否为用户手动触发
  const updateHomeScreenWeather = async (locationName, showLoading = false, isManual = false) => {
    // 如果是手动触发，重置自动重试状态
    if (isManual) {
      resetAutoRetryState();
    }

    // 检查是否应该静默错误：
    // - 手动触发时不静默（显示错误）
    // - 自动触发且已经显示过错误时静默
    const shouldSilentError = !isManual && hasShownErrorToday();

    // 默认后台加载，不显示遮罩
    const data = await fetchLocationWeather(locationName, '', showLoading, shouldSilentError);
    if (data) {
      homeScreenWeather.value = {
        city: data.city,
        temperature: Math.round(data.temperature),
        weatherDescription: data.weatherDescription,
        lastUpdated: data.lastUpdated
      };
      // 保存到 localStorage
      localStorage.setItem('homeScreenWeather', JSON.stringify(homeScreenWeather.value));
      // 保存最后使用的位置，用于自动更新
      localStorage.setItem('lastKnownLocation', locationName);
      // 成功后重置失败计数
      if (!isManual) {
        resetAutoRetryState();
      }
      return true;
    } else {
      // 自动更新失败时记录
      if (!isManual) {
        recordAutoUpdateFailure();
        // 如果这次显示了错误（即之前没显示过），标记为已显示
        if (!shouldSilentError) {
          markErrorShown();
        }
      }
      return false;
    }
  };

  // 应用启动时，如果超过1小时未更新，则尝试自动更新
  const autoUpdateWeather = () => {
    // 检查是否还可以自动重试
    if (!canAutoRetry()) {
      console.log('今日自动获取天气已达3次失败上限，等待用户手动操作');
      return;
    }

    const lastUpdated = homeScreenWeather.value.lastUpdated ? new Date(homeScreenWeather.value.lastUpdated) : null;
    if (lastUpdated) {
      const hoursDiff = (new Date() - lastUpdated) / (1000 * 60 * 60);
      if (hoursDiff > 1) {
        // 假设我们保存了上次的真实地名用于自动更新
        const lastLocation = localStorage.getItem('lastKnownLocation');
        if (lastLocation) {
          updateHomeScreenWeather(lastLocation, false, false);
        }
      }
    }
  };

  return {
    homeScreenWeather,
    updateHomeScreenWeather,
    autoUpdateWeather,
    resetAutoRetryState,
    canAutoRetry
  };
});
