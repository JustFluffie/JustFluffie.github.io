import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore'; // 确保 apiStore 被正确使用
import { useNotificationStore } from '@/stores/notificationStore';
import { useCalendarStore } from '@/stores/calendarStore'; // 引入日历 store
import { parseAiResponse } from '@/utils/messageParser';
import { formatISO } from 'date-fns'; // 引入日期格式化工具

// 心声生成的Prompt
const getInnerVoicePrompt = (char, chatHistory) => {
  const historyText = chatHistory.map(msg => `${msg.role === 'user' ? '用户' : char.name}: ${msg.content}`).join('\n');

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
- **标题 (title)**: 为这次心声生成一个简短的小标题，例如“#01 初次见面”。

**输出格式 (必须是可被解析的JSON):**
{
  "emotion": "...",
  "outfit": "...",
  "posture": "...",
  "innerVoice": "...",
  "unspokenWords": "...",
  "title": "..."
}
`;
};


export function useAiResponder(charId, apiStore) {
  const singleStore = useSingleStore();
  const notificationStore = useNotificationStore();
  const calendarStore = useCalendarStore(); // 实例化日历 store
  const router = useRouter();
  const route = useRoute();

  const isTyping = ref(false);

  const triggerAiResponse = async () => {
    console.log('[useAiResponder] triggerAiResponse triggered');
    isTyping.value = true;
    try {
      const character = singleStore.getCharacter(charId.value);
      let responseText = await apiStore.getChatCompletion(charId.value);
      
      if (responseText) {
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
              // 无时间，默认为今天，无具体时间
              timeStr = new Date().toTimeString().slice(0, 5);
          }

          if (todoContent) {
            calendarStore.addEvent({
              type: 'todo',
              title: todoContent,
              content: todoContent, // 兼容 UI 组件使用 content 字段
              date: formatISO(targetDate, { representation: 'date' }),
              done: false,
              time: timeStr
            });
            console.log(`[useAiResponder] Added new todo: "${todoContent}" at ${timeStr} on ${formatISO(targetDate, { representation: 'date' })}`);
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

        if (!singleStore.messages[charId.value]) singleStore.messages[charId.value] = [];
        const isCharBlocked = character?.isBlocked || false;

        // 1. 拆分多条消息
        // 策略：首先按显式分隔符 '|||' 拆分，然后对每一段尝试按特殊消息格式拆分
        // 这样即使AI忘记使用分隔符，只要使用了特殊格式（如[图片：...]），也能被正确拆分
        let rawSegments = responseText.split('|||');
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

            singleStore.messages[charId.value].push({
              id: Date.now().toString() + i, // 确保ID唯一
              sender: 'char',
              type: type,
              content: content,
              isTextGenerated: isTextGenerated,
              ...extraData,
              time: Date.now(),
              blocked: isCharBlocked
            });
            singleStore.saveData();

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

      // 获取最近的对话用于生成心声
      const recentMessages = singleStore.getFormattedRecentMessages(charId.value, 10);
      const prompt = getInnerVoicePrompt(character, recentMessages);

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
