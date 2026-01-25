import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { useDebugStore } from '@/stores/debugStore';
import { parseAiResponse } from '@/utils/messageParser';
import { formatISO } from 'date-fns';
import { usePromptBuilder } from '@/composables/chat/usePromptBuilder';

export function useAiHandler(charId, apiStore) {
  const singleStore = useSingleStore();
  const notificationStore = useNotificationStore();
  const calendarStore = useCalendarStore();
  const momentsStore = useMomentsStore();
  const debugStore = useDebugStore();
  const router = useRouter();
  const route = useRoute();
  const { buildInnerVoicePrompt } = usePromptBuilder();

  const isTyping = ref(false);

  /**
   * 处理撤回指令
   */
  const handleRevokeInstruction = (text) => {
    const revokePattern = /\[撤回\]/g;
    if (revokePattern.test(text)) {
      const charMessages = singleStore.messages[charId.value] || [];
      for (let i = charMessages.length - 1; i >= 0; i--) {
        const msg = charMessages[i];
        if (msg.sender === 'char' && !msg.isRevoked) {
          singleStore.revokeMessage(charId.value, msg.id);
          console.log(`[useAiHandler] Revoked message: ${msg.id}`);
          break;
        }
      }
      return text.replace(revokePattern, '').trim();
    }
    return text;
  };

  /**
   * 处理朋友圈互动指令
   */
  const handleMomentInteraction = (text) => {
    const interactMomentPattern = /\[互动朋友圈：(.+?)\]/g;
    let interactMatch;
    while ((interactMatch = interactMomentPattern.exec(text)) !== null) {
      try {
        const interactData = JSON.parse(interactMatch[1]);
        const { action, response } = interactData;
        
        const userMoments = momentsStore.moments.filter(m => m.userId === 'user');
        if (userMoments.length > 0) {
          const latestUserMoment = userMoments[0];
          
          if (action === 'like') {
            momentsStore.likeMoment(latestUserMoment.id, charId.value);
          } else if (action === 'comment' && response) {
            momentsStore.likeMoment(latestUserMoment.id, charId.value);
            momentsStore.addComment(latestUserMoment.id, {
              userId: charId.value,
              content: response,
              time: Date.now(),
            });
          }
        }
      } catch (e) {
        console.error('[useAiHandler] Failed to parse moment interaction data:', e);
      }
    }
    return text.replace(interactMomentPattern, '').trim();
  };

  /**
   * 处理发布朋友圈指令
   */
  const handlePostMoment = (text) => {
    const momentPattern = /\[朋友圈：(.+?)\]/g;
    let momentMatch;
    while ((momentMatch = momentPattern.exec(text)) !== null) {
      try {
        const momentData = JSON.parse(momentMatch[1]);
        const { text: contentText, imageDescription } = momentData;
        
        const images = [];
        if (imageDescription) {
          images.push({ content: imageDescription, isTextGenerated: true });
        }

        if (contentText || images.length > 0) {
          momentsStore.addMoment({
            userId: charId.value,
            content: contentText || '',
            images: images,
            time: Date.now(),
          });
        }
      } catch (e) {
        console.error('[useAiHandler] Failed to parse moment data:', e);
      }
    }
    return text.replace(momentPattern, '').trim();
  };

  /**
   * 处理待办事项指令
   */
  const handleTodoInstruction = (text) => {
    const todoPattern = /\[待办：(?:((?:\d{4}-\d{2}-\d{2}\s)?\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2})\s)?(.+?)\]/g;
    let match;
    while ((match = todoPattern.exec(text)) !== null) {
      const dateTimeStr = match[1];
      const todoContent = match[2].trim();
      
      let targetDate = new Date();
      let timeStr = '';

      if (dateTimeStr) {
         if (dateTimeStr.includes('-')) {
             if (dateTimeStr.includes(':')) {
                 const [datePart, timePart] = dateTimeStr.split(/\s+/);
                 targetDate = new Date(datePart);
                 timeStr = timePart;
             } else {
                 targetDate = new Date(dateTimeStr);
                 timeStr = '';
             }
         } else {
             timeStr = dateTimeStr;
         }
      } else {
          const now = new Date();
          const delays = [15, 30, 60];
          const randomDelay = delays[Math.floor(Math.random() * delays.length)];
          now.setMinutes(now.getMinutes() + randomDelay);
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          timeStr = `${hours}:${minutes}`;
      }

      if (todoContent) {
        let finalContent = todoContent.substring(0, 18) + (todoContent.length > 18 ? '...' : '');
        calendarStore.addEvent({
          type: 'todo',
          title: finalContent,
          content: finalContent,
          date: formatISO(targetDate, { representation: 'date' }),
          done: false,
          time: timeStr
        });
      }
    }
    return text.replace(todoPattern, '').trim();
  };

  /**
   * 生成并保存心声
   */
  const generateAndSaveInnerVoice = async () => {
    try {
      const character = singleStore.getCharacter(charId.value);
      if (!character) {
        return;
      }

      const voices = singleStore.innerVoices[charId.value] || [];
      const latestIndex = voices[0]?.title.match(/#(\d+)/)?.[1];
      let nextIndex = (latestIndex ? parseInt(latestIndex, 10) : voices.length) + 1;

      // 获取上一条心声
      const previousVoice = voices.length > 0 ? voices[0] : null;

      // 使用更少的消息来生成心声，防止因主回复过长导致上下文溢出
      const recentMessages = singleStore.getFormattedRecentMessages(charId.value, 3);
      const prompt = buildInnerVoicePrompt(character, recentMessages, nextIndex, previousVoice);
      
      const { content: voiceResponse, usage: voiceUsage } = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }], {});
      debugStore.addTokenUsage(voiceUsage);

      if (voiceResponse) {
        // 移除潜在的Markdown代码块
        let cleanedResponse = voiceResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.substring(7);
        }
        if (cleanedResponse.endsWith('```')) {
          cleanedResponse = cleanedResponse.slice(0, -3);
        }
        
        const startIndex = cleanedResponse.indexOf('{');
        const endIndex = cleanedResponse.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonString = cleanedResponse.substring(startIndex, endIndex + 1);
          try {
            const voiceData = JSON.parse(jsonString);
            singleStore.addInnerVoice(charId.value, voiceData);
          } catch (e) {
            console.error('[InnerVoice] Failed to parse JSON:', e, jsonString);
          }
        }
      }
    } catch (error) {
      console.error('[useAiHandler] Failed to generate inner voice:', error);
      notificationStore.addNotification({
        type: 'error',
        message: `心声生成失败: ${error.message}`,
      });
    }
  };

  const triggerAiResponse = async () => {
    isTyping.value = true;
    let apiCallSuccessful = false; // 标志位
    try {
      const character = singleStore.getCharacter(charId.value);
      if (!character) {
        isTyping.value = false;
        return;
      }
      
      // 使用 isOnline 属性 (true:线上, false:线下)
      const isOnline = character.isOnline !== false; // 默认为线上模式

      const { content: responseText, usage: responseUsage } = await apiStore.getChatCompletion(charId.value, { 
        isOnline: isOnline // 传递在线状态
      });
      debugStore.addTokenUsage(responseUsage);
      
      if (responseText) {
        apiCallSuccessful = true; // API调用成功且有内容
        let processedText = handleRevokeInstruction(responseText);
        processedText = handleMomentInteraction(processedText);
        processedText = handlePostMoment(processedText);
        processedText = handleTodoInstruction(processedText);

        if (!processedText) {
            // 即使主回复为空，也触发心声
            // generateAndSaveInnerVoice(); 移动到 finally
            return;
        }

        const isCharBlocked = character?.isBlocked || false;
        const separatorRegex = /(?:\||\\\||｜)\s*(?:\||\\\||｜)\s*(?:\||\\\||｜)+/;
        let rawSegments = processedText.split(separatorRegex);
        if (rawSegments.length === 1 && processedText.includes('\n')) {
            rawSegments = processedText.split('\n').map(s => s.trim()).filter(s => s);
        }
        
        const specialMsgPattern = /(\[(?:图片|表情包|语音|位置|转账)：.+?\])/g;
        const segments = rawSegments.flatMap(seg => seg.split(specialMsgPattern).map(s => s.trim()).filter(s => s));

        for (let i = 0; i < segments.length; i++) {
            if (i > 0) await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            let { type, content, extraData = {} } = parseAiResponse(segments[i]);

            if (type === 'transfer_accepted') {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
              singleStore.autoAcceptPendingTransfers(charId.value);
              continue;
            }

            if (type === 'sticker') {
                const sticker = singleStore.stickers.find(e => e.name === content);
                if (sticker) {
                    content = sticker.url;
                    extraData.name = sticker.name;
                } else {
                    type = 'text';
                    content = `[表情包：${content}]`;
                }
            }

            const isTextGenerated = type === 'image' && !content.startsWith('http') && !content.startsWith('data:');

            singleStore.addMessage(charId.value, {
              id: Date.now().toString() + i,
              sender: 'char',
              type: type,
              content: content,
              isTextGenerated,
              ...extraData,
              time: Date.now(),
              blocked: isCharBlocked
            });

            // A notification should be sent if the user is not actively viewing the chat.
            // This is true if they are on a different page OR if the current page is hidden (e.g., another tab).
            const isChatCurrentlyVisible = route.path === `/chat/room/${charId.value}` && !document.hidden;

            if (!isChatCurrentlyVisible) {
              singleStore.incrementUnreadCount(charId.value);
              notificationStore.triggerNotification(
                character.nickname || character.name,
                type === 'text' ? content : `[${type}]`,
                character.avatar,
                () => router.push(`/chat/room/${charId.value}`),
                3000,
                type
              );
            }
        }
      } else {
        // API调用成功但返回空内容
        apiCallSuccessful = true;
      }
    } catch (error) {
      console.error("[useAiHandler] triggerAiResponse failed:", error);
      notificationStore.addNotification({
        type: 'error',
        message: `AI 响应失败: ${error.message}`,
      });
      apiCallSuccessful = false; // API调用失败
    } finally {
      isTyping.value = false;
      if (apiCallSuccessful) {
        generateAndSaveInnerVoice();
      }
    }
  };

  return {
    isTyping,
    triggerAiResponse,
  };
}
