<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  homeData: {
    type: Object,
    required: true
  },
  currentDate: {
    type: String,
    required: true
  },
  weatherText: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['show-source-select', 'save-home-data', 'update:homeData'])

const showSourceSelect = (type) => {
  emit('show-source-select', type)
}

const saveHomeData = () => {
  emit('save-home-data')
}
</script>

<template>
  <div class="section-top" id="topComponent" :style="homeData.bg ? { backgroundImage: `url('${homeData.bg}')` } : {}">
    <!-- 背景触发器 -->
    <div class="section-top-bg-trigger" @click="showSourceSelect('bg')"></div>
    <!-- 磨砂遮罩 -->
    <div class="glass-mask"></div>
    
    <!-- 头像 -->
    <div 
      class="profile-avatar" 
      id="homeAvatar" 
      @click.stop="showSourceSelect('avatar')"
      :style="homeData.avatar ? { backgroundImage: `url('${homeData.avatar}')`, backgroundColor: 'transparent' } : {}"
    ></div>
    
    <!-- 自定义文本 -->
    <input 
      type="text" 
      class="custom-text-input" 
      :value="homeData.text"
      @input="$emit('update:homeData', { ...homeData, text: $event.target.value })"
      :placeholder="t('homeScreen.inputPlaceholder')" 
      @blur="saveHomeData"
    >
    
    <!-- 底部小组件 (日期/天气) -->
    <div class="widgets-container">
      <div class="mini-widget-capsule">
        <span>{{ currentDate }}</span>
      </div>
      <div class="mini-widget-capsule">
        <span>{{ weatherText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-top {
    flex: 1.3;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 20px;
    position: relative;
    overflow: hidden;
    background-size: cover;
    background-position: center;
    transition: background-image 0.3s ease;
}

.section-top-bg-trigger {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0;
    cursor: pointer;
}

.glass-mask {
    position: absolute;
    top: 60%;
    left: 0;
    width: 100%;
    height: 50%;
    background: rgba(236, 236, 236, 0.1);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border-top: none;
    z-index: 1;
    pointer-events: none;
    border-radius: 0 0 20px 20px;
}

.glass-mask::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.40;
    border-radius: 0 0 20px 20px;
    pointer-events: none;
}

.profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 0px solid rgba(255,255,255,0.9);
    background-color: var(--bg-white);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    z-index: 2;
    position: absolute;
    top: 35%;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    transition: transform 0.2s;
}

.profile-avatar:active { transform: translateX(-50%) scale(0.95); }

.custom-text-input {
    background: transparent;
    border: none;
    color: var(--text-darkest);
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    width: 90%;
    outline: none;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    z-index: 2;
    font-family: inherit;
    padding: 5px;
    border-radius: 8px;
    transition: background 0.2s;
    position: absolute;
    top: 75%;
    left: 50%;
    transform: translateX(-50%);
}

.custom-text-input:focus {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: none;
}

.custom-text-input::placeholder {
    color: rgba(255,255,255,0.7);
}

.widgets-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0 10px;
    z-index: 2;
    position: absolute;
    bottom: 3px;
    left: 0;
}

.mini-widget-capsule {
    background: transparent;
    padding: 6px 12px;
    border-radius: 20px;
    border: none;
    color: var(--text-darkest);
    font-size: 10px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    cursor: pointer;
}
</style>
