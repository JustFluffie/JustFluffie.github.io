<template>
  <div
    class="debug-console"
    :class="{ 'collapsed': isCollapsed }"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
  >
    <div
      class="header"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <span @click.stop="toggleCollapse">{{ isCollapsed ? '🧸' : 'Debug Console' }}</span>
      <div class="controls" v-if="!isCollapsed">
        <button @click.stop="clearLogs">Clear</button>
        <button @click.stop="$emit('hide')">Hide</button>
        <button @click.stop="exitDebugMode" class="exit-btn">Exit</button>
      </div>
    </div>
    <div v-if="!isCollapsed" class="content" ref="logContainer">
      <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
        <pre>{{ formatLog(log.args) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const emit = defineEmits(['hide']);

const isCollapsed = ref(true);
const logs = ref([]);
const position = ref({ x: 10, y: 10 });
const logContainer = ref(null);

let originalConsole = {};
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const initialPos = ref({ x: 0, y: 0 });

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

const clearLogs = () => {
  logs.value = [];
};

const exitDebugMode = () => {
  if (confirm('Close debug mode?')) {
    localStorage.removeItem('debug-mode');
    window.location.reload();
  }
};

const formatLog = (args) => {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[Unserializable Object]';
      }
    }
    return String(arg);
  }).join(' ');
};

const startDrag = (event) => {
  if (isDragging.value) return;
  isDragging.value = true;
  
  const e = event.touches ? event.touches[0] : event;
  dragStart.value = { x: e.clientX, y: e.clientY };
  initialPos.value = { ...position.value };

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
};

const onDrag = (event) => {
  if (!isDragging.value) return;
  if (event.cancelable) {
    event.preventDefault();
  }

  const e = event.touches ? event.touches[0] : event;
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;

  position.value.x = initialPos.value.x + dx;
  position.value.y = initialPos.value.y + dy;

  // Boundary checks
  position.value.x = Math.max(0, Math.min(position.value.x, window.innerWidth - (isCollapsed.value ? 60 : window.innerWidth * 0.8)));
  position.value.y = Math.max(0, Math.min(position.value.y, window.innerHeight - (isCollapsed.value ? 40 : 300)));
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
};

const captureLogs = () => {
  const types = ['log', 'warn', 'error', 'info', 'debug'];
  types.forEach(type => {
    originalConsole[type] = console[type];
    console[type] = (...args) => {
      logs.value.unshift({ type, args });
      originalConsole[type](...args);
    };
  });
};

const releaseLogs = () => {
  for (const type in originalConsole) {
    console[type] = originalConsole[type];
  }
};

onMounted(() => {
  captureLogs();
  console.log('Debug console initialized.');
});

onUnmounted(() => {
  releaseLogs();
});
</script>

<style scoped>
.debug-console {
  position: fixed;
  z-index: 9999;
  background-color: rgba(255, 255, 255, 0.5);
  color: rgb(26, 26, 26);
  border-radius: 8px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
  transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease;
  height: auto;
  max-height: 300px;
  width: 80vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.debug-console.collapsed {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.507);
  cursor: move;
  user-select: none;
  touch-action: none;
  height: 40px;
  width: 100%;
}

.collapsed .header {
  padding: 0;
  justify-content: center;
  background-color: transparent;
}

.header span {
  font-weight: bold;
  font-size: 16px;
}

.header .controls {
  display: flex;
  gap: 8px;
}

.header button {
  background: rgba(255, 255, 255, 0);
  color: rgb(26, 26, 26);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.header button.exit-btn {
  background: rgba(255, 68, 68, 0.521);
}

.content {
  padding: 8px;
  overflow-y: auto;
  flex-grow: 1;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid #444;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.log { color: #000000; }
.log-item.warn { color: #ffc107; }
.log-item.error { color: #f44336; }
.log-item.info { color: #2196f3; }
.log-item.debug { color: #000000; }

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
