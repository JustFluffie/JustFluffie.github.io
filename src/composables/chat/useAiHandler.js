import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { parseAiResponse } from '@/utils/messageParser';
import { formatISO } from 'date-fns';
import { usePromptBuilder } from '@/composables/chat/usePromptBuilder';

export function useAiHandler(charId, apiStore) {
  const singleStore = useSingleStore();
  const notificationStore = useNotificationStore();
  const calendarStore = useCalendarStore();
  const momentsStore = useMomentsStore();
  const router = useRouter();
  const route = useRoute();
  const { buildInnerVoicePrompt } = usePromptBuilder();

  const isTyping = ref(false);

  /**
   * 处理撤回指令
   * 格式: [撤回]
   */
  const handleRevokeInstruction = (text) => {
    const revokePattern = /\[撤回\]/g;
    if (revokePattern.test(text)) {
      const charMessages = singleStore.messages[charId.value] || [];
      // 从后往前找最近一条未撤回的消息
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
   * 格式: [互动朋友圈：{"action":"like"}] 或 [互动朋友圈：{"action":"comment","response":"..."}]
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
            console.log(`[useAiHandler] Liked user's latest moment: ${latestUserMoment.id}`);
          } else if (action === 'comment' && response) {
            momentsStore.likeMoment(latestUserMoment.id, charId.value);
            momentsStore.addComment(latestUserMoment.id, {
              userId: charId.value,
              content: response,
              time: Date.now(),
            });
            console.log(`[useAiHandler] Commented on user's latest moment: ${latestUserMoment.id}`);
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
   * 格式: [朋友圈：{"text": "...", "imageDescription": "..."}]
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
          images.push({
            content: imageDescription,
            isTextGenerated: true
          });
        }

        if (contentText || images.length > 0) {
          momentsStore.addMoment({
            userId: charId.value,
            content: contentText || '',
            images: images,
            time: Date.now(),
          });
          console.log(`[useAiHandler] Added new moment for ${charId.value}`);
        }
      } catch (e) {
        console.error('[useAiHandler] Failed to parse moment data from AI response:', e);
      }
    }
    return text.replace(momentPattern, '').trim();
  };

  /**
   * 处理待办事项指令
   * 格式: [待办：YYYY-MM-DD HH:mm 内容] 等
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
          // 默认延迟
          const now = new Date();
          const delays = [15, 30, 60];
          const randomDelay = delays[Math.floor(Math.random() * delays.length)];
          now.setMinutes(now.getMinutes() + randomDelay);
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          timeStr = `${hours}:${minutes}`;
      }

      if (todoContent) {
        let finalContent = todoContent;
        if (finalContent.length > 18) {
            finalContent = finalContent.substring(0, 18) + '...';
        }

        calendarStore.addEvent({
          type: 'todo',
          title: finalContent,
          content: finalContent,
          date: formatISO(targetDate, { representation: 'date' }),
          done: false,
          time: timeStr
        });
        console.log(`[useAiHandler] Added new todo: "${finalContent}"`);
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
      if (!character) return;

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

      const recentMessages = singleStore.getFormattedRecentMessages(charId.value, 10);
      const prompt = buildInnerVoicePrompt(character, recentMessages, nextIndex);

      const voiceResponse = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }]);

      if (voiceResponse) {
        const startIndex = voiceResponse.indexOf('{');
        const endIndex = voiceResponse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonString = voiceResponse.substring(startIndex, endIndex + 1);
          const voiceData = JSON.parse(jsonString);
          singleStore.addInnerVoice(charId.value, voiceData);
          console.log('[useAiHandler] Inner voice generated and saved:', voiceData);
        } else {
          console.warn('[useAiHandler] Failed to find JSON in inner voice response.');
        }
      }
    } catch (error) {
      console.error('[useAiHandler] Failed to generate inner voice:', error);
    }
  };

  const triggerAiResponse = async () => {
    console.log('[useAiHandler] triggerAiResponse triggered');
    isTyping.value = true;
    try {
      const character = singleStore.getCharacter(charId.value);
      
      const pendingTransfers = singleStore.getPendingUserTransfers(charId.value);
      console.log('[useAiHandler] Pending transfers to accept:', pendingTransfers.length);
      
      let responseText = await apiStore.getChatCompletion(charId.value);
      console.log('[useAiHandler] AI Response:', responseText);
      
      if (responseText) {
        // 依次处理各种指令
        responseText = handleRevokeInstruction(responseText);
        responseText = handleMomentInteraction(responseText);
        responseText = handlePostMoment(responseText);
        responseText = handleTodoInstruction(responseText);

        if (!responseText) {
            isTyping.value = false;
            generateAndSaveInnerVoice();
            return;
        }

        if (!singleStore.messages[charId.value]) {
            singleStore.messages[charId.value] = [];
        }
        const isCharBlocked = character?.isBlocked || false;

        // 拆分消息
        const separatorRegex = /(?:\||\\\||｜)\s*(?:\||\\\||｜)\s*(?:\||\\\||｜)+/g;
        let cleanText = responseText.replace(separatorRegex, '|||');

        let rawSegments = cleanText.split('|||');
        let segments = [];
        const specialMsgPattern = /(\[(?:图片|表情包|语音|位置|转账)：.+?\])/g;

        rawSegments.forEach(seg => {
            const subSegments = seg.split(specialMsgPattern).map(s => s.trim()).filter(s => s);
            segments.push(...subSegments);
        });

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
            }

            let { type, content } = parseAiResponse(segment);
            let extraData = {};

            if (type === 'transfer_accepted') {
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
              singleStore.autoAcceptPendingTransfers(charId.value);
              console.log('[useAiHandler] Transfer acceptance message processed.');
              continue;
            }

            if (type === 'sticker') {
                const stickerName = content;
                const sticker = singleStore.stickers.find(e => e.name === stickerName);
                if (sticker) {
                    content = sticker.url;
                    extraData.name = stickerName;
                } else {
                    type = 'text';
                    content = `[表情包：${stickerName}]`;
                }
            }

            let isTextGenerated = false;
            if (type === 'image' && !content.startsWith('http') && !content.startsWith('data:')) {
                isTextGenerated = true;
            }

            singleStore.addMessage(charId.value, {
              id: Date.now().toString() + i,
              sender: 'char',
              type: type,
              content: content,
              isTextGenerated: isTextGenerated,
              ...extraData,
              time: Date.now(),
              blocked: isCharBlocked
            });

            if (route.path !== `/chat/room/${charId.value}`) {
              singleStore.incrementUnreadCount(charId.value);
              notificationStore.triggerNotification(
                character.nickname || character.name,
                type === 'text' ? content : `[${type}]`,
                character.avatar,
                () => {
                  router.push(`/chat/room/${charId.value}`);
                },
                3000,
                type
              );
            }
        }

        if (pendingTransfers.length > 0 && singleStore.getPendingUserTransfers(charId.value).length > 0) {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
          singleStore.autoAcceptPendingTransfers(charId.value);
          console.log('[useAiHandler] Fallback transfer acceptance executed at the end');
        }
      }
    } catch (error) {
      console.error("[useAiHandler] triggerAiResponse failed:", error);
    } finally {
      isTyping.value = false;
      generateAndSaveInnerVoice();
    }
  };

  return {
    isTyping,
    triggerAiResponse,
  };
}
