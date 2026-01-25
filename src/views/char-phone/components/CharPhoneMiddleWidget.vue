<template>
  <div class="char-phone-middle-widget">
    <!-- 左侧：照片区域容器 -->
    <div class="photo-section">
      <div class="photo-wrapper">
        <div 
          class="photo-container"
          :style="photoStyle"
          @click="handlePhotoClick"
        >
          <div v-if="!widgetData.photo" class="upload-hint">
            点击上传
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：App网格区域容器 -->
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
  emit('app-click', app)
}

const handleUploadComplete = (image) => {
  const newData = { ...props.widgetData }
  newData.photo = image.content
  emit('update:widgetData', newData)
}

const getAppIconUrl = (appLabel) => {
  return charThemeStore.getAppIcon(charId, appLabel)
}
</script>

<style scoped>
.char-phone-middle-widget {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 1.2em;
  padding: 0;
  box-sizing: border-box;
}

/* 左侧照片区域容器 */
.photo-section {
  flex: 0 0 calc(var(--middle-left-width, 50%) - 0.6em);  /* 使用CSS变量控制宽度，减去gap的一半 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 左侧照片包裹层 - 用于固定照片位置 */
.photo-wrapper {
  width: 100%;
  height: 95%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 左侧照片容器 - 正方形 */
.photo-container {
  aspect-ratio: 1 / 1;
  height: 95%;
  border-radius: 1.8em;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.15em 0.5em rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
  transform: translate(
    var(--middle-left-offset, 0em), 
    var(--middle-vertical-offset, 0em)
  );  /* 使用CSS变量控制水平和垂直偏移，默认值为0（无偏移） */
}

.photo-container:hover {
  transform: translateY(-0.1em);
  box-shadow: 0 0.25em 0.8em rgba(0, 0, 0, 0.12);
}

.photo-container:active {
  transform: scale(0.98);
}

/* 右侧App网格区域容器 */
.app-section {
  flex: 0 0 calc(var(--middle-right-width, 50%) - 0.6em);  /* 使用CSS变量控制宽度，减去gap的一半 */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

/* 右侧App网格包裹层 - 用于固定网格位置 */
.app-grid-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

/* 右侧App网格 */
.app-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  align-content: center;
  justify-items: center;
  row-gap: 0.2em;  /* 调整此值来控制上下两行的间距，数值越大间距越大 */
  transform: translate(
    var(--middle-right-offset, 0em), 
    var(--middle-right-vertical-offset, 0em)
  );  /* 使用CSS变量控制水平和垂直偏移，默认值为0（无偏移） */
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2em;
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
  box-shadow: 0 0.1em 0.3em rgba(0, 0, 0, 0.1);
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

.upload-hint {
  color: #999;
  font-size: 0.8em;
  pointer-events: none;
  text-align: center;
}
</style>
