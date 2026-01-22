<script setup>
import { defineProps, defineEmits, computed } from 'vue'

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

// --- 新增的核心逻辑 ---
// 计算容器的样式：内边距(Padding) 和 圆角
const containerStyle = computed(() => {
  if (props.showFrame) {
    // 【有边框模式】
    // 这些数值是根据你之前的 CSS (top: 3.2%, width: 90% -> 左右各5%) 推算的。
    // 你需要根据你的“手机边框图片”的实际厚度微调这些值。
    return {
      paddingTop: '3.5%',    // 对应之前的 top: 3.2% + 一点余量
      paddingBottom: '3.5%', // 下巴区域
      paddingLeft: '5%',     // 对应之前的 width: 90% (两边各留 5%)
      paddingRight: '5%',
      // 如果需要限制内容不溢出圆角边框，可以加这个：
      // borderRadius: '2rem', 
    }
  } else {
    // 【无边框模式】
    // 铺满屏幕，但给一点点呼吸空间，防止内容贴着显示器边缘
    return {
      padding: '1.5%', 
      // borderRadius: '0',
    }
  }
})

// 事件处理函数，用于将子组件的事件冒泡到父组件
const handleUpdateHomeData = (newData) => emit('update:homeData', newData)
const handleShowSourceSelect = (type) => emit('show-source-select', type)
const handleSaveHomeData = () => emit('save-home-data')
const handleAppClick = (app) => emit('app-click', app)
</script>

<template>
  <div class="widget-container" :class="{ 'no-frame-mode': !showFrame }" :style="containerStyle">
    <div class="screen-content">
      
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
  </div>
</template>

<style scoped>
.widget-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.screen-content {
  position: relative;
  width: 100%;
  height: 100%;
  /* 如果你的手机屏幕有圆角，可以在这里加 */
  border-radius: 20px; 
}

.header-widget {
  position: absolute;
  top: 0; /* 【关键修改】归零，由父级 padding 控制位置 */
  left: 50%;
  transform: translateX(-50%);
  width: 100%; /* 或者 94%，看你是否需要左右留白 */
  height: 35%;
  z-index: 10;
}

.widget-sub-container {
  position: absolute;
  top: 32.5%; /* 紧接在 Header 下方 (35% + 1% 间隙) */
  height: 64%; 
  width: 50%;
  /* transition 等保持不变 */
}

.left-widgets { left: 0; }
.right-widgets { right: 0; }

.widget-item { position: absolute; }

/* 小组件相对于其子容器进行定位 */
.left-app-grid {
  top: 0; /* 相对于 sub-container */
  left: 3%;
  width: 80%;
  height: 40%;
  font-size: 7vh;
}

.left-list-card {
  top: 40%;
  left: 4%; /* 稍微向左偏移一点以匹配原始布局 */
  width: 88%;
  height: 55%;
}

.right-photo-wall {
  top: 10%;
  left: 0%;
  width: 80%;
  height: 55%;
}

.right-app-grid {
  top: 65%;
  left: 7%;
  width: 90%;
  height: 40%;
  font-size: 7vh; /* 为 AppGrid 提供缩放引擎 */
}
</style>
