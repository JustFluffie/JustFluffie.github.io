<script setup>
import { useBatteryStore } from '@/stores/batteryStore';
import { useThemeStore } from '@/stores/themeStore';

const batteryStore = useBatteryStore();
const themeStore = useThemeStore();
</script>

<template>
  <div class="status-bar" v-if="themeStore.showStatusBar">
    <span class="time">{{ batteryStore.currentTime }}</span>
    <div class="notch"></div>
    <div class="icons" @click="batteryStore.checkBatteryApi" style="cursor: pointer;">
      <span class="battery-level" style="font-size: 12px; font-weight: 600;">{{ batteryStore.level }}%</span>
      <!-- 这里的SVG可以被一个更动态的电池组件替换，但暂时保留原样 -->
      <svg class="svg-icon" style="width:20px;height:20px;" viewBox="0 0 24 24">
        <rect x="2" y="6" width="18" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
        <line x1="23" y1="11" x2="23" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
        <rect x="4" y="8" :width="14 * (batteryStore.level / 100)" height="8" rx="1" ry="1" fill="currentColor"></rect>
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* 样式已在 src/assets/css/layout/PhoneSimulator.css 中定义 */
.notch {
    position: absolute;
    top: -8px; /* 调整以适应在组件内的位置 */
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 22px;
    background: #1a1a1a;
    border-radius: 0 0 14px 14px;
    z-index: -1; /* 确保在时间和图标下方 */
}
</style>
