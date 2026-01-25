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
      if (!character) return;

      const voices = singleStore.innerVoices[charId.value] || [];
      let nextIndex = (voices[0]?.title.match(/#(\d+)/)?.[1] || voices.length) + 1;

      const recentMessages = singleStore.getFormattedRecentMessages(charId.value, 10);
      const prompt = buildInnerVoicePrompt(character, recentMessages, nextIndex);
      
      const voiceResponse = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }], { max_tokens: 500 });

      if (voiceResponse) {
        const startIndex = voiceResponse.indexOf('{');
        const endIndex = voiceResponse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonString = voiceResponse.substring(startIndex, endIndex + 1);
          const voiceData = JSON.parse(jsonString);
          singleStore.addInnerVoice(charId.value, voiceData);
        }
      }
    } catch (error) {
      console.error('[useAiHandler] Failed to generate inner voice:', error);
    }
  };

  const triggerAiResponse = async () => {
    isTyping.value = true;
    try {
      const character = singleStore.getCharacter(charId.value);
      if (!character) {
        isTyping.value = false;
        return;
      }
      
      // --- 修正后的动态 max_tokens 计算 ---
      const activePreset = apiStore.getActivePreset();
      const presetMaxTokens = activePreset?.max_tokens || 1500;

      // 使用 isOnline 属性 (true:线上, false:线下)
      const isOnline = character.isOnline !== false; // 默认为线上模式
      const replyLength = character.replyLength || { min: 10, max: 50 }; // 默认线上长度
      const replyLengthMin = character.replyLengthMin || replyLength.min;
      const replyLengthMax = character.replyLengthMax || replyLength.max;

      let calculatedTokens;
      if (isOnline) {
        calculatedTokens = (replyLengthMin + replyLengthMax) || 100;
      } else { // offline
        calculatedTokens = (replyLengthMin + replyLengthMax) * 2;
      }
      
      const finalMaxTokens = Math.min(presetMaxTokens, Math.max(50, calculatedTokens));
      // --- 结束计算 ---

      let responseText = await apiStore.getChatCompletion(charId.value, { max_tokens: finalMaxTokens });
      
      if (responseText) {
        responseText = handleRevokeInstruction(responseText);
        responseText = handleMomentInteraction(responseText);
        responseText = handlePostMoment(responseText);
        responseText = handleTodoInstruction(responseText);

        if (!responseText) {
            generateAndSaveInnerVoice();
            return;
        }

        const isCharBlocked = character?.isBlocked || false;
        const separatorRegex = /(?:\||\\\||｜)\s*(?:\||\\\||｜)\s*(?:\||\\\||｜)+/;
        let rawSegments = responseText.split(separatorRegex);
        if (rawSegments.length === 1) {
            rawSegments = responseText.split(/\n\s*\n/).map(s => s.trim()).filter(s => s);
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

            if (route.path !== `/chat/room/${charId.value}`) {
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
      }
    } catch (error) {
      console.error("[useAiHandler] triggerAiResponse failed:", error);
    } finally {
      isTyping.value = false;
      if (responseText) generateAndSaveInnerVoice();
    }
  };

  return {
    isTyping,
    triggerAiResponse,
  };
}
