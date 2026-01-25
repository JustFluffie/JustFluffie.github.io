<template>
  <div class="char-phone-bottom-widget">
    <!-- 左侧：App网格区域容器 -->
    <div class="app-section">
      <div class="app-grid-wrapper">
<div class="app-grid">
          <div 
            v-for="(app, index) in widgetData.apps" 
            :key="index"
            class="app-item"
            @click="handleAppClick(app)"
          >
            <div class="app-icon">
              <img v-if="getAppIconUrl(app.label)" :src="getAppIconUrl(app.label)" alt="app icon" class="app-icon-img" />
              <div v-else class="app-icon-placeholder" :style="{ background: app.color }"></div>
            </div>
            <div class="app-label">{{ app.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：照片区域容器 -->
    <div class="photo-section">
      <div class="photo-wrapper">
        <!-- 圆形照片容器 -->
        <div 
          class="photo-container"
          :style="photoStyle"
          @click="handlePhotoClick"
        >
          <div v-if="!widgetData.photo" class="upload-hint">
            点击上传
          </div>
        </div>
        
        <!-- 两行文本输入框 -->
        <div class="text-inputs">
          <input 
            type="text" 
            class="custom-input"
            v-model="widgetData.text1"
            placeholder="输入文本1"
            @input="handleTextInput"
          />
          <input 
            type="text" 
            class="custom-input"
            v-model="widgetData.text2"
            placeholder="输入文本2"
            @input="handleTextInput"
          />
        </div>
      </div>
    </div>

    <!-- 图片上传弹窗 -->
    <ImageUploadModal
      v-model:visible="showUploadModal"
      :type="'basic'"
      :biz-type="'photo'"
      @upload-complete="handleUploadComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCharThemeStore } from '@/stores/charphone/charThemeStore'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

const props = defineProps({
  widgetData: {
    type: Object,
    default: () => ({
      photo: '',
      text1: '',
      text2: '',
      apps: []
    })
  }
})

const emit = defineEmits(['update:widgetData', 'app-click'])

const route = useRoute()
const charThemeStore = useCharThemeStore()
const charId = route.params.charId

const showUploadModal = ref(false)

// 样式计算
const photoStyle = computed(() => {
  if (props.widgetData.photo) {
    return {
      backgroundImage: `url('${props.widgetData.photo}')`,
      backgroundColor: 'transparent'
    }
  }
  return { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
})

// 事件处理
const handlePhotoClick = () => {
  showUploadModal.value = true
}

const handleAppClick = (app) => {
  console.log('Bottom widget - 打开应用:', app.label)
  emit('app-click', app)
}

const handleUploadComplete = (image) => {
  const newData = { ...props.widgetData }
  newData.photo = image.content
  emit('update:widgetData', newData)
}

const handleTextInput = () => {
  emit('update:widgetData', { ...props.widgetData })
}

const getAppIconUrl = (appLabel) => {
  return charThemeStore.getAppIcon(charId, appLabel)
}
</script>

<style scoped>
.char-phone-bottom-widget {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  padding: 0;
  box-sizing: border-box;
}

/* 左侧App网格区域容器 */
.app-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 左侧App网格包裹层 */
.app-grid-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 左侧App网格 */
.app-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  row-gap: 5px;
  align-content: center;
  justify-items: center;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.app-item:active {
  transform: scale(0.95);
}

.app-icon {
  width: var(--global-icon-size);
  height: var(--global-icon-size);
  border-radius: var(--global-icon-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  background-color: #f0f0f0; /* Add a default background for the icon container */
}

.app-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-icon-placeholder {
  width: 100%;
  height: 100%;
}

.app-label {
  width: 4em;
  font-size: var(--global-icon-font-size);
  color: var(--text-darkest, #333);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

/* 右侧照片区域容器 */
.photo-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 右侧照片包裹层 - 垂直布局 */
.photo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}

/* 右侧照片容器 - 圆形 */
.photo-container {
  width: 48%;
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 50%;  /* 圆形 */
  background-size: cover;
  background-position: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.upload-hint {
  color: #999;
  font-size: 12px;
  pointer-events: none;
  text-align: center;
}

/* 文本输入框容器 */
.text-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 120px;
}

/* 自定义文本输入框 */
.custom-input {
  width: 100%;
  padding: 2px 6px;
  background: transparent;  /* 底色透明 */
  border: none;
  color: var(--text-darkest, #333);
  font-size: 14px;
  font-family: 'Times New Roman', Times, serif;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease;
}

.custom-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
  font-size: 12px;
}
</style>
