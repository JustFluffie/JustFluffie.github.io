import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore'; // 确保 apiStore 被正确使用
import { useNotificationStore } from '@/stores/notificationStore';
import { useCalendarStore } from '@/stores/calendarStore'; // 引入日历 store
import { useMomentsStore } from '@/stores/chat/momentsStore'; // 引入朋友圈 store
import { parseAiResponse } from '@/utils/messageParser';
import { formatISO } from 'date-fns'; // 引入日期格式化工具

// 心声生成的Prompt
const getInnerVoicePrompt = (char, chatHistory, nextIndex) => {
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
};


export function useAiResponder(charId, apiStore) {
  const singleStore = useSingleStore();
  const notificationStore = useNotificationStore();
  const calendarStore = useCalendarStore(); // 实例化日历 store
  const momentsStore = useMomentsStore(); // 实例化朋友圈 store
  const router = useRouter();
  const route = useRoute();

  const isTyping = ref(false);

  const triggerAiResponse = async () => {
    console.log('[useAiResponder] triggerAiResponse triggered');
    isTyping.value = true;
    try {
      const character = singleStore.getCharacter(charId.value);
      
      // 获取待处理的转账信息（但不立即处理，稍后混杂在消息中处理）
      const pendingTransfers = singleStore.getPendingUserTransfers(charId.value);
      console.log('[useAiResponder] Pending transfers to accept:', pendingTransfers.length);
      
      let responseText = await apiStore.getChatCompletion(charId.value);
      console.log('[useAiResponder] AI Response:', responseText);
      
      if (responseText) {
        // --- 新增：处理撤回指令 ---
        // 格式: [撤回]
        const revokePattern = /\[撤回\]/g;
        if (revokePattern.test(responseText)) {
          // 查找角色最近一条未撤回的消息
          const charMessages = singleStore.messages[charId.value] || [];
          // 从后往前找
          for (let i = charMessages.length - 1; i >= 0; i--) {
            const msg = charMessages[i];
            if (msg.sender === 'char' && !msg.isRevoked) {
              singleStore.revokeMessage(charId.value, msg.id);
              console.log(`[useAiResponder] Revoked message: ${msg.id}`);
              break; // 只撤回最近的一条
            }
          }
          // 从回复中移除撤回指令
          responseText = responseText.replace(revokePattern, '').trim();
        }
        // --- 结束：处理撤回指令 ---

        // --- 新增：处理朋友圈互动指令 ---
        const interactMomentPattern = /\[互动朋友圈：(.+?)\]/g;
        let interactMatch;
        while ((interactMatch = interactMomentPattern.exec(responseText)) !== null) {
          try {
            const interactData = JSON.parse(interactMatch[1]);
            const { action, response } = interactData;
            
            // 找到用户最新的一条朋友圈
            const userMoments = momentsStore.moments.filter(m => m.userId === 'user');
            if (userMoments.length > 0) {
              const latestUserMoment = userMoments[0]; // moments是按时间倒序的
              
              if (action === 'like') {
                momentsStore.likeMoment(latestUserMoment.id, charId.value);
                console.log(`[useAiResponder] Liked user's latest moment: ${latestUserMoment.id}`);
              } else if (action === 'comment' && response) {
                // 评论时自动点赞
                momentsStore.likeMoment(latestUserMoment.id, charId.value);
                momentsStore.addComment(latestUserMoment.id, {
                  userId: charId.value,
                  content: response,
                  time: Date.now(),
                });
                console.log(`[useAiResponder] Commented on user's latest moment: ${latestUserMoment.id}`);
              }
            }
          } catch (e) {
            console.error('[useAiResponder] Failed to parse moment interaction data:', e);
          }
        }
        // 从回复中移除指令
        responseText = responseText.replace(interactMomentPattern, '').trim();
        // --- 结束：处理朋友圈互动 ---

        // --- 新增：处理朋友圈 ---
        // 格式: [朋友圈：{"text": "...", "imageDescription": "..."}]
        const momentPattern = /\[朋友圈：(.+?)\]/g;
        let momentMatch;
        while ((momentMatch = momentPattern.exec(responseText)) !== null) {
          try {
            const momentData = JSON.parse(momentMatch[1]);
            const { text, imageDescription } = momentData;
            
            const images = [];
            if (imageDescription) {
              images.push({
                content: imageDescription,
                isTextGenerated: true
              });
            }

            if (text || images.length > 0) {
              momentsStore.addMoment({
                userId: charId.value,
                content: text || '',
                images: images,
                time: Date.now(),
              });
              console.log(`[useAiResponder] Added new moment for ${charId.value}`);
            }
          } catch (e) {
            console.error('[useAiResponder] Failed to parse moment data from AI response:', e);
          }
        }
        // 从回复中移除朋友圈指令
        responseText = responseText.replace(momentPattern, '').trim();
        // --- 结束：处理朋友圈 ---

        // --- 新增：处理待办事项 ---
        // 支持格式：[待办：YYYY-MM-DD HH:mm 内容] 或 [待办：HH:mm 内容] 或 [待办：YYYY-MM-DD 内容]
        const todoPattern = /\[待办：(?:((?:\d{4}-\d{2}-\d{2}\s)?\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2})\s)?(.+?)\]/g;
        let match;
        while ((match = todoPattern.exec(responseText)) !== null) {
          const dateTimeStr = match[1];
          const todoContent = match[2].trim();
          
          let targetDate = new Date();
          let timeStr = '';

          if (dateTimeStr) {
             if (dateTimeStr.includes('-')) {
                 // 包含日期
                 if (dateTimeStr.includes(':')) {
                     // YYYY-MM-DD HH:mm
                     const [datePart, timePart] = dateTimeStr.split(/\s+/);
                     targetDate = new Date(datePart);
                     timeStr = timePart;
                 } else {
                     // YYYY-MM-DD
                     targetDate = new Date(dateTimeStr);
                     timeStr = ''; // 全天或无具体时间
                 }
             } else {
                 // 只有时间 HH:mm
                 timeStr = dateTimeStr;
                 // targetDate 保持为今天
             }
          } else {
              // 无时间，默认为今天，随机延迟 15/30/60 分钟
              const now = new Date();
              const delays = [15, 30, 60];
              const randomDelay = delays[Math.floor(Math.random() * delays.length)];
              now.setMinutes(now.getMinutes() + randomDelay);
              // 格式化为 HH:mm
              const hours = now.getHours().toString().padStart(2, '0');
              const minutes = now.getMinutes().toString().padStart(2, '0');
              timeStr = `${hours}:${minutes}`;
          }

          if (todoContent) {
            // 截断内容，如果超过18个字
            let finalContent = todoContent;
            if (finalContent.length > 18) {
                finalContent = finalContent.substring(0, 18) + '...';
            }

            calendarStore.addEvent({
              type: 'todo',
              title: finalContent,
              content: finalContent, // 兼容 UI 组件使用 content 字段
              date: formatISO(targetDate, { representation: 'date' }),
              done: false,
              time: timeStr
            });
            console.log(`[useAiResponder] Added new todo: "${finalContent}" at ${timeStr} on ${formatISO(targetDate, { representation: 'date' })}`);
          }
        }
        // 从回复中移除待办事项指令，以免显示在聊天中
        responseText = responseText.replace(todoPattern, '').trim();
        // 如果移除后消息为空，则直接返回，不继续处理
        if (!responseText) {
            isTyping.value = false;
            generateAndSaveInnerVoice(); // 即使没有消息也尝试生成心声
            return;
        }
        // --- 结束：处理待办事项 ---

        // 确保消息数组存在
        if (!singleStore.messages[charId.value]) {
            singleStore.messages[charId.value] = [];
        }
        const isCharBlocked = character?.isBlocked || false;

        // 1. 拆分多条消息
        // 预处理：处理可能的转义字符、全角字符和空格
        // 匹配连续的3个或更多竖线（包括普通|、转义\|、全角｜），允许中间有空格
        // 这样可以兼容 |||、\|\|\|、｜｜｜、| | | 等各种变体
        const separatorRegex = /(?:\||\\\||｜)\s*(?:\||\\\||｜)\s*(?:\||\\\||｜)+/g;
        let cleanText = responseText.replace(separatorRegex, '|||');

        // 策略：首先按显式分隔符 '|||' 拆分，然后对每一段尝试按特殊消息格式拆分
        // 这样即使AI忘记使用分隔符，只要使用了特殊格式（如[图片：...]），也能被正确拆分
        let rawSegments = cleanText.split('|||');
        let segments = [];
        
        const specialMsgPattern = /(\[(?:图片|表情包|语音|位置|转账)：.+?\])/g;

        rawSegments.forEach(seg => {
            // 对每一段进行正则拆分，提取特殊消息
            const subSegments = seg.split(specialMsgPattern).map(s => s.trim()).filter(s => s);
            segments.push(...subSegments);
        });

        // 2. 依次处理每条消息
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            // 模拟打字/发送延迟 (第一条消息立即发送，后续消息有间隔)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
            }

            // 解析消息类型
            let { type, content } = parseAiResponse(segment);
            let extraData = {};

            // --- 新增：处理收款消息 ---
            if (type === 'transfer_accepted') {
              // 延迟一下再插入收款气泡，模拟自然的收款动作
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
              singleStore.autoAcceptPendingTransfers(charId.value);
              console.log('[useAiResponder] Transfer acceptance message processed.');
              continue; // 处理完收款后，跳过后续的消息添加逻辑
            }

            // 处理表情包：将名称转换为URL
            if (type === 'sticker') {
                const stickerName = content;
                const sticker = singleStore.stickers.find(e => e.name === stickerName);
                if (sticker) {
                    content = sticker.url; // 替换为真实URL
                    extraData.name = stickerName; // 保存名称
                } else {
                    // 如果找不到表情包，回退为文本消息，避免显示裂开的图片
                    type = 'text';
                    content = `[表情包：${stickerName}]`;
                }
            }

            // 判断是否为文字生图 (AI发送的非URL图片)
            let isTextGenerated = false;
            if (type === 'image' && !content.startsWith('http') && !content.startsWith('data:')) {
                isTextGenerated = true;
            }

            singleStore.addMessage(charId.value, {
              id: Date.now().toString() + i, // 确保ID唯一
              sender: 'char',
              type: type,
              content: content,
              isTextGenerated: isTextGenerated,
              ...extraData,
              time: Date.now(),
              blocked: isCharBlocked
            });

            // 如果当前不在该角色的聊天页面，增加未读计数并触发通知
            if (route.path !== `/chat/room/${charId.value}`) {
              singleStore.incrementUnreadCount(charId.value);
              
              notificationStore.triggerNotification(
                character.nickname || character.name,
                type === 'text' ? content : `[${type}]`, // 通知内容简略显示类型
                character.avatar,
                () => {
                  router.push(`/chat/room/${charId.value}`);
                },
                3000,
                type
              );
            }
        }
        // 如果AI没有明确回复收款，但仍有待处理转账（例如，AI的回复被过滤后变空），则在这里处理
        if (pendingTransfers.length > 0 && singleStore.getPendingUserTransfers(charId.value).length > 0) {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
          singleStore.autoAcceptPendingTransfers(charId.value);
          console.log('[useAiResponder] Fallback transfer acceptance executed at the end');
        }
      }
    } catch (error) {
      console.error("[useAiResponder] triggerAiResponse failed:", error);
    } finally {
      isTyping.value = false;
      // 在主回复流程结束后，异步生成心声，不阻塞UI
      generateAndSaveInnerVoice();
    }
  };

  const generateAndSaveInnerVoice = async () => {
    try {
      const character = singleStore.getCharacter(charId.value);
      if (!character) return;

      // 计算序号
      const voices = singleStore.innerVoices[charId.value] || [];
      let nextIndex = 1;
      if (voices.length > 0) {
        const lastTitle = voices[0].title;
        if (lastTitle) {
            const match = lastTitle.match(/#(\d+)/);
            if (match) {
                nextIndex = parseInt(match[1], 10) + 1;
            } else {
                nextIndex = voices.length + 1;
            }
        } else {
             nextIndex = voices.length + 1;
        }
      }

      // 获取最近的对话用于生成心声
      const recentMessages = singleStore.getFormattedRecentMessages(charId.value, 10);
      const prompt = getInnerVoicePrompt(character, recentMessages, nextIndex);

      // 使用通用API调用
      const voiceResponse = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }]);

      if (voiceResponse) {
        // 尝试解析JSON
        const startIndex = voiceResponse.indexOf('{');
        const endIndex = voiceResponse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonString = voiceResponse.substring(startIndex, endIndex + 1);
          const voiceData = JSON.parse(jsonString);
          singleStore.addInnerVoice(charId.value, voiceData);
          console.log('[useAiResponder] Inner voice generated and saved:', voiceData);
        } else {
          console.warn('[useAiResponder] Failed to find JSON in inner voice response.');
        }
      }
    } catch (error) {
      console.error('[useAiResponder] Failed to generate inner voice:', error);
    }
  };

  return {
    isTyping,
    triggerAiResponse,
  };
}
