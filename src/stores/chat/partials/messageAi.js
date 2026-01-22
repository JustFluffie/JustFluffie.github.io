import { useApiStore } from '@/stores/apiStore';
import { parseAiResponse } from '@/utils/messageParser';
import { useNotificationStore } from '@/stores/notificationStore';
import router from '@/router';

export const messageAiActions = {
  async triggerAiResponseForCharacter(charId) {
    const apiStore = useApiStore();
    try {
        const character = this.getCharacter(charId);
        if (!character) return;

        // 获取待处理的转账信息（但不立即处理，稍后混杂在消息中处理）
        const pendingTransfers = this.getPendingUserTransfers(charId);
        console.log('[SingleStore] Pending transfers to accept:', pendingTransfers.length);

        const responseText = await apiStore.getChatCompletion(charId);
        console.log('[SingleStore] AI Response:', responseText);
        
        if (responseText) {
            const isCharBlocked = character?.isBlocked || false;

            let rawSegments = responseText.split('|||');
            let segments = [];
            const specialMsgPattern = /(\[(?:图片|表情包|语音|位置|转账)：.+?\])/g;

            rawSegments.forEach(seg => {
                const subSegments = seg.split(specialMsgPattern).map(s => s.trim()).filter(s => s);
                segments.push(...subSegments);
            });

            // 决定在哪个位置插入收款气泡（如果有待处理转账）
            const insertTransferAfterIndex = pendingTransfers.length > 0 ? 0 : -1;
            let transferInserted = false;

            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
                }

                let { type, content } = parseAiResponse(segment);
                let extraData = {};

                // 如果角色处于线下模式，则跳过所有非文本消息
                if (character && !character.isOnline && type !== 'text') {
                  continue; // 跳过此消息段
                }

                if (type === 'sticker') {
                    const stickerName = content;
                    const sticker = this.stickers.find(e => e.name === stickerName);
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

                // 为转账消息添加 pending 状态
                if (type === 'transfer') {
                    extraData.status = 'pending';
                }

                this.addMessage(charId, {
                    id: Date.now().toString() + i,
                    sender: 'char',
                    type: type,
                    content: content,
                    isTextGenerated: isTextGenerated,
                    ...extraData,
                    timestamp: Date.now(),
                    blocked: isCharBlocked
                });

                // 在指定位置插入收款气泡（第一条消息发送后）
                if (i === insertTransferAfterIndex && !transferInserted && pendingTransfers.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
                    this.autoAcceptPendingTransfers(charId);
                    transferInserted = true;
                    console.log('[SingleStore] Transfer acceptance inserted after message', i);
                }

                // 增加未读计数
                this.incrementUnreadCount(charId);

                // 触发通知
                const notificationStore = useNotificationStore();
                const currentRoute = router.currentRoute.value;
                const isCurrentChat = currentRoute.name === 'single-chat' && currentRoute.params.id === charId;

                if (!isCurrentChat) {
                    notificationStore.triggerNotification(
                        character.name,
                        content,
                        character.avatar,
                        () => {
                            router.push({ name: 'single-chat', params: { id: charId } });
                        },
                        3000,
                        type
                    );
                }
            }
            
            // 如果消息处理完毕但还没插入收款气泡
            if (!transferInserted && pendingTransfers.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
                this.autoAcceptPendingTransfers(charId);
                console.log('[SingleStore] Transfer acceptance inserted at the end');
            }
        }
    } catch (error) {
        console.error(`[SingleStore] triggerAiResponseForCharacter failed for charId ${charId}:`, error);
    }
  },

  addMessageFromChar(charId, content) {
    const character = this.getCharacter(charId);
    if (!character) return;

    this.addMessage(charId, {
      id: Date.now().toString(),
      sender: 'char',
      type: 'text',
      content: content,
      isTextGenerated: false,
      time: Date.now(),
      blocked: character.isBlocked || false
    });

    this.incrementUnreadCount(charId);

    // 触发通知
    const notificationStore = useNotificationStore();
    const currentRoute = router.currentRoute.value;
    const isCurrentChat = currentRoute.name === 'single-chat' && currentRoute.params.id === charId;

    if (!isCurrentChat) {
        notificationStore.triggerNotification(
            character.name,
            content,
            character.avatar,
            () => {
                router.push({ name: 'single-chat', params: { id: charId } });
            },
            3000,
            'text'
        );
    }
  },

  async checkAutoSummary(charId) {
    const character = this.getCharacter(charId);
    if (!character || !character.autoSummarySettings?.enabled) {
      return;
    }

    const settings = character.autoSummarySettings;
    const currentMessageCount = this.messages[charId]?.length || 0;
    const lastSummaryCount = settings.lastSummaryCount || 0;
    const range = settings.range || 50;

    if (currentMessageCount - lastSummaryCount >= range) {
      console.log(`[AutoSummary] Triggered for ${character.name}. Current: ${currentMessageCount}, Last: ${lastSummaryCount}, Range: ${range}`);
      const result = await this.summarizeMessages(charId, {
        type: 'range',
        start: lastSummaryCount + 1,
        end: currentMessageCount
      });

      if (result.success) {
        settings.lastSummaryCount = currentMessageCount;
        this.saveData();
        console.log(`[AutoSummary] Success. New lastSummaryCount: ${currentMessageCount}`);
      } else {
        console.error(`[AutoSummary] Failed: ${result.message}`);
      }
    }
  },

  async summarizeMessages(charId, options) {
    const character = this.getCharacter(charId);
    if (!character) return { success: false, message: '角色不存在' };

    let messagesToSummarize = [];
    let summaryTitle = '核心记忆';

    switch (options.type) {
      case 'recent':
        const count = character.memoryCount || 10;
        messagesToSummarize = (this.messages[charId] || []).slice(-count);
        summaryTitle = `最近 ${count} 条消息的记忆`;
        break;
      case 'range':
        const { start, end } = options;
        const allMessages = this.messages[charId] || [];
        if (start < 1 || end > allMessages.length || start > end) {
          return { success: false, message: '无效的范围' };
        }
        messagesToSummarize = allMessages.slice(start - 1, end);
        summaryTitle = `第 ${start}-${end} 条消息的记忆`;
        break;
      case 'video':
        if (this.lastVideoCallTranscript.charId !== charId || this.lastVideoCallTranscript.messages.length === 0) {
          return { success: false, message: '没有可总结的通话记录' };
        }
        messagesToSummarize = this.lastVideoCallTranscript.messages;
        summaryTitle = '上次视频通话的核心记忆';
        break;
      default:
        return { success: false, message: '未知的总结类型' };
    }

    if (messagesToSummarize.length === 0) {
      return { success: false, message: '没有可总结的消息' };
    }

    const chatLog = messagesToSummarize.map(msg => {
      const senderName = msg.sender === 'user' ? '用户' : character.name;
      return `${senderName}: ${msg.content}`;
    }).join('\n');

    const prompt = `你是一个对话总结助手。请根据以下聊天记录，为角色“${character.name}”生成一段简短的、以第一人称视角（“我”的角度）写的核心记忆。这段记忆应该捕捉对话的关键信息、情感或决定，用于未来的回忆。\n\n聊天记录：\n${chatLog}\n\n核心记忆：`;

    try {
      const apiStore = useApiStore();
      
      // 获取预设
      let presetToUse = null;
      if (character.api && character.api !== 'default') {
          presetToUse = apiStore.presets.find(p => p.name === character.api);
      }

      const summary = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }], presetToUse);
      if (summary) {
        if (!character.memories) {
          character.memories = [];
        }
        character.memories.push({
          id: Date.now(),
          content: `【${summaryTitle}】\n${summary.trim()}`
        });
        this.saveData();
        console.log(`[Summary] Added to ${character.name}'s memory: ${summary}`);
        return { success: true, message: '总结成功！' };
      }
      return { success: false, message: 'API未能生成摘要' };
    } catch (error) {
      console.error('[Summary] Failed to generate memory:', error);
      return { success: false, message: '生成摘要时发生错误' };
    }
  },

  acceptTransfer(charId, messageId) {
    const msgs = this.messages[charId];
    if (!msgs) return;

    const transferMsg = msgs.find(m => m.id === messageId);
    
    // 注意：status 为 undefined 或 'pending' 都视为待处理状态
    const isPending = transferMsg?.status === 'pending' || transferMsg?.status === undefined;
    
    if (transferMsg && transferMsg.type === 'transfer' && isPending) {
      transferMsg.status = 'accepted';
      
      if (transferMsg.sender !== 'user') {
        // 角色发送的转账被用户收取：添加用户收款的消息气泡
        this.addMessage(charId, {
          id: Date.now().toString(),
          sender: 'user',
          type: 'transfer',
          content: transferMsg.content, // 金额
          note: transferMsg.note || '',
          status: 'accepted', // 已收款状态
          isReceived: true, // 标记这是收款消息，不是发送转账
          timestamp: Date.now()
        });
      }
      
      this.saveData();
    }
  },

  // 获取用户发送的待处理转账列表（不修改状态）
  getPendingUserTransfers(charId) {
    const msgs = this.messages[charId];
    if (!msgs) return [];
    
    return msgs.filter(
      m => m.type === 'transfer' && m.sender === 'user' && m.status === 'pending'
    );
  },

  // 自动收取用户发送的待处理转账（角色收取）
  // 返回是否有转账被收取
  autoAcceptPendingTransfers(charId) {
    const msgs = this.messages[charId];
    if (!msgs) {
      console.log('[SingleStore] autoAcceptPendingTransfers: No messages found for charId', charId);
      return false;
    }

    // 查找所有用户发送的待处理转账
    const allTransfers = msgs.filter(m => m.type === 'transfer');
    console.log('[SingleStore] All transfers:', allTransfers.map(t => ({ id: t.id, sender: t.sender, status: t.status, content: t.content })));
    
    const pendingTransfers = msgs.filter(
      m => m.type === 'transfer' && m.sender === 'user' && m.status === 'pending'
    );
    console.log('[SingleStore] Pending transfers from user:', pendingTransfers.length);

    if (pendingTransfers.length > 0) {
      const now = Date.now();
      
      pendingTransfers.forEach((transferMsg, index) => {
        // 将用户发送的转账标记为已接收
        transferMsg.status = 'accepted';
        
        // 添加角色收款的消息气泡
        // 使用稍早的时间戳确保收款消息在 AI 响应之前
        this.addMessage(charId, {
          id: `${now}-receive-${index}-${Math.random().toString(36).substr(2, 9)}`,
          sender: 'char',
          type: 'transfer',
          content: transferMsg.content, // 金额
          note: transferMsg.note || '',
          status: 'accepted', // 已收款状态
          isReceived: true, // 标记这是收款消息，不是发送转账
          timestamp: now + index // 确保每个收款消息有唯一的时间戳
        });
      });
      
      return true;
    }
    return false;
  },
};
