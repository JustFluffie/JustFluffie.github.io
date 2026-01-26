import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';
import { useDebugStore } from '@/stores/debugStore'; // 引入 Debug Store
import { usePromptBuilder } from '@/composables/chat/usePromptBuilder';
import { apiService } from '@/services/apiService';

export const useApiStore = defineStore('api', () => {
  const { buildSystemPrompt, buildProactiveInstruction } = usePromptBuilder();
  
  // --- 持久化逻辑 ---
  const savedPresets = localStorage.getItem('api_presets');
  const savedActivePresetName = localStorage.getItem('api_activePresetName');
  const savedImageHostProvider = localStorage.getItem('api_imageHostProvider');
  const savedImgbbApiKey = localStorage.getItem('api_imgbbApiKey');
  const savedCatboxUserHash = localStorage.getItem('api_catboxUserHash');

  const initialPresets = savedPresets ? JSON.parse(savedPresets) : [
    {
      name: '默认预设',
      apiKey: '',
      apiUrl: '',
      model: '',
      masterPrompt: '',
    }
  ];

  initialPresets.forEach(preset => {
    if (preset.masterPrompt === undefined) {
      preset.masterPrompt = '';
    }
  });

  const presets = reactive(initialPresets);
  const activePresetName = ref(savedActivePresetName || '默认预设');
  const models = ref([]);
  const imageHostProvider = ref(savedImageHostProvider || 'none');
  const imgbbApiKey = ref(savedImgbbApiKey || '');
  const catboxUserHash = ref(savedCatboxUserHash || '');

  function saveState() {
    localStorage.setItem('api_presets', JSON.stringify(presets));
    localStorage.setItem('api_activePresetName', activePresetName.value);
    localStorage.setItem('api_imageHostProvider', imageHostProvider.value);
    localStorage.setItem('api_imgbbApiKey', imgbbApiKey.value);
    localStorage.setItem('api_catboxUserHash', catboxUserHash.value);
  }

  watch(
    [presets, activePresetName, imageHostProvider, imgbbApiKey, catboxUserHash],
    saveState,
    { deep: true }
  );

  const getActivePreset = () => {
    return presets.find(p => p.name === activePresetName.value);
  };

  function addPreset(name, settings) {
    const index = presets.findIndex(p => p.name === name);
    if (index !== -1) {
      presets[index] = { ...presets[index], ...settings, name };
    } else {
      presets.push({ name, ...settings });
    }
    activePresetName.value = name;
    saveState();
  }

  function deletePreset(name) {
    if (name === '默认预设') {
      alert('不能删除默认预设！');
      return;
    }
    const index = presets.findIndex(p => p.name === name);
    if (index !== -1) {
      presets.splice(index, 1);
      if (activePresetName.value === name) {
        activePresetName.value = '默认预设';
      }
      saveState();
    }
  }

  function switchPreset(name) {
    if (presets.some(p => p.name === name)) {
      activePresetName.value = name;
      saveState();
    }
  }

  async function fetchModels(presetOverride = null, isAutoConnect = false) {
    const presetToUse = presetOverride || getActivePreset();
    if (!presetToUse || !presetToUse.apiUrl || !presetToUse.apiKey) {
      if (!isAutoConnect) alert('请先设置有效的 API URL 和 API Key！');
      return;
    }
    try {
      const fetchedModels = await apiService.fetchModels(presetToUse.apiUrl, presetToUse.apiKey);
      if (fetchedModels.length > 0) {
        models.value = fetchedModels;
        console.log('模型列表已更新!', models.value);
        if (!isAutoConnect) alert('模型列表已成功更新！');
      } else {
        console.log('未找到符合条件的模型，请检查 API 响应数据。');
        if (!isAutoConnect) alert('未能从API响应中解析出模型列表。请打开开发者工具(F12)，在控制台(Console)中查看 "API 响应数据" 以确定问题。');
      }
    } catch (error) {
      if (!isAutoConnect) alert(`拉取模型失败: ${error.message}`);
    }
  }

  async function getChatCompletion(charId, options = {}) {
    const singleStore = useSingleStore();
    const themeStore = useThemeStore();
    const debugStore = useDebugStore(); // 获取 Debug Store 实例
    const character = singleStore.getCharacter(charId);
    const activePreset = getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) {
      themeStore.showToast('请先在API设置中配置有效的URL和Key', 'error');
      return null;
    }
    const modelToUse = activePreset.model;
    if (!modelToUse) {
      themeStore.showToast('请先在API设置中选择一个模型', 'error');
      return null;
    }

    const systemPrompt = buildSystemPrompt(character);
    debugStore.addLog(`--- System Prompt for ${character.name} ---\n${systemPrompt}\n--------------------`);

    // --- 动态上下文长度调整 ---
    // 目标：为线下模式的长回复腾出token空间
    const baseMemoryCount = character.memoryCount || 15; // 获取用户设置的上下文长度, 默认为15
    const isOnline = options.isOnline !== false; // 从 useAiHandler 传入，默认为线上
    
    let finalMemoryCount = baseMemoryCount;
    if (!isOnline) {
      // 如果是线下模式，将上下文消息数量减半，但最少保留4条，以防上下文丢失
      finalMemoryCount = Math.max(4, Math.floor(baseMemoryCount / 2));
    }

    const formattedMessages = singleStore.getFormattedRecentMessages(charId, finalMemoryCount);
    
    const finalSystemPrompt = (activePreset.masterPrompt ? activePreset.masterPrompt.trim() + '\n' : '') + systemPrompt.trim();

    const apiMessages = [{ role: 'system', content: finalSystemPrompt }, ...formattedMessages];
    if (formattedMessages.length === 0) {
      apiMessages.push({ role: 'user', content: '（用户刚刚上线）' });
    }

    const maxTokens = options.max_tokens;

    try {
      const response = await apiService.fetchChatCompletion(
        activePreset.apiUrl,
        activePreset.apiKey,
        modelToUse,
        apiMessages,
        maxTokens
      );
      if (response.content) {
        debugStore.addLog(`--- AI Raw Response ---\n${response.content}\n--------------------`);
      }
      return response; // 返回完整的响应对象
    } catch (error) {
      themeStore.showToast(`获取AI回复失败: ${error.message}`, 'error');
      return { content: null, usage: null };
    }
  }

  async function getGenericCompletion(messages, options = {}) {
    const themeStore = useThemeStore();
    const debugStore = useDebugStore();
    const activePreset = options.preset || getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) {
      themeStore.showToast('请先在API设置中配置有效的URL和Key', 'error');
      return null;
    }
    const modelToUse = activePreset.model;
    if (!modelToUse) {
      themeStore.showToast('请先在API设置中选择一个模型', 'error');
      return null;
    }
    
    const maxTokens = options.max_tokens;

    try {
      const response = await apiService.fetchChatCompletion(
        activePreset.apiUrl,
        activePreset.apiKey,
        modelToUse,
        messages,
        maxTokens
      );
      if (response.content) {
        debugStore.addLog(`--- AI Generic Raw Response (Inner Voice) ---\n${response.content}\n--------------------`);
      }
      return response; // 返回完整的响应对象
    } catch (error) {
      if (!options.silent) {
        themeStore.showToast(`获取AI回复失败: ${error.message}`, 'error');
      }
      return { content: null, usage: null, error }; // 返回 error 对象以便调用者检查
    }
  }

  async function getProactiveMessage(charId, options = {}) {
    const singleStore = useSingleStore();
    const character = singleStore.getCharacter(charId);
    const activePreset = getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) return null;
    const modelToUse = activePreset.model;
    if (!modelToUse) return null;

    let systemPrompt = buildSystemPrompt(character) + buildProactiveInstruction();
    const memoryCount = character.memoryCount || 10;
    const formattedMessages = singleStore.getFormattedRecentMessages(charId, memoryCount);

    const finalSystemPrompt = (activePreset.masterPrompt ? activePreset.masterPrompt.trim() + '\n' : '') + systemPrompt.trim();

    const apiMessages = [{ role: 'system', content: finalSystemPrompt }, ...formattedMessages];
    if (formattedMessages.length === 0) {
      apiMessages.push({ role: 'user', content: '（用户刚刚上线，请根据指令主动发起话题）' });
    }

    const maxTokens = options.max_tokens;

    try {
      const response = await apiService.fetchChatCompletion(
        activePreset.apiUrl,
        activePreset.apiKey,
        modelToUse,
        apiMessages,
        maxTokens
      );
      return response; // 返回完整的响应对象
    } catch (error) {
      console.error('获取主动消息失败:', error);
      return { content: null, usage: null };
    }
  }

  async function autoConnect() {
    console.log('尝试自动连接并获取模型列表...');
    await fetchModels(null, true);
  }

  return {
    presets,
    activePresetName,
    models,
    imageHostProvider,
    imgbbApiKey,
    catboxUserHash,
    getActivePreset,
    addPreset,
    deletePreset,
    switchPreset,
    fetchModels,
    getChatCompletion,
    getGenericCompletion,
    getProactiveMessage,
    autoConnect,
  };
});
