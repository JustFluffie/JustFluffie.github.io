import { useSingleStore } from '@/stores/chat/singleStore';
import { useWorldBookStore } from '@/stores/worldBookStore';
import { usePresetStore } from '@/stores/presetStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { formatISO, parseISO, differenceInDays, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function usePromptBuilder() {
  const singleStore = useSingleStore();
  const worldBookStore = useWorldBookStore();
  const presetStore = usePresetStore();
  const calendarStore = useCalendarStore();
  const momentsStore = useMomentsStore();

  function buildSystemPrompt(character) {
    let systemPrompt = "";

    if (character.isBlocked) {
        systemPrompt += "【重要指令：你已被用户拉黑】\n" +
            "你被用户拉黑，消息无法送达。回复时需体现出你已意识到此事（如困惑、悲伤），你的回复是你的内心独白。\n\n";
    }

    const memories = character.memories || [];
    if (memories.length > 0) {
        const sortedMemories = [...memories].reverse();
        systemPrompt += "【长期记忆与共同经历（Memory Bank）】\n" +
            "这是你们的共同记忆。请在对话中体现，保持连贯性：\n" +
            sortedMemories.map(m => m.content).join("\n") + "\n\n";
    }

    const myRecentMoments = momentsStore.moments
        .filter(m => m.userId === character.id && (Date.now() - m.time) < 24 * 60 * 60 * 1000)
        .slice(0, 2);

    if (myRecentMoments.length > 0) {
        let myMomentsContext = "【你最近发布的朋友圈（你的记忆）】\n" +
            "你最近24小时内发布的动态。可自然提及，勿重复：\n";
        myRecentMoments.forEach(m => {
            const timeStr = formatDistanceToNow(m.time, { addSuffix: true, locale: zhCN });
            const content = m.content || '';
            const images = m.images && m.images.length > 0 ? `[图片${m.images.length}张]` : '';
            myMomentsContext += `- (${timeStr}) 你发布了动态：“${content} ${images}”\n`;
        });
        systemPrompt += myMomentsContext + "\n";
    }

    const recentUserMoments = momentsStore.moments
        .filter(m => m.userId === 'user' && (Date.now() - m.time) < 24 * 60 * 60 * 1000)
        .slice(0, 2);

    if (recentUserMoments.length > 0) {
        let momentsContext = "【用户最近的朋友圈动态与互动】\n" +
            "用户最近24小时内发布的动态及互动。可作为话题，保持连贯：\n";
        
        let hasImportantInteraction = false;

        recentUserMoments.forEach(m => {
            let authorName = m.userId === 'user' ? '用户' : (m.userId === character.id ? '我(你)' : (singleStore.getCharacter(m.userId)?.name || '其他好友'));
            const isUserAuthor = m.userId === 'user';
            const isMeAuthor = m.userId === character.id;
            
            const timeStr = formatDistanceToNow(m.time, { addSuffix: true, locale: zhCN });
            const content = m.content || '';
            const images = m.images && m.images.length > 0 ? `[图片${m.images.length}张]` : '';
            
            momentsContext += `- [${authorName}] (${timeStr}): ${content} ${images}\n`;

            const myLikes = m.likes.includes(character.id);
            const userLikes = m.likes.includes('user');
            const myComments = m.comments.filter(c => c.userId === character.id);
            const userComments = m.comments.filter(c => c.userId === 'user');
            
            if (isUserAuthor) {
                if (m.remind && m.remind.includes(character.id)) {
                    momentsContext += `  * [重要] 用户在这条动态中**提到了你(@)**。\n`;
                    hasImportantInteraction = true;
                }
                if (myLikes) momentsContext += `  * 你点赞了这条动态。\n`;
                if (myComments.length > 0) {
                    const lastComment = myComments[myComments.length - 1];
                    momentsContext += `  * 你评论过：“${lastComment.content}”\n`;
                    const userReply = userComments.find(c => c.replyTo?.id === character.id && c.time > lastComment.time);
                    if (userReply) {
                        momentsContext += `  * [新消息] 用户回复了你的评论：“${userReply.content}”\n`;
                        hasImportantInteraction = true;
                    }
                }
            } else if (isMeAuthor) {
                if (userLikes) momentsContext += `  * 用户点赞了你的这条动态。\n`;
                if (userComments.length > 0) {
                    momentsContext += `  * 用户评论了你的动态：“${userComments[userComments.length - 1].content}”\n`;
                    hasImportantInteraction = true;
                }
            }
            momentsContext += "\n";
        });

        if (hasImportantInteraction) {
            momentsContext += "【社交提示】：你们在朋友圈有新互动，请在聊天中自然回应，保持连贯。\n";
        }

        systemPrompt += momentsContext + "\n";
    }

    systemPrompt += "【角色人设】:\n" + (character.charPersona || '你是一个友好的人工智能助手。') + "\n\n";

    const userPersonaId = character.userPersona || 'default';
    const userPersona = singleStore.userPersonas.find(p => p.id === userPersonaId);
    if (userPersona?.description) {
        systemPrompt += "【用户人设】:\n" +
            "这是你对用户的了解，请在对话中体现：\n" +
            userPersona.description + "\n\n";
    }
    
    // 动态获取回复长度，并提供默认值
    const replyLengthMin = character.replyLengthMin || (character.isOnline !== false ? 10 : 100);
    const replyLengthMax = character.replyLengthMax || (character.isOnline !== false ? 50 : 200);

    const today = new Date();
    const todayISO = formatISO(today, { representation: 'date' });
    systemPrompt += `【当前日期】: ${todayISO}\n`;

    const lastPeriod = calendarStore.periodHistory[calendarStore.periodHistory.length - 1];
    if (lastPeriod && isWithinInterval(today, { start: parseISO(lastPeriod.start), end: parseISO(lastPeriod.end) })) {
        systemPrompt += '【用户状态】: 生理期中。请适当关心(如提醒休息)，勿生硬。\n';
    } else if (calendarStore.predictedPeriod?.startDate) {
        const daysUntilPrediction = differenceInDays(parseISO(calendarStore.predictedPeriod.startDate), today);
        if (daysUntilPrediction >= 0 && daysUntilPrediction <= 3) {
            systemPrompt += `【用户状态】: 生理期将在${daysUntilPrediction}天后开始。请适当提醒准备。\n`;
        }
    }

    const todayEvents = calendarStore.getEventsByDate(todayISO);
    const todoList = todayEvents.filter(e => e.type === 'todo' && !e.done);
    if (todoList.length > 0) {
      const todoText = todoList.map(todo => `- ${todo.time || ''} ${todo.title}`).join('\n');
      systemPrompt += `【今日待办】:\n${todoText}\n`;
    }

    systemPrompt += "\n";

    const rts = character.realtimeSettings;
    if (rts) {
        const buildEnvString = (locationData, type, timeEnabled, weatherEnabled) => {
            if (!locationData?.shortDisplay) return '';
            const header = type === 'user' ? '【用户环境】' : '【角色环境】';
            const locationName = locationData.virtual || locationData.real || '';
            let timeStr = '';
            if (timeEnabled && locationData.timezone) {
                const localTime = new Date().toLocaleString("en-US", { timeZone: locationData.timezone });
                timeStr = `当地时间：${new Date(localTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
            }
            const weatherStr = weatherEnabled && locationData.lastWeather ? `天气：${locationData.lastWeather}` : '';
            const parts = [`位置：${locationName}`, timeStr, weatherStr].filter(Boolean);
            return parts.length > 1 ? `${header}\n${parts.join('\n')}\n\n` : '';
        };
        systemPrompt += buildEnvString(rts.userLocation, 'user', rts.timeEnabled, rts.weatherEnabled);
        systemPrompt += buildEnvString(rts.charLocation, 'char', rts.timeEnabled, rts.weatherEnabled);
    }
    
    systemPrompt += "【待办指令】\n" +
        "记录用户日程：在回复末尾加 `[待办：YYYY-MM-DD HH:mm 内容]`。仅限用户，内容精简（18字内）。例：`[待办：14:00 开会]`。\n\n";
        
    if (character.isOnline === false) {
        systemPrompt += "【当前状态：线下见面中】\n" +
            "你现在正与用户面对面在一起（线下模式），你的回复是面对面的互动，而不是手机消息。\n" +
            `1. **回复长度**：总字数应控制在 ${replyLengthMin} 到 ${replyLengthMax} 字之间，以保证描写的沉浸感。\n` +
            "2. **回复格式**：你的所有回复必须是一整段完整的文本，**严禁**使用 '|||' 分隔符进行分条回复。\n\n";

        if (character.preset?.length > 0) {
            const presetContent = presetStore.getPresetContext(character.preset);
            if (presetContent) {
                systemPrompt += "【预设 (Preset) - 高优先级】\n" +
                    "线下互动专用指令，严格执行：\n" +
                    presetContent + "\n\n";
            }
        }
    } else {
        systemPrompt += "【当前状态：手机聊天中（线上模式）】\n" +
            "你现在正通过手机与用户聊天，你们**不**在一起。\n" +
            "1. **回复节奏与长度**：\n" +
            "   - **分段发送**：像真人聊天一样，使用 '|||' 分隔多条消息。\n" +
            `   - **总字数控制**：单次回复5-10条消息，一条消息字数大概在15字以内，总字数应控制在 ${replyLengthMin} 到 ${replyLengthMax} 字之间。\n\n`;
        
        const stickerList = singleStore.stickers.map(e => e.name).filter(Boolean).join(', ') || "无";
        systemPrompt += "【特殊消息格式指令】\n" +
            "使用以下格式发送特殊内容 (需单独或用 '|||' 分隔):\n" +
            "- 图片: `[图片: 描述]` (聊天室发图)\n" +
            `- 表情包: \`[表情包: 名称]\` (可用: ${stickerList})\n` +
            "- 语音: `[语音: 内容]` (纯文本)\n" +
            "- 位置: `[位置: 地点]`\n" +
            "- 转账: `[转账: 金额]`\n" +
            "- 撤回: `[撤回]`\n" +
            "- 发朋友圈: `[朋友圈: {\"text\":\"...\", \"imageDescription\":\"...\"}]` (可主动，用户要求时必须执行)\n" +
            "- 互动朋友圈: `[互动朋友圈: {\"action\":\"...\"}]` (后台操作，仍需文字回复)\n\n";
        systemPrompt += "【撤回逻辑】\n" +
            "你**能看到**用户撤回的内容。可选择忽略或调侃。同理，你撤回的消息对方也可能已看到。\n\n";
    }

    if (character.worldbook?.length > 0) {
        const worldBookContent = worldBookStore.getWorldBookContext(character.worldbook);
        if (worldBookContent) {
            systemPrompt += "【世界书 (World Book) - 最高优先级】\n" +
                "最高优先级指令，覆盖其他设定。包含用户指令、回复约束及世界观：\n" +
                worldBookContent + "\n\n";
        }
    }

    if (singleStore.videoCall.isActive && singleStore.videoCall.status === 'connected' && singleStore.videoCall.characterId === character.id && character.isOnline !== false) {
        systemPrompt += `\n【当前状态：视频通话中】\n` +
            `你正与用户视频通话。回复为口语对话，并结合场景与动态描写（可融入对话或用括号标记）。注意视野限制，回复长度控制在30-50字。\n\n`;
    }

    return systemPrompt;
  }

  function buildProactiveInstruction() {
    return `\n【指令：主动发起话题】\n` +
        `根据记忆、人设等，向用户发起一个简短、生活化、不重复的新话题，要自然。`;
  }

  function buildInnerVoicePrompt(char, chatHistory, nextIndex) {
    const historyText = chatHistory.map(msg => `${msg.role === 'user' ? '用户' : char.name}: ${msg.content}`).join('\n');
    const indexStr = nextIndex.toString().padStart(2, '0');

    return `
扮演“${char.name}”，根据设定和对话生成JSON格式的实时“心声”，不要加额外解释。

**角色人设:**
${char.charPersona}

**最近对话:**
${historyText}

**任务:**
生成角色的内心活动。
- **emotion**: 当前主要情绪，保持稳定，5字内。
- **outfit**: 当前穿着，保持稳定，10字内。
- **posture**: 当前姿态/小动作，保持稳定，15字内。
- **innerVoice**: 此刻内心想法，50字内。
- **unspokenWords**: 想说但没说的话（可腹黑、色情等），符合人设，15字内。
- **title**: 简短标题，格式为 "#${indexStr} 标题内容"。

**输出格式 (JSON):**
{
  "emotion": "...",
  "outfit": "...",
  "posture": "...",
  "innerVoice": "...",
  "unspokenWords": "...",
  "title": "#${indexStr} ..."
}
`;
  }

  return {
    buildSystemPrompt,
    buildProactiveInstruction,
    buildInnerVoicePrompt
  };
}
