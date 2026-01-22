<script setup>
// ==========================================
// 模块导入
// ==========================================
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import localforage from 'localforage'

// Store
import { useThemeStore } from '@/stores/themeStore'
import { useWeatherStore } from '@/stores/weatherStore'

// 组件
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import DockBar from './components/DockBar.vue'
import HomeScreen2 from './HomeScreen2.vue'
import WidgetContainer from './components/WidgetContainer.vue'

// ==========================================
// 初始化与状态管理
// ==========================================
const { t } = useI18n()
const router = useRouter()
const themeStore = useThemeStore()
const weatherStore = useWeatherStore()
const { themePresets, currentThemePreset, appIcons, showFrame } = storeToRefs(themeStore)
const { homeScreenWeather } = storeToRefs(weatherStore)

// 页面控制状态
const currentPage = ref(1)
const touchStartX = ref(0)
const touchEndX = ref(0)

// 弹窗与图片选择状态
const showImageModal = ref(false)
const currentSourceType = ref('') // 当前正在修改图片的类型 (bg, avatar, cdCover, etc.)

// 主页核心数据
let homeData = reactive({
  headerBg: '',
  avatar: '',
  text: '',
  musicTexts: ['虚拟', '- 陈粒', '摇摇晃晃情绪却满溢', '你是我未曾拥有无法捕捉的亲昵', '我却有你的吻你的魂你的心'],
  cdCover: '',
  photo1: '',
  photo2: ''
})

// 时间与天气状态
const currentDate = ref('--/--/--  --')

// ==========================================
// 计算属性 (Computed)
// ==========================================
// 应用列表配置
// [提示] 修改下方的 leftApps 和 rightApps 数组来调整 App 的位置
// leftApps 显示在左侧（Header下方），rightApps 显示在右侧（PhotoWall下方）
const leftApps = computed(() => [
  { id: 'spy', label: '', action: () => {} },
  { id: 'check', label: '', action: () => {} }
])

const rightApps = computed(() => [
  { id: 'chat', label: t('homeScreen.apps.chat'), route: '/chat' },
  { id: 'calendar', label: t('homeScreen.apps.calendar'), route: '/calendar' }
])

const dockApps = computed(() => [
  { id: 'api', label: t('homeScreen.apps.apiSettings'), route: '/api' },
  { id: 'theme', label: t('homeScreen.apps.theme'), route: '/theme' },
  { id: 'worldbook', label: t('homeScreen.apps.worldbook'), route: '/world-book' },
  { id: 'preset', label: t('homeScreen.apps.preset'), route: '/preset' }
])

// 弹窗标题
const modalTitle = computed(() => {
  const titleMap = {
    headerBg: '设置顶部背景',
    avatar: t('homeScreen.modalTitles.setAvatar'),
    cdCover: t('homeScreen.modalTitles.setCdCover'),
    photo1: t('homeScreen.modalTitles.setPhoto1'),
    photo2: t('homeScreen.modalTitles.setPhoto2'),
  };
  return titleMap[currentSourceType.value] || t('homeScreen.modalTitles.default');
});

// 天气文本
const weatherText = computed(() => {
  const { city, temperature, weatherDescription } = homeScreenWeather.value;
  if (city && temperature !== '--') {
    return `${city} ${temperature}°C ${weatherDescription}`;
  }
  return city; // '点击获取'
});

// 壁纸
const wallpaper = computed(() => {
  const preset = themePresets.value[currentThemePreset.value];
  return preset?.bg ? `url(${preset.bg})` : '';
});

// ==========================================
// 方法定义 (Methods)
// ==========================================

// --- 数据加载与保存 ---
const loadHomeData = async () => {
  try {
    const saved = await localforage.getItem('aiPhoneHomeData')
    if (saved) {
      Object.assign(homeData, { ...homeData, ...saved })
    }
  } catch (e) {
    console.error('Failed to load home data from localforage', e)
  }
  updateTime()
}

const saveHomeData = async () => {
  try {
    // 使用 JSON.parse(JSON.stringify()) 来获取纯净的 JS 对象，避免存储 Proxy
    await localforage.setItem('aiPhoneHomeData', JSON.parse(JSON.stringify(homeData)))
  } catch (e) {
    console.error('Failed to save home data to localforage', e)
  }
}

// --- 工具方法 ---
const updateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const weekDays = [
    t('homeScreen.weekdays.sun'), t('homeScreen.weekdays.mon'), t('homeScreen.weekdays.tue'),
    t('homeScreen.weekdays.wed'), t('homeScreen.weekdays.thu'), t('homeScreen.weekdays.fri'),
    t('homeScreen.weekdays.sat')
  ]
  const weekDay = weekDays[now.getDay()]
  currentDate.value = `${year}/${month}/${day}  ${weekDay}`
}

// --- 导航与交互 ---
const goToPage = (page) => {
  currentPage.value = page
}

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
  // 重置结束点，以区分点击和滑动
  touchEndX.value = 0;
}

const handleTouchMove = (e) => {
  touchEndX.value = e.touches[0].clientX;
}

const handleTouchEnd = () => {
  // 如果 touchEndX 仍为0，说明没有发生滑动（touchmove），直接返回
  if (touchEndX.value === 0) {
    touchStartX.value = 0;
    return;
  }

  const distance = touchStartX.value - touchEndX.value;

  if (distance > 50) {
    // 向左滑动
    if (currentPage.value < 2) {
      currentPage.value++;
    }
  } else if (distance < -50) {
    // 向右滑动
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  }
  // 重置值
  touchStartX.value = 0;
  touchEndX.value = 0;
}

const handleAppClick = (app) => {
  if (app.route) {
    router.push(app.route)
  } else if (app.action) {
    app.action()
  }
}

// --- 图片处理 ---
const showSourceSelect = (type) => {
  currentSourceType.value = type;
  showImageModal.value = true;
}

const handleImageSelected = (imageData) => {
  if (imageData && imageData.content) {
    updateHomeImage(imageData.content);
  }
}

const updateHomeImage = async (url) => {
  if (homeData.hasOwnProperty(currentSourceType.value)) {
    homeData[currentSourceType.value] = url
    await saveHomeData()
  }
}

// ==========================================
// 生命周期与监听 (Lifecycle & Watch)
// ==========================================
onMounted(() => {
  loadHomeData()
  themeStore.initTheme()
  weatherStore.autoUpdateWeather()
})
</script>

<template>
<div 
  class="home-screen" 
  id="homeScreen" 
  :style="{ backgroundImage: wallpaper }"
  @touchstart="handleTouchStart" 
  @touchmove="handleTouchMove" 
  @touchend="handleTouchEnd"
>
    
    <!-- ==========================================
         页面容器
         ========================================== -->
    <div class="pages-container">
      <div class="pages-wrapper" :class="{ 'page-2': currentPage === 2 }">
        
        <!-- ========== 第一页 ========== -->
        <div class="page page-1" @click.self="$emit('background-click')">
          
          <!-- 桌面小组件容器 -->
          <WidgetContainer
            :homeData="homeData"
            :current-date="currentDate"
            :weather-text="weatherText"
            :left-apps="leftApps"
            :right-apps="rightApps"
            :app-icons="appIcons"
            :show-frame="showFrame"
            @update:homeData="newData => Object.assign(homeData, newData)"
            @show-source-select="showSourceSelect"
            @save-home-data="saveHomeData"
            @app-click="handleAppClick"
          />
        </div>
        
        
        <!-- ========== 第二页 ========== -->
        <div class="page page-2"> 
          <HomeScreen2 
            :homeData="homeData"
            @update:homeData="newData => Object.assign(homeData, newData)"
            @show-source-select="showSourceSelect"
            @save-home-data="saveHomeData"
            style="max-width: 100%; height: 100%;" 
          />
        </div>  

      </div>
    </div>

    <!-- ==========================================
         页面指示器
         ========================================== -->
    <div class="page-indicator">
      <div class="dot" :class="{ active: currentPage === 1 }" @click="goToPage(1)"></div>
      <div class="dot" :class="{ active: currentPage === 2 }" @click="goToPage(2)"></div>
    </div>

    <!-- ==========================================
         Dock 栏
         ========================================== -->
    <DockBar
      :apps="dockApps"
      :app-icons="appIcons"
      @app-click="handleAppClick"
    />

    <!-- ==========================================
         辅助组件
         ========================================== -->
    <!-- 图片上传弹窗 -->
<ImageUploadModal
      v-model:visible="showImageModal"
      type="basic"
      :biz-type="currentSourceType"
      :title="modalTitle"
      @upload-complete="handleImageSelected"
    />

  </div>
</template>

<style>
/* 注意这里没有 scoped，或者是用 :root */
:root {
  --global-icon-size: 7.3vh;
  --global-icon-font-size: 3.2vh;
  --global-icon-radius: 1.6vh;
}
</style>

<style scoped>
/* ==========================================
   1. 主屏幕布局 (Layout)
   ========================================== */
.home-screen {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    transition: transform 0.3s ease, opacity 0.3s ease;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: var(--bg-white);
    color: var(--home-text-color, var(--text-darkest));
    overflow: hidden; 
}

.home-screen.hidden {
    transform: scale(0.9);
    opacity: 0;
    pointer-events: none;
}

.pages-container {
    height: 100%;
    /* --- 核心修改 1：顶部避让摄像头 --- */
    /* S23 Ultra 顶部有挖孔，状态栏高度约 40-50px */
    /* 使用 env() 自动适配，同时设置最小值 50px 保证不贴顶 */
    padding-top: max(30px, env(safe-area-inset-top) + 20px);
    /* --- 核心修改 2：底部避让 Dock 栏 --- */
    /* Dock 高约 90px + 底部间距 30px = 120px */
    /* 我们留 150px 确保最后一排图标不会被 Dock 挡住 */
    padding-bottom: 150px;
    overflow: hidden;
    position: relative;
    box-sizing: border-box; /* 确保 padding 不会撑破 height: 100% */
}

.pages-wrapper {
    display: flex;
    flex-direction: row; /* 强制横向 */
    /* 核心：靠左对齐！ */
    /* 如果这里是 center 或 space-between，你的第一页就会跑偏 */
    justify-content: flex-start; 
    align-items: flex-start;
    width: 200%;
    height: 100%;
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pages-wrapper.page-2 {
    transform: translateX(-50%);
}

.page {
    /* 再次确认：不许缩放，死死锁定 50% */
    flex: 0 0 50%; 
    width: 50%;
    height: 100%;
    /* 页面内部布局 */
    display: flex;
    flex-direction: column;
    align-items: center; /* 让 Widget 居中 */
    padding: 0 15px;
    box-sizing: border-box;
}



/* ==========================================
   2. 页面指示器 (Page Indicator)
   ========================================== */
.page-indicator {
    position: absolute;
    /* --- 核心修改 3：位置调整 --- */
    /* 放在 Dock 栏正上方。Dock 大约占据底部 120px 空间 */
    bottom: 108px; 
    left: 50%;
    transform: translateX(-50%);
    /* 把它显示出来！原来是 none */
    display: flex; 
    gap: 10px; /* 稍微拉开点间距 */
    z-index: 50;
    /* 增加一个半透明胶囊背景，让白点在浅色壁纸上也能看清 */
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0);
    border-radius: 20px;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5); /* 默认半透明白 */
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dot.active {
    background: #fff; /* 激活纯白 */
    width: 6px; /* S23 屏幕大，指示条可以稍微长一点 */
    border-radius: 4px;
    box-shadow: 0 0 8px rgba(255,255,255,0.6); /* 加点发光效果 */
}

</style>
