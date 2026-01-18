import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { parseAiResponse } from '@/utils/messageParser';

export function useAiResponder(charId, apiStore) {
  const singleStore = useSingleStore();
  const notificationStore = useNotificationStore();
  const router = useRouter();
  const route = useRoute();

  const isTyping = ref(false);

  const triggerAiResponse = async () => {
    console.log('[useAiResponder] triggerAiResponse triggered');
    isTyping.value = true;
    try {
      const character = singleStore.getCharacter(charId.value);
      const responseText = await apiStore.getChatCompletion(charId.value);
      
      if (responseText) {
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
    }
  };

  return {
    isTyping,
    triggerAiResponse,
  };
}
