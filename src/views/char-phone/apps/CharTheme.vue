<template>
  <CPhoneAppsLayout 
    :title="themeTitle" 
    @close="handleClose" 
    background="#f8f6f3"
    color="#37474f"
    themeColor="#555"
  >
    <div class="theme-container">
      <!-- 壁纸设置模块 -->
      <div class="theme-section">
        <div class="section-title">壁纸设置</div>
        <div class="wallpaper-preview-container">
          <div 
            class="wallpaper-preview" 
            :style="wallpaperStyle"
            @click="openWallpaperUpload"
          >
            <div v-if="!currentWallpaper" class="upload-hint">
              <svg-icon name="image" class="hint-icon" />
              <span>点击上传壁纸</span>
            </div>
          </div>
          <button 
            v-if="currentWallpaper" 
            class="btn-clear" 
            @click="clearWallpaper"
          >
            清除壁纸
          </button>
        </div>
      </div>

      <!-- App图标设置模块 -->
      <div class="theme-section">
        <div class="section-title">App图标设置</div>
        <div class="app-icons-grid">
          <div 
            v-for="app in availableApps" 
            :key="app.label" 
            class="app-icon-item"
            @click="openAppIconUpload(app.label)"
          >
            <div class="app-icon-box">
              <img 
                v-if="getAppIconUrl(app.label)" 
                :src="getAppIconUrl(app.label)" 
                alt="app icon"
              />
              <div v-else class="app-icon-placeholder">
                <span>{{ app.label.charAt(0) }}</span>
              </div>
            </div>
            <span class="app-name">{{ app.label }}</span>
            <button 
              v-if="getAppIconUrl(app.label)" 
              class="btn-clear-icon"
              @click.stop="clearAppIcon(app.label)"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片上传弹窗 -->
    <ImageUploadModal
      v-model:visible="isUploadModalVisible"
      :title="uploadModalTitle"
      :bizType="uploadBizType"
      type="basic"
      @upload-complete="handleImageUpload"
      @send-image="handleImageUpload"
    />
  </CPhoneAppsLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useCharThemeStore } from '@/stores/charphone/charThemeStore'
import CPhoneAppsLayout from '../components/CPhoneAppsLayout.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

// --- 1. 设置与钩子 ---
const emit = defineEmits(['close'])
const route = useRoute()
const singleStore = useSingleStore()
const charThemeStore = useCharThemeStore()

// --- 2. 状态 ---
const charId = route.params.charId
const isUploadModalVisible = ref(false)
const uploadModalTitle = ref('')
const uploadBizType = ref('theme')
const currentUploadTarget = ref(null) // { type: 'wallpaper' | 'appIcon', appLabel?: string }

// --- 3. 计算属性 ---
const characterInfo = computed(() => singleStore.getCharacter(charId))
const themeTitle = computed(() => characterInfo.value ? `${characterInfo.value.name}的主题` : '主题')

const currentTheme = computed(() => charThemeStore.getCharTheme(charId))
const currentWallpaper = computed(() => currentTheme.value.wallpaper)

const wallpaperStyle = computed(() => {
  if (currentWallpaper.value) {
    return {
      backgroundImage: `url(${currentWallpaper.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})

// 获取当前CharPhone中可用的所有app
const availableApps = computed(() => {
  const storageKey = `charphone_${charId}`
  const savedData = localStorage.getItem(storageKey)
  const apps = []
  
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      
      // 从middle获取apps
      if (parsed.middle?.apps) {
        parsed.middle.apps.forEach(app => {
          if (app.label && !apps.find(a => a.label === app.label)) {
            apps.push({ label: app.label, route: app.route })
          }
        })
      }
      
      // 从bottom获取apps
      if (parsed.bottom?.apps) {
        parsed.bottom.apps.forEach(app => {
          if (app.label && !apps.find(a => a.label === app.label)) {
            apps.push({ label: app.label, route: app.route })
          }
        })
      }
    } catch (e) {
      console.error('Failed to parse charphone data:', e)
    }
  }
  
  return apps
})

// --- 4. 方法 ---
const handleClose = () => {
  emit('close')
}

const openWallpaperUpload = () => {
  uploadModalTitle.value = '设置壁纸'
  uploadBizType.value = 'theme'
  currentUploadTarget.value = { type: 'wallpaper' }
  isUploadModalVisible.value = true
}

const openAppIconUpload = (appLabel) => {
  uploadModalTitle.value = `设置 ${appLabel} 图标`
  uploadBizType.value = 'avatar'
  currentUploadTarget.value = { type: 'appIcon', appLabel }
  isUploadModalVisible.value = true
}

const handleImageUpload = (image) => {
  const url = image.content
  
  if (currentUploadTarget.value.type === 'wallpaper') {
    charThemeStore.setWallpaper(charId, url)
  } else if (currentUploadTarget.value.type === 'appIcon') {
    charThemeStore.setAppIcon(charId, currentUploadTarget.value.appLabel, url)
  }
  
  isUploadModalVisible.value = false
  currentUploadTarget.value = null
}

const clearWallpaper = () => {
  if (confirm('确定要清除壁纸吗？')) {
    charThemeStore.setWallpaper(charId, '')
  }
}

const clearAppIcon = (appLabel) => {
  if (confirm(`确定要清除 ${appLabel} 的图标吗？`)) {
    charThemeStore.deleteAppIcon(charId, appLabel)
  }
}

const getAppIconUrl = (appLabel) => {
  return charThemeStore.getAppIcon(charId, appLabel)
}
</script>

<style scoped>
.theme-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 15px;
  box-sizing: border-box;
}

/* 主题区块 */
.theme-section {
  margin-bottom: 25px;
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #37474f;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

/* 壁纸预览 */
.wallpaper-preview-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wallpaper-preview {
  width: 100%;
  aspect-ratio: 9/16;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.wallpaper-preview:active {
  transform: scale(0.98);
}

.upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  gap: 8px;
  background: rgba(0, 0, 0, 0.1);
}

.hint-icon {
  width: 40px;
  height: 40px;
  opacity: 0.8;
}

.btn-clear {
  padding: 10px 20px;
  background: #ff5252;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  align-self: center;
}

.btn-clear:hover {
  background: #ff1744;
}

.btn-clear:active {
  transform: scale(0.95);
}

/* App图标网格 */
.app-icons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.app-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.app-icon-item:hover {
  background: #f5f5f5;
}

.app-icon-box {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.app-icon-item:active .app-icon-box {
  transform: scale(0.95);
}

.app-icon-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 24px;
  font-weight: 600;
}

.app-name {
  font-size: 12px;
  color: #37474f;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
}

.btn-clear-icon {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff5252;
  color: #fff;
  border: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.app-icon-item:hover .btn-clear-icon {
  opacity: 1;
}

.btn-clear-icon:hover {
  background: #ff1744;
}
</style>
