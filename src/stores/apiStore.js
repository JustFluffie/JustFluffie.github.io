import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';
import { usePromptBuilder } from '@/composables/chat/usePromptBuilder';
import { apiService } from '@/services/apiService';

export const useApiStore = defineStore('api', () => {
  const { buildSystemPrompt, buildProactiveInstruction } = usePromptBuilder();
  
  // --- 持久化逻辑 ---
  // 从 localStorage 加载状态
  const savedPresets = localStorage.getItem('api_presets');
  const savedActivePresetName = localStorage.getItem('api_activePresetName');
  const savedImageHostProvider = localStorage.getItem('api_imageHostProvider');
  const savedImgbbApiKey = localStorage.getItem('api_imgbbApiKey');
  const savedCatboxUserHash = localStorage.getItem('api_catboxUserHash');

  // 状态
  const presets = reactive(
    savedPresets ? JSON.parse(savedPresets) : [
      {
        name: '默认预设',
        apiKey: '',
        apiUrl: '', // 去掉默认 URL
        model: '',
      }
    ]
  );
  const activePresetName = ref(savedActivePresetName || '默认预设');
  const models = ref([]); // 初始模型列表为空
  const imageHostProvider = ref(savedImageHostProvider || 'none');
  const imgbbApiKey = ref(savedImgbbApiKey || '');
  const catboxUserHash = ref(savedCatboxUserHash || '');

  // 保存状态到 localStorage
  function saveState() {
    localStorage.setItem('api_presets', JSON.stringify(presets));
    localStorage.setItem('api_activePresetName', activePresetName.value);
    localStorage.setItem('api_imageHostProvider', imageHostProvider.value);
    localStorage.setItem('api_imgbbApiKey', imgbbApiKey.value);
    localStorage.setItem('api_catboxUserHash', catboxUserHash.value);
  }

  // 监听状态变化并自动保存
  watch(
    [presets, activePresetName, imageHostProvider, imgbbApiKey, catboxUserHash],
    saveState,
    { deep: true }
  );

  // 获取当前激活的预设对象
  const getActivePreset = () => {
    return presets.find(p => p.name === activePresetName.value);
  };

  // Actions
  function addPreset(name, settings) {
    if (presets.some(p => p.name === name)) {
      // 更新现有预设
      const index = presets.findIndex(p => p.name === name);
      if (index !== -1) {
        presets[index] = { ...presets[index], ...settings, name };
      }
    } else {
      // 添加新预设
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
      // 如果删除的是当前激活的预设，则切换到默认预设
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
      if (!isAutoConnect) {
        alert('请先设置有效的 API URL 和 API Key！');
      }
      return;
    }

    try {
      const fetchedModels = await apiService.fetchModels(presetToUse.apiUrl, presetToUse.apiKey);
      
      if (fetchedModels.length > 0) {
        models.value = fetchedModels;
        console.log('模型列表已更新!', models.value);
        if (!isAutoConnect) {
          alert('模型列表已成功更新！');
        }
      } else {
        console.log('未找到符合条件的模型，请检查 API 响应数据。');
        if (!isAutoConnect) {
          alert('未能从API响应中解析出模型列表。请打开开发者工具(F12)，在控制台(Console)中查看 "API 响应数据" 以确定问题。');
        }
      }

    } catch (error) {
      if (!isAutoConnect) {
        alert(`拉取模型失败: ${error.message}`);
      }
    }
  }

  async function getChatCompletion(charId) {
    const singleStore = useSingleStore();
    const themeStore = useThemeStore();
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

    // 使用公共函数构建 System Prompt
    const systemPrompt = buildSystemPrompt(character);

    const memoryCount = character.memoryCount || 10;
    // 使用 singleStore 的格式化方法处理不同类型的消息 (短期记忆)
    const formattedMessages = singleStore.getFormattedRecentMessages(charId, memoryCount);

    // 最终消息列表：System Prompt + 短期记忆
    const apiMessages = [
      { role: 'system', content: systemPrompt.trim() },
      ...formattedMessages
    ];

    // 如果没有历史消息，添加一个占位符以满足API要求
    if (formattedMessages.length === 0) {
        apiMessages.push({
            role: 'user',
            content: '（用户刚刚上线）'
        });
    }

    try {
      return await apiService.fetchChatCompletion(
        activePreset.apiUrl,
        activePreset.apiKey,
        modelToUse,
        apiMessages
      );
    } catch (error) {
      themeStore.showToast(`获取AI回复失败: ${error.message}`, 'error');
      return null;
    }
  }

  async function getGenericCompletion(messages, presetOverride = null) {
    const themeStore = useThemeStore();
    const activePreset = presetOverride || getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) {
      themeStore.showToast('请先在API设置中配置有效的URL和Key', 'error');
      return null;
    }

    const modelToUse = activePreset.model;
    if (!modelToUse) {
      themeStore.showToast('请先在API设置中选择一个模型', 'error');
      return null;
    }

    try {
      return await apiService.fetchChatCompletion(
        activePreset.apiUrl,
        activePreset.apiKey,
        modelToUse,
        messages
      );
    } catch (error) {
      themeStore.showToast(`获取AI回复失败: ${error.message}`, 'error');
      return null;
    }
  }

  async function getProactiveMessage(charId) {
    const singleStore = useSingleStore();
    const character = singleStore.getCharacter(charId);
    const activePreset = getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) {
      return null; // 后台任务不弹窗报错，直接返回
    }
    const modelToUse = activePreset.model;
    if (!modelToUse) return null;

    // 使用公共函数构建 System Prompt
    let systemPrompt = buildSystemPrompt(character);

    // 追加主动消息指令
    systemPrompt += buildProactiveInstruction();

    const memoryCount = character.memoryCount || 10;
    const formattedMessages = singleStore.getFormattedRecentMessages(charId, memoryCount);

    const apiMessages = [
      { role: 'system', content: systemPrompt.trim() },
      ...formattedMessages
    ];

    // 如果没有历史消息，添加一个占位符以满足API要求
    if (formattedMessages.length === 0) {
        apiMessages.push({
            role: 'user',
            content: '（用户刚刚上线，请根据指令主动发起话题）'
        });
    }

    try {
      return await apiService.fetchChatCompletion(
        activePreset.apiUrl,
        activePreset.apiKey,
        modelToUse,
        apiMessages
      );
    } catch (error) {
      console.error('获取主动消息失败:', error);
      return null;
    }
  }

  // 在应用启动时自动连接
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
