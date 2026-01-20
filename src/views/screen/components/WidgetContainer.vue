<script setup>
import { defineProps, defineEmits } from 'vue'

// 组件
import HomeHeader from './HomeHeader.vue'
import PhotoWall from './PhotoWall.vue'
import AppGrid from './AppGrid.vue'
import HomeListCard from './HomeListCard.vue'

// 定义 props
const props = defineProps({
  homeData: Object,
  currentDate: String,
  weatherText: String,
  leftApps: Array,
  rightApps: Array,
  appIcons: Object,
  showFrame: Boolean
})

// 定义 emits
const emit = defineEmits([
  'update:homeData',
  'show-source-select',
  'save-home-data',
  'app-click'
])

// 事件处理函数，用于将子组件的事件冒泡到父组件
const handleUpdateHomeData = (newData) => emit('update:homeData', newData)
const handleShowSourceSelect = (type) => emit('show-source-select', type)
const handleSaveHomeData = () => emit('save-home-data')
const handleAppClick = (app) => emit('app-click', app)
</script>

<template>
  <div class="widget-container" :class="{ 'no-frame-mode': !showFrame }">
    <!-- 顶部 Header (保持在顶层，因为它横跨整个屏幕) -->
    <div class="widget-item header-widget">
      <HomeHeader
        :homeData="homeData"
        @update:homeData="handleUpdateHomeData"
        :current-date="currentDate"
        :weather-text="weatherText"
        @show-source-select="handleShowSourceSelect"
        @save-home-data="handleSaveHomeData"
      />
    </div>

    <!-- 左侧子容器 -->
    <div class="widget-sub-container left-widgets">
      <div class="widget-item left-app-grid">
        <AppGrid
          :apps="leftApps"
          :app-icons="appIcons"
          @app-click="handleAppClick"
        />
      </div>
      <div class="widget-item left-list-card">
        <HomeListCard />
      </div>
    </div>

    <!-- 右侧子容器 -->
    <div class="widget-sub-container right-widgets">
      <div class="widget-item right-photo-wall">
        <PhotoWall
          :home-data="homeData"
          @show-source-select="handleShowSourceSelect"
        />
      </div>
      <div class="widget-item right-app-grid">
        <AppGrid
          :apps="rightApps"
          :app-icons="appIcons"
          @app-click="handleAppClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.widget-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.header-widget {
  position: absolute;
  top: 3.2%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 35%;
  z-index: 1; /* 确保 Header 在最上层 */
}

.widget-sub-container {
  position: absolute;
  top: 38%; /* 从 Header 下方开始 */
  height: 62%; /* 占据剩余高度 */
  width: 50%;
  transition: transform 0.3s ease-in-out;
  transform-origin: center center; /* 以各自中心为缩放基准点 */
}

.left-widgets {
  left: 0;
}

.right-widgets {
  right: 0;
}

/* 在无边框模式下，分别缩放左右两个子容器 */
.widget-container.no-frame-mode .widget-sub-container {
  transform: scale(0.96);
}

.widget-item {
  position: absolute;
  /* background-color: rgba(255, 0, 0, 0.1); */ /* 调试辅助 */
}

/* 小组件相对于其子容器进行定位 */
.left-app-grid {
  top: 6%;
  left: 9%;
  width: 90%;
  height: 40%;
}

.left-list-card {
  top: 37%;
  left: 14%; /* 稍微向左偏移一点以匹配原始布局 */
  width: 80%;
  height: 55%;
}

.right-photo-wall {
  top: 16%;
  left: 3%;
  width: 80%;
  height: 55%;
}

.right-app-grid {
  top: 68%;
  left: 0%;
  width: 90%;
  height: 40%;
}
</style>
