import { defineStore } from 'pinia';
import LZString from 'lz-string';
import { useApiStore } from '@/stores/apiStore';
import { parseAiResponse } from '@/utils/messageParser';
import { useNotificationStore } from '@/stores/notificationStore';
import router from '@/router';

// 引入拆分的逻辑
import { videoCallState, videoCallActions } from './partials/videoCall';
import { innerVoiceState, innerVoiceActions } from './partials/innerVoice';
import { messageAiActions } from './partials/messageAi';

const defaultStickers = [];

export const useSingleStore = defineStore('singleChat', {
  state: () => ({
    characters: [],
    messages: {}, // { charId: [message] }
    unreadCounts: {}, // { charId: count }
    stickers: [],
    userPersonas: [],
    npcs: [], // 配角NPC列表
    currentUserProfile: {
      name: '我',
      customId: 'user_001'
    },
    bubblePresets: [], // 气泡样式预设
    favorites: [], // 收藏

    // 混入拆分的状态
    ...innerVoiceState,
    ...videoCallState,
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
          this.npcs = data.npcs || [];
          this.currentUserProfile = data.currentUserProfile || { name: '我', customId: 'user_001' };
          this.bubblePresets = data.bubblePresets || [];
          this.favorites = data.favorites || [];
          this.innerVoices = data.innerVoices || {};
          
          // 恢复 currentInnerVoice 为最新一条
          this.currentInnerVoice = {};
          for (const charId in this.innerVoices) {
            if (this.innerVoices[charId] && this.innerVoices[charId].length > 0) {
              this.currentInnerVoice[charId] = this.innerVoices[charId][0];
            }
          }

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
          this.npcs = [];
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
          npcs: this.npcs,
          currentUserProfile: this.currentUserProfile,
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
      // 查找默认人设
      const defaultPersona = this.userPersonas.find(p => p.isDefault);
      const userPersonaId = defaultPersona ? defaultPersona.id : '';

      const newChar = {
        id: Date.now().toString(),
        name: name,
        nickname: '',
        avatar: '',
        videoBg: '',
        userVideoImg: '',
        userPersona: userPersonaId,
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
        },
        // 新增：自动总结设置 (扁平化结构，与 Settings 页面一致)
        autoSummary: false,
        summaryRange: 20,
        lastSummaryCount: 0,
        summaryPrompt: '',
        // 新增：关联角色 (用于朋友圈互动)
        linkedCharacters: []
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

    // NPC 相关操作
    addNpc(name) {
      const newNpc = {
        id: Date.now().toString(),
        name: name,
        avatar: '',
        summary: '',
        enableAutoReply: false, // 独立后台活动
        replyCooldown: 60, // 冷却时间(分钟)
        lastActionTime: 0,
        group: '', // 分组
        interactWithUser: false // 是否关联用户
      };
      this.npcs.push(newNpc);
      this.saveData();
      return newNpc.id;
    },

    deleteNpc(id) {
      const index = this.npcs.findIndex(n => n.id === id);
      if (index !== -1) {
        this.npcs.splice(index, 1);
        // 还需要从所有角色的关联列表中移除此NPC
        this.characters.forEach(char => {
          if (char.linkedNpcs && char.linkedNpcs.includes(id)) {
            char.linkedNpcs = char.linkedNpcs.filter(npcId => npcId !== id);
          }
        });
        this.saveData();
      }
    },
    
    getLastMessage(charId) {
      const msgs = this.messages[charId] || [];
      return msgs.length > 0 ? msgs[msgs.length - 1] : null;
    },

    clearChatHistory(charId) {
      if (this.messages[charId]) {
        this.messages[charId] = [];
        this.unreadCounts[charId] = 0;
        // 同时清空心声
        if (this.innerVoices[charId]) {
          this.innerVoices[charId] = [];
          this.currentInnerVoice[charId] = null;
        }
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

    // 新增：统一的消息添加方法
    addMessage(charId, message) {
      if (!this.messages[charId]) {
        this.messages[charId] = [];
      }
      this.messages[charId].push(message);
      this.saveData();

      // 检查是否需要自动总结
      this.checkAutoSummary(charId);
    },

    sendSystemNotification(charId, content) {
      this.addMessage(charId, {
        id: Date.now().toString(),
        sender: 'system',
        type: 'notification',
        content: content,
        timestamp: Date.now()
      });
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

    // 撤回消息
    revokeMessage(charId, messageId) {
      const msgs = this.messages[charId];
      if (!msgs) return;

      const msg = msgs.find(m => m.id === messageId);
      if (msg) {
        msg.isRevoked = true;
        this.saveData();
      }
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

        // 处理撤回消息
        if (msg.isRevoked) {
          if (msg.sender === 'user') {
            return {
              role: 'user',
              content: `[用户撤回了一条消息：${content}]`
            };
          } else {
            return {
              role: 'assistant',
              content: `[你撤回了一条消息：${content}]`
            };
          }
        }
        
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

    // 添加到收藏
    addToFavorites(charId, messages) {
      if (!Array.isArray(messages)) {
        messages = [messages];
      }
      
      const char = this.getCharacter(charId);
      const charName = char ? char.name : '角色';

      // 格式化消息内容
      const formattedLines = messages.map(msg => {
        const date = new Date(msg.timestamp || msg.time || Date.now());
        const timeStr = `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
        
        const senderName = msg.sender === 'user' ? '我' : charName;
        
        // 处理内容，如果是特殊类型，可能需要转换
        let content = msg.content;
        if (msg.type === 'image') content = `[图片：${msg.content}]`;
        else if (msg.type === 'voice') content = `[语音：${msg.content}]`;
        else if (msg.type === 'sticker') content = `[表情包：${msg.name || msg.content}]`;
        else if (msg.type === 'location') content = `[位置：${msg.content}]`;
        else if (msg.type === 'transfer') content = `[转账：${msg.content}]`;
        
        return `${senderName}：${content} | ${timeStr}`;
      });

      const favoriteItem = {
        id: Date.now().toString(), // 收藏条目的ID
        charId: charId,
        type: 'messages', // 类型
        content: formattedLines.join('\n'), // 多条消息合并为文本
        timestamp: Date.now(), // 收藏操作的时间
        originalMessageIds: messages.map(m => m.id) // 保留原始ID引用
      };

      if (!this.favorites) this.favorites = [];
      this.favorites.unshift(favoriteItem); // 添加到开头
      this.saveData();
    },

    // 添加朋友圈到收藏
    addMomentToFavorites(moment) {
      const favoriteItem = {
        id: Date.now().toString(),
        charId: moment.userId, // 假设 moment.userId 是角色ID
        type: 'moments',
        content: moment, // 存储整个 moment 对象
        timestamp: Date.now()
      };

      if (!this.favorites) this.favorites = [];
      this.favorites.unshift(favoriteItem);
      this.saveData();
    },
    
    // 移除朋友圈收藏
    removeMomentFromFavorites(momentId) {
      if (!this.favorites) return;
      const index = this.favorites.findIndex(f => f.type === 'moments' && f.content.id === momentId);
      if (index !== -1) {
        this.favorites.splice(index, 1);
        this.saveData();
      }
    },
    
    // 检查朋友圈是否已收藏
    isMomentFavorited(momentId) {
      if (!this.favorites) return false;
      return this.favorites.some(f => f.type === 'moments' && f.content.id === momentId);
    },

    // 切换记忆收藏状态（副本模式）
    toggleMemoryFavorite(charId, memory) {
      if (!this.favorites) this.favorites = [];
      
      // 查找是否已收藏（通过 originalId 或内容匹配）
      const index = this.favorites.findIndex(f => {
        if (String(f.charId) !== String(charId) || f.type !== 'memory') return false;
        if (memory.id && f.originalId === memory.id) return true;
        
        // 后备匹配：内容和时间
        // 注意：存储的 content 可能包含时间头，需要处理
        let storedContent = f.content;
        // 尝试去除第一行时间（如果存在换行）
        if (storedContent.includes('\n')) {
            const parts = storedContent.split('\n');
            // 简单的启发式：如果第一行看起来像时间，或者我们假设它就是时间
            // 这里我们假设存储格式总是 "时间\n内容"
            storedContent = parts.slice(1).join('\n');
        }
        
        return storedContent === memory.content && Math.abs((f.memoryTime || f.timestamp) - (memory.time || 0)) < 1000;
      });

      if (index !== -1) {
        // 已收藏 -> 移除
        this.favorites.splice(index, 1);
        // 同时更新原记忆状态（如果存在）
        if (memory) memory.isFavorite = false;
      } else {
        // 格式化时间
        const date = new Date(memory.time || Date.now());
        const timeStr = `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
        const contentWithTime = `${timeStr}\n${memory.content}`;

        // 未收藏 -> 添加副本
        this.favorites.unshift({
          id: Date.now().toString(),
          charId: charId,
          type: 'memory',
          originalId: memory.id,
          content: contentWithTime, // 存储带时间的内容
          timestamp: Date.now(), // 收藏操作的时间
          memoryTime: memory.time || Date.now() // 记忆的原时间
        });
        // 同时更新原记忆状态
        if (memory) memory.isFavorite = true;
      }
      this.saveData();
    },

    // 检查记忆是否已收藏
    isMemoryFavorited(charId, memory) {
      if (!this.favorites) return false;
      return this.favorites.some(f => {
        if (String(f.charId) !== String(charId) || f.type !== 'memory') return false;
        if (memory.id && f.originalId === memory.id) return true;
        
        let storedContent = f.content;
        if (storedContent.includes('\n')) {
            storedContent = storedContent.split('\n').slice(1).join('\n');
        }
        return storedContent === memory.content && Math.abs((f.memoryTime || f.timestamp) - (memory.time || 0)) < 1000;
      });
    },

    // 混入拆分的 Actions
    ...innerVoiceActions,
    ...videoCallActions,
    ...messageAiActions,
  }
});
