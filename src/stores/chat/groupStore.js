import { defineStore } from 'pinia';
import LZString from 'lz-string';
import router from '@/router';
import { useNotificationStore } from '@/stores/notificationStore';

export const useGroupStore = defineStore('groupChat', {
  state: () => ({
    groups: [], // 群组列表 { id, name, avatar, members: [], notice: '' }
    messages: {}, // { groupId: [message] }
  }),
  
  actions: {
    initData() {
      const savedGroups = localStorage.getItem('aiPhoneGroupChatData');
      if (savedGroups) {
        try {
          const decompressed = LZString.decompressFromUTF16(savedGroups);
          const data = decompressed ? JSON.parse(decompressed) : JSON.parse(savedGroups);
          
          this.groups = data.groups || [];
          this.messages = data.messages || {};
        } catch (e) {
          console.error("Failed to parse group chat data", e);
          this.groups = [];
          this.messages = {};
        }
      }
    },
    
    saveData() {
      const data = {
        groups: this.groups,
        messages: this.messages
      };
      try {
        const jsonString = JSON.stringify(data);
        const compressed = LZString.compressToUTF16(jsonString);
        localStorage.setItem('aiPhoneGroupChatData', compressed);
      } catch (e) {
        console.error('Error saving group chat data', e);
      }
    },

    createGroup(name, memberIds) {
        const newGroup = {
            id: `g-${Date.now()}`,
            name: name,
            avatar: '', // 默认群头像
            members: memberIds, // ['user', 'char1', 'char2']
            notice: '',
            createdTime: Date.now()
        };
        this.groups.unshift(newGroup);
        this.messages[newGroup.id] = [];
        this.saveData();
        return newGroup.id;
    },

    getGroup(id) {
        return this.groups.find(g => g.id === id);
    },

    getLastMessage(groupId) {
        const msgs = this.messages[groupId] || [];
        return msgs.length > 0 ? msgs[msgs.length - 1] : null;
    },

    addMessage(groupId, message) {
        if (!this.messages[groupId]) {
            this.messages[groupId] = [];
        }
        this.messages[groupId].push(message);
        this.saveData();

        // 通知逻辑
        if (message.sender !== 'user') {
            const currentRoute = router.currentRoute.value;
            // 假设群聊路由是 /chat/group/:id，如果尚未实现，此判断将始终为真（即总是弹窗，除非在其他页面）
            // 实际上如果路由不存在，用户肯定不在该页面，所以弹窗是正确的。
            if (currentRoute.path !== `/chat/group/${groupId}`) {
                const group = this.getGroup(groupId);
                const notificationStore = useNotificationStore();
                
                notificationStore.triggerNotification(
                    group ? group.name : '群聊消息',
                    message.content,
                    group ? group.avatar : '',
                    () => {
                        // 如果路由尚未配置，这里可能会跳转失败或到404，但逻辑是正确的
                        router.push(`/chat/group/${groupId}`);
                    },
                    3000,
                    message.type // 传入消息类型，由 store 处理格式化
                );
            }
        }
    }
  }
});
