<template>
  <div class="char-phone-header" @click.stop="handleBackgroundClick">
    <!-- 背景图片模块 -->
    <div 
      class="widget-background"
      :style="backgroundStyle"
    >
      <div v-if="!widgetData.background" class="upload-hint">
        点击上传
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="widget-content" @click.stop>
      <!-- 左侧区域：头像 + 日期信息 -->
      <div class="left-section">
        <div 
          class="avatar-circle"
          :style="avatarStyle"
          @click="handleAvatarClick"
        >
          <div v-if="!widgetData.avatar" class="upload-hint">
            点击上传
          </div>
        </div>

        <div class="date-info">
          <div class="weekday">{{ currentWeekday }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </div>

      <!-- 右侧区域：照片 + 文字输入 -->
      <div class="right-section">
        <div class="text-inputs-row">
          <input
            v-model="photoTexts[0]"
            type="text"
            class="photo-text-input"
            placeholder="点击输入文字"
            @blur="handlePhotoTextBlur(0)"
            @click.stop
          />
          <input
            v-model="photoTexts[1]"
            type="text"
            class="photo-text-input"
            placeholder="点击输入文字"
            @blur="handlePhotoTextBlur(1)"
            @click.stop
          />
        </div>

        <div class="photos-row">
          <div 
            class="photo-item"
            :style="getPhotoStyle(0)"
            @click="handlePhotoClick(0)"
          >
            <div v-if="!widgetData.photos[0]" class="upload-hint">
              点击上传
            </div>
          </div>
          <div 
            class="photo-item"
            :style="getPhotoStyle(1)"
            @click="handlePhotoClick(1)"
          >
            <div v-if="!widgetData.photos[1]" class="upload-hint">
              点击上传
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片上传弹窗 -->
    <ImageUploadModal
      v-model:visible="showUploadModal"
      :type="'basic'"
      :biz-type="currentUploadType"
      @upload-complete="handleUploadComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

// Props & Emits
const props = defineProps({
  widgetData: {
    type: Object,
    default: () => ({
      background: '',
      avatar: '',
      photos: ['', ''],
      photoTexts: ['', '']
    })
  }
})

const emit = defineEmits(['update:widgetData'])

// 状态管理
const showUploadModal = ref(false)
const currentUploadType = ref('background')
const currentPhotoIndex = ref(0)
const photoTexts = ref([
  props.widgetData.photoTexts?.[0] || '',
  props.widgetData.photoTexts?.[1] || ''
])

// 时间相关
const currentDate = ref('')
const currentWeekday = ref('')
let timeInterval = null

const updateDateTime = () => {
  const now = new Date()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  currentDate.value = `${month}.${day}`
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  currentWeekday.value = weekdays[now.getDay()]
}

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 60000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// 样式计算
const backgroundStyle = computed(() => {
  if (props.widgetData.background) {
    return {
      backgroundImage: `url('${props.widgetData.background}')`,
      backgroundColor: 'transparent'
    }
  }
  return { backgroundColor: '#e0e0e0' }
})

const avatarStyle = computed(() => {
  if (props.widgetData.avatar) {
    return {
      backgroundImage: `url('${props.widgetData.avatar}')`,
      backgroundColor: 'transparent'
    }
  }
  return { backgroundColor: '#e0e0e0' }
})

const getPhotoStyle = (index) => {
  if (props.widgetData.photos[index]) {
    return {
      backgroundImage: `url('${props.widgetData.photos[index]}')`,
      backgroundColor: 'transparent'
    }
  }
  return { backgroundColor: '#e0e0e0' }
}

// 事件处理
const handleBackgroundClick = () => {
  currentUploadType.value = 'background'
  showUploadModal.value = true
}

const handleAvatarClick = () => {
  currentUploadType.value = 'avatar'
  showUploadModal.value = true
}

const handlePhotoClick = (index) => {
  currentPhotoIndex.value = index
  currentUploadType.value = `photo${index}`
  showUploadModal.value = true
}

const handleUploadComplete = (image) => {
  const newData = { ...props.widgetData }
  
  if (currentUploadType.value === 'background') {
    newData.background = image.content
  } else if (currentUploadType.value === 'avatar') {
    newData.avatar = image.content
  } else if (currentUploadType.value.startsWith('photo')) {
    newData.photos = [...props.widgetData.photos]
    newData.photos[currentPhotoIndex.value] = image.content
  }
  
  emit('update:widgetData', newData)
}

const handlePhotoTextBlur = (index) => {
  const newData = { 
    ...props.widgetData, 
    photoTexts: [...photoTexts.value]
  }
  emit('update:widgetData', newData)
}
</script>

<style scoped>
/* Widget 容器 */
.char-phone-header {
  width: 100%;
  height: 100%;
  border-radius: 2em;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0.08em 0.33em rgba(0, 0, 0, 0.1);
}

/* 背景图片模块 */
.widget-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-hint {
  color: #999;
  font-size: 0.8em;
  pointer-events: none;
  text-align: center;
}

/* 内容区域 */
.widget-content {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 6%;
  box-sizing: border-box;
  pointer-events: none;
}

.widget-content > * {
  pointer-events: auto;
}

/* 左侧区域：头像 + 日期 */
.left-section {
  position: absolute;
  top: 48%;
  left: 9%;
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  align-items: center;
  transform: translateY(-50%);
}

.avatar-circle {
  width: 125%;
  height: 125%;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  aspect-ratio: 1;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  color: #333;
  text-align: center;
}

.date {
  font-size: 0.8em;
  font-weight: 600;
}

.weekday {
  font-size: 0.8em;
  font-weight: 500;
}

/* 右侧区域：照片 + 文字输入 */
.right-section {
  position: absolute;
  top: 6%;
  right: 3%;
  display: flex;
  height: 88%;
  width: 65%;
  flex-direction: column;
  gap: 0.5em;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.5);
  padding: 0.85em;
  border-radius: 1.5em;
}

.text-inputs-row {
  display: flex;
  position: absolute;
  top: 9%;
  left: 7.5%;
  gap: 1.5em;
}

.photo-text-input {
  width: 40%;
  background: rgb(255, 255, 255, 0);
  border: none;
  border-radius: 0.33em;
  font-size: 0.95em;
  color: #333;
  outline: none;
  transition: background 0.2s;
  text-align: center;
  font-family: 'Segoe UI', serif;
}

.photo-text-input:focus {
  background: rgba(255, 255, 255, 0.1);
}

.photo-text-input::placeholder {
  color: #333;
  font-size: 0.7em;
}

/* 照片容器行 - 负责整体布局和定位 */
.photos-row {
  display: flex;              /* 使用 flex 布局，让两个照片横向排列 */
  position: absolute;         /* 绝对定位，相对于 .right-section 定位 */
  top: 25.5%;                /* 距离 .right-section 顶部 25.5% 的位置 */
  right: 7.5%;                /* 距离 .right-section 右边 10% 的位置 */
  width: 85%;                /* 容器宽度占 .right-section 的 80% - 控制整个照片区域的宽度 */
  height: 85%;               /* 容器高度占 .right-section 的 60% - 控制整个照片区域的高度 */
  gap: 1.5em;                /* 两个照片之间的间距 */
}

/* 单个照片项 - 负责单张照片的尺寸和样式 */
.photo-item {
  width: 50%;                /* 单张照片宽度占 .photos-row 的 80% - 控制单张照片的宽度 */
  height: 80%;               /* 单张照片高度占 .photos-row 的 80% - 控制单张照片的高度 */
  border-radius: 1em;        /* 照片圆角 */
  background-size: cover;    /* 背景图片覆盖整个区域 */
  background-position: center; /* 背景图片居中 */
  cursor: pointer;           /* 鼠标悬停时显示手型光标 */
  display: flex;             /* flex 布局用于居中"点击上传"提示文字 */
  align-items: center;       /* 垂直居中 */
  justify-content: center;   /* 水平居中 */
}
</style>
