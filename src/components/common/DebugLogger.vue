<template>
  <div class="debug-logger">
    <div class="header">
      <span>Debug Console</span>
      <button @click="clearLogs">Clear</button>
    </div>
    <div class="logs" ref="logsContainer">
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
  // Auto-scroll to the bottom
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
};

onMounted(() => {
  console.log = (...args) => {
    addLog('log', args);
    originalConsole.log.apply(console, args);
  };
  console.error = (...args) => {
    addLog('error', args);
    originalConsole.error.apply(console, args);
  };
  console.warn = (...args) => {
    addLog('warn', args);
    originalConsole.warn.apply(console, args);
  };
  console.info = (...args) => {
    addLog('info', args);
    originalConsole.info.apply(console, args);
  };
});

onUnmounted(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

const clearLogs = () => {
  logs.value = [];
};

const formatMessage = (message) => {
  return message.map(arg => {
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
</script>

<style scoped>
.debug-logger {
  position: fixed;
  bottom: 10px;
  left: 10px;
  width: calc(100% - 20px);
  max-width: 500px;
  height: 200px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid #444;
  border-radius: 5px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: monospace;
  font-size: 12px;
}
.header {
  background-color: #333;
  padding: 5px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.header button {
  background: #555;
  color: white;
  border: 1px solid #777;
  border-radius: 3px;
  cursor: pointer;
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
.log-item:last-child {
  border-bottom: none;
}
.log-item.error { color: #ff8080; }
.log-item.warn { color: #ffff80; }
.log-item.info { color: #80bfff; }
.log-item.log { color: #ffffff; }
.log-timestamp, .log-type {
    margin-right: 8px;
    opacity: 0.7;
}
pre.log-message {
    margin: 0;
    display: inline;
    font-family: monospace;
}
</style>
