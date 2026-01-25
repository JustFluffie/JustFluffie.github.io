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
    default: () => ({})
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
  <div class="app-grid-2">
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
.app-grid-2 {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 改为4列 */
    width: 100%;
    height: 100%; 
    align-content: center; 
    gap: 0.5em;
    box-sizing: border-box;
    justify-items: center; /* 水平居中 */
}

.app-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em; /* 稍微增加图标和标签的间距 */
    cursor: pointer;
    transition: transform 0.2s ease;
}

.app-icon:active { transform: scale(0.95); }

.app-icon .icon {
    width: var(--global-icon-size);
    height: var(--global-icon-size);
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
    font-size: 12px; /* 直接设置字体大小 */
    color: var(--home-text-color, var(--text-darkest));
    text-align: center;
    white-space: nowrap; 
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
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
