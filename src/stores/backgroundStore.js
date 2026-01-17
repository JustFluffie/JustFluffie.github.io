import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useBackgroundStore = defineStore('background', () => {
  // 状态：全局后台活动总开关，默认为 false
  const globalBackgroundActivity = ref(false);

  // --- 主动消息配置 (主要) ---
  const globalProactiveInterval = ref(5); // 检测间隔 (分钟)
  const globalProactiveCooldown = ref(30); // 冷却时间 (分钟)
  const globalProactiveDailyLimit = ref(10); // 每日上限 (条)
  const globalTriggerMode = ref('always'); // 'always' | 'idle'
  const globalProactiveIdleTime = ref(15); // 挂机时间 (分钟)
  const globalProactiveScope = ref(['all']); // 应用范围：['all'] 或 [charId1, charId2, ...]

  // --- 动态互动配置 (次要) ---
  const globalMomentsInterval = ref(60); // 检测间隔 (分钟)
  const globalMomentsDailyLimit = ref(5); // 每日上限 (次)

  // Action：切换全局后台活动的状态
  function toggleGlobalBackgroundActivity() {
    globalBackgroundActivity.value = !globalBackgroundActivity.value;
  }

  return {
    globalBackgroundActivity,
    toggleGlobalBackgroundActivity,
    
    // 主动消息
    globalProactiveInterval,
    globalProactiveCooldown,
    globalProactiveDailyLimit,
    globalTriggerMode,
    globalProactiveIdleTime,
    globalProactiveScope,

    // 动态互动
    globalMomentsInterval,
    globalMomentsDailyLimit
  };
});
