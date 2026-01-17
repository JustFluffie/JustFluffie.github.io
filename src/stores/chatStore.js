import { defineStore } from 'pinia';
import { useSingleStore } from './chat/singleStore';
import { useGroupStore } from './chat/groupStore';

export const useChatStore = defineStore('chat', {
  state: () => ({
    topNote: '', // 置顶笔记 (全局)
    pinnedSessions: [], // 置顶会话ID列表
  }),
  
  getters: {
    // --- 代理 SingleStore 的状态 ---
    characters: () => {
        const singleStore = useSingleStore();
        return singleStore.characters;
    },
    stickers: () => {
        const singleStore = useSingleStore();
        return singleStore.stickers;
    },
    userPersonas: () => {
        const singleStore = useSingleStore();
        return singleStore.userPersonas;
    },
    bubblePresets: () => {
        const singleStore = useSingleStore();
        return singleStore.bubblePresets;
    },
    favorites: () => {
        const singleStore = useSingleStore();
        return singleStore.favorites;
    },
    videoCall: () => {
        const singleStore = useSingleStore();
        return singleStore.videoCall;
    },

    // --- 聚合 Messages (只读) ---
    // 注意：如果组件试图直接修改 chatStore.messages，将会失败。必须调用 Actions。
    messages: () => {
        const singleStore = useSingleStore();
        const groupStore = useGroupStore();
        return { ...singleStore.messages, ...groupStore.messages };
    },

    // --- 会话列表 (核心新功能) ---
    sessionList: (state) => {
        const singleStore = useSingleStore();
        const groupStore = useGroupStore();
        
        const list = [];

        // 1. 添加单聊会话
        singleStore.characters.forEach(char => {
            const lastMsg = singleStore.getLastMessage(char.id);
            list.push({
                type: 'single',
                id: char.id,
                name: char.nickname || char.name,
                avatar: char.avatar,
                lastMessage: lastMsg,
                time: lastMsg ? lastMsg.time : 0,
                isPinned: state.pinnedSessions.includes(char.id),
                raw: char // 原始数据
            });
        });

        // 2. 添加群聊会话
        groupStore.groups.forEach(group => {
            const lastMsg = groupStore.getLastMessage(group.id);
            list.push({
                type: 'group',
                id: group.id,
                name: group.name,
                avatar: group.avatar,
                lastMessage: lastMsg,
                time: lastMsg ? lastMsg.time : group.createdTime,
                isPinned: state.pinnedSessions.includes(group.id),
                raw: group
            });
        });

        // 3. 排序 (置顶优先，然后按时间倒序)
        return list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.time - a.time;
        });
    }
  },

  actions: {
    initData() {
      const singleStore = useSingleStore();
      const groupStore = useGroupStore();
      
      singleStore.initData();
      groupStore.initData();
      
      const savedNote = localStorage.getItem('chatTopNote');
      if (savedNote) {
        this.topNote = savedNote;
      }

      const savedPinned = localStorage.getItem('chatPinnedSessions');
      if (savedPinned) {
        try {
            this.pinnedSessions = JSON.parse(savedPinned);
        } catch (e) {
            console.error('Failed to parse pinned sessions', e);
            this.pinnedSessions = [];
        }
      }
    },
    
    saveTopNote(note) {
      this.topNote = note;
      localStorage.setItem('chatTopNote', note);
    },

    togglePin(sessionId) {
        const index = this.pinnedSessions.indexOf(sessionId);
        if (index === -1) {
            this.pinnedSessions.push(sessionId);
        } else {
            this.pinnedSessions.splice(index, 1);
        }
        localStorage.setItem('chatPinnedSessions', JSON.stringify(this.pinnedSessions));
    },

    // --- 代理 SingleStore Actions ---
    saveData() {
        const singleStore = useSingleStore();
        singleStore.saveData();
        // groupStore.saveData(); // 通常不需要手动调用，除非有全局保存按钮
    },
    
    addCharacter(name) {
        const singleStore = useSingleStore();
        return singleStore.addCharacter(name);
    },
    
    getCharacter(id) {
        const singleStore = useSingleStore();
        return singleStore.getCharacter(id);
    },
    
    getLastMessage(id) {
        const singleStore = useSingleStore();
        const groupStore = useGroupStore();
        
        // 简单判断：群ID通常有特定前缀，或者直接查
        if (singleStore.messages[id]) {
            return singleStore.getLastMessage(id);
        } else if (groupStore.messages[id]) {
            return groupStore.getLastMessage(id);
        }
        return null;
    },

    clearChatHistory(charId) {
        const singleStore = useSingleStore();
        singleStore.clearChatHistory(charId);
    },

    // --- 视频通话代理 ---
    startVideoCall(charId) {
        const singleStore = useSingleStore();
        singleStore.startVideoCall(charId);
    },
    connectVideoCall() {
        const singleStore = useSingleStore();
        singleStore.connectVideoCall();
    },
    endVideoCall() {
        const singleStore = useSingleStore();
        singleStore.endVideoCall();
    },
    minimizeVideoCall() {
        const singleStore = useSingleStore();
        singleStore.minimizeVideoCall();
    },
    maximizeVideoCall() {
        const singleStore = useSingleStore();
        singleStore.maximizeVideoCall();
    },
    applyChatBackgroundToAll(bgUrl) {
        const singleStore = useSingleStore();
        singleStore.applyChatBackgroundToAll(bgUrl);
    },

    // --- 兼容性/辅助方法 ---
    // 用于 MomentsStore 发送通知
    receiveMessage(charId, content) {
        const singleStore = useSingleStore();
        if (singleStore.messages[charId]) {
            singleStore.messages[charId].push({
                id: Date.now().toString(),
                sender: 'char',
                type: 'text',
                content: content,
                time: Date.now(),
            });
            singleStore.saveData();
        }
    },

    sendSystemNotification(charId, content) {
        const singleStore = useSingleStore();
        if (singleStore.messages[charId]) {
            singleStore.messages[charId].push({
                id: `${Date.now()}-${charId}`,
                sender: 'system',
                type: 'notification',
                content: content,
                time: Date.now()
            });
            singleStore.saveData();
        }
    }
  }
});
