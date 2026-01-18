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
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
}

.app-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.app-icon:hover { transform: scale(1.05); }
.app-icon:active { transform: scale(0.95); }

.app-icon .icon {
    width: 52px;
    height: 52px;
    border-radius: var(--app-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: var(--bg-white);
    color: white;
}

.app-icon .label {
    font-size: 10px;
    color: var(--home-text-color, var(--text-darkest));
    text-align: center;
}

.icon:has(img.custom-app-icon) {
    background: transparent;
}

.custom-app-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
}
</style>
