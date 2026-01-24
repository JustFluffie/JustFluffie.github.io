<template>
  <AppLayout :title="t('charPhone.title', '查看手机')" no-padding :class="{ 'hide-back-btn': currentApp }">
    <div class="char-phone-container">
      <!-- Char的手机框架 -->
      <div class="char-phone-frame">
        <!-- 灵动岛 -->
        <div class="char-notch"></div>
        
        <div class="char-phone-screen">
          <!-- 状态栏 -->
          <div class="char-status-bar">
            <span class="time">{{ currentTime }}</span>
            <div class="icons">
              <span>5G</span>
              <div class="battery-icon"></div>
            </div>
          </div>
          
          <!-- 屏幕内容 -->
          <div class="char-content">
            <CharPhoneWidgetContainer 
              :header-data="headerData"
              :middle-data="middleData"
              :bottom-data="bottomData"
              @update:header-data="updateHeaderData"
              @update:middle-data="updateMiddleData"
              @update:bottom-data="updateBottomData"
              @app-click="handleAppClick"
            />
          </div>

          <!-- Dock栏 (消息气泡) -->
          <CharPhoneDock 
            :dock-data="dockData"
            @update:dock-data="updateDockData"
          />
          
          <!-- 应用层 -->
          <Transition name="app-fade">
            <CharDiary 
              v-if="currentApp === 'diary'" 
              @close="closeApp" 
            />
            <CharMemo 
              v-else-if="currentApp === 'memo'" 
              @close="closeApp" 
            />
            <CharSchedule 
              v-else-if="currentApp === 'schedule'" 
              @close="closeApp" 
            />
          </Transition>

          <!-- 底部横条 -->
          <div class="char-home-indicator"></div>
        </div>
        
        <!-- 侧边按钮模拟 -->
        <div class="char-btn-power"></div>
        <div class="char-btn-volume-up"></div>
        <div class="char-btn-volume-down"></div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSingleStore } from '@/stores/chat/singleStore'
import AppLayout from '@/components/common/AppLayout.vue'
import CharPhoneWidgetContainer from './components/CharPhoneWidgetContainer.vue'
import CharPhoneDock from './components/CharPhoneDock.vue'
import CharDiary from './apps/CharDiary.vue'
import CharMemo from './apps/CharMemo.vue'
import CharSchedule from './apps/CharSchedule.vue'

const { t } = useI18n()
const route = useRoute()
const singleStore = useSingleStore()

const charId = route.params.charId

// 动态时间显示
const currentTime = ref('')
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadCharPhoneData()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Widget数据管理
const headerData = ref({
  background: '',
  avatar: '',
  photos: ['', ''],
  photoTexts: ['', '']
})

const defaultMiddleApps = [
  { label: '微信', color: 'rgba(255, 255, 255, 0.9)', route: '/chat' },
  { label: '行程表', color: 'rgba(255, 255, 255, 0.9)', route: '/schedule' },
  { label: '日记', color: 'rgba(255, 255, 255, 0.9)', route: '/diary' },
  { label: '备忘录', color: 'rgba(255, 255, 255, 0.9)', route: '/memo' }
]

const middleData = ref({
  photo: '',
  apps: JSON.parse(JSON.stringify(defaultMiddleApps))
})

const defaultBottomApps = [
  { label: '购买记录', color: 'rgba(255, 255, 255, 0.9)', route: '/purchase' },
  { label: '搜索记录', color: 'rgba(255, 255, 255, 0.9)', route: '/search' },
  { label: '主题', color: 'rgba(255, 255, 255, 0.9)', route: '/theme' },
  { label: 'app1', color: 'rgba(255, 255, 255, 0.9)', route: '/app1' }
]

const bottomData = ref({
  photo: '',
  text1: '',
  text2: '',
  apps: JSON.parse(JSON.stringify(defaultBottomApps))
})

const dockData = ref({
  avatars: {
    other: '',
    mine: ''
  },
  messages: {
    other: '',
    mine: ''
  }
})

// 应用状态
const currentApp = ref(null)

// 加载保存的数据
const loadCharPhoneData = () => {
  const storageKey = `charphone_${charId}`
  const savedData = localStorage.getItem(storageKey)
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      if (parsed.header) headerData.value = { ...headerData.value, ...parsed.header }
      
      if (parsed.middle) {
        middleData.value = { ...middleData.value, ...parsed.middle }
        // 确保 apps 存在且不为空，否则使用默认值
        if (!middleData.value.apps || middleData.value.apps.length === 0 || !middleData.value.apps[0].label) {
          middleData.value.apps = JSON.parse(JSON.stringify(defaultMiddleApps))
        }
      }
      
      if (parsed.bottom) {
        bottomData.value = { ...bottomData.value, ...parsed.bottom }
        // 确保 apps 存在且不为空，否则使用默认值
        if (!bottomData.value.apps || bottomData.value.apps.length === 0 || !bottomData.value.apps[0].label) {
          bottomData.value.apps = JSON.parse(JSON.stringify(defaultBottomApps))
        }
      }
      
      if (parsed.dock) dockData.value = { ...dockData.value, ...parsed.dock }
    } catch (e) {
      console.error('Failed to load char phone data:', e)
    }
  }
}

// 保存数据
const saveCharPhoneData = () => {
  const storageKey = `charphone_${charId}`
  const dataToSave = {
    header: headerData.value,
    middle: middleData.value,
    bottom: bottomData.value,
    dock: dockData.value
  }
  localStorage.setItem(storageKey, JSON.stringify(dataToSave))
}

// 更新Header数据
const updateHeaderData = (newData) => {
  headerData.value = newData
  saveCharPhoneData()
}

// 更新Middle数据
const updateMiddleData = (newData) => {
  middleData.value = newData
  saveCharPhoneData()
}

// 更新Bottom数据
const updateBottomData = (newData) => {
  bottomData.value = newData
  saveCharPhoneData()
}

const updateDockData = (newData) => {
  dockData.value = newData
  saveCharPhoneData()
}

// 处理应用点击
const handleAppClick = (app) => {
  console.log('App clicked:', app)
  if (app.label === '日记' || app.route === '/diary') {
    currentApp.value = 'diary'
  } else if (app.label === '备忘录' || app.route === '/memo') {
    currentApp.value = 'memo'
  } else if (app.label === '行程' || app.route === '/schedule') {
    currentApp.value = 'schedule'
  }
}

const closeApp = () => {
  currentApp.value = null
}
</script>

<style scoped>
/* 覆盖 AppLayout 样式 */
:deep(.app-header) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: transparent;
  border: none;
  z-index: 20;
  pointer-events: none; /* 让点击穿透 */
}

:deep(.app-header .back-btn) {
  pointer-events: auto; /* 恢复按钮点击 */
  color: #333; /* 深色按钮适配白色背景 */
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));
  transition: opacity 0.3s ease;
}

.hide-back-btn :deep(.app-header .back-btn) {
  opacity: 0;
  pointer-events: none;
}

:deep(.app-header .title),
:deep(.app-header .action-btn) {
  display: none;
}

:deep(.app-content) {
  padding: 0 !important;
  overflow: hidden; /* 防止滚动 */
}

.char-phone-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #ffffff; /* 白色背景 */
  padding: 8px; /* 四周只留 5px */
  padding-top: 20px; /* 为用户设备状态栏留出空间 */
  overflow: hidden;
  box-sizing: border-box;
}

/* 模拟Char的手机框架 */
.char-phone-frame {
  width: 100%;
  height: 100%;
  background: #f5f5f5; /* 浅灰色外壳，更精致 */
  border-radius: 40px;
  padding: 6px; /* 更细的边框 */
  box-shadow: 
    0 10px 30px rgba(0,0,0,0.15),
    inset 0 0 2px rgba(0,0,0,0.1);
  position: relative;
  border: 1px solid #e0e0e0; /* 更细的边框 */
  box-sizing: border-box;
}

.char-phone-screen {
  width: 100%;
  height: 100%;
  background: var(--text-quaternary); /* 默认壁纸 */
  border-radius: 35px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 4px solid #202020; /* 更细的屏幕边框 */
  box-sizing: border-box;
}

/* 灵动岛 */
.char-notch {
  position: absolute;
  top: 2%;
  left: 50%;
  transform: translateX(-50%);
  width: 21%; /* 灵动岛更宽 */
  height: 2.8%; /* 灵动岛更高 */
  background: #000;
  border-radius: 20px; /* 完全圆角的胶囊形状 */
  z-index: 11;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* 状态栏 */
.char-status-bar {
  height: 30px;
  display: flex;
  justify-content: space-between;
  padding: 5px 25px 0;
  align-items: center;
  font-size: 12px;
  color: #000000;
  z-index: 11;
}

.icons {
  display: flex;
  gap: 5px;
  align-items: center;
}

.battery-icon {
  width: 20px;
  height: 10px;
  border: 1px solid #000000;
  border-radius: 2px;
  position: relative;
}
.battery-icon::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  bottom: 1px;
  right: 3px;
  background: #000000;
}

/* 内容区 
   说明：现在widget的尺寸由CharPhoneWidgetContainer统一管理
   调整widget高度：请修改 CharPhoneWidgetContainer.vue 中的百分比值
*/
.char-content {
  flex: 1;
  padding: 15px;
  padding-bottom: 120px; /* 为Dock栏留出空间 */
  overflow-y: auto;
  box-sizing: border-box;
}

/* 物理按键模拟 */
.char-btn-power {
  position: absolute;
  right: -2px;
  top: 100px;
  width: 2px;
  height: 40px;
  background: #333;
  border-radius: 0 2px 2px 0;
}

.char-btn-volume-up {
  position: absolute;
  left: -2px;
  top: 80px;
  width: 2px;
  height: 40px;
  background: #333;
  border-radius: 2px 0 0 2px;
}

.char-btn-volume-down {
  position: absolute;
  left: -2px;
  top: 130px;
  width: 2px;
  height: 40px;
  background: #333;
  border-radius: 2px 0 0 2px;
}

/* 应用切换动画 */
.app-fade-enter-active,
.app-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.app-fade-enter-from,
.app-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
