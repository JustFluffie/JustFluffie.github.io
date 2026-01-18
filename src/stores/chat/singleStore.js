import { defineStore } from 'pinia';
import LZString from 'lz-string';

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

    // 全局视频通话状态 (单聊)
    videoCall: {
      isActive: false,
      isMinimized: false,
      status: 'idle', // idle, waiting, connected
      characterId: null,
      duration: 0,
      timerInterval: null,
      connectTimer: null,
    }
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
        }
      } else {
        this.stickers = [...defaultStickers];
      }
    },
    
    saveData() {
      const data = {
        characters: this.characters,
        messages: this.messages,
        unreadCounts: this.unreadCounts,
        stickers: this.stickers,
        userPersonas: this.userPersonas,
        bubblePresets: this.bubblePresets,
        favorites: this.favorites
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
        }
      };
      
      this.characters.unshift(newChar);
      this.messages[newChar.id] = [];
      this.unreadCounts[newChar.id] = 0;
      this.saveData();
      return newChar.id;
    },
    
    deleteCharacter(id) {
      const index = this.characters.findIndex(c => c.id === id);
      if (index !== -1) {
        this.characters.splice(index, 1);
        delete this.messages[id];
        delete this.unreadCounts[id];
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

    startVideoCall(charId) {
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

    endVideoCall() {
      this._clearVideoTimers();
      
      // 如果通话已连接且有通话时长，则发送通话总结消息
      if (this.videoCall.status === 'connected' && this.videoCall.duration > 0) {
        const duration = this.videoCall.duration;
        const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
        const seconds = (duration % 60).toString().padStart(2, '0');
        const timeStr = `${minutes}:${seconds}`;
        
        const charId = this.videoCall.characterId;
        if (charId && this.messages[charId]) {
            this.messages[charId].push({
                id: Date.now().toString(),
                sender: 'user', // or system
                type: 'call_summary',
                content: `通话时长 ${timeStr}`,
                time: Date.now()
            });
            this.saveData();
        }
      }

      // 重置状态
      this.videoCall.isActive = false;
      this.videoCall.isMinimized = false;
      this.videoCall.status = 'idle';
      this.videoCall.characterId = null;
      this.videoCall.duration = 0;
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
            // 转账
            content = `[转账：${msg.content}]`;
            break;
          // text 类型保持不变
        }

        return {
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: content
        };
      });
    },
  }
});
