<template>
  <div>
    <!-- 1. 最小化浮窗 -->
    <GlobalFloat
      :is-active="videoCall.isActive && videoCall.isMinimized"
      :image-url="characterAvatar"
      @click="maximize"
      :boundary-ref="props.boundaryRef"
    >
      <div class="image-container">
        <img v-if="characterAvatar" :src="characterAvatar" alt="Avatar">
        <div v-else class="default-avatar"></div>
        <div class="mini-status-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </div>
      </div>
    </GlobalFloat>

    <!-- 2. 视频通话主界面 (最大化时) -->
    <div class="video-call-overlay" v-if="isVideoCallActive">
        
        <!-- 2.1 挂断确认弹窗 -->
        <div class="video-confirm-dialog" v-if="showHangupConfirm">
            <div class="confirm-box">
                <p>确定要挂断吗？</p>
                <div class="confirm-buttons">
                    <button @click="cancelEndVideoCall" class="cancel-btn">取消</button>
                    <button @click="confirmEndVideoCall" class="confirm-btn">挂断</button>
                </div>
            </div>
        </div>

        <!-- 2.2 等待接通界面 -->
        <div class="video-waiting" v-if="videoCallStatus === 'waiting'">
            <div class="waiting-avatar">
                <img :src="characterAvatar || 'https://placehold.co/100x100/gray/white?text=Avatar'">
                <div class="waiting-ripple"></div>
                <div class="waiting-ripple delay"></div>
            </div>
            <div class="waiting-text">等待接通...</div>
            <div class="waiting-controls">
                <div class="video-btn hangup" @click="endVideoCall">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1 0-1.35c2.93-2.94 6.86-4.73 11.21-4.73s8.28 1.79 11.21 4.73c.38.38.38 1.02 0 1.4l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.66-1.85.995.995 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"></path></svg>
                </div>
            </div>
        </div>

        <!-- 2.3 通话中界面 -->
        <div class="video-content" v-if="videoCallStatus === 'connected'">
            <!-- 背景 -->
            <img :src="character?.videoBg || 'https://placehold.co/375x812/black/white?text=No+Image'" class="video-bg">
            
            <!-- 通话计时器 -->
            <div class="video-timer">{{ videoTimerStr }}</div>

            <!-- 最小化按钮 -->
            <div class="video-minimize-btn" @click="minimizeVideoCall">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 30px; height: 30px;transform: translate(10px, -8px);"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline></svg>
            </div>

            <!-- 用户自己的小窗 (可拖拽) -->
            <div class="draggable-window" ref="videoFloatWindow">
                <img :src="character?.userVideoImg || 'https://placehold.co/100x160/gray/white?text=User'">
            </div>
            
            <!-- 视频中的文字聊天面板 -->
            <div class="video-chat-panel" v-show="isVideoChatVisible">
                <div class="video-chat-messages" ref="videoChatMessagesContainer">
                    <div v-for="(msg, idx) in videoChatMessages" :key="idx" class="video-chat-msg" :class="msg.type">
                        {{ msg.text }}
                    </div>
                    <div v-if="isAiReplying" class="video-chat-msg received typing-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
                <div class="video-chat-input-box">
                    <input type="text" v-model="videoChatInput" placeholder="发送文字..." @keypress.enter="sendVideoChatMessage">
                    <div class="video-send-btn" @click="sendVideoChatMessage">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 26px; height: 26px; vertical-align: middle; margin-left: 3px;"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    </div>
                </div>
            </div>

            <!-- 底部控制按钮 -->
            <div class="video-controls">
                <div class="video-btn" @click="isVideoChatVisible = !isVideoChatVisible" title="打开文本框">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </div>
                <div class="video-btn hangup" @click="endVideoCall" title="挂断">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1 0-1.35c2.93-2.94 6.86-4.73 11.21-4.73s8.28 1.79 11.21 4.73c.38.38.38 1.02 0 1.4l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.66-1.85.995.995 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"></path></svg>
                </div>
                <div class="video-btn" @click="retry" title="重试">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import GlobalFloat from '@/components/common/GlobalFloat.vue';

// =================================================================
// Props
// =================================================================
const props = defineProps({
  boundaryRef: {
    type: Object,
    default: null
  }
});

// =================================================================
// 状态管理 (Pinia)
// =================================================================
const singleStore = useSingleStore();
const apiStore = useApiStore();

// =================================================================
// 核心状态与计算属性
// =================================================================
const videoCall = computed(() => singleStore.videoCall);
const character = computed(() => singleStore.getCharacter(videoCall.value.characterId));
const characterAvatar = computed(() => character.value?.avatar || 'https://placehold.co/60x60/gray/white?text=Avatar');

// UI相关的计算属性
const isVideoCallActive = computed(() => videoCall.value.isActive && !videoCall.value.isMinimized);
const videoCallStatus = computed(() => videoCall.value.status);
const videoDuration = computed(() => videoCall.value.duration);
const videoTimerStr = computed(() => {
    const duration = videoDuration.value;
    const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
    const seconds = (duration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
});

// =================================================================
// 挂断逻辑
// =================================================================
const showHangupConfirm = ref(false);

const endVideoCall = () => {
    if (videoCallStatus.value === 'waiting') {
        // 在等待状态直接挂断，无需总结消息
        singleStore.endVideoCall([]);
    } else {
        showHangupConfirm.value = true;
    }
};

const confirmEndVideoCall = () => {
    // 确认挂断时，传递聊天记录
    singleStore.endVideoCall(videoChatMessages.value);
    showHangupConfirm.value = false;
};

const cancelEndVideoCall = () => {
    showHangupConfirm.value = false;
};

// =================================================================
// 窗口状态管理 (最小化/最大化)
// =================================================================
const minimizeVideoCall = () => {
    singleStore.minimizeVideoCall();
};

const maximize = () => {
    singleStore.maximizeVideoCall();
};

// =================================================================
// 视频通话中的文本聊天
// =================================================================
const isVideoChatVisible = ref(false);
const videoChatInput = ref('');
const videoChatMessages = ref([]);
const isAiReplying = ref(false);
const videoChatMessagesContainer = ref(null); // 模板引用

const sendVideoChatMessage = async () => {
    const text = videoChatInput.value.trim();
    if (!text) return;

    // 1. 将用户消息添加到本地UI
    videoChatMessages.value.push({ text, type: 'sent' });
    const userMessageId = Date.now().toString();
    videoChatInput.value = '';

    // 2. 将用户消息添加到主store以维持上下文，并标记为通话中消息
    const charId = character.value.id;
    if (!singleStore.messages[charId]) {
        singleStore.messages[charId] = [];
    }
    singleStore.messages[charId].push({
        id: userMessageId,
        sender: 'user',
        type: 'text',
        content: text,
        time: Date.now(),
        inVideoCall: true // 添加标记
    });

    await nextTick();
    if (videoChatMessagesContainer.value) {
        videoChatMessagesContainer.value.scrollTop = videoChatMessagesContainer.value.scrollHeight;
    }

    // 3. 获取AI回复
    isAiReplying.value = true;
    try {
        const responseText = await apiStore.getChatCompletion(charId);

        if (responseText) {
            // 4. 将AI回复添加到本地UI
            videoChatMessages.value.push({ text: responseText, type: 'received' });
            
            // 5. 将AI回复添加到主store
            singleStore.messages[charId].push({
                id: (Date.now() + 1).toString(),
                sender: 'char',
                type: 'text',
                content: responseText,
                time: Date.now(),
                inVideoCall: true // 添加标记
            });
        }
    } catch (error) {
        console.error("获取视频聊天中的 AI 回复失败：", error);
        videoChatMessages.value.push({ text: '抱歉，我暂时无法回复...', type: 'received' });
    } finally {
        isAiReplying.value = false;
        await nextTick();
        if (videoChatMessagesContainer.value) {
            videoChatMessagesContainer.value.scrollTop = videoChatMessagesContainer.value.scrollHeight;
        }
    }
};

const retry = () => {
    // 重试逻辑占位符
    console.log("重试操作已触发");
    // 你可以在这里添加你的 AI 重新生成逻辑
};

// =================================================================
// 可拖动窗口逻辑
// =================================================================
const videoFloatWindow = ref(null); // 模板引用
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const elStartX = ref(0);
const elStartY = ref(0);

const dragStart = (e) => {
  const el = videoFloatWindow.value;
  if (!el) return;
  
  isDragging.value = true;
  const touch = e.touches ? e.touches[0] : e;
  dragStartX.value = touch.clientX;
  dragStartY.value = touch.clientY;
  elStartX.value = el.offsetLeft;
  elStartY.value = el.offsetTop;

  window.addEventListener('mousemove', dragMove);
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('touchend', dragEnd);
  
  e.preventDefault();
};

const dragMove = (e) => {
  if (!isDragging.value) return;
  
  const el = videoFloatWindow.value;
  const parent = el.parentElement;
  if (!el || !parent) return;

  const touch = e.touches ? e.touches[0] : e;
  const dx = touch.clientX - dragStartX.value;
  const dy = touch.clientY - dragStartY.value;

  let newX = elStartX.value + dx;
  let newY = elStartY.value + dy;

  // 限制在父元素边界内
  const maxX = parent.clientWidth - el.offsetWidth;
  const maxY = parent.clientHeight - el.offsetHeight;
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  el.style.left = `${newX}px`;
  el.style.top = `${newY}px`;
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  
  if (e.touches) {
    e.preventDefault();
  }
};

const dragEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  window.removeEventListener('mousemove', dragMove);
  window.removeEventListener('mouseup', dragEnd);
  window.removeEventListener('touchmove', dragMove);
  window.removeEventListener('touchend', dragEnd);
};

// =================================================================
// 生命周期钩子
// =================================================================

// 监听 videoFloatWindow ref 的变化，以确保在元素存在时添加事件监听器
watch(videoFloatWindow, (newEl, oldEl) => {
  if (oldEl) {
    // 清理旧元素的事件监听器
    oldEl.removeEventListener('mousedown', dragStart);
    oldEl.removeEventListener('touchstart', dragStart);
  }
  if (newEl) {
    // 为新元素添加事件监听器
    newEl.addEventListener('mousedown', dragStart);
    newEl.addEventListener('touchstart', dragStart, { passive: false });
  }
});

onBeforeUnmount(() => {
  // 为安全起见，在组件卸载时清除所有可能残留的全局监听器
  window.removeEventListener('mousemove', dragMove);
  window.removeEventListener('mouseup', dragEnd);
  window.removeEventListener('touchmove', dragMove);
  window.removeEventListener('touchend', dragEnd);
});
</script>

<style scoped>
/* =================================================================
   1. 最小化浮窗
   ================================================================= */
.image-container {
  width: 100%;
  height: 100%;
  position: relative;
}
.image-container img, .default-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.default-avatar {
  background-color: #555;
}
.mini-status-icon {
  position: absolute;
  bottom: 4px;
  left: 4px;
  width: 14px;
  height: 14px;
  background: #07C160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse 2s infinite;
}

/* =================================================================
   2. 视频通话主界面
   ================================================================= */
.video-call-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: #000; z-index: 2000; display: flex; flex-direction: column;
}

/* =================================================================
   2.1 等待界面
   ================================================================= */
.video-waiting {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(180deg, #2b2b2b 0%, #1a1a1a 100%); color: white; padding-bottom: 100px;
}
.waiting-avatar {
    width: 100px; height: 100px; border-radius: 12px; margin-bottom: 20px; position: relative;
    display: flex; align-items: center; justify-content: center;
}
.waiting-avatar img { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; z-index: 2; position: relative; }
.waiting-ripple {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 100%; height: 100%; border-radius: 12px; background: rgba(255, 255, 255, 0.1);
    animation: ripple 2s infinite; z-index: 1;
}
.waiting-ripple.delay { animation-delay: 1s; }
.waiting-text { font-size: 16px; margin-bottom: 60px; opacity: 0.8; }
.waiting-controls { 
    position: absolute; 
    bottom: 30px; 
    left: 0; 
    width: 100%; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    gap: 40px; 
    z-index: 2002;
}

/* =================================================================
   2.2 通话中界面
   ================================================================= */
.video-content { flex: 1; position: relative; width: 100%; height: 100%; overflow: hidden; }
.video-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
.video-timer {
    position: absolute; top: 50px; left: 50%; transform: translateX(-50%);
    color: white; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index: 2004;
}

/* =================================================================
   2.3 可拖拽的用户小窗
   ================================================================= */
.draggable-window {
    position: absolute; top: 40px; right: 20px; width: 100px; height: 160px;
    background: #333; border-radius: 12px; overflow: hidden; z-index: 2001;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);
    cursor: grab;
    touch-action: none;
}
.draggable-window:active {
    cursor: grabbing;
}
.draggable-window img { width: 100%; height: 100%; object-fit: cover; }

/* =================================================================
   2.4 视频内文本聊天面板
   ================================================================= */
.video-chat-panel {
    position: absolute; 
    bottom: 95px; 
    left: 15px; right: 15px; height: 250px;
    background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(2px); border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2); display: flex; flex-direction: column; z-index: 2001; padding: 10px;
}
.video-chat-messages {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 10px; scrollbar-width: none;
}
.video-chat-messages::-webkit-scrollbar { display: none; }
.video-chat-msg {
    padding: 6px 10px; border-radius: 8px; font-size: 15px; line-height: 1.4; max-width: 95%; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.video-chat-msg.received { align-self: flex-start; }
.video-chat-msg.sent { align-self: flex-end; }

.typing-indicator {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
}
.typing-indicator .dot {
    width: 6px;
    height: 6px;
    margin: 0 2px;
    border-radius: 50%;
    animation: typing-bounce 1.2s infinite ease-in-out;
}
.typing-indicator .dot:nth-child(2) { animation-delay: -1.0s; }
.typing-indicator .dot:nth-child(3) { animation-delay: -0.8s; }

.video-chat-input-box {
    height: 40px; display: flex; align-items: center; gap: 8px;
    background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 0 5px 0 15px;
}
.video-chat-input-box input {
    background: transparent;
    border: none;
    color: white;
    flex: 1;
    outline: none;
    font-family: inherit;
    font-size: 15px;
    padding: 10px 0;
}
.video-chat-input-box input::placeholder {
    color: rgba(255, 255, 255, 0.6);
    opacity: 1;
}
.video-send-btn {
    width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.2);
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;
}

/* =================================================================
   3. 控制器与按钮
   ================================================================= */
.video-controls {
    position: absolute; bottom: 30px; left: 0; width: 100%; display: flex; justify-content: center; align-items: center; gap: 40px; z-index: 2002;
}
.video-btn {
    width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.1s;
    background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); color: white; border: 1px solid rgba(255,255,255,0.3);
}
.video-btn:active { transform: scale(0.95); }
.video-btn.hangup { 
    background: #ff3a30a1; color: white; border: none;
    width: 60px; height: 60px;
}
.video-btn svg { width: 24px; height: 24px; stroke-width: 1.5; }
.video-btn.hangup svg { width: 30px; height: 30px; }

.video-minimize-btn {
    position: absolute; top: 40px; left: 20px; width: 36px; height: 36px; border-radius: 50%;
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    color: white; z-index: 2003; cursor: pointer;
}

/* =================================================================
   4. 确认弹窗
   ================================================================= */
.video-confirm-dialog {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 3000;
}
.confirm-box {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(15px) saturate(180%);
    -webkit-backdrop-filter: blur(15px) saturate(180%);
    border-radius: 18px;
    padding: 18px;
    width: 250px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
.confirm-box p {
    color: white;
    font-size: 16px;
    margin: 0 0 18px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.confirm-buttons {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}
.confirm-buttons button {
    flex: 1;
    border: none;
    padding: 10px 0;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}
.confirm-buttons .cancel-btn {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
}
.confirm-buttons .cancel-btn:active {
    background-color: rgba(255, 255, 255, 0.2);
}
.confirm-buttons .confirm-btn {
    background-color: rgba(255, 59, 48, 0.7);
    color: white;
}
.confirm-buttons .confirm-btn:active {
    background-color: rgba(255, 59, 48, 0.7);
}

/* =================================================================
   5. 动画效果
   ================================================================= */
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}
@keyframes typing-bounce {
    0%, 80%, 100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1.0);
    }
}
</style>
