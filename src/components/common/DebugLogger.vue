<template>
  <div
    class="debug-logger-container"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
    :class="{ 'is-expanded': isExpanded }"
  >
    <div
      class="handle"
      @mousedown="startDrag"
      @touchstart.prevent="startDrag"
    >
      <span v-if="!isExpanded">🐞</span>
      <span v-else>Debug Console</span>
      <button v-if="isExpanded" @click.stop="clearLogs">Clear</button>
      <button @click.stop="toggleExpand">{{ isExpanded ? 'Collapse' : 'Expand' }}</button>
    </div>
    <div v-if="isExpanded" class="logs" ref="logsContainer">
      <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
        <span class="log-timestamp">[{{ log.timestamp }}]</span>
        <span class="log-type">[{{ log.type.toUpperCase() }}]</span>
        <pre class="log-message">{{ formatMessage(log.message) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const logs = ref([]);
const logsContainer = ref(null);
const isExpanded = ref(false);
const position = ref({ x: 10, y: window.innerHeight - 50 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const initialPos = ref({ x: 0, y: 0 });

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

const addLog = (type, args) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push({
    type,
    timestamp,
    message: [...args],
  });
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
};

onMounted(() => {
  console.log = (...args) => { addLog('log', args); originalConsole.log.apply(console, args); };
  console.error = (...args) => { addLog('error', args); originalConsole.error.apply(console, args); };
  console.warn = (...args) => { addLog('warn', args); originalConsole.warn.apply(console, args); };
  console.info = (...args) => { addLog('info', args); originalConsole.info.apply(console, args); };
  
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
});

onUnmounted(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;

  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
});

const clearLogs = () => { logs.value = []; };
const toggleExpand = () => { isExpanded.value = !isExpanded.value; };

const formatMessage = (message) => {
  return message.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try { return JSON.stringify(arg, null, 2); } catch (e) { return '[Unserializable Object]'; }
    }
    return String(arg);
  }).join(' ');
};

const getEventPosition = (event) => {
  if (event.touches) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

const startDrag = (event) => {
  isDragging.value = true;
  const pos = getEventPosition(event);
  dragStart.value = { x: pos.x, y: pos.y };
  initialPos.value = { x: position.value.x, y: position.value.y };
};

const onDrag = (event) => {
  if (isDragging.value) {
    event.preventDefault();
    const pos = getEventPosition(event);
    const dx = pos.x - dragStart.value.x;
    const dy = pos.y - dragStart.value.y;
    position.value.x = initialPos.value.x + dx;
    position.value.y = initialPos.value.y + dy;
  }
};

const stopDrag = () => {
  isDragging.value = false;
};
</script>

<style scoped>
.debug-logger-container {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid #444;
  border-radius: 5px;
  z-index: 9999;
  font-family: monospace;
  font-size: 12px;
  transition: all 0.2s ease-in-out;
}
.debug-logger-container:not(.is-expanded) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}
.debug-logger-container.is-expanded {
  width: calc(100% - 20px);
  max-width: 500px;
  height: 200px;
  display: flex;
  flex-direction: column;
}
.handle {
  background-color: #333;
  padding: 5px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  flex-shrink: 0;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}
.handle:active {
  cursor: grabbing;
}
.debug-logger-container:not(.is-expanded) .handle {
  background: none;
  padding: 0;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  justify-content: center;
}
.debug-logger-container:not(.is-expanded) button {
  display: none;
}
.handle button {
  background: #555;
  color: white;
  border: 1px solid #777;
  border-radius: 3px;
  cursor: pointer;
  margin-left: 5px;
}
.logs {
  flex: 1;
  overflow-y: auto;
  padding: 5px;
}
.log-item {
  border-bottom: 1px solid #444;
  padding: 2px 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-item:last-child { border-bottom: none; }
.log-item.error { color: #ff8080; }
.log-item.warn { color: #ffff80; }
.log-item.info { color: #80bfff; }
.log-item.log { color: #ffffff; }
.log-timestamp, .log-type { margin-right: 8px; opacity: 0.7; }
pre.log-message { margin: 0; display: inline; font-family: monospace; }
</style>
