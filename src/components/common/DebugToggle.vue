<template>
  <div class="debug-toggle" @click="debugStore.toggle()">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
      <path d="m9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <path d="M12 17h.01"></path>
    </svg>
  </div>
</template>

<script setup>
import { useDebugStore } from '@/stores/debugStore';
const debugStore = useDebugStore();
</script>

<style scoped>
.debug-toggle {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 9998;
  width: 48px;
  height: 48px;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.debug-toggle svg {
  color: white;
  width: 24px;
  height: 24px;
}
</style>
