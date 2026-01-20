<script setup>
// ==========================================
// 模块导入
// ==========================================
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeatherStore } from '@/stores/weatherStore'
// import Modal from '@/components/common/Modal.vue' // 注意：如果没用到可以去掉，或者保留备用

// ==========================================
// Props & Emits 定义
// ==========================================
const props = defineProps({
  homeData: {
    type: Object,
    required: true,
    default: () => ({ text: '' }) // 建议加上默认值，防止父组件传空对象
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

// ==========================================
// 初始化与状态管理
// ==========================================
const { t } = useI18n()
const weatherStore = useWeatherStore()

const showLocationModal = ref(false)
const locationInput = ref('')

const inputValue = computed({
  get: () => props.homeData?.text || '', 
  set: (val) => emit('update:homeData', { ...props.homeData, text: val })
})
const inputLangClass = computed(() => {
  const text = inputValue.value;
  if (!text) return 'lang-zh'; 
  // 韩文
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) { return 'lang-kr'; }
  // 日文
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) { return 'lang-ja'; }
  // 中文
  if (/[\u4e00-\u9fa5]/.test(text)) { return 'lang-zh'; }
  // 英文/数字/符号
  return 'lang-en';
})

// ==========================================
// 事件处理方法
// ==========================================
/* 显示资源选择器 */
const showSourceSelect = (type) => {
  emit('show-source-select', type)
}
/* 保存主页数据 */
const saveHomeData = () => {
  emit('save-home-data')
}
/* 处理天气组件点击事件 */
const handleWeatherClick = () => {
  locationInput.value = localStorage.getItem('lastKnownLocation') || '';
  showLocationModal.value = true;
}
/* 确认并更新地点 */
const confirmLocation = () => {
  const location = locationInput.value.trim();
  if (location) {
    weatherStore.updateHomeScreenWeather(location);
    localStorage.setItem('lastKnownLocation', location);
  }
  showLocationModal.value = false;
}
</script>

<template>
  <!-- ==========================================
       顶部区域容器
       ========================================== -->
  <div class="section-top" id="topComponent" :style="homeData.headerBg ? { backgroundImage: `url('${homeData.headerBg}')` } : {}">
    <!-- 背景点击触发器 -->
    <div class="section-top-bg-trigger" @click="showSourceSelect('headerBg')"></div>
    
    <!-- 磨砂玻璃遮罩 -->
    <div class="glass-mask"></div>

    <!-- 内部内容容器 (固定大小，用于锁定布局) -->
    <div class="header-inner-container">
      <!-- ==========================================
           用户头像
           ========================================== -->
      <div 
        class="profile-avatar" 
        id="homeAvatar" 
        @click.stop="showSourceSelect('avatar')"
        :style="homeData.avatar ? { backgroundImage: `url('${homeData.avatar}')`, backgroundColor: 'transparent' } : {}"
      ></div>
      
      <!-- ==========================================
           自定义文本输入框
           ========================================== -->
      <input 
        type="text" 
        class="custom-text-input" 
        :class="inputLangClass"
        v-model="inputValue"
        :placeholder="t('homeScreen.inputPlaceholder')" 
        @blur="saveHomeData"
      >
      
      <!-- ==========================================
           底部小组件 (日期/天气)
           ========================================== -->
      <div class="widgets-container">
        <div class="mini-widget-capsule">
          <span>{{ currentDate }}</span>
        </div>
        <div class="mini-widget-capsule" @click="handleWeatherClick">
          <span>{{ weatherText }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ==========================================
       地点输入弹窗
       ========================================== -->
  <Modal v-model:visible="showLocationModal" :title="t('homeScreen.enterLocation')">
    <input 
      type="text" 
      class="base-input" 
      v-model="locationInput" 
      :placeholder="t('homeScreen.enterLocation')"
      @keyup.enter="confirmLocation"
    >
    <template #footer>
      <button class="modal-btn cancel" @click="showLocationModal = false">{{ t('cancel') }}</button>
      <button class="modal-btn confirm" @click="confirmLocation">{{ t('confirm') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
/* ==========================================
   顶部容器样式
   ========================================== */
.section-top {
    height: 100%;
    width: 100%;
    background: rgb(255, 255, 255);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    position: relative;
    overflow: hidden;
    background-size: cover;
    background-position: center;
    transition: background-image 0.3s ease;
}

/* ==========================================
   背景与遮罩
   ========================================== */
.section-top-bg-trigger {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0;
    cursor: pointer;
}

.glass-mask {
    position: absolute;
    top: 58%;
    left: 0;
    width: 100%;
    height: 50%;
    background: rgba(250, 252, 255, 0.1);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border-top: none;
    z-index: 1;
    pointer-events: none;
    border-radius: 0 0 0.83em 0.83em; /* 20px / 24px */
}

.glass-mask::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.25;
    border-radius: 0 0 0.83em 0.83em; /* 20px / 24px */
    pointer-events: none;
}

.header-inner-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10em;  /* 固定宽度 */
    height: 10em; /* 固定高度 */
    z-index: 2;
    font-size: 1.5em; /* 继承父级字体大小并放大，作为新的内部基准 (24/16=1.5) */
    /* background: rgba(0, 255, 0, 0.1); */ /* 调试辅助 */
}

/* ==========================================
   头像样式
   ========================================== */
.profile-avatar {
    width: 3.5em;
    height: 3.5em;
    border-radius: 50%;
    background-color: var(--bg-white);
    background-size: cover;
    background-position: center;
    box-shadow: 0 0.33em 0.83em rgba(0,0,0,0.15);
    position: absolute;
    top: 56%; /* 相对于内部容器定位 */
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    transition: transform 0.2s;
}

.profile-avatar:active { transform: translate(-50%, -50%) scale(0.95); }

/* ==========================================
   自定义文本输入框样式
   ========================================== */
.custom-text-input {
    background: transparent;
    border: none;
    color: var(--home-text-color);
    font-size: 0.6em;
    font-weight: 500;
    text-align: center;
    width: 100%;
    outline: none;
    text-shadow: 0 0.04em 0.04em rgba(0,0,0,0.3);
    font-family: inherit;
    padding: 0.2em;
    border-radius: 0.33em;
    transition: background 0.2s;
    position: absolute;
    top: 73%; /* 相对于内部容器定位 */
    left: 50%;
    transform: translateX(-50%);
}

.custom-text-input:focus {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: none;
}

.custom-text-input::placeholder {
    color: var(--home-text-color);
}

/* --- 语言特定样式 --- */
/* 英文 */
.custom-text-input.lang-en {
    font-family: Segoe UI, serif; font-size: 0.6em; font-style: italic; top: 73.2% }

/* 中文 */
.custom-text-input.lang-zh {
    font-family: inherit;  font-size: 0.5em; font-style: normal; top: 74% }

/* 日文 */
.custom-text-input.lang-ja {
    font-family: 'Kiwi Maru', serif; font-size: 0.55em; font-weight: 450; font-style: normal; text-shadow:  0 1px 1px rgba(0,0,0,0.2); }

/* 韩文 */
.custom-text-input.lang-kr {
    font-family: 'Gaegu', cursive; font-size: 0.72em; font-weight: 600; font-style: normal; text-shadow:  0 1px 1px rgba(0,0,0,0.15); }

/* ==========================================
   小组件容器样式
   ========================================== */
.widgets-container {
    display: flex;
    justify-content: space-between;
    width: 136.5%;
    position: absolute;
    bottom: 0.6em; /* 相对于内部容器定位 */
    left: -18%;
}

.mini-widget-capsule {
    background: transparent;
    padding: 0.25em 0.33em; /* 6px 8px */
    border-radius: 0.83em; /* 20px */
    border: none;
    color: var(--home-text-color, var(--text-darkest));
    font-size: 0.45em;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 0.04em 0.04em rgba(0,0,0,0.2); /* 1px */
    cursor: pointer;
}
</style>
