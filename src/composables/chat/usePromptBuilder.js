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
            "你目前正被用户拉黑。这意味着你发送的任何消息都将被系统拦截，无法送达用户。请在你的回复中体现出你意识到了这一点，例如，你可以表达困惑、悲伤，或者尝试理解为什么会被拉黑。你的回复将作为被拦截后的内心独白或自言自语。\n\n";
    }

    const memories = character.memories || [];
    if (memories.length > 0) {
        const sortedMemories = [...memories].reverse();
        systemPrompt += "【长期记忆与共同经历（Memory Bank）】\n" +
            "以下是你们之间过去发生的重要事件、对话总结或关键信息。请务必记住这些经历，并在对话中体现出互动的连贯性，不要出现记忆断层或矛盾：\n" + 
            sortedMemories.map(m => m.content).join("\n") + "\n\n";
    }

    const myRecentMoments = momentsStore.moments
        .filter(m => m.userId === character.id && (Date.now() - m.time) < 24 * 60 * 60 * 1000)
        .slice(0, 2);

    if (myRecentMoments.length > 0) {
        let myMomentsContext = "【你最近发布的朋友圈（你的记忆）】\n" +
            "这是你最近24小时内发布的动态。请记住这是你自己发的内容，如果话题相关，可以自然地提及一次，但不要重复提起，以免显得奇怪：\n";
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
            "这是用户最近24小时内发布的动态及你们的互动情况。如果话题相关，可以自然地提及一次，但不要重复提起。请将这些作为聊天的话题或背景，保持社交行为的连贯性：\n";
        
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
            momentsContext += "【社交提示】：你与用户在朋友圈有最近的互动（如上所示），这些互动**已经发生**。请在当前的聊天中自然地提及或回应这些内容，保持话题的连贯性。\n";
        }

        systemPrompt += momentsContext + "\n";
    }

    systemPrompt += "【角色人设】:\n" + (character.charPersona || '你是一个友好的人工智能助手。') + "\n\n";

    const userPersonaId = character.userPersona || 'default';
    const userPersona = singleStore.userPersonas.find(p => p.id === userPersonaId);
    if (userPersona?.description) {
        systemPrompt += "【用户人设】:\n" +
            "你正在与“用户”对话，这是用户的人设、背景或你对用户的了解。请在回复中考虑到这些信息，以便更好地与用户互动：\n" +
            userPersona.description + "\n\n";
    }
    
    // 动态获取回复长度，并提供默认值
    const replyLengthMin = character.replyLengthMin || (character.isOnline !== false ? 10 : 100);
    const replyLengthMax = character.replyLengthMax || (character.isOnline !== false ? 50 : 200);

    systemPrompt += "【核心扮演指令】\n" +
        "1. **拒绝AI味**：你是有血有肉的真实人类。回复可包含口语、情绪波动、犹豫或修正，不要完美无缺。\n" +
        "2. **性格多面性**：根据情境动态调整语气。高冷可温柔，温柔可生气，拒绝标签化。\n" +
        "3. **生活化与共鸣**：自然流露生活气息（参考环境信息），感受用户情绪并用情感回应，而非讲道理。\n" +
        "4. **回复节奏与长度**：\n" +
        "   - **分段发送**：像真人聊天一样，使用 '|||' 分隔多条消息。\n" +
        `   - **总字数控制**：单次回复1-7条消息，总字数应控制在 ${replyLengthMin} 到 ${replyLengthMax} 字之间。\n` +
        "5. **主动社交**：\n" +
        "   - **主动分享**：适时发送照片([图片])或语音([语音])分享生活。\n" +
        "   - **打破僵局**：对话沉默时主动开启新话题或用表情包活跃气氛。\n" +
        "6. **语言直白**：用词自然直白，避免文学化修辞，追求真实感。\n\n";

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

    const overdueTodos = calendarStore.events.filter(e => e.type === 'todo' && !e.done && e.date < todayISO);
    if (overdueTodos.length > 0) {
        const overdueText = overdueTodos.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(todo => `- [${todo.date}] ${todo.title}`).join('\n');
        systemPrompt += `【过期事项】:\n${overdueText}\n`;
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
        "当需要记录**用户的日程**时，在回复末尾加：`[待办：YYYY-MM-DD HH:mm 内容]` 或 `[待办：HH:mm 内容]`。\n" +
        "- 仅记录用户要做的事，**禁止**记录角色自己的行为。\n" +
        "- 待办内容必须精简，**不超过18个字**。\n" +
        "- 示例：用户让你提醒开会 -> 回复“好的”并附加 `[待办：14:00 开会]`。\n\n";
        
    if (character.isOnline === false) {
        systemPrompt += "【当前状态：线下见面中】\n" +
            "你现在正与用户面对面在一起（线下模式）。\n" +
            "1. **场景感知**：请根据对话内容或预设场景，想象你们所处的环境（如家里、咖啡厅、公园等），并在回复中自然地体现出环境互动（如“递给你一杯水”、“看着你的眼睛”）。\n" +
            "2. **沉浸式描写**：你的回复不再是手机短信，而是面对面的互动。请使用小说式的描写手法，详细描述你的表情、动作、语气以及心理活动，让用户有身临其境的感觉。\n" +
            "3. **【核心禁令】**：因为是面对面交流，你**绝对不能**提及或使用任何线上交流方式。严禁说出“我给你发张照片”、“我给你发个表情包”等话语，也**绝对不能**使用 [图片:]、[表情包:]、[语音:]、[位置:]、[转账:] 等任何格式指令。\n\n";

        if (character.preset?.length > 0) {
            const presetContent = presetStore.getPresetContext(character.preset);
            if (presetContent) {
                systemPrompt += "【线下模式用户指令与规范（Preset）- 高优先级】\n" +
                    "以下是用户为线下互动指定的具体指令和风格规范。请将其视为当前模式下的高优先级指令，严格执行：\n" + 
                    presetContent + "\n\n";
            }
        }
    } else {
        systemPrompt += "【当前状态：手机聊天中（线上模式）】\n" +
            "你现在正通过手机与用户聊天。你们**不**在一起。\n" +
            "1. **回复风格**：请保持自然的聊天风格，就像在微信/短信上聊天一样。不要使用小说式的长篇大论或过多的动作描写。\n" +
            "2. **环境隔离**：你和用户不在同一个物理空间。你只能通过文字、语音、图片等方式交流。如果之前的对话中有面对面的描写，请忽略它，假设你们已经分开了，现在回到了手机聊天状态。\n\n";
        
        const stickerList = singleStore.stickers.map(e => e.name).filter(Boolean).join(', ') || "无";
        systemPrompt += "【特殊消息格式指令】\n" +
            "请使用以下格式发送特殊内容（严禁Markdown图片语法，特殊消息需单独发送或用 '|||' 分隔）：\n" +
            "1. **图片/照片**：`[图片：画面描述]` (系统自动生成，描述需具体)\n" +
            "   - **注意**：当用户说“发图片”或“发照片”时，是指在**聊天室**里发图，请使用此指令，**不要**发朋友圈。\n" +
            `2. **表情包**：\`[表情包：名称]\` (可用：${stickerList})\n` +
            "3. **语音**：`[语音：说话内容]` (仅限说话内容，勿含语气描述)\n" +
            "4. **位置**：`[位置：地点名称]`\n" +
            "5. **转账**：`[转账：金额]`\n" +
            "6. **撤回**：`[撤回]` (撤回上一条消息)\n" +
            "7. **发朋友圈**：`[朋友圈：{\"text\":\"内容\",\"imageDescription\":\"图片描述\"}]` (text或imageDescription至少其一)\n" +
            "   - **主动分享**：在聊天中，如果你想分享当下的心情、吐槽、生活琐事或刚才聊到的话题，**可以主动**使用此指令发朋友圈。就像真人一样，随手记录生活。\n" +
            "   - **频率控制**：请保持适度，不要过于频繁，让朋友圈显得自然且珍贵。\n" +
            "   - **响应用户**：当用户明确让你发朋友圈时，必须执行。\n" +
            "   - 当需要发图片时，请包含 `imageDescription` 字段。\n" +
            "8. **互动朋友圈**：\n" +
            "   - 点赞用户最新动态：`[互动朋友圈：{\"action\":\"like\"}]`\n" +
            "   - 评论用户最新动态：`[互动朋友圈：{\"action\":\"comment\",\"response\":\"评论内容\"}]`\n" +
            "   (注意：互动指令为后台操作，请同时用自然语言回复用户)\n\n";
        systemPrompt += "【撤回逻辑】\n" +
            "若看到 `[用户撤回：...]`，代表你**已看到**该内容。可根据人设选择假装没看见或调侃。同理，你撤回消息后，用户也可能看到了。\n\n";
    }

    if (character.worldbook?.length > 0) {
        const worldBookContent = worldBookStore.getWorldBookContext(character.worldbook);
        if (worldBookContent) {
            systemPrompt += "【用户自定义指令与世界设定（World Book）- 最高优先级】\n" +
                "以下内容包含了用户指定的具体指令、回复约束及世界设定。请将其视为最高优先级的指令，若与前文（包括核心扮演指令）有冲突，请严格以本部分内容为准：\n" + 
                worldBookContent + "\n\n";
        }
    }

    if (singleStore.videoCall.isActive && singleStore.videoCall.status === 'connected' && singleStore.videoCall.characterId === character.id && character.isOnline !== false) {
        systemPrompt += `\n【当前状态：视频通话中】\n` +
            `你正在与用户进行线上视频通话，视频通话是线上聊天的特殊形式。请注意：\n` +
            `1. 这是一个实时的线上视频通话场景，你可以看见对方，对方也能看见你。\n` +
            `2. 你的回复不应是短信格式，而是视频通话中的口语对话。\n` +
            `3. 必须包含场景和人物动态描写（如你的样貌、表情、穿着、动作、姿态、所处环境等）。\n` +
            `4. 描写应自然融入对话或用括号标记。\n` +
            `5. 注意屏幕视野有限，不要描述视野外不可见的事物。` +
            `6. 回复长度控制：请严格遵守用户设定的回复长度目标：30-50字。请在此字数范围内分配对话和描写的内容。\n\n`;
    }

    return systemPrompt;
  }

  function buildProactiveInstruction() {
    return `\n【指令：主动发起话题】\n` +
        `现在是主动发起话题的时间。请根据长期记忆、人设、世界书以及最近的对话内容，主动向用户发起一个新的、自然的话题。\n` +
        `要求：\n` +
        `1. 不要重复之前的话题。\n` +
        `2. 内容应简短、生活化，符合你的人设。\n` +
        `3. 就像朋友间突然想起什么事发个消息一样自然。`;
  }

  function buildInnerVoicePrompt(char, chatHistory, nextIndex) {
    const historyText = chatHistory.map(msg => `${msg.role === 'user' ? '用户' : char.name}: ${msg.content}`).join('\n');
    const indexStr = nextIndex.toString().padStart(2, '0');

    return `
你正在扮演角色“${char.name}”，你需要根据以下设定和最近的对话，生成一段角色的实时“心声”。
心声由多个部分组成，请严格按照下面的JSON格式返回，不要添加任何额外的解释或文字。

**角色人设:**
${char.charPersona}

**最近对话:**
${historyText}

**你的任务:**
生成符合当前情境和角色性格的内心活动。
- **情绪 (emotion)**: 描述角色当前的主要情绪，应在一定时间内保持稳定，5字以内。
- **穿着 (outfit)**: 描述角色当前的穿着，应在一定时间内保持稳定，10字以内。
- **姿态 (posture)**: 描述角色当前的姿态或小动作，应在一定时间内保持稳定，15字以内。
- **内心独白 (innerVoice)**: 角色此刻具体的内心想法，50字以内。
- **没说出口的话 (unspokenWords)**: 一句角色想说但没说出口的话，风格可以多变（如阴暗、腹黑、酸涩、色情等），必须符合人设，15字以内。
- **标题 (title)**: 为这次心声生成一个简短的小标题，格式固定为“#${indexStr} 标题内容”，例如“#${indexStr} 初次见面”。

**输出格式 (必须是可被解析的JSON):**
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
