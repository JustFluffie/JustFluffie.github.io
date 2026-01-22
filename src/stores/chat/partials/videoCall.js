import { useNotificationStore } from '@/stores/notificationStore';
import router from '@/router';

export const videoCallState = {
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
};

export const videoCallActions = {
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

      this.addMessage(charId, {
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
};
