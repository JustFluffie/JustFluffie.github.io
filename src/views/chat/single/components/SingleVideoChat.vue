<template>
  <div>
    <!-- Minimized Float Window -->
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

    <!-- Maximized Video Call Overlay -->
    <div class="video-call-overlay" v-if="isVideoCallActive">
        <!-- Hangup Confirmation Dialog -->
        <div class="video-confirm-dialog" v-if="showHangupConfirm">
            <div class="confirm-box">
                <p>确定要挂断吗？</p>
                <div class="confirm-buttons">
                    <button @click="cancelEndVideoCall" class="cancel-btn">取消</button>
                    <button @click="confirmEndVideoCall" class="confirm-btn">挂断</button>
                </div>
            </div>
        </div>

        <!-- Waiting UI -->
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

        <!-- Connected UI -->
        <div class="video-content" v-if="videoCallStatus === 'connected'">
            <img :src="character?.videoBg || 'https://placehold.co/375x812/black/white?text=No+Image'" class="video-bg">
            
            <div class="video-timer">{{ videoTimerStr }}</div>

            <!-- 您可以修改这里的 width 和 height 来调整图标大小 -->
            <div class="video-minimize-btn" @click="minimizeVideoCall">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 30px; height: 30px;transform: translate(10px, -8px);"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline></svg>
            </div>

            <div class="draggable-window" ref="videoFloatWindow">
                <img :src="character?.userVideoImg || 'https://placehold.co/100x160/gray/white?text=User'">
            </div>
            
            <div class="video-chat-panel" v-show="isVideoChatVisible">
                <div class="video-chat-messages" ref="videoChatMessagesContainer">
                    <div v-for="(msg, idx) in videoChatMessages" :key="idx" class="video-chat-msg" :class="msg.type">
                        {{ msg.text }}
                    </div>
                </div>
                <div class="video-chat-input-box">
                    <input type="text" v-model="videoChatInput" placeholder="发送文字..." @keypress.enter="sendVideoChatMessage">
                    <div class="video-send-btn" @click="sendVideoChatMessage">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 26px; height: 26px; vertical-align: middle; margin-left: 3px;"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    </div>
                </div>
            </div>

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
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import GlobalFloat from '@/components/common/GlobalFloat.vue';

const props = defineProps({
  boundaryRef: {
    type: Object,
    default: null
  }
});

const singleStore = useSingleStore();
const apiStore = useApiStore();

// Shared State
const videoCall = computed(() => singleStore.videoCall);
const character = computed(() => singleStore.getCharacter(videoCall.value.characterId));
const characterAvatar = computed(() => character.value?.avatar || 'https://placehold.co/60x60/gray/white?text=Avatar');

// --- Logic for Maximized View ---
const isVideoCallActive = computed(() => videoCall.value.isActive && !videoCall.value.isMinimized);
const videoCallStatus = computed(() => videoCall.value.status);
const videoDuration = computed(() => videoCall.value.duration);

const showHangupConfirm = ref(false);
const isVideoChatVisible = ref(false);
const videoChatInput = ref('');
const videoChatMessages = ref([]);
const videoChatMessagesContainer = ref(null);
const videoFloatWindow = ref(null); // This is for the small user window inside the call

const videoTimerStr = computed(() => {
    const duration = videoDuration.value;
    const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
    const seconds = (duration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
});

const endVideoCall = () => {
    if (videoCallStatus.value === 'waiting') {
        singleStore.endVideoCall();
    } else {
        showHangupConfirm.value = true;
    }
};

const confirmEndVideoCall = () => {
    singleStore.endVideoCall();
    showHangupConfirm.value = false;
};

const cancelEndVideoCall = () => {
    showHangupConfirm.value = false;
};

const minimizeVideoCall = () => {
    singleStore.minimizeVideoCall();
};

const maximize = () => {
    singleStore.maximizeVideoCall();
};

const retry = () => {
    // Placeholder for retry logic
    console.log("Retry action triggered");
    // You can add your AI regeneration logic here
};

const sendVideoChatMessage = async () => {
    const text = videoChatInput.value.trim();
    if (!text) return;

    // Add user message to local chat
    videoChatMessages.value.push({ text, type: 'sent' });
    const currentUserMessage = { role: 'user', content: text };
    videoChatInput.value = '';
    await nextTick();
    if (videoChatMessagesContainer.value) {
        videoChatMessagesContainer.value.scrollTop = videoChatMessagesContainer.value.scrollHeight;
    }

    // Temporarily add system and user messages to singleStore for API call
    const charId = character.value.id;
    const originalMessages = singleStore.messages[charId] ? [...singleStore.messages[charId]] : [];
    if (!singleStore.messages[charId]) {
        singleStore.messages[charId] = [];
    }
    singleStore.messages[charId].push({
        id: Date.now().toString(),
        sender: 'user',
        type: 'text',
        content: text,
        time: Date.now()
    });

    try {
        // Get AI response
        const responseText = await apiStore.getChatCompletion(charId);

        if (responseText) {
            // Add AI response to local chat
            videoChatMessages.value.push({ text: responseText, type: 'received' });
            await nextTick();
            if (videoChatMessagesContainer.value) {
                videoChatMessagesContainer.value.scrollTop = videoChatMessagesContainer.value.scrollHeight;
            }
            // Also add to singleStore to maintain context for subsequent calls within the video chat
            singleStore.messages[charId].push({
                id: (Date.now() + 1).toString(),
                sender: 'char',
                type: 'text',
                content: responseText,
                time: Date.now()
            });
        }
    } catch (error) {
        console.error("Failed to get AI response in video chat:", error);
        videoChatMessages.value.push({ text: '抱歉，我暂时无法回复...', type: 'received' });
    } finally {
        // IMPORTANT: Restore original messages to prevent video chat from polluting main chat history
        singleStore.messages[charId] = originalMessages;
    }
};

// --- Draggable Window Logic ---
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const elStartX = ref(0);
const elStartY = ref(0);

const dragStart = (e) => {
  const el = videoFloatWindow.value;
  if (!el) return;
  
  isDragging.value = true;
  // For touch events
  const touch = e.touches ? e.touches[0] : e;
  dragStartX.value = touch.clientX;
  dragStartY.value = touch.clientY;
  elStartX.value = el.offsetLeft;
  elStartY.value = el.offsetTop;

  // Add move and end listeners to the window
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('touchend', dragEnd);
  
  // Prevent text selection while dragging
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

  // Constrain within parent bounds
  const maxX = parent.clientWidth - el.offsetWidth;
  const maxY = parent.clientHeight - el.offsetHeight;
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  el.style.left = `${newX}px`;
  el.style.top = `${newY}px`;
  el.style.right = 'auto'; // Override the initial 'right' style
  el.style.bottom = 'auto'; // Override any potential 'bottom' style
  
  // Prevent scrolling on touch devices
  if (e.touches) {
    e.preventDefault();
  }
};

const dragEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  // Remove listeners from the window
  window.removeEventListener('mousemove', dragMove);
  window.removeEventListener('mouseup', dragEnd);
  window.removeEventListener('touchmove', dragMove);
  window.removeEventListener('touchend', dragEnd);
};

onMounted(() => {
  const el = videoFloatWindow.value;
  if (el) {
    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, { passive: false });
  }
});

onBeforeUnmount(() => {
  const el = videoFloatWindow.value;
  if (el) {
    el.removeEventListener('mousedown', dragStart);
    el.removeEventListener('touchstart', dragStart);
  }
  // Clean up global listeners just in case
  window.removeEventListener('mousemove', dragMove);
  window.removeEventListener('mouseup', dragEnd);
  window.removeEventListener('touchmove', dragMove);
  window.removeEventListener('touchend', dragEnd);
});
</script>

<style scoped>
/* Styles for Minimized Float */
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
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* Styles for Maximized Overlay */
.video-call-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: #000; z-index: 2000; display: flex; flex-direction: column;
}

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
@keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}
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

.video-content { flex: 1; position: relative; width: 100%; height: 100%; overflow: hidden; }
.video-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
.video-timer {
    position: absolute; top: 50px; left: 50%; transform: translateX(-50%);
    color: white; font-size: 16px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index: 2004;
}
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

.video-chat-panel {
    position: absolute; 
    /* Adjust this value to change the distance between the text box and the bottom controls */
    bottom: 95px; 
    left: 15px; right: 15px; height: 200px;
    background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(2px); border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2); display: flex; flex-direction: column; z-index: 2001; padding: 10px;
}
.video-chat-messages {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 10px; scrollbar-width: none;
}
.video-chat-messages::-webkit-scrollbar { display: none; }
.video-chat-msg {
    padding: 6px 10px; border-radius: 8px; font-size: 13px; line-height: 1.4; max-width: 85%; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.video-chat-msg.received { align-self: flex-start; }
.video-chat-msg.sent { align-self: flex-end; }

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
    font-size: 14px;
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

.video-minimize-btn {
    position: absolute; top: 40px; left: 20px; width: 36px; height: 36px; border-radius: 50%;
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    color: white; z-index: 2003; cursor: pointer;
}

/* Styles for Confirmation Dialog */
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
    background-color: rgba(255, 255, 255, 0.3);
}
.confirm-buttons .confirm-btn {
    background-color: rgba(255, 59, 48, 0.7);
    color: white;
}
.confirm-buttons .confirm-btn:active {
    background-color: rgba(255, 59, 48, 0.9);
}
</style>
