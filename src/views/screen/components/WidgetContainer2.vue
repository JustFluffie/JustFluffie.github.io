<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import MusicPlayer from './MusicPlayer.vue'

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

    </div>
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
</style>
