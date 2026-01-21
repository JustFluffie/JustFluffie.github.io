<script setup>
// ==========================================
// Props & Emits 定义
// ==========================================
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

// ==========================================
// 事件处理方法
// ==========================================
const handleAppClick = (app) => {
  emit('app-click', app)
}
</script>

<template>
  <div class="app-grid">
    <div 
      v-for="app in apps" 
      :key="app.id" 
      class="app-icon" 
      @click="handleAppClick(app)"
    >
      <div class="icon">
          <img v-if="appIcons[app.id]" :src="appIcons[app.id]" class="custom-app-icon">
      </div>
      <span class="label">{{ app.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.app-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    /* 1. 撑满父容器 (40% 高度那个框) */
    width: 100%;
    height: 100%; 
    /* 2. 垂直方向的对齐 */
    /* 如果你想让图标群在容器里垂直居中： */
    align-content: center; 
    /* 3. 网格行之间的间距 (原来是 gap: 0.25em) */
    /* 建议可以稍微加大一点行间距，避免标签和下一行图标挨太近 */
    row-gap: 0.5em; 
    column-gap: 0.25em;
    /* --- 修改建议结束 --- */
    box-sizing: border-box;
    justify-items: center; /* 水平居中 */
}

.app-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.12em;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 1em; /* 让图标容器宽度与图标一致 */
}

.app-icon:active { transform: scale(0.95); }

.app-icon .icon {
    width: var(--global-icon-size);     /* 绝对和 Dock 一样大 */
    height: var(--global-icon-size);    /* 绝对和 Dock 一样大 */
    border-radius: var(--global-icon-radius);
    font-size: var(--global-icon-font-size);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-white);
    color: white;
    overflow: hidden;
}

.app-icon .label {
    font-size: 0.17em; /* 相对图标大小缩放 */
    color: var(--home-text-color, var(--text-darkest));
    text-align: center;
    white-space: nowrap; 
    overflow: hidden;
    text-overflow: ellipsis;
    width: 4em;
}

.icon:has(img.custom-app-icon) {
    background: transparent;
}

.custom-app-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
    display: block;
}
</style>
