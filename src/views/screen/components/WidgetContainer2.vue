<script setup>
import { defineProps, defineEmits, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MusicPlayer from './MusicPlayer.vue'
import AppGrid2 from './AppGrid2.vue'
import SocialPortal from './SocialPortal.vue'
import { useThemeStore } from '@/stores/themeStore'
import { storeToRefs } from 'pinia'

// 定义 props
const props = defineProps({
  homeData: Object,
  showFrame: Boolean
})

// 定义 emits
const emit = defineEmits([
  'update:homeData',
  'show-source-select',
  'save-home-data'
])

// 计算容器的样式：内边距(Padding)
const containerStyle = computed(() => {
  if (props.showFrame) {
    // 【有边框模式】
    return {
      paddingTop: '3.5%',
      paddingBottom: '3.5%',
      paddingLeft: '5%',
      paddingRight: '5%',
    }
  } else {
    // 【无边框模式】
    return {
      padding: '1.5%',
    }
  }
})

// 事件处理函数
const handleUpdateHomeData = (newData) => emit('update:homeData', newData)
const handleShowSourceSelect = (type) => emit('show-source-select', type)
const handleSaveHomeData = () => emit('save-home-data')

const router = useRouter()
const themeStore = useThemeStore()
const { appIcons } = storeToRefs(themeStore)

// App Grid Data
const apps = ref([
  { id: 'social-portal', label: '社交圈' },
  { id: 'ao3', label: 'AO3' },
  { id: 'placeholder-2', label: 'App 2' },
  { id: 'placeholder-3', label: 'App 3' },
])

// App States
const isSocialPortalVisible = ref(false)

const handleAppClick = (app) => {
  if (app.id === 'social-portal') {
    isSocialPortalVisible.value = true
  } else if (app.id === 'ao3') {
    router.push('/ao3')
  }
  // Handle other apps later
}

const closeSocialPortal = () => {
  isSocialPortalVisible.value = false
}
</script>

<template>
  <div class="widget-container-2" :class="{ 'no-frame-mode': !showFrame }" :style="containerStyle">
    <div class="screen-content-2">
      
      <!-- MusicPlayer Widget -->
      <div class="widget-item music-player-widget">
        <MusicPlayer
          :homeData="homeData"
          @update:homeData="handleUpdateHomeData"
          @show-source-select="handleShowSourceSelect"
          @save-home-data="handleSaveHomeData"
        />
      </div>

      <!-- 未来可以在这里添加更多 Widget -->
      <div class="widget-item app-grid-widget">
        <AppGrid2
          :apps="apps"
          :appIcons="appIcons"
          @app-click="handleAppClick"
        />
      </div>
    </div>

    <SocialPortal
      v-if="isSocialPortalVisible"
      @close="closeSocialPortal"
    />
  </div>
</template>

<style scoped>
.widget-container-2 {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.screen-content-2 {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px; 
}

.widget-item {
  position: absolute;
}

/* --- 精确定位 MusicPlayer --- */
/* 这里是总控制台，决定 MusicPlayer 在第二屏的具体位置和大小 */
.music-player-widget {
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 15%; /* 扁平高度 */
  font-size: 10px; /* 控制 MusicPlayer 内部缩放的基准 */
}

/* --- 定位 App Grid --- */
.app-grid-widget {
  top: 55%; /* 放在 Music Player 下方 */
  left: 50%;
  transform: translateX(-50%);
  width: 98%;
  height: 25%; /* 调整高度以适应单行应用 */
}
</style>
