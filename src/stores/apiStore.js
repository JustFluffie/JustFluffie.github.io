import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';
import { useWorldBookStore } from '@/stores/worldBookStore';
import { usePresetStore } from '@/stores/presetStore';
import { useCalendarStore } from '@/stores/calendarStore'; // 引入日历 store
import { formatISO } from 'date-fns'; // 引入日期格式化工具

export const useApiStore = defineStore('api', () => {
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

    // 去除 URL 末尾的斜杠，防止双斜杠问题
    const baseUrl = presetToUse.apiUrl.replace(/\/+$/, '');
    console.log(`正在从 ${baseUrl} 拉取模型列表...`);
    
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${presetToUse.apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息' }));
        const detailedMsg = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
        
        if (response.status === 429) {
             throw new Error(`API 配额已耗尽或请求过于频繁 (429)。请检查 API Key 状态。详情: ${detailedMsg}`);
        }
        throw new Error(`API 请求失败 (状态码: ${response.status}): ${detailedMsg}`);
      }

      const data = await response.json();
      console.log('API 响应数据:', JSON.stringify(data, null, 2)); // 打印 API 响应的结构
      // 增加 data.data 存在性检查，并移除 .filter(id => id.includes('gpt')) 以支持非 GPT 模型
      const fetchedModels = data.data ? data.data.map(model => model.id) : [];
      
      if (fetchedModels.length > 0) {
        models.value = [...new Set(fetchedModels)]; // 直接使用拉取到的模型列表，不再合并
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
      console.error('拉取模型失败:', error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = '网络请求失败，请检查API地址是否正确，或是否存在跨域/网络问题。';
      }
      if (!isAutoConnect) {
        alert(`拉取模型失败: ${errorMsg}`);
      }
    }
  }

  async function getChatCompletion(charId) {
    const singleStore = useSingleStore();
    const worldBookStore = useWorldBookStore();
    const presetStore = usePresetStore();
    const themeStore = useThemeStore();
    const calendarStore = useCalendarStore(); // 实例化日历 store
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

    // 去除 URL 末尾的斜杠
    const baseUrl = activePreset.apiUrl.replace(/\/+$/, '');

    // --- 构建 System Prompt ---
    // 顺序建议：长期记忆 -> 角色人设 -> 预设(线下) -> 世界书
    let systemPrompt = "";

    // 0. 拉黑状态处理 (最高优先级)
    if (character.isBlocked) {
        systemPrompt += "【重要指令：你已被用户拉黑】\n" +
            "你目前正被用户拉黑。这意味着你发送的任何消息都将被系统拦截，无法送达用户。请在你的回复中体现出你意识到了这一点，例如，你可以表达困惑、悲伤，或者尝试理解为什么会被拉黑。你的回复将作为被拦截后的内心独白或自言自语。\n\n";
    }

    // 1. 长期记忆 (Memory Bank)
    // 假设 memories 是按时间倒序存储的(最新的在前)，我们需要按时间正序提供给AI
    const memories = character.memories || [];
    if (memories.length > 0) {
        // 简单的去重或截断逻辑可以加在这里，目前全部读取
        const sortedMemories = [...memories].reverse();
        systemPrompt += "【长期记忆/故事总结】:\n" + sortedMemories.map(m => m.content).join("\n") + "\n\n";
    }

    // 2. 角色人设
    systemPrompt += "【角色人设】:\n" + (character.charPersona || '你是一个友好的人工智能助手。') + "\n\n";

    // 2.1. 新增：今日待办事项
    const today = formatISO(new Date(), { representation: 'date' });
    const todayEvents = calendarStore.getEventsByDate(today);
    const todoList = todayEvents.filter(e => e.type === 'todo' && !e.done);

    if (todoList.length > 0) {
      const todoText = todoList
        .map(todo => `- ${todo.time || ''} ${todo.title}`)
        .join('\n');
      systemPrompt += `【今日待办事项】:\n${todoText}\n\n`;
    }

    // 2.2. 实时环境信息 (Real-time Sense)
    const rts = character.realtimeSettings;
    if (rts) {
        const buildEnvString = (locationData, type, timeEnabled, weatherEnabled) => {
            if (!locationData || !locationData.shortDisplay) return '';

            const header = type === 'user' ? '【用户环境】' : '【角色环境】';
            const locationName = locationData.virtual || locationData.real || '';
            
            let timeStr = '';
            if (timeEnabled && locationData.timezone) {
                const localTime = new Date().toLocaleString("en-US", { timeZone: locationData.timezone });
                const formattedTime = new Date(localTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
                timeStr = `当地时间：${formattedTime}`;
            }

            let weatherStr = '';
            if (weatherEnabled && locationData.lastWeather) {
                weatherStr = `天气：${locationData.lastWeather}`;
            }

            const parts = [`位置：${locationName}`, timeStr, weatherStr].filter(Boolean);
            if (parts.length <= 1) return ''; // 如果只有位置信息，则不显示

            return `${header}\n${parts.join('\n')}\n\n`;
        };

        let envPrompts = '';
        envPrompts += buildEnvString(rts.userLocation, 'user', rts.timeEnabled, rts.weatherEnabled);
        envPrompts += buildEnvString(rts.charLocation, 'char', rts.timeEnabled, rts.weatherEnabled);

        if (envPrompts) {
            systemPrompt += envPrompts;
        }
    }
    
    // 2.3 格式指令
    systemPrompt += "【待办指令】:\n" +
        "1. 如果你想为用户创建待办事项，请使用格式：[待办：HH:mm 任务内容] 或 [待办：任务内容]。\n" +
        "   - 如果提供了时间，任务将按时添加；如果未提供，则使用当前时间。\n" +
        "   - 例如：[待办：14:30 开会] 或 [待办：买菜]。\n\n";
        
    const availableStickers = singleStore.stickers.map(e => e.name).filter(Boolean);
    const stickerInstruction = availableStickers.length > 0 
        ? `2. 如果你想发送表情包，请使用格式：[表情包：表情名称]。\n   可用表情包：${availableStickers.join(', ')}。\n   注意：只能使用上述列表中的表情包，严禁编造不存在的表情包。\n`
        : "2. (当前无可用表情包，请勿发送表情包)\n";

    systemPrompt += "【格式指令】:\n" +
        "1. 如果你想发送图片，请使用格式：[图片：图片描述或URL]\n" +
        stickerInstruction +
        "3. 如果你想发送语音，请使用格式：[语音：语音内容]\n" +
        "4. 如果你想发送位置，请使用格式：[位置：位置名称]\n" +
        "5. 如果你想转账，请使用格式：[转账：金额]\n" +
        "注意：\n" +
        "- 请严格遵守上述格式，不要使用Markdown图片语法。\n" +
        "- 特殊消息（图片、表情包、语音、位置、转账）必须单独发送，不能与普通文本混合在同一条消息中。\n" +
        "- 如果你想连续发送多条消息（例如先发图片再发文字，或分段发送长文本），请在消息之间使用字符串 '|||' 作为分隔符。\n" +
        "- 例如：[图片：一只猫]|||这就我家猫，可爱吧？|||哈哈\n\n";

    // 3. 预设 (仅线下模式)
    // 假设 character.isOnline === false 时为线下模式
    if (character.isOnline === false && character.preset && character.preset.length > 0) {
        const presetContent = presetStore.getPresetContext(character.preset);
        if (presetContent) systemPrompt += "【预设/补充设定】:\n" + presetContent + "\n\n";
    }

    // 4. 世界书
    const worldBookIds = character.worldbook || [];
    if (worldBookIds.length > 0) {
        const worldBookContent = worldBookStore.getWorldBookContext(worldBookIds);
        if (worldBookContent) {
            systemPrompt += "【世界书/设定参考】:\n" + worldBookContent + "\n\n";
        }
    }

    // 5. 视频通话特殊Prompt处理 (追加在最后或人设后)
    if (singleStore.videoCall.isActive && 
        singleStore.videoCall.status === 'connected' && 
        singleStore.videoCall.characterId === charId &&
        character.isOnline !== false) {
        
        systemPrompt += `\n【当前状态：视频通话中】\n` +
            `你正在与用户进行视频通话。请注意：\n` +
            `1. 这是一个实时视频通话场景，你可以看见对方，对方也能看见你。\n` +
            `2. 你的回复不应是短信格式，而是视频通话中的口语对话。\n` +
            `3. 必须包含场景和人物动态描写（如你的样貌、表情、穿着、动作、姿态、所处环境等）。\n` +
            `4. 描写应自然融入对话或用括号标记。\n` +
            `5. 注意屏幕视野有限，不要描述视野外不可见的事物。`;
    }

    const memoryCount = character.memoryCount || 10;
    // 使用 singleStore 的格式化方法处理不同类型的消息 (短期记忆)
    const formattedMessages = singleStore.getFormattedRecentMessages(charId, memoryCount);

    // 最终消息列表：System Prompt + 短期记忆
    const apiMessages = [
      { role: 'system', content: systemPrompt.trim() },
      ...formattedMessages
    ];

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activePreset.apiKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: apiMessages,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息' }));
        const detailedMsg = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
        
        if (response.status === 429) {
            let userMsg = 'API 请求过于频繁 (429)。';
            if (JSON.stringify(errorData).includes('quota') || JSON.stringify(errorData).includes('exhausted') || JSON.stringify(errorData).includes('RESOURCE_EXHAUSTED')) {
                userMsg = 'API 配额已耗尽 (429)。请检查您的 API Key 余额或更换模型。';
            }
            throw new Error(`${userMsg} 详情: ${detailedMsg}`);
        }

        throw new Error(`API 请求失败 (状态码: ${response.status}): ${detailedMsg}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error('API返回错误:', data.error);
        throw new Error(data.error.message || 'API返回了一个未知错误');
      }
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        console.error('API响应格式不符合预期:', data);
        throw new Error('API响应格式不符合预期。请检查控制台中的错误详情。');
      }
    } catch (error) {
      console.error('获取AI回复失败:', error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = '网络请求失败，请检查API地址是否正确，或是否存在跨域/网络问题。';
      }
      themeStore.showToast(`获取AI回复失败: ${errorMsg}`, 'error');
      return null;
    }
  }

  async function getGenericCompletion(messages) {
    const themeStore = useThemeStore();
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

    // 去除 URL 末尾的斜杠
    const baseUrl = activePreset.apiUrl.replace(/\/+$/, '');

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activePreset.apiKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误信息' }));
        const detailedMsg = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
        
        if (response.status === 429) {
            let userMsg = 'API 请求过于频繁 (429)。';
            if (JSON.stringify(errorData).includes('quota') || JSON.stringify(errorData).includes('exhausted') || JSON.stringify(errorData).includes('RESOURCE_EXHAUSTED')) {
                userMsg = 'API 配额已耗尽 (429)。请检查您的 API Key 余额或更换模型。';
            }
            throw new Error(`${userMsg} 详情: ${detailedMsg}`);
        }

        throw new Error(`API 请求失败 (状态码: ${response.status}): ${detailedMsg}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error('API返回错误:', data.error);
        throw new Error(data.error.message || 'API返回了一个未知错误');
      }
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        console.error('API响应格式不符合预期:', data);
        throw new Error('API响应格式不符合预期。请检查控制台中的错误详情。');
      }
    } catch (error) {
      console.error('获取AI回复失败:', error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = '网络请求失败，请检查API地址是否正确，或是否存在跨域/网络问题。';
      }
      themeStore.showToast(`获取AI回复失败: ${errorMsg}`, 'error');
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
    autoConnect, // 导出 autoConnect 方法
  };

  async function getProactiveMessage(charId) {
    const singleStore = useSingleStore();
    const worldBookStore = useWorldBookStore();
    const presetStore = usePresetStore();
    const themeStore = useThemeStore();
    const character = singleStore.getCharacter(charId);
    const activePreset = getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) {
      return null; // 后台任务不弹窗报错，直接返回
    }
    const modelToUse = activePreset.model;
    if (!modelToUse) return null;

    // 去除 URL 末尾的斜杠
    const baseUrl = activePreset.apiUrl.replace(/\/+$/, '');

    // --- 构建 System Prompt ---
    let systemPrompt = "";

    // 1. 长期记忆
    const memories = character.memories || [];
    if (memories.length > 0) {
        const sortedMemories = [...memories].reverse();
        systemPrompt += "【长期记忆/故事总结】:\n" + sortedMemories.map(m => m.content).join("\n") + "\n\n";
    }

    // 2. 角色人设
    systemPrompt += "【角色人设】:\n" + (character.charPersona || '你是一个友好的人工智能助手。') + "\n\n";

    // 3. 预设 (仅线下)
    if (character.isOnline === false && character.preset && character.preset.length > 0) {
        const presetContent = presetStore.getPresetContext(character.preset);
        if (presetContent) systemPrompt += "【预设/补充设定】:\n" + presetContent + "\n\n";
    }

    // 4. 世界书
    const worldBookIds = character.worldbook || [];
    if (worldBookIds.length > 0) {
        const worldBookContent = worldBookStore.getWorldBookContext(worldBookIds);
        if (worldBookContent) {
            systemPrompt += "【世界书/设定参考】:\n" + worldBookContent + "\n\n";
        }
    }

    // 5. 主动消息指令
    systemPrompt += `\n【指令：主动发起话题】\n` +
        `现在是主动发起话题的时间。请根据长期记忆、人设、世界书以及最近的对话内容，主动向用户发起一个新的、自然的话题。\n` +
        `要求：\n` +
        `1. 不要重复之前的话题。\n` +
        `2. 内容应简短、生活化，符合你的人设。\n` +
        `3. 就像朋友间突然想起什么事发个消息一样自然。`;

    const memoryCount = character.memoryCount || 10;
    const formattedMessages = singleStore.getFormattedRecentMessages(charId, memoryCount);

    const apiMessages = [
      { role: 'system', content: systemPrompt.trim() },
      ...formattedMessages
    ];

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activePreset.apiKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: apiMessages,
        })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('主动消息API请求失败:', response.status, errorData);
          throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('获取主动消息失败:', error);
      return null;
    }
  }
});
