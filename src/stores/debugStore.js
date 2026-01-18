import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useDebugStore = defineStore('debug', () => {
  const isVisible = ref(false);
  const messages = reactive([]);

  // 限制最大消息数量，防止内存溢出
  const MAX_MESSAGES = 200;

  function addMessage(level, content) {
    const timestamp = new Date().toLocaleTimeString();
    messages.unshift({
      id: Date.now() + Math.random(),
      level, // 'log', 'warn', 'error', 'info'
      content,
      timestamp,
    });

    // 如果消息数量超过上限，则移除最旧的消息
    if (messages.length > MAX_MESSAGES) {
      messages.pop();
    }
  }

  function clearMessages() {
    messages.length = 0;
  }

  function show() {
    isVisible.value = true;
  }

  function hide() {
    isVisible.value = false;
  }

  function toggle() {
    isVisible.value = !isVisible.value;
  }

  return {
    isVisible,
    messages,
    addMessage,
    clearMessages,
    show,
    hide,
    toggle,
  };
});
