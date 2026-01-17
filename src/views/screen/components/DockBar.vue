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
          <img v-if="appIcons[app.id]" :src="appIcons[app.id]" class="custom-app-icon">
      </div>
      <span class="label">{{ app.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.bottom-bar {
    height: 85px;
    width: calc(100% - 40px);
    margin: 0 20px;
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(20px);
    border: 0px solid rgba(255,255,255,0.4);
    border-radius: 32px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: absolute;
    bottom: 15px;
    left: 0;
    z-index: 500;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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
    color: var(--text-darkest);
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
