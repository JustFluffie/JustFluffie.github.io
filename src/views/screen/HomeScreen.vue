<script setup>
// ==========================================
// 1. 导入模块 (Imports)
// ==========================================
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import localforage from 'localforage'

// Store
import { useThemeStore } from '@/stores/themeStore'

// 组件
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import HomeHeader from './components/HomeHeader.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import PhotoWall from './components/PhotoWall.vue'
import AppGrid from './components/AppGrid.vue'
import DockBar from './components/DockBar.vue'
import HomeScreen2 from './HomeScreen2.vue'

// ==========================================
// 2. 初始化与状态 (Init & State)
// ==========================================
const { t } = useI18n()
const router = useRouter()
const themeStore = useThemeStore()
const { themePresets, currentThemePreset, appIcons } = storeToRefs(themeStore)

// --- 页面控制状态 ---
const currentPage = ref(1)
const touchStartX = ref(0)
const touchEndX = ref(0)

// --- 弹窗与图片选择状态 ---
const showImageModal = ref(false)
const currentSourceType = ref('') // 当前正在修改图片的类型 (bg, avatar, cdCover, etc.)
const fileInput = ref(null) // (保留引用，虽然主要使用 Modal)

// --- 主页核心数据 ---
let homeData = reactive({
  headerBg: '',
  avatar: '',
  text: t('homeScreen.greeting'),
  musicTexts: ['虚拟', '- 陈粒', '摇摇晃晃情绪却满溢', '你是我未曾拥有无法捕捉的亲昵', '我却有你的吻你的魂你的心'],
  cdCover: '',
  photo1: '',
  photo2: ''
})

// --- 时间与天气状态 ---
const currentDate = ref('--/--/--  --')
const weatherText = ref(t('homeScreen.defaultWeather'))

// ==========================================
// 3. 计算属性 (Computed)
// ==========================================
// 应用列表配置 (响应式)
const mainApps = computed(() => [
  { id: 'chat', label: t('homeScreen.apps.chat'), route: '/chat' },
  { id: 'calendar', label: t('homeScreen.apps.calendar'), action: () => console.log('Open Calendar') },
  { id: 'placeholder-1', label: '', action: () => {} },
  { id: 'placeholder-2', label: '', action: () => {} }
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

const wallpaper = computed(() => {
  const preset = themePresets.value[currentThemePreset.value];
  return preset?.bg ? `url(${preset.bg})` : '';
});

// ==========================================
// 4. 方法定义 (Methods)
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

// (保留旧的文件上传处理，以防万一)
const handleHomeUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    await updateHomeImage(e.target.result)
  }
  reader.readAsDataURL(file)
  event.target.value = '' // 重置 input
}

const updateHomeImage = async (url) => {
  if (homeData.hasOwnProperty(currentSourceType.value)) {
    homeData[currentSourceType.value] = url
    await saveHomeData()
  }
}

// ==========================================
// 5. 生命周期与监听 (Lifecycle & Watch)
// ==========================================
onMounted(() => {
  loadHomeData()
  updateTime()
  themeStore.initTheme()
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
    
    <!-- ==================== 页面容器 ==================== -->
    <div class="pages-container">
      <div class="pages-wrapper" :class="{ 'page-2': currentPage === 2 }">
        
        <!-- ========== 第一页 ========== -->
        <div class="page page-1">
          
          <HomeHeader
            v-model:homeData="homeData"
            :current-date="currentDate"
            :weather-text="weatherText"
            @show-source-select="showSourceSelect"
            @save-home-data="saveHomeData"
          />

          <MusicPlayer
            v-model:homeData="homeData"
            @show-source-select="showSourceSelect"
            @save-home-data="saveHomeData"
          />

          <!-- 3. 底部组件 (照片墙 & 应用网格) -->
          <div class="section-bottom">
            <PhotoWall
              :home-data="homeData"
              @show-source-select="showSourceSelect"
            />

            <AppGrid
              :apps="mainApps"
              :app-icons="appIcons"
              @app-click="handleAppClick"
            />
          </div>
        </div>
        
        <HomeScreen2 />

      </div>
    </div>

    <!-- ==================== 页面指示器 ==================== -->
    <div class="page-indicator">
      <div class="dot" :class="{ active: currentPage === 1 }" @click="goToPage(1)"></div>
      <div class="dot" :class="{ active: currentPage === 2 }" @click="goToPage(2)"></div>
    </div>

    <DockBar
      :apps="dockApps"
      :app-icons="appIcons"
      @app-click="handleAppClick"
    />

    <!-- ==================== 辅助组件 ==================== -->
    <!-- 隐藏的文件输入 (保留) -->
    <input type="file" ref="fileInput" class="hidden-input" accept="image/*" @change="handleHomeUpload">

    <!-- 图片上传弹窗 -->
    <ImageUploadModal
      v-model:visible="showImageModal"
      type="basic"
      :biz-type="currentSourceType"
      :title="modalTitle"
      @send-image="handleImageSelected"
    />

  </div>
</template>

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
    color: var(--text-darkest);
}

.home-screen.hidden {
    transform: scale(0.9);
    opacity: 0;
    pointer-events: none;
}

.pages-container {
    height: 100%;
    padding-top: 21px;
    padding-bottom: 150px;
    overflow: hidden;
    position: relative;
}

.pages-wrapper {
    display: flex;
    width: 200%;
    height: 100%;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.pages-wrapper.page-2 {
    transform: translateX(-50%);
}

.page {
    width: 50%;
    height: 100%;
    padding: 15px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.section-bottom {
    flex: 1;
    display: flex;
    gap: 15px;
}

/* ==========================================
   2. 页面指示器 (Page Indicator)
   ========================================== */
.page-indicator {
    position: absolute;
    bottom: 125px;
    left: 50%;
    transform: translateX(-50%);
    display: none;
    gap: 8px;
    z-index: 50;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
}

.dot.active {
    background: var(--text-primary);
    width: 20px;
    border-radius: 4px;
}
</style>
