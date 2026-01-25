import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useDebugStore = defineStore('debug', () => {
  const tokenUsage = reactive({
    total_tokens: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    last_request_tokens: 0,
  });

  const logs = ref([]);

  function addTokenUsage(usage) {
    if (!usage) return;
    
    const lastRequestTotal = usage.total_tokens || 0;
    tokenUsage.last_request_tokens = lastRequestTotal;
    
    tokenUsage.total_tokens += lastRequestTotal;
    tokenUsage.prompt_tokens += usage.prompt_tokens || 0;
    tokenUsage.completion_tokens += usage.completion_tokens || 0;

    addLog(`Token Usage: Prompt=${usage.prompt_tokens}, Completion=${usage.completion_tokens}, Total=${lastRequestTotal}`);
  }

  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logs.value.unshift(`[${timestamp}] ${message}`);
    if (logs.value.length > 100) {
      logs.value.pop();
    }
  }
  
  function resetTokenUsage() {
    tokenUsage.total_tokens = 0;
    tokenUsage.prompt_tokens = 0;
    tokenUsage.completion_tokens = 0;
    tokenUsage.last_request_tokens = 0;
    addLog('Token usage has been reset.');
  }

  return {
    tokenUsage,
    logs,
    addTokenUsage,
    addLog,
    resetTokenUsage,
  };
});
