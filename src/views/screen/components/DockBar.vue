<script setup>
defineProps({
  apps: {
    type: Array,
    required: true
  },
  appIcons: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['app-click'])

const handleAppClick = (app) => {
  emit('app-click', app)
}
</script>

<template>
  <div class="bottom-bar">
    <div 
      v-for="app in apps" 
      :key="app.id" 
      class="app-icon" 
      @click="handleAppClick(app)"
    >
      <div class="icon">
          <!-- 增加 draggable="false" 防止拖拽图片影响点击体验 -->
          <img 
            v-if="appIcons[app.id]" 
            :src="appIcons[app.id]" 
            class="custom-app-icon"
            draggable="false" 
          >
      </div>
      <!-- 如果想要更像 iOS/OneUI，Dock栏通常不显示文字，
           如果不显示文字，可以将 .label 设为 display: none -->
      <span class="label">{{ app.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.bottom-bar {
    /* --- 布局定位核心优化 --- */
    position: absolute;
    /* 1. 适配 S23/iPhone 底部手势条，保证不贴底 */
    bottom: max(15px, env(safe-area-inset-bottom) + 10px);
    /* 2. 物理居中大法，比 margin 靠谱 */
    left: 50%;
    transform: translateX(-50%);
    
    /* --- 尺寸控制 --- */
    height: 105px; /* 稍微增高一点，给文字留呼吸感 */
    width: calc(100% - 40px); /* 默认占满减去边距 */
    max-width: 400px; /* 关键：限制最大宽度，防止平板上图标分太开 */
    padding: 0 10px;  /* 减小内边距，让 justify-content 发挥作用 */
    box-sizing: border-box; /* 确保 padding 不撑大盒子 */
    /* --- 视觉质感 (S23 Ultra 屏幕通透，这里要加强质感) --- */
    background: rgba(255, 255, 255, 0.05); /* 稍微调高不透明度 */
    backdrop-filter: blur(2px) saturate(150%); /* 高斯模糊 + 增加饱和度(让背景色透过来更鲜艳) */
    -webkit-backdrop-filter: blur(2px) saturate(150%);
    border-radius: 36px; /* 更加圆润 */
    box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.05),
        0 10px 30px rgba(0, 0, 0, 0.1);
    
    /* --- 内部对齐 --- */
    display: flex;
    justify-content: space-evenly; /* 比 around 更均匀 */
    align-items: center;
    z-index: 500;
}

.app-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px; /* 稍微拉近图标和文字 */
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* 更有弹性的动效 */
    /* 扩大点击热区 */
    padding: 5px; 
}

.app-icon:active { 
    transform: scale(0.9); 
    opacity: 0.8;
}

.app-icon .icon {
    width: var(--global-icon-size);     /* 跟随全局 */
    height: var(--global-icon-size);    /* 跟随全局 */
    border-radius: var(--global-icon-radius); /* 跟随全局 */
    font-size: var(--global-icon-font-size);  
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.9);
    color: #333;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1); /* 图标本身加一点投影 */
}

.app-icon .label {
    font-size: 11px; /* 10px 在 S23 高分屏上可能太细，11px 更清晰 */
    font-weight: 500;
    color: var(--home-text-color, #333);
    text-shadow: 0 1px 2px rgba(255,255,255,0.5); /* 防止背景太花看不清字 */
    text-align: center;
    letter-spacing: 0.3px;
}

/* 移除默认背景，针对图片图标 */
.icon:has(img.custom-app-icon) {
    background: transparent;
    box-shadow: none;
}

.custom-app-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
    /* 防止图片显示锯齿 */
    will-change: transform; 
}
</style>
