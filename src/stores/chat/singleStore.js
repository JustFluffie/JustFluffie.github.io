import { defineStore } from 'pinia';
import LZString from 'lz-string';
import { useApiStore } from '@/stores/apiStore';
import { parseAiResponse } from '@/utils/messageParser';
import { useNotificationStore } from '@/stores/notificationStore';
import router from '@/router';

const defaultStickers = [];

export const useSingleStore = defineStore('singleChat', {
  state: () => ({
    characters: [],
    messages: {}, // { charId: [message] }
    unreadCounts: {}, // { charId: count }
    stickers: [],
    userPersonas: [],
    bubblePresets: [], // 气泡样式预设
    favorites: [], // 收藏

    // 新增：实时心声
    innerVoices: {}, // { charId: [voice] }
    currentInnerVoice: {}, // { charId: voice }

    // 全局视频通话状态 (单聊)
    videoCall: {
      isActive: false,
      isMinimized: false,
      status: 'idle', // idle, waiting, connected
      characterId: null,
      duration: 0,
      timerInterval: null,
      connectTimer: null,
      initiatedBy: null, // 'user' or 'character'
    },

    // 保存上次视频通话的聊天记录，用于手动总结
    lastVideoCallTranscript: { 
      charId: null,
      messages: []
    },
  }),
  
  actions: {
    initData() {
      const savedChat = localStorage.getItem('aiPhoneSingleChatData');
      // 兼容旧数据：如果新key没有数据，尝试读取旧key
      const oldChat = localStorage.getItem('aiPhoneChatData');
      
      const dataToLoad = savedChat || oldChat;

      if (dataToLoad) {
        let data;
        try {
          const decompressed = LZString.decompressFromUTF16(dataToLoad);
          data = decompressed ? JSON.parse(decompressed) : JSON.parse(dataToLoad);
          
          this.characters = data.characters || [];
          this.messages = data.messages || {};
          this.unreadCounts = data.unreadCounts || {};
          // 迁移 emojis -> stickers
          this.stickers = data.stickers || [...defaultStickers];
          this.userPersonas = data.userPersonas || [];
          this.bubblePresets = data.bubblePresets || [];
          this.favorites = data.favorites || [];
          this.innerVoices = data.innerVoices || {};
          this.lastVideoCallTranscript = data.lastVideoCallTranscript || { charId: null, messages: [] };
          
          // 如果是从旧数据迁移，保存到新位置
          if (!savedChat && oldChat) {
              this.saveData();
          }
        } catch (e) {
          console.error("Failed to parse single chat data", e);
          this.characters = [];
          this.messages = {};
          this.stickers = [...defaultStickers];
          this.userPersonas = [];
          this.favorites = [];
          this.innerVoices = {};
        }
      } else {
        this.stickers = [...defaultStickers];
      }
    },
    
    saveData() {
      // 使用 setTimeout 将保存操作移出主线程，避免大数据量时造成UI卡顿
      setTimeout(() => {
        const data = {
          characters: this.characters,
          messages: this.messages,
          unreadCounts: this.unreadCounts,
          stickers: this.stickers,
          userPersonas: this.userPersonas,
          bubblePresets: this.bubblePresets,
          favorites: this.favorites,
          innerVoices: this.innerVoices,
          lastVideoCallTranscript: this.lastVideoCallTranscript
        };
        try {
          const jsonString = JSON.stringify(data);
          const compressed = LZString.compressToUTF16(jsonString);
          localStorage.setItem('aiPhoneSingleChatData', compressed);
        } catch (e) {
          if (e.name === 'QuotaExceededError' || e.code === 22) {
              console.error('LocalStorage quota exceeded!', e);
              alert('存储空间已满！无法保存聊天数据。');
          } else {
              console.error('Error saving single chat data', e);
          }
        }
      }, 0);
    },
    
    addCharacter(name) {
      const newChar = {
        id: Date.now().toString(),
        name: name,
        nickname: '',
        avatar: '',
        videoBg: '',
        userVideoImg: '',
        userPersona: 'default',
        charPersona: '',
        isOnline: true,
        worldbook: '',
        preset: [],
        api: 'default',
        memoryCount: 10,
        replyLength: '10-50',
        npc: [],
        summary: '',
        proactiveMessaging: false,
        proactiveInterval: 5,
        proactiveCooldown: 30,
        proactiveDailyLimit: 10,
        triggerMode: 'always',
        proactiveIdleTime: 15,
        lastProactiveTime: 0, // 上次主动发送时间
        todayProactiveCount: 0, // 今日主动发送次数
        lastActiveTime: Date.now(), // 上次活跃时间 (用户或角色发送消息)
        memories: [],
        chatBackground: '', // 聊天背景
        isBlocked: false, // 是否被拉黑
        bubbleSettings: {
            css: '',
            fontSize: 14
        },
        realtimeSettings: {
            timeEnabled: false,
            weatherEnabled: false,
            charLocation: { real: '', virtual: '', display: '' },
            userLocation: { real: '', virtual: '', display: '' }
        }
      };
      
      this.characters.unshift(newChar);
      this.messages[newChar.id] = [];
      this.unreadCounts[newChar.id] = 0;
      this.innerVoices[newChar.id] = [];
      this.currentInnerVoice[newChar.id] = null;
      this.saveData();
      return newChar.id;
    },
    
    deleteCharacter(id) {
      const index = this.characters.findIndex(c => c.id === id);
      if (index !== -1) {
        this.characters.splice(index, 1);
        delete this.messages[id];
        delete this.unreadCounts[id];
        delete this.innerVoices[id];
        delete this.currentInnerVoice[id];
        this.saveData();
      }
    },

    getCharacter(id) {
      return this.characters.find(c => c.id === id);
    },
    
    getLastMessage(charId) {
      const msgs = this.messages[charId] || [];
      return msgs.length > 0 ? msgs[msgs.length - 1] : null;
    },

    clearChatHistory(charId) {
      if (this.messages[charId]) {
        this.messages[charId] = [];
        this.unreadCounts[charId] = 0;
        this.saveData();
      }
    },

    incrementUnreadCount(charId) {
      if (typeof this.unreadCounts[charId] === 'number') {
        this.unreadCounts[charId]++;
      } else {
        this.unreadCounts[charId] = 1;
      }
      this.saveData();
    },

    clearUnreadCount(charId) {
      if (this.unreadCounts[charId]) {
        this.unreadCounts[charId] = 0;
        this.saveData();
      }
    },

    sendSystemNotification(charId, content) {
      if (!this.messages[charId]) {
        this.messages[charId] = [];
      }
      this.messages[charId].push({
        id: Date.now().toString(),
        sender: 'system',
        type: 'notification',
        content: content,
        timestamp: Date.now()
      });
      this.saveData();
    },

    retryFromMessage(charId, messageId) {
      const msgs = this.messages[charId];
      if (!msgs) return;

      const msgIndex = msgs.findIndex(m => m.id === messageId);
      if (msgIndex !== -1) {
        // 删除指定消息之后的所有消息
        this.messages[charId].splice(msgIndex + 1);
        this.saveData();
      }
    },

    // --- 心声 Actions ---
    addInnerVoice(charId, voiceData) {
      if (!this.innerVoices[charId]) {
        this.innerVoices[charId] = [];
      }
      
      // 添加时间戳和唯一ID
      const newVoice = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...voiceData
      };

      // 更新当前心声用于实时显示
      this.currentInnerVoice[charId] = newVoice;

      // 存入历史记录
      this.innerVoices[charId].unshift(newVoice);

      // 保持最多20条历史记录
      if (this.innerVoices[charId].length > 20) {
        this.innerVoices[charId].pop();
      }

      this.saveData();
    },

    clearInnerVoices(charId) {
      if (this.innerVoices[charId]) {
        this.innerVoices[charId] = [];
        this.currentInnerVoice[charId] = null;
        this.saveData();
      }
    },

    // --- 视频通话 Actions ---
    _clearVideoTimers() {
      if (this.videoCall.timerInterval) {
        clearInterval(this.videoCall.timerInterval);
        this.videoCall.timerInterval = null;
      }
      if (this.videoCall.connectTimer) {
        clearTimeout(this.videoCall.connectTimer);
        this.videoCall.connectTimer = null;
      }
    },

    startVideoCall(charId, initiator = 'user') { // initiator: 'user' or 'character'
      const char = this.getCharacter(charId);
      // 线下模式无法触发视频通话
      if (char && char.isOnline === false) {
          return;
      }

      if (this.videoCall.isActive) return;

      this.videoCall.isActive = true;
      this.videoCall.isMinimized = false;
      this.videoCall.status = 'waiting';
      this.videoCall.characterId = charId;
      this.videoCall.duration = 0;
      this.videoCall.initiatedBy = initiator;
      
      this.videoCall.connectTimer = setTimeout(() => {
        this.connectVideoCall();
      }, 2000);
    },

    connectVideoCall() {
        this.videoCall.status = 'connected';
        this._clearVideoTimers();
        this.videoCall.timerInterval = setInterval(() => {
            this.videoCall.duration++;
        }, 1000);
    },

    async endVideoCall() {
      const wasConnected = this.videoCall.status === 'connected';
      const callDuration = this.videoCall.duration;
      const charId = this.videoCall.characterId;
      const initiatedBy = this.videoCall.initiatedBy;

      this._clearVideoTimers();

      if (wasConnected && charId && this.messages[charId]) {
        const callMessages = this.messages[charId].filter(m => m.inVideoCall);
        
        // 保存通话记录
        if (callMessages.length > 0) {
          this.lastVideoCallTranscript = {
            charId: charId,
            messages: JSON.parse(JSON.stringify(callMessages)) // 深拷贝
          };
        } else {
          // 如果没有通话内容，则清空
          this.lastVideoCallTranscript = { charId: null, messages: [] };
        }

        this.messages[charId] = this.messages[charId].filter(m => !m.inVideoCall);

        const minutes = Math.floor(callDuration / 60).toString().padStart(2, '0');
        const seconds = (callDuration % 60).toString().padStart(2, '0');
        const timeStr = `${minutes}:${seconds}`;

        const summaryContent = initiatedBy === 'character' 
            ? `视频通话已结束，时长 ${timeStr}`
            : `通话时长 ${timeStr}`;

        // 确定发送者：谁发起的通话，谁发送总结消息
        const summarySender = initiatedBy === 'character' ? 'char' : 'user';

        this.messages[charId].push({
            id: Date.now().toString(),
            sender: summarySender,
            type: 'call_summary',
            content: summaryContent,
            timestamp: Date.now()
        });

        if (summarySender === 'char') {
            this.incrementUnreadCount(charId);
            
            const notificationStore = useNotificationStore();
            const currentRoute = router.currentRoute.value;
            const isCurrentChat = currentRoute.name === 'single-chat' && currentRoute.params.id === charId;
            
            if (!isCurrentChat) {
                const char = this.getCharacter(charId);
                notificationStore.triggerNotification(
                    char ? char.name : '未知角色',
                    summaryContent,
                    char ? char.avatar : '',
                    () => {
                        router.push({ name: 'single-chat', params: { id: charId } });
                    },
                    3000,
                    'call_summary'
                );
            }
        }
        
        this.saveData();

        // 自动总结并触发AI响应
        if (callMessages.length > 0) {
          await this.summarizeMessages(charId, { type: 'video' });
        }
        
        setTimeout(() => {
            this.triggerAiResponseForCharacter(charId);
        }, 1000);
      }

      // 重置状态
      this.videoCall.isActive = false;
      this.videoCall.isMinimized = false;
      this.videoCall.status = 'idle';
      this.videoCall.characterId = null;
      this.videoCall.duration = 0;
      this.videoCall.initiatedBy = null;
    },

    minimizeVideoCall() {
      this.videoCall.isMinimized = true;
    },

    maximizeVideoCall() {
      this.videoCall.isMinimized = false;
    },

    applyChatBackgroundToAll(bgUrl) {
        this.characters.forEach(char => {
            char.chatBackground = bgUrl;
        });
        this.saveData();
    },

    updateProactiveStatus(charId) {
      const char = this.getCharacter(charId);
      if (char) {
        char.lastProactiveTime = Date.now();
        char.todayProactiveCount = (char.todayProactiveCount || 0) + 1;
        this.saveData();
      }
    },

    resetDailyProactiveCount() {
      this.characters.forEach(char => {
        char.todayProactiveCount = 0;
      });
      this.saveData();
    },

    updateLastActiveTime(charId) {
      const char = this.getCharacter(charId);
      if (char) {
        char.lastActiveTime = Date.now();
        this.saveData();
      }
    },

    getFormattedRecentMessages(charId, count = 10) {
      const msgs = this.messages[charId] || [];
      const recent = msgs.slice(-count);
      
      return recent.map(msg => {
        let content = msg.content;
        
        // 根据消息类型格式化内容，以便AI理解
        switch (msg.type) {
          case 'sticker':
            // 表情包：优先读取名称
            content = `[表情包：${msg.name || '未知表情包'}]`;
            break;
          case 'image':
            if (msg.isTextGenerated) {
              // 文字生图：AI需识别为图片，文本是描述
              content = `[图片：${msg.content}]`;
            } else {
              // 本地/URL图片
              content = `[图片：${msg.content}]`;
            }
            break;
          case 'voice':
            // 语音：AI读取为语音信息，内容为文本
            content = `[语音：${msg.content}]`;
            break;
          case 'location':
            // 位置：包含名称和详细地址
            content = `[位置：${msg.content}]`;
            break;
          case 'transfer':
            // 转账：区分发送转账和收款
            if (msg.isReceived) {
              if (msg.sender === 'user') {
                // 用户收款（用户收取了角色发送的转账）
                content = `[用户收取了转账：¥${msg.content}]`;
              } else {
                // 角色收款（角色收取了用户发送的转账）
                content = `[角色收取了用户的转账：¥${msg.content}]`;
              }
            } else if (msg.sender === 'user') {
              // 用户发送转账
              content = `[用户发送转账：¥${msg.content}${msg.note ? `，备注：${msg.note}` : ''}]`;
            } else {
              // 角色发送转账
              content = `[转账：¥${msg.content}${msg.note ? `，备注：${msg.note}` : ''}]`;
            }
            break;
          case 'call_summary':
            // 通话总结
            content = `[通话记录：${msg.content}]`;
            break;
          // text 类型保持不变
        }

        return {
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: content
        };
      });
    },

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
              if (!this.messages[charId]) this.messages[charId] = [];
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
  
                  this.messages[charId].push({
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
              
              this.saveData();
          }
      } catch (error) {
          console.error(`[SingleStore] triggerAiResponseForCharacter failed for charId ${charId}:`, error);
      }
    },

    addMessageFromChar(charId, content) {
      const character = this.getCharacter(charId);
      if (!character) return;

      if (!this.messages[charId]) {
        this.messages[charId] = [];
      }

      this.messages[charId].push({
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

      this.saveData();
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
        const summary = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }]);
        if (summary) {
          if (!character.memories) {
            character.memies = [];
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
          this.messages[charId].push({
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
          this.messages[charId].push({
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
        
        this.saveData();
        return true;
      }
      return false;
    },
  }
});
