<template>
  <div class="check-phone-bottom-widget">
    <!-- 左侧：App网格区域容器 -->
    <div class="app-section">
      <div class="app-grid-wrapper">
        <div class="app-grid">
          <div 
            v-for="(app, index) in apps" 
            :key="index"
            class="app-item"
            @click="handleAppClick(app)"
          >
            <div class="app-icon" :style="{ background: app.color }">
            </div>
            <div class="app-label">{{ app.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：照片区域容器 -->
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
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

const props = defineProps({
  widgetData: {
    type: Object,
    default: () => ({
      photo: ''
    })
  }
})

const emit = defineEmits(['update:widgetData'])

const showUploadModal = ref(false)

// 固定的 App 配置 - 布局：购买记录|搜索记录 在上，主题|app1 在下
const apps = [
  { label: '购买记录', color: 'rgba(255, 255, 255, 0.9)', route: '/purchase' },
  { label: '搜索记录', color: 'rgba(255, 255, 255, 0.9)', route: '/search' },
  { label: '主题', color: 'rgba(255, 255, 255, 0.9)', route: '/theme' },
  { label: 'app1', color: 'rgba(255, 255, 255, 0.9)', route: '/app1' }
]

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
  // 这里可以添加路由跳转或其他逻辑
  console.log('打开应用:', app.label)
  // 例如: router.push(app.route)
}

const handleUploadComplete = (image) => {
  const newData = { ...props.widgetData }
  newData.photo = image.content
  emit('update:widgetData', newData)
}
</script>

<style scoped>
.check-phone-bottom-widget {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 1.2em;
  padding: 0;
  box-sizing: border-box;
}

/* 左侧App网格区域容器 */
.app-section {
  flex: 0 0 calc(var(--bottom-left-width, 50%) - 0.6em);  /* 使用CSS变量控制宽度，减去gap的一半 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 左侧App网格包裹层 - 用于固定网格位置 */
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
  row-gap: 0.2em;  /* 调整此值来控制上下两行的间距，数值越大间距越大 */
  align-content: center;
  justify-items: center;
  transform: translate(
    var(--bottom-left-offset, 0em),
    var(--bottom-left-vertical-offset, 0em)
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
  flex: 0 0 calc(var(--bottom-right-width, 50%) - 0.6em);  /* 使用CSS变量控制宽度，减去gap的一半 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 右侧照片包裹层 - 用于固定照片位置 */
.photo-wrapper {
  width: 100%;
  height: 95%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 右侧照片容器 - 正方形 */
.photo-container {
  aspect-ratio: 1 / 1;
  height: 85%;
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
    var(--bottom-right-offset, 0em),
    var(--bottom-right-vertical-offset, 0em)
  );  /* 使用CSS变量控制水平和垂直偏移，默认值为0（无偏移） */
}

.photo-container:hover {
  transform: translateY(-0.1em);
  box-shadow: 0 0.25em 0.8em rgba(0, 0, 0, 0.12);
}

.photo-container:active {
  transform: scale(0.98);
}

.upload-hint {
  color: #999;
  font-size: 0.8em;
  pointer-events: none;
  text-align: center;
}
</style>
