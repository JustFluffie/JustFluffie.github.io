import { defineStore } from 'pinia';
import { ref, onUnmounted } from 'vue';
import { useThemeStore } from './themeStore'; // 引入 themeStore 以使用 toast

export const useBatteryStore = defineStore('battery', () => {
  const level = ref(98);
  const isCharging = ref(false);
  const currentTime = ref('9:41');
  let timer = null;

  const updateTime = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    currentTime.value = `${h}:${m}`;
  };

  const initTime = () => {
    if (timer) clearInterval(timer);
    updateTime();
    timer = setInterval(updateTime, 1000);
  };

  const initBattery = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        const updateStatus = () => {
          isCharging.value = battery.charging;
          level.value = Math.round(battery.level * 100);
        };

        updateStatus();

        battery.addEventListener('chargingchange', updateStatus);
        battery.addEventListener('levelchange', updateStatus);
      } else {
        console.warn('浏览器不支持电池状态 API，将使用模拟值。');
      }
    } catch (error) {
      console.error('获取电池状态失败:', error);
    }
  };

  const initialize = () => {
    initTime();
    initBattery();
  };

  const checkBatteryApi = async () => {
    const themeStore = useThemeStore();
    if ('getBattery' in navigator) {
      try {
        await navigator.getBattery();
        themeStore.showToast('电池API连接成功', 'success');
        // 重新初始化以确保状态更新
        initBattery();
      } catch (err) {
        themeStore.showToast('电池API连接失败', 'error');
      }
    } else {
      themeStore.showToast('浏览器不支持电池API', 'info');
    }
  };

  onUnmounted(() => {
    if (timer) clearInterval(timer);
    // 事件监听器会自动被浏览器垃圾回收，无需手动移除
  });

  return {
    level,
    isCharging,
    currentTime,
    initialize,
    checkBatteryApi, // 导出新方法
  };
});
