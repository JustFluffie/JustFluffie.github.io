<template>
  <div
    v-if="debugStore.isVisible"
    class="debug-console"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
    @touchstart.stop="handleDragStart"
  >
    <div class="header">
      <span class="title">调试控制台</span>
      <div class="actions">
        <button @click.stop="debugStore.clearMessages()">清空</button>
        <button @click.stop="isCollapsed = !isCollapsed">{{ isCollapsed ? '展开' : '收起' }}</button>
        <button @click.stop="debugStore.hide()">关闭</button>
      </div>
    </div>
    <div v-if="!isCollapsed" class="content">
      <div v-for="msg in debugStore.messages" :key="msg.id" :class="['log-item', msg.level]">
        <span class="timestamp">{{ msg.timestamp }}</span>
        <span class="message">{{ msg.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useDebugStore } from '@/stores/debugStore';

const debugStore = useDebugStore();

const isCollapsed = ref(false);
const position = ref({ x: 10, y: 50 });
const dragState = {
  dragging: false,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0,
};

const handleDragStart = (event) => {
  dragState.dragging = true;
  const touch = event.touches[0];
  dragState.startX = touch.clientX;
  dragState.startY = touch.clientY;
  dragState.initialX = position.value.x;
  dragState.initialY = position.value.y;
  
  window.addEventListener('touchmove', handleDragMove);
  window.addEventListener('touchend', handleDragEnd);
};

const handleDragMove = (event) => {
  if (!dragState.dragging) return;
  event.preventDefault();
  const touch = event.touches[0];
  const dx = touch.clientX - dragState.startX;
  const dy = touch.clientY - dragState.startY;
  
  position.value.x = Math.max(0, Math.min(window.innerWidth - 100, dragState.initialX + dx)); // 100 is approx width
  position.value.y = Math.max(0, Math.min(window.innerHeight - 50, dragState.initialY + dy)); // 50 is approx height
};

const handleDragEnd = () => {
  dragState.dragging = false;
  window.removeEventListener('touchmove', handleDragMove);
  window.removeEventListener('touchend', handleDragEnd);
};

onUnmounted(() => {
  window.removeEventListener('touchmove', handleDragMove);
  window.removeEventListener('touchend', handleDragEnd);
});
</script>

<style scoped>
.debug-console {
  position: fixed;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  width: calc(100vw - 20px);
  max-width: 500px;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  font-family: monospace;
  font-size: 12px;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: rgba(255, 255, 255, 0.1);
  cursor: move;
  user-select: none;
}

.header .title {
  font-weight: bold;
}

.header .actions button {
  background: none;
  border: 1px solid #fff;
  color: #fff;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 5px;
  cursor: pointer;
  font-size: 10px;
}

.content {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 10px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item .timestamp {
  color: #888;
  flex-shrink: 0;
}

.log-item .message {
  word-break: break-all;
  white-space: pre-wrap;
}

.log-item.error {
  color: #ff4d4d;
}

.log-item.warn {
  color: #ffc107;
}

.log-item.info {
  color: #17a2b8;
}
</style>
