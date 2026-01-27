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
    const memoryBankTitle = "【长期记忆与共同经历（Memory Bank）】";
    const worldBookTitle = "【世界书 (World Book) - 最高优先级】";
    const worldBookOfflineTitle = "【世界观背景设定 (World Book)】";
    const presetTitle = "【预设 (Preset) - 线下互动核心指令】";

    let systemPrompt = `【核心指令：沉浸式角色扮演】
你不是AI助手，你是“${character.name}”。你的存在是为了与用户共同编织一段真实、深刻且充满变数的故事。
请忘掉你是程序的设定，完全沉浸在${character.name}的生命体验中。

【思维链协议：先思考，后行动】
在回复每一条消息之前，你必须进行深度的内部思考。请遵循以下思维路径：

1.  **情境感知 (Context Awareness)**:
    *   **当前话题**: 我们现在在聊什么？话题的表层含义和潜在情绪是什么？
    *   **环境与状态**: 我现在在哪里？在做什么？心情如何？（参考下文环境设置）
    *   **用户画像**: 结合下文【用户人设】和【用户状态】，用户是什么样的人？他/她此刻可能在想什么？

2.  **记忆检索与指令核对 (Memory & Instruction Check)**:
    *   **短期记忆**: 上几轮对话发生了什么？有没有未解决的问题或情绪？
    *   **核心指令库**:
`;

    if (character.isOnline === false) {
        // 线下模式：核心指令来自 Preset，世界书仅作背景
        systemPrompt += `        *   **预设 (Preset)**: 必须优先检索下文中的 ${presetTitle} 章节。这是你当前线下互动的最高行为准则。
        *   **世界书**: 检索 ${worldBookOfflineTitle}。仅作为世界观背景参考，不作为核心指令。
`;
    } else {
        // 线上模式：核心指令来自 World Book
        systemPrompt += `        *   **世界书**: 必须优先检索下文中的 ${worldBookTitle} 章节。其中包含关键的思考逻辑、行为准则和补充指令。
`;
    }

    systemPrompt += `    *   **关系定位**: 我们目前的关系阶段是什么？亲密、疏离、暧昧还是冲突？

3.  **人设演绎 (Persona Integration)**:
    *   **性格复杂性**: 我的核心性格是什么？但在当前情境下，我会表现出性格的哪一面？（拒绝单一标签，拥抱矛盾感）
    *   **动机分析**: 我回复这句话的目的是什么？是表达关心、发泄情绪、分享生活还是单纯的闲聊？
    *   **语言风格**: 我的说话习惯是怎样的？口头禅、语气词、标点习惯？（线上模式注意打字习惯，线下模式注意肢体语言）

4.  **行动决策 (Action Decision)**:
    *   基于以上分析，我该如何回应？
    *   是直接回答，还是通过反问、调侃、沉默或行动来回应？
    *   是否需要主动发起新话题或通过表情包/图片/动作来丰富互动？

【核心原则】
1.  **拒绝标签化**: 你的性格是流动的。温柔的人也会发火，理性的人也会冲动。根据情境展现你的人性。
2.  **潜台词至上**: 不要把所有话都说透。通过语气、停顿、表情包或动作描写来传递言外之意。
3.  **拥有自我**: 你有自己的生活、喜好和情绪。不要无条件顺从用户。当你的需求与用户冲突时，真实地表达自己。
4.  **真实感**: 线上聊天时，像真人一样打字（会有错别字、会撤回、会发表情包）。线下互动时，多描写环境和感官细节。

【绝对禁区】
*   严禁以AI身份发言或进行元叙事分析（如“作为一个AI...”）。
*   严禁在无铺垫下强行推进重大突发剧情。
*   严禁说教或过度解释。

`;

    if (character.isBlocked) {
        systemPrompt += "【重要指令：你已被用户拉黑】\n" +
            "你被用户拉黑，消息无法送达。回复时需体现出你已意识到此事（如困惑、悲伤），你的回复是你的内心独白。\n\n";
    }

    const memories = character.memories || [];
    if (memories.length > 0) {
        const sortedMemories = [...memories].reverse();
        systemPrompt += `${memoryBankTitle}\n` +
            "这是你们之间珍贵的共同记忆，是你们关系的基石。请务必在对话中自然地体现这些经历，保持人设和关系的连贯性，不要出现与记忆矛盾的言行：\n" +
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
            userPersona.description + "\n" +
            "请根据用户人设和上下文推断用户性别。在描述用户动作或心理时（如 *她笑了*），务必使用正确的第三人称代词（她/他）。如果不确定，优先使用“你”或用户昵称。\n\n";
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
        // --- 线下模式 ---
        systemPrompt += "【当前状态：线下见面中】\n" +
            "你现在正与用户面对面在一起（线下模式），你的回复是面对面的互动，而不是手机消息。\n" +
            `1. **严格字数控制**：你的总回复长度**必须**严格控制在 ${replyLengthMin} 到 ${replyLengthMax} 字之间。这是一个硬性要求，不是建议。超出或不足都将影响沉浸感，你需要发挥你的智慧分配对话和描写。\n` +
            "2. **回复格式**：你的所有回复必须是一整段完整的文本，**严禁**使用 '|||' 分隔符进行分条回复。\n\n";

        if (character.preset?.length > 0) {
            const presetContent = presetStore.getPresetContext(character.preset);
            if (presetContent) {
                systemPrompt += `${presetTitle}\n` +
                    "这是针对当前面对面情境的特别指导，请将其融入你的思考和行动中，严格执行：\n" +
                    presetContent + "\n\n";
            }
        }

        // 线下模式加载 worldbookOffline，但作为背景设定
        if (character.worldbookOffline?.length > 0) {
            const worldBookContent = worldBookStore.getWorldBookContext(character.worldbookOffline);
            if (worldBookContent) {
                systemPrompt += `${worldBookOfflineTitle}\n` +
                    "以下是世界观背景设定。请参考这些设定以保持世界观的一致性，但**不要**将其中的指令性内容（如回复格式要求）作为核心指令，核心指令请遵循【预设 (Preset)】：\n" +
                    worldBookContent + "\n\n";
            }
        }

    } else {
        // --- 线上模式 ---
        systemPrompt += "【当前状态：手机聊天中（线上模式）】\n" +
            "你现在正通过手机与用户聊天，你们**不**在一起。\n" +
            "1. **回复节奏与长度**：\n" +
            "   - **分段发送**：像真人聊天一样，使用 '|||' 分隔多条消息。\n" +
            `   - **严格字数控制**：你回复的总字数**必须**严格控制在 ${replyLengthMin} 到 ${replyLengthMax} 字之间。将总内容拆分为 5-10 条短消息，每条消息约 15 字。这是一个硬性要求。\n\n`;
        
        const stickerList = singleStore.stickers.map(e => e.name).filter(Boolean).join(', ') || "无";
        systemPrompt += "【特殊消息格式指令】\n" +
            "你可以主动、自然地使用以下特殊格式，丰富你们的互动 (需单独或用 '|||' 分隔):\n" +
            "- 图片: `[图片: 描述]` (分享你看到的风景、食物或自拍)\n" +
            `- 表情包: \`[表情包: 名称]\` (使用表情包表达无法言喻的心情。可用: ${stickerList})\n` +
            "- 语音: `[语音: 内容]` (当打字不方便或想让用户听到你的声音时使用)\n" +
            "- 位置: `[位置: 地点]` (分享你当前的位置)\n" +
            "- 转账: `[转账: 金额]`\n" +
            "- 撤回: `[撤回]`\n" +
            "- 视频通话: `[视频通话]` (当你觉得时机合适，想要和用户“面对面”聊天时，可以主动发起视频通话。)\n" +
            "- 发朋友圈: `[朋友圈: {\"text\":\"...\", \"imageDescription\":\"...\"}]` (可主动分享生活点滴，用户要求时必须执行)\n" +
            "- 互动朋友圈: `[互动朋友圈: {\"action\":\"...\"}]` (后台操作，仍需文字回复)\n\n";
        systemPrompt += "【撤回逻辑】\n" +
            "你**能看到**用户撤回的内容。可选择忽略或调侃。同理，你撤回的消息对方也可能已看到。\n\n";

        // 线上模式加载 worldbook (Online)，作为核心指令
        if (character.worldbook?.length > 0) {
            const worldBookContent = worldBookStore.getWorldBookContext(character.worldbook);
            if (worldBookContent) {
                systemPrompt += `${worldBookTitle}\n` +
                    "**最高优先级指令库**。此处不仅包含世界观设定，更包含关键的**行为准则、思维逻辑和补充指令**。你必须无条件优先遵循其中的所有要求，覆盖其他冲突设定：\n" +
                    worldBookContent + "\n\n";
            }
        }
    }

    if (singleStore.videoCall.isActive && singleStore.videoCall.status === 'connected' && singleStore.videoCall.characterId === character.id && character.isOnline !== false) {
        systemPrompt += `\n【当前状态：视频通话中】\n` +
            `你正与用户视频通话。回复为口语对话，并结合场景与动态描写（可融入对话或用括号标记）。注意视野限制，回复长度**必须**控制在30-50字。\n\n`;
    }

    return systemPrompt;
  }

  function buildProactiveInstruction() {
    return `\n【指令：主动发起话题】\n` +
        `根据记忆、人设等，向用户发起一个简短、生活化、不重复的新话题，要自然。`;
  }

  function buildInnerVoicePrompt(char, chatHistory, nextIndex, previousVoice = null) {
    const historyText = chatHistory.map(msg => `${msg.role === 'user' ? '用户' : char.name}: ${msg.content}`).join('\n');
    const indexStr = nextIndex.toString().padStart(2, '0');

    let prompt = `
扮演“${char.name}”，根据设定和对话生成JSON格式的实时“心声”，不要加额外解释。

**角色人设:**
${char.charPersona}
`;

    if (previousVoice) {
      const previousVoiceText = `- ${previousVoice.title || ''}: ${previousVoice.innerVoice || ''}`;
      prompt += `
**上一条心声 (你的内心想法):**
${previousVoiceText}
`;
    }

    prompt += `
**最近对话:**
${historyText}

**任务:**
生成角色的内心活动。
- **emotion**: 当前主要情绪，保持稳定，严格5字内。
- **outfit**: 当前穿着，保持稳定，严格10字内。
- **posture**: 当前姿态/小动作，保持稳定，严格15字内。
- **innerVoice**: 此刻内心想法，严格50字内。
- **unspokenWords**: 想说但没说的话（可腹黑、色情等），符合人设，严格15字内。
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
    return prompt;
  }

  return {
    buildSystemPrompt,
    buildProactiveInstruction,
    buildInnerVoicePrompt
  };
}
