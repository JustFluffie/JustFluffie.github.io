<template>
  <AppLayout :title="t('checkPhone.title', '查看手机')" no-padding>
    <div class="check-phone-container">
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
            <CheckPhoneWidgetContainer 
              :header-data="headerData"
              :middle-data="middleData"
              :bottom-data="bottomData"
              @update:header-data="updateHeaderData"
              @update:middle-data="updateMiddleData"
              @update:bottom-data="updateBottomData"
            />
          </div>

          <!-- Dock栏 -->
          <CheckPhoneDock 
            :apps="dockApps"
            @app-click="handleAppClick"
          />
          
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
import CheckPhoneWidgetContainer from './components/CheckPhoneWidgetContainer.vue'
import CheckPhoneDock from './components/CheckPhoneDock.vue'

const { t } = useI18n()
const route = useRoute()
const singleStore = useSingleStore()

const charId = route.params.charId
const char = computed(() => singleStore.getCharacter(charId))
const charName = computed(() => char.value ? char.value.name : t('chat.unknownCharacter'))

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
  loadCheckPhoneData()
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

const middleData = ref({
  photo: '',
  apps: [
    { icon: '', label: '' },
    { icon: '', label: '' },
    { icon: '', label: '' },
    { icon: '', label: '' }
  ]
})

const bottomData = ref({
  photo: '',
  apps: [
    { icon: '', label: '' },
    { icon: '', label: '' },
    { icon: '', label: '' },
    { icon: '', label: '' }
  ]
})

// Dock应用数据
const dockApps = ref([
  { id: 'messages', label: '消息', icon: '' },
  { id: 'photos', label: '相册', icon: '' },
  { id: 'music', label: '音乐', icon: '' },
  { id: 'settings', label: '设置', icon: '' }
])

// 加载保存的数据
const loadCheckPhoneData = () => {
  const storageKey = `checkphone_${charId}`
  const savedData = localStorage.getItem(storageKey)
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      if (parsed.header) {
        headerData.value = parsed.header
      }
      if (parsed.middle) {
        middleData.value = parsed.middle
      }
      if (parsed.bottom) {
        bottomData.value = parsed.bottom
      }
      if (parsed.dockApps) {
        dockApps.value = parsed.dockApps
      }
    } catch (e) {
      console.error('Failed to load check phone data:', e)
    }
  }
}

// 保存数据
const saveCheckPhoneData = () => {
  const storageKey = `checkphone_${charId}`
  const dataToSave = {
    header: headerData.value,
    middle: middleData.value,
    bottom: bottomData.value,
    dockApps: dockApps.value
  }
  localStorage.setItem(storageKey, JSON.stringify(dataToSave))
}

// 更新Header数据
const updateHeaderData = (newData) => {
  headerData.value = newData
  saveCheckPhoneData()
}

// 更新Middle数据
const updateMiddleData = (newData) => {
  middleData.value = newData
  saveCheckPhoneData()
}

// 更新Bottom数据
const updateBottomData = (newData) => {
  bottomData.value = newData
  saveCheckPhoneData()
}

// 处理Dock应用点击
const handleAppClick = (app) => {
  console.log('App clicked:', app)
  // 未来可以添加应用打开逻辑
}
</script>

<style>
/* 注意这里没有 scoped，或者是用 :root */
:root {
  --global-icon-size: 5.5vh;
  --global-icon-font-size: 1.1vh;
  --global-icon-radius: 1.3vh;
}
</style>

<style scoped>
/* 覆盖 AppLayout 样式 */
:deep(.app-header) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: transparent;
  border: none;
  z-index: 100;
  pointer-events: none; /* 让点击穿透 */
}

:deep(.app-header .back-btn) {
  pointer-events: auto; /* 恢复按钮点击 */
  color: #333; /* 深色按钮适配白色背景 */
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));
}

:deep(.app-header .title),
:deep(.app-header .action-btn) {
  display: none;
}

:deep(.app-content) {
  padding: 0 !important;
  overflow: hidden; /* 防止滚动 */
}

.check-phone-container {
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
  top: 2.8%;
  left: 50%;
  transform: translateX(-50%);
  width: 21%; /* 灵动岛更宽 */
  height: 3%; /* 灵动岛更高 */
  background: #000;
  border-radius: 20px; /* 完全圆角的胶囊形状 */
  z-index: 10;
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
  z-index: 5;
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
   说明：现在widget的尺寸由CheckPhoneWidgetContainer统一管理
   调整widget高度：请修改 CheckPhoneWidgetContainer.vue 中的百分比值
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
</style>
