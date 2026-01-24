<template>
  <div 
    class="c-phone-app-layout"
    :style="{ 
      '--app-bg': background, 
      '--app-text': color, 
      '--app-theme': themeColor 
    }"
  >
    <CPhoneAppHeader 
      :title="title" 
      :show-clear="showClear"
      :show-refresh="showRefresh"
      @back="handleBack"
      @clear="emit('clear')"
      @refresh="emit('refresh')"
    >
      <template #action>
        <slot name="action"></slot>
      </template>
    </CPhoneAppHeader>
    
    <div class="app-container">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import CPhoneAppHeader from './CPhoneAppHeader.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  background: {
    type: String,
    default: '#ffffff'
  },
  color: {
    type: String,
    default: '#000000'
  },
  themeColor: {
    type: String,
    default: '#000000'
  },
  showClear: {
    type: Boolean,
    default: false
  },
  showRefresh: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'clear', 'refresh'])

const handleBack = () => {
  emit('close')
}
</script>

<style scoped>
.c-phone-app-layout {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  animation: slideIn 0.3s ease-out;
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.app-container {
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
}
</style>
