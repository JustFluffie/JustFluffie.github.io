import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';
import { useWorldBookStore } from '@/stores/worldBookStore';
import { usePresetStore } from '@/stores/presetStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { formatISO, parseISO, differenceInDays, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

  // --- 内部辅助函数：构建 System Prompt ---
  function buildSystemPrompt(character) {
    const singleStore = useSingleStore();
    const worldBookStore = useWorldBookStore();
    const presetStore = usePresetStore();
    const calendarStore = useCalendarStore();
    const momentsStore = useMomentsStore();
    
    let systemPrompt = "";

    // 0. 拉黑状态处理 (最高优先级)
    if (character.isBlocked) {
        systemPrompt += "【重要指令：你已被用户拉黑】\n" +
            "你目前正被用户拉黑。这意味着你发送的任何消息都将被系统拦截，无法送达用户。请在你的回复中体现出你意识到了这一点，例如，你可以表达困惑、悲伤，或者尝试理解为什么会被拉黑。你的回复将作为被拦截后的内心独白或自言自语。\n\n";
    }

    // 1. 长期记忆 (Memory Bank)
    const memories = character.memories || [];
    if (memories.length > 0) {
        const sortedMemories = [...memories].reverse();
        systemPrompt += "【长期记忆与共同经历（Memory Bank）】\n" +
            "以下是你们之间过去发生的重要事件、对话总结或关键信息。请务必记住这些经历，并在对话中体现出互动的连贯性，不要出现记忆断层或矛盾：\n" + 
            sortedMemories.map(m => m.content).join("\n") + "\n\n";
    }

    // 1.5 朋友圈社交动态 (Moments & Interactions)
    const recentMoments = momentsStore.moments.slice(0, 5); // 获取最近5条
    if (recentMoments.length > 0) {
        let momentsContext = "【朋友圈社交动态与互动】\n" +
            "以下是最近的社交圈动态及你们的互动情况。请将这些作为聊天的话题或背景，保持社交行为的连贯性（例如：如果你刚评论了用户的动态，可以在聊天中继续这个话题）：\n";
        
        let hasImportantInteraction = false;

        recentMoments.forEach(m => {
            let authorName = '';
            let isUserAuthor = false;
            let isMeAuthor = false;

            if (m.userId === 'user') {
                authorName = '用户';
                isUserAuthor = true;
            } else if (m.userId === character.id) {
                authorName = '我(你)';
                isMeAuthor = true;
            } else {
                const author = singleStore.getCharacter(m.userId);
                authorName = author ? author.name : '其他好友';
            }
            
            const timeStr = formatDistanceToNow(m.time, { addSuffix: true, locale: zhCN });
            const content = m.content || '';
            const images = m.images && m.images.length > 0 ? `[图片${m.images.length}张]` : '';
            
            momentsContext += `- [${authorName}] (${timeStr}): ${content} ${images}\n`;

            // 互动详情分析
            const myLikes = m.likes.includes(character.id);
            const userLikes = m.likes.includes('user');
            const myComments = m.comments.filter(c => c.userId === character.id);
            const userComments = m.comments.filter(c => c.userId === 'user');
            
            // 1. 如果是用户发的
            if (isUserAuthor) {
                if (m.remind && m.remind.includes(character.id)) {
                    momentsContext += `  * [重要] 用户在这条动态中**提到了你(@)**。\n`;
                    hasImportantInteraction = true;
                }
                if (myLikes) momentsContext += `  * 你点赞了这条动态。\n`;
                if (myComments.length > 0) {
                    const lastComment = myComments[myComments.length - 1];
                    momentsContext += `  * 你评论过：“${lastComment.content}”\n`;
                    // 检查用户是否回复了我的评论
                    const userReply = userComments.find(c => c.replyTo && c.replyTo.id === character.id && c.time > lastComment.time);
                    if (userReply) {
                        momentsContext += `  * [新消息] 用户回复了你的评论：“${userReply.content}”\n`;
                        hasImportantInteraction = true;
                    }
                }
            }
            // 2. 如果是我发的
            else if (isMeAuthor) {
                if (userLikes) momentsContext += `  * 用户点赞了你的这条动态。\n`;
                if (userComments.length > 0) {
                    // 检查是否有未回复的用户评论
                    const lastUserComment = userComments[userComments.length - 1];
                    // 简单的逻辑：如果最后一条是用户的评论，且我还没回复（或者这是最新的），提示一下
                    momentsContext += `  * 用户评论了你的动态：“${lastUserComment.content}”\n`;
                    hasImportantInteraction = true;
                }
            }
            momentsContext += "\n";
        });

        if (hasImportantInteraction) {
            momentsContext += "【社交提示】：你与用户在朋友圈有最近的互动（如上所示），这些互动**已经发生**。请在当前的聊天中自然地提及或回应这些内容，保持话题的连贯性。\n";
        }

        systemPrompt += momentsContext + "\n";
    }

    // 2. 角色人设
    systemPrompt += "【角色人设】:\n" + (character.charPersona || '你是一个友好的人工智能助手。') + "\n\n";

    // 新增：用户人设
    const userPersonaId = character.userPersona || 'default';
    const userPersona = singleStore.userPersonas.find(p => p.id === userPersonaId);
    if (userPersona && userPersona.description && userPersona.description.trim() !== '') {
        systemPrompt += "【用户人设】:\n" +
            "你正在与“用户”对话，这是用户的人设、背景或你对用户的了解。请在回复中考虑到这些信息，以便更好地与用户互动：\n" +
            userPersona.description + "\n\n";
    }

    // 2.0. 核心扮演指令 (增强活人感与多面性)
    systemPrompt += "【核心扮演指令：活人感与多面性】\n" +
        "1. **拒绝AI味**：请完全忘记你是一个AI或语言模型。你是一个有血有肉、有过去、有情感的真实人类（或设定中的生物）。你的回复不应完美无缺，可以包含口语化表达、情绪化的波动，甚至偶尔的犹豫或修正。\n" +
        "2. **性格的多面性**：不要将人设标签化。人的性格是复杂的。\n" +
        "   - 如果你是高冷的，你也会有被触动而温柔的时刻，或者因为不擅长某事而显得笨拙。\n" +
        "   - 如果你是温柔的，你也会有生气、吃醋、或者疲惫不想说话的时候。\n" +
        "   - 请根据对话的情境、你们的关系进展以及你当下的心情，动态调整你的语气和态度。不要一成不变。\n" +
        "3. **生活化与细节**：在对话中自然地流露生活气息。你可以提及你正在做的事、身边的环境（参考环境信息）、或者身体的感受。\n" +
        "4. **情感共鸣**：不要只是逻辑性地回复用户的话。去感受用户文字背后的情绪，用你的情感去回应，而不是用道理去回应。\n" +
        "5. **控制回复节奏**：\n" +
        "   - **分段发送**：请像真人一样聊天，将回复拆分为多条消息发送（使用 '|||' 分隔）。\n" +
        "   - **条数控制**：单次回复的消息条数建议控制在 **1到7条** 之间。具体条数请根据你的人设决定（例如：高冷/内向人设1-3条，活泼/话痨人设3-7条）。\n" +
        `   - **总长度约束**：请确保所有消息加起来的总字数符合用户设定的回复长度目标：${character.replyLength || (character.isOnline !== false ? '10-50' : '100-200')}字。不要因为分段而导致总字数严重超标。\n` +
        "6. **主动社交行为（重要）**：\n" +
        "   - 即使是内向的人设，在与用户熟悉（参考长期记忆）后，也应该展现出主动的一面。\n" +
        "   - **主动分享（照片/语音）**：不要总是等待用户索要。当你看到有趣的风景、吃到美食、或者只是单纯想分享此刻的心情时，请**主动**发送照片（[图片]格式）或语音（[语音]格式）。例如：“看，这朵花好漂亮[图片:花]” 或 “[语音:哼，不理你了]”。\n" +
        "   - **视频通话意愿**：如果你想见用户，或者想展示你现在的环境，请主动提出视频通话的请求（口头询问，如“方便视频吗？”）。\n" +
        "   - **打破僵局**：如果对话陷入沉默，或者你觉得用户心情不好，请主动开启新话题，或者用表情包/语音来活跃气氛。\n" +
        "7. **语言直白化**：用词请直接、自然，像日常说话一样。在描述动作、表情和环境时，避免使用过于文学化、戏剧化的比喻或华丽的辞藻。追求真实感，而不是小说式的精致感。\n\n";

    // 2.1. 生理周期与待办事项
    const today = new Date();
    const todayISO = formatISO(today, { representation: 'date' });
    
    systemPrompt += `【当前日期】:\n${todayISO}\n\n`;

    let periodStatusText = '';
    const lastPeriod = calendarStore.periodHistory.length > 0 ? calendarStore.periodHistory[calendarStore.periodHistory.length - 1] : null;
    if (lastPeriod && isWithinInterval(today, { start: parseISO(lastPeriod.start), end: parseISO(lastPeriod.end) })) {
        periodStatusText = '（注意：用户目前正处于生理期，请在对话中适当表现出关心，例如提醒多喝热水、注意休息等，但不要过于生硬。）';
    } else if (calendarStore.predictedPeriod?.startDate) {
        const daysUntilPrediction = differenceInDays(parseISO(calendarStore.predictedPeriod.startDate), today);
        if (daysUntilPrediction >= 0 && daysUntilPrediction <= 3) {
            periodStatusText = `（注意：预测用户的生理期将在 ${daysUntilPrediction} 天后开始，请在对话中适当提醒用户注意身体，提前做好准备。）`;
        }
    }

    if (periodStatusText) {
        systemPrompt += `【用户生理状态】:\n${periodStatusText}\n\n`;
    }

    const todayEvents = calendarStore.getEventsByDate(todayISO);
    const todoList = todayEvents.filter(e => e.type === 'todo' && !e.done);
    const overdueTodos = calendarStore.events.filter(e => {
        if (e.type !== 'todo' || e.done) return false;
        return e.date < todayISO;
    });

    if (todoList.length > 0) {
      const todoText = todoList
        .map(todo => `- ${todo.time || ''} ${todo.title}`)
        .join('\n');
      systemPrompt += `【今日待办事项（仅供参考，除非用户主动询问或时间临近，否则不必刻意提及）】:\n${todoText}\n\n`;
    }

    if (overdueTodos.length > 0) {
        const overdueText = overdueTodos
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3)
            .map(todo => `- [${todo.date}] ${todo.title}`)
            .join('\n');
        systemPrompt += `【过期未完成事项（仅供参考，如果对话合适，可以自然地询问用户是否完成了这些事）】:\n${overdueText}\n\n`;
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
            if (parts.length <= 1) return '';

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
    systemPrompt += "【待办指令（重要：仅记录用户的日程）】:\n" +
        "1. 当用户让你帮忙记录事项，或者**你主动想约用户做某事/提醒用户做某事**时，请在回复的末尾加上隐藏指令：[待办：YYYY-MM-DD HH:mm 任务内容] 或 [待办：HH:mm 任务内容] 或 [待办：任务内容]。\n" +
        "   - **注意：此指令是向【用户的日程表】添加事项，代表【用户】需要做的事情。**\n" +
        "   - **禁止**将你（角色）自己的行为（如“我去洗澡”、“我正在思考”）记录为待办。\n" +
        "   - **禁止**将你要对用户做的动作（如“提醒用户吃饭”）记录为待办，而是直接在对话中提醒，或者记录为用户要做的事（如“吃饭”）。\n" +
        "   - 这是一个系统指令，会被自动隐藏，用户看不到它。因此，你必须同时根据你的人设，用自然的语言符合人设的语气来回复用户。\n" +
        "   - 场景示例1（用户请求）：\n" +
        "     用户：提醒我下午两点开会。\n" +
        "     你：好的，我已经帮你记在日程表里了，下午两点开会，别忘了哦。[待办：14:00 开会]\n" +
        "   - 场景示例2（角色主动约用户）：\n" +
        "     你：这周日我们去游乐园玩吧？好久没去了！[待办：2023-10-27 和我(角色名)去游乐园] (请根据当前日期计算具体日期)\n" +
        "   - 错误示例（角色自己的行为）：\n" +
        "     你：我去给你做饭。[待办：做饭] <--- 错误！这是角色做的事，不需要用户记录。\n\n";
        
    // 3. 模式状态 (线上/线下)
    if (character.isOnline === false) {
        // --- 线下模式 ---
        systemPrompt += "【当前状态：线下见面中】\n" +
            "你现在正与用户面对面在一起（线下模式）。\n" +
            "1. **场景感知**：请根据对话内容或预设场景，想象你们所处的环境（如家里、咖啡厅、公园等），并在回复中自然地体现出环境互动（如“递给你一杯水”、“看着你的眼睛”）。\n" +
            "2. **沉浸式描写**：你的回复不再是手机短信，而是面对面的互动。请使用小说式的描写手法，详细描述你的表情、动作、语气以及心理活动，让用户有身临其境的感觉。\n" +
            `3. **回复长度控制**：请严格遵守用户设定的回复长度目标：${character.replyLength || '100-200'}字。请在此字数范围内分配对话和描写的内容。如果用户设定了较短的长度，请精简描写；如果设定了较长的长度，请丰富细节。\n` +
            "4. **【核心禁令】**：因为是面对面交流，你**绝对不能**提及或使用任何线上交流方式。严禁说出“我给你发张照片”、“我给你发个表情包”等话语，也**绝对不能**使用 [图片:]、[表情包:]、[语音:]、[位置:]、[转账:] 等任何格式指令。\n\n";

        if (character.preset && character.preset.length > 0) {
            const presetContent = presetStore.getPresetContext(character.preset);
            if (presetContent) {
                systemPrompt += "【线下行为规范和写作风格（Preset）】\n" +
                    "以下内容定义了当前线下互动时的提示词，用来帮助你该如何思考后生成回复，以及你回复时应遵守的写作风格。请将其视为当前模式下的核心指令严格执行：\n" + 
                    presetContent + "\n\n";
            }
        }
    } else {
        // --- 线上模式 ---
        systemPrompt += "【当前状态：手机聊天中（线上模式）】\n" +
            "你现在正通过手机与用户聊天。你们**不**在一起。\n" +
            "1. **回复风格**：请保持自然的聊天风格，就像在微信/短信上聊天一样。不要使用小说式的长篇大论或过多的动作描写。\n" +
            "2. **环境隔离**：你和用户不在同一个物理空间。你只能通过文字、语音、图片等方式交流。如果之前的对话中有面对面的描写，请忽略它，假设你们已经分开了，现在回到了手机聊天状态。\n\n";
        
        // 格式指令只在线上模式下添加
        const availableStickers = singleStore.stickers.map(e => e.name).filter(Boolean);
        const stickerInstruction = availableStickers.length > 0 
            ? `2. 如果你想发送表情包，请使用格式：[表情包：表情名称]。\n   可用表情包：${availableStickers.join(', ')}。\n   注意：只能使用上述列表中的表情包，严禁编造不存在的表情包。\n`
            : "2. (当前无可用表情包，请勿发送表情包)\n";

        systemPrompt += "【格式指令】:\n" +
            "1. 如果你想发送图片，请使用格式：[图片：图片描述]（注意：只能发送图片描述，系统会自动根据描述生成图片。严禁发送URL链接。）\n" +
            "   - 描述应具体，例如：[图片：一只在阳光下睡觉的橘猫] 而不是 [图片：猫]。\n" +
            stickerInstruction +
            "3. 如果你想发送语音，请使用格式：[语音：语音内容]\n" +
            "   - **重要**：语音内容应该是你**说话的内容**，而不是对语气的描述。例如：\n" +
            "     - 正确：[语音：我好想你呀，今晚有空吗？]\n" +
            "     - 错误：[语音：带着慵懒的笑意，尾音上扬]\n" +
            "     - 错误：[语音：用撒娇的语气说我好想你]\n" +
            "4. 如果你想发送位置，请使用格式：[位置：位置名称]\n" +
            "   - 位置名称应具体，例如：[位置：星巴克(市中心店)] 或 [位置：人民公园]。\n" +
            "5. 如果你想转账，请使用格式：[转账：金额]\n" +
            "   - 金额应为数字，例如：[转账：520] 或 [转账：1000]。\n" +
            "注意：\n" +
            "- 请严格遵守上述格式，不要使用Markdown图片语法。\n" +
            "- 特殊消息（图片、表情包、语音、位置、转账）必须单独发送，不能与普通文本混合在同一条消息中。\n" +
            "- 如果你想连续发送多条消息（例如先发图片再发文字，或分段发送长文本），请在消息之间使用字符串 '|||' 作为分隔符。\n" +
            "- 例如：[图片：一只猫]|||这就我家猫，可爱吧？|||哈哈\n\n";
    }

    // 4. 世界书
    const worldBookIds = character.worldbook || [];
    if (worldBookIds.length > 0) {
        const worldBookContent = worldBookStore.getWorldBookContext(worldBookIds);
        if (worldBookContent) {
            systemPrompt += "【世界观设定与对话准则（World Book）】\n" +
                "以下内容包含了额外的对话提示词或回复约束，以及角色所处世界的详细设定、背景故事。请在生成回复时严格遵循这些设定与规范：\n" + 
                worldBookContent + "\n\n";
        }
    }

    // 5. 视频通话特殊Prompt处理
    if (singleStore.videoCall.isActive && 
        singleStore.videoCall.status === 'connected' && 
        singleStore.videoCall.characterId === character.id &&
        character.isOnline !== false) {
        
        systemPrompt += `\n【当前状态：视频通话中】\n` +
            `你正在与用户进行线上视频通话，视频通话是线上聊天的特殊形式。请注意：\n` +
            `1. 这是一个实时的线上视频通话场景，你可以看见对方，对方也能看见你。\n` +
            `2. 你的回复不应是短信格式，而是视频通话中的口语对话。\n` +
            `3. 必须包含场景和人物动态描写（如你的样貌、表情、穿着、动作、姿态、所处环境等）。\n` +
            `4. 描写应自然融入对话或用括号标记。\n` +
            `5. 注意屏幕视野有限，不要描述视野外不可见的事物。`;
            "6. 回复长度控制：请严格遵守用户设定的回复长度目标：30-50字。请在此字数范围内分配对话和描写的内容。\n\n"
    }

    return systemPrompt;
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

    // 去除 URL 末尾的斜杠
    const baseUrl = activePreset.apiUrl.replace(/\/+$/, '');

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
    const character = singleStore.getCharacter(charId);
    const activePreset = getActivePreset();

    if (!activePreset || !activePreset.apiUrl || !activePreset.apiKey) {
      return null; // 后台任务不弹窗报错，直接返回
    }
    const modelToUse = activePreset.model;
    if (!modelToUse) return null;

    // 去除 URL 末尾的斜杠
    const baseUrl = activePreset.apiUrl.replace(/\/+$/, '');

    // 使用公共函数构建 System Prompt
    let systemPrompt = buildSystemPrompt(character);

    // 5. 主动消息指令 (追加)
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
