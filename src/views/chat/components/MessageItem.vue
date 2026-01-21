<template>
  <div 
    class="message" 
    :class="{ 
      sent: msg.sender === 'user', 
      received: msg.sender !== 'user',
      revoked: msg.type === 'revoked' || msg.type === 'notification',
      'selection-mode-active': isSelectionMode
    }"
  >
    <!-- 多选框 -->
    <div class="message-checkbox" 
         :class="{ checked: isSelected, visible: isSelectionMode }"
         @click.stop="$emit('toggle-selection', msg.id)">
    </div>

    <!-- 消息主体 -->
    <!-- 撤回/通知消息 -->
    <template v-if="msg.type === 'revoked' || msg.type === 'notification'">
       <div class="system-message-wrapper"
            @mousedown="handleLongPressStart" @mouseup="handleLongPressEnd" @mouseleave="handleLongPressEnd"
            @touchstart="handleLongPressStart" @touchend="handleLongPressEnd" @touchmove="handleTouchMove"
            @click.prevent="handleClick">
          <div class="system-message-text" @click.stop="!isSelectionMode && toggleRevokedContent()">
              {{ getSystemMessageText() }}
          </div>
          <div class="revoked-content" v-if="msg.type === 'revoked'" v-show="showRevokedContent">
              {{ msg.sender === 'user' ? '我' : charName }}：{{ msg.content }}
          </div>
       </div>
    </template>

    <!-- 正常消息 -->
    <template v-else>
      <!-- 头像 -->
      <div class="msg-avatar" @click="handleAvatarClick">
        <img v-if="msg.sender === 'user' ? userAvatar : charAvatar" :src="msg.sender === 'user' ? userAvatar : charAvatar" alt="avatar">
        <div v-else class="default-avatar" :class="{ user: msg.sender === 'user' }"></div>
      </div>

      <div class="msg-content-wrapper">
        <div class="msg-bubble-box">
        <!-- 气泡 -->
        <div class="msg-bubble"
            :class="bubbleClass"
            :style="bubbleStyle"
            @mousedown="handleLongPressStart" @mouseup="handleLongPressEnd" @mouseleave="handleLongPressEnd"
            @touchstart="handleLongPressStart" @touchend="handleLongPressEnd" @touchmove="handleTouchMove"
            @click.prevent="handleClick">
        
        <!-- 引用 -->
        <div v-if="msg.quote" class="quote-in-bubble">
          <div class="quote-in-bubble-sender">{{ msg.quote.sender === 'user' ? '你' : charName }}:</div>
          <div class="quote-in-bubble-text">{{ msg.quote.content }}</div>
        </div>

        <!-- 编辑视图 -->
        <div v-if="isEditing" class="edit-view">
          <textarea v-model="editedContent" class="edit-textarea" rows="3"></textarea>
          <div class="edit-actions">
            <button @click="cancelEdit" class="edit-btn cancel">取消</button>
            <button @click="saveEdit" class="edit-btn save">保存</button>
          </div>
        </div>
        
        <!-- 内容视图 -->
        <template v-else>
          <div v-if="msg.type === 'text'">{{ msg.content }}</div>
          <template v-else-if="msg.type === 'image'">
            <!-- 文字生成图片，使用固定尺寸的容器 -->
            <!-- 如果是AI发送的图片，或者标记为文字生成的图片，都使用文字生图样式 -->
            <div v-if="msg.isTextGenerated || (msg.sender !== 'user' && !msg.content.startsWith('http') && !msg.content.startsWith('data:'))" class="text-generated-image-container" @click="previewStore.preview(msg)">
              <div class="description-placeholder">
                {{ msg.content }}
              </div>
            </div>
            <!-- 普通图片，使用自适应尺寸的容器 -->
            <div v-else class="image-msg" @click="previewStore.preview(msg)">
              <img :src="msg.content" alt="图片">
            </div>
          </template>
          <div v-else-if="msg.type === 'sticker' " class="sticker-msg"><img :src="msg.content" alt="表情包"></div>
          <div v-else-if="msg.type === 'voice'" class="voice-msg-wrapper">
              <div class="voice-msg">
                  <SvgIcon name="voice-wave" class="voice-icon-svg" :class="{ 'playing': showVoiceText }" />
                  <span>{{ Math.min(60, Math.ceil(msg.content.length / 2)) }}"</span>
              </div>
          </div>
          <div v-else-if="msg.type === 'location'" class="location-msg">
              <div class="location-text">
                  <div class="msg-title">{{ msg.content || '位置信息' }}</div>
                  <div class="msg-desc">详细地址</div>
              </div>
              <div class="location-map">
                  <img src="https://files.catbox.moe/uryae6.png" alt="地图"><div class="location-pin"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
              </div>
          </div>
          <div v-else-if="msg.type === 'transfer'" 
               class="transfer-msg"
               :class="transferMsgClass"
               @click.stop="handleTransferClick">
              <div class="transfer-content">
                  <div class="transfer-icon">
                    <svg v-if="msg.status === 'accepted'" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span v-else>¥</span>
                  </div>
                  <div class="transfer-info">
                      <div class="transfer-amount">¥{{ msg.content }}</div>
                      <div class="transfer-desc">{{ transferDesc }}</div>
                  </div>
              </div>
              <div class="transfer-footer">
                {{ transferFooter }}
              </div>
          </div>
          <div v-else-if="msg.type === 'call_summary'" class="call-summary-msg">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1 0-1.35c2.93-2.94 6.86-4.73 11.21-4.73s8.28 1.79 11.21 4.73c.38.38.38 1.02 0 1.4l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.66-1.85.995.995 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
              <span>{{ msg.content }}</span>
          </div>
        </template>
        </div>
        
        <!-- 拉黑标记 -->
        <div v-if="msg.blocked && msg.sender !== 'user'" class="blocked-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        </div>
        <!-- 语音文字 -->
        <div v-if="msg.type === 'voice'" class="voice-text" v-show="showVoiceText">
          {{ msg.content }}
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
import { ref, computed, watch } from 'vue'
import { usePreviewStore } from '@/stores/previewStore'
import SvgIcon from '@/components/common/SvgIcon.vue'

// ================================================================================================
// 属性、事件
// ================================================================================================
const props = defineProps({
  msg: { type: Object, required: true },
  charName: { type: String, default: '' },
  charAvatar: { type: String, default: '' },
  userAvatar: { type: String, default: '' },
  bubbleStyle: { type: Object, default: () => ({}) },
  isSelectionMode: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false },
  editingMessageId: { type: String, default: null }
})

const emit = defineEmits([
  'save-edit', 'cancel-edit', 'toggle-selection',
  'long-press', 'cancel-long-press', 'touch-move', 'click-msg', 'show-thought', 'accept-transfer'
])

const previewStore = usePreviewStore();

// ================================================================================================
// 响应式状态
// ================================================================================================
const showVoiceText = ref(false)
const showRevokedContent = ref(false)
const editedContent = ref('')

// ================================================================================================
// 计算属性
// ================================================================================================
const isEditing = computed(() => props.editingMessageId === props.msg.id);
const bubbleClass = computed(() => {
  const type = props.msg.type;
  const isTransferAccepted = type === 'transfer' && props.msg.status === 'accepted';
  return {
    'no-style': ['image', 'sticker', 'location', 'transfer'].includes(type),
    'has-location': type === 'location',
    'has-transfer': type === 'transfer',
    'accepted': isTransferAccepted
  }
});

// 转账消息的样式类
const transferMsgClass = computed(() => {
  if (props.msg.type !== 'transfer') return {};
  
  const isAccepted = props.msg.status === 'accepted';
  const isSender = props.msg.sender === 'user'; // 用户是发送方
  
  return {
    // 发送方（转账发起者）：被接收后变灰
    'accepted-sender': isAccepted && isSender,
    // 接收方（收款者）：收款后保持橙色
    'accepted-receiver': isAccepted && !isSender,
    // 待处理状态
    'pending': !isAccepted
  };
});

// 转账描述文字
const transferDesc = computed(() => {
  if (props.msg.type !== 'transfer') return '';
  
  const isSender = props.msg.sender === 'user';
  const isAccepted = props.msg.status === 'accepted';
  const isReceived = props.msg.isReceived; // 收款消息气泡
  
  // 如果有备注，始终显示备注
  if (props.msg.note) return props.msg.note;
  
  // 收款消息气泡（角色或用户收款后生成的气泡）
  if (isReceived) {
    return '已收款';
  }
  
  // 没有备注时：根据状态显示
  if (isAccepted) {
    // 已被接收的转账
    return '已被接收';
  }
  
  // 待处理的转账
  if (isSender) {
    return `转账给${props.charName}`;
  } else {
    return '转账给你';
  }
});

// 转账底部文字（用来显示状态）
const transferFooter = computed(() => {
  if (props.msg.type !== 'transfer') return '';
  
  if (props.msg.isReceived) return '已收款';
  if (props.msg.status === 'accepted') return '已被领取';
  return '微信转账';
});

// ================================================================================================
// 侦听器
// ================================================================================================
watch(isEditing, (newValue) => {
  if (newValue) editedContent.value = props.msg.content;
});

// ================================================================================================
// 方法 - 事件处理
// ================================================================================================
const handleLongPressStart = (event) => { emit('long-press', event, props.msg.id) }
const handleLongPressEnd = () => { emit('cancel-long-press') }
const handleTouchMove = (event) => { emit('touch-move', event) }
const handleClick = (event) => {
  if (props.msg.type === 'voice') {
    toggleVoiceText();
  }
  // 对于图片消息，点击事件由 previewStore 处理
  if (props.msg.type === 'image') {
    return;
  }
  emit('click-msg', event, props.msg.id);
}

const handleAvatarClick = () => {
  if (props.msg.sender !== 'user') {
    emit('show-thought', props.msg.id);
  }
};

// ================================================================================================
// 方法 - 功能
// ================================================================================================
const toggleVoiceText = () => { showVoiceText.value = !showVoiceText.value }
const toggleRevokedContent = () => { showRevokedContent.value = !showRevokedContent.value }

const saveEdit = () => {
  if (editedContent.value.trim()) {
    emit('save-edit', { msgId: props.msg.id, newContent: editedContent.value });
  }
}
const cancelEdit = () => { emit('cancel-edit') }

const getSystemMessageText = () => {
  if (props.msg.type === 'notification') return props.msg.content;
  if (props.msg.type === 'revoked') {
    return `"${props.msg.sender === 'user' ? '你' : props.charName}" 撤回了一条消息`;
  }
  return '';
}

const handleTransferClick = () => {
  // 只有角色发送的转账才能被用户点击收取
  // 用户发送的转账由角色自动收取（通过 autoAcceptPendingTransfers）
  // 注意：status 为 undefined 或 'pending' 都视为待处理状态
  const isPending = props.msg.status === 'pending' || props.msg.status === undefined;
  
  if (isPending && props.msg.sender !== 'user' && !props.isSelectionMode) {
    emit('accept-transfer', props.msg.id);
  }
}
</script>

<style scoped>
/* --- 根容器 --- */
.message { display: flex; gap: 10px; max-width: 85%; position: relative; }
.message.sent { align-self: flex-end; flex-direction: row-reverse; }
.message.revoked { justify-content: center; width: 100%; max-width: 100%; flex-direction: row !important; padding: 10px 0; gap: 5px; align-items: center; }
.message.revoked .message-checkbox {
  position: static;
  transform: none;
  /* 在多选模式下，为系统消息（如撤回、通知）的复选框腾出空间 */
  margin-right: 5px; 
}

/* --- 头像 --- */
.msg-avatar { width: 36px; height: 36px; border-radius: 4px; flex-shrink: 0; overflow: hidden; background: #ddd; }
.msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
.default-avatar { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px; }

.msg-content-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 100%;
}
.message.sent .msg-content-wrapper {
  align-items: flex-end;
}
.message.received .msg-content-wrapper {
  align-items: flex-start;
}

/* --- 消息气泡 --- */
.msg-bubble { 
  padding: 10px 14px; 
  border-radius: 4px; 
  font-size: 14px; 
  line-height: 1.4; 
  word-break: break-word; 
  position: relative; 
  background: white; 
  color: #333; 
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none;   /* Safari */
  -khtml-user-select: none;    /* Konqueror HTML */
  -moz-user-select: none;      /* Old versions of Firefox */
  -ms-user-select: none;       /* Internet Explorer/Edge */
  user-select: none;           /* Non-prefixed version */
}
.message.sent .msg-bubble { background: #A9EA7A; color: var(--text-primary); }
.message.received .msg-bubble::before { content: ''; position: absolute; top: 12px; left: -6px; width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-right: 7px solid white; }
.message.sent .msg-bubble::after { content: ''; position: absolute; top: 12px; right: -6px; width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-left: 7px solid #A9EA7A; }

/* --- 引用 --- */
.quote-in-bubble { background: rgba(0,0,0,0.05); padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; font-size: 12px; color: #555; border-left: 2px solid #ccc; }
.quote-in-bubble-sender { font-weight: bold; margin-bottom: 2px; }
.quote-in-bubble-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }

/* --- 编辑视图 --- */
.edit-view { display: flex; flex-direction: column; }
.edit-textarea { width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-size: 14px; margin-bottom: 8px; resize: vertical; }
.edit-actions { display: flex; justify-content: flex-end; gap: 8px; }
.edit-btn { padding: 4px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.edit-btn.save { background-color: #07C160; color: white; }
.edit-btn.cancel { background-color: #f0f0f0; color: #333; }

/* --- 特殊消息类型 --- */
.msg-bubble.no-style { background: transparent !important; padding: 0; box-shadow: none; }
.msg-bubble.no-style::before, .msg-bubble.no-style::after { display: none; }
.message.sent .msg-bubble.has-location::after, .message.sent .msg-bubble.has-transfer::after { display: block; }
.message.received .msg-bubble.has-location::before, .message.received .msg-bubble.has-transfer::before { display: block; }
.message.sent .msg-bubble.has-location::after { border-left-color: white; }
.message.received .msg-bubble.has-location::before { border-right-color: white; }
.message.sent .msg-bubble.has-transfer::after { border-left-color: #FA9D3B; }
.message.received .msg-bubble.has-transfer::before { border-right-color: #FA9D3B; }
/* 已接收的转账小三角也使用浅橙色 */
.message.sent .msg-bubble.has-transfer.accepted::after { border-left-color: #FBD4A4; }
.message.received .msg-bubble.has-transfer.accepted::before { border-right-color: #FBD4A4; }

.image-msg img {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

.text-generated-image-container {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 2px;
  background-color: var(--text-quaternary);
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
}

.description-placeholder {
  position: absolute;
  top: 10px; left: 10px; right: 10px; bottom: 10px;
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-all;
  overflow-y: auto;
  text-align: center;
  -ms-overflow-style: none;
  scrollbar-width: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.description-placeholder::-webkit-scrollbar {
  display: none;
}
.sticker-msg img { max-width: 140px; display: block; }
.voice-msg-wrapper { cursor: pointer; }
.voice-msg { display: flex; align-items: center; gap: 5px; min-width: 60px; }
.voice-icon-svg { width: 20px; height: 20px; color: inherit; }
.message.sent .voice-icon-svg { transform: scaleX(-1); }

/* 语音播放动画 */
@keyframes voice-play-arc1 {
  0%, 83.3% { opacity: 1; transform: scale(1); } 
  83.4%, 100% { opacity: 0; transform: scale(0); }
}

@keyframes voice-play-arc2 {
  0%, 33.3% { opacity: 0; transform: scale(0); } 
  33.4%, 83.3% { opacity: 1; transform: scale(1); }
  83.4%, 100% { opacity: 0; transform: scale(0); } 
}

:deep(.voice-icon-svg.playing .voice-arc-1),
:deep(.voice-icon-svg.playing .voice-arc-2) {
  animation: infinite ease; 
  animation-duration: 1.8s; 
  transition: all 0.2s ease !important;
  transform-origin: center center;
  background: transparent !important; 
}

:deep(.voice-icon-svg.playing .voice-arc-1) {
  animation-name: voice-play-arc1;
}

:deep(.voice-icon-svg.playing .voice-arc-2) {
  animation-name: voice-play-arc2;
}

.voice-text {
  margin-top:5px;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  background: white;
  color: #333;
  max-width: 100%;
  position: relative;
  border: 1px solid #E5E5E5;
}
.location-msg { width: 200px; background: white; border-radius: 4px; overflow: hidden; }
.location-text { padding: 6px 12px; }
.location-map { width: 100%; height: 100px; background: #EEE; position: relative; }
.location-map img { width: 100%; height: 100%; object-fit: cover; }
.location-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; color: #FF3B30; }
.transfer-msg { width: 200px; background: #FA9D3B; border-radius: 4px; padding: 12px !important; color: white; cursor: pointer; transition: all 0.2s; }
/* 已接收的转账使用浅橙色背景 */
.transfer-msg.accepted-sender,
.transfer-msg.accepted-receiver { 
  background: #FBD4A4; 
  cursor: default; 
}
.transfer-msg:not(.accepted-sender):not(.accepted-receiver):active { opacity: 0.9; }
.transfer-content { display: flex; align-items: center; gap: 10px; }
.transfer-icon { width: 36px; height: 36px; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.transfer-icon svg { width: 25px;  /* 打勾图标宽度 */ height: 25px; /* 打勾图标高度 */ }
.transfer-info { display: flex; flex-direction: column; }
.transfer-amount { font-size: 16px; font-weight: 500; }
.transfer-desc { font-size: 12px; opacity: 0.9; }
.transfer-footer { margin-top: 8px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 10px; opacity: 0.8; }
.call-summary-msg { display: flex; align-items: center; gap: 8px; }
.call-summary-msg svg { width: 14px; height: 14px; color: #333; }

/* --- 系统/撤回消息 --- */
.system-message-wrapper { display: flex; flex-direction: column; align-items: center; max-width: 80%; }
.system-message-text { font-size: 11px; color: #888; padding: 6px 12px; background: transparent; border-radius: 10px; cursor: pointer; }
.revoked-content { margin-top: 4px; padding: 6px 10px; background: #D6D6D6; border-radius: 10px; font-size: 10px; color: #666; width: 100%; word-break: break-all; }

/* --- 多选模式 --- */
.message-checkbox { position: absolute; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: 2px solid #ccc; display: none; align-items: center; justify-content: center; cursor: pointer; background: white; z-index: 100; }
.message-checkbox.visible { display: flex; }
.message-checkbox.checked { background: #07C160; border-color: #07C160; }
.message-checkbox.checked::after { content: '✓'; color: white; font-size: 12px; font-weight: bold; }
.message.received .message-checkbox { left: 46px; right: auto; z-index: 5; }
.message.sent .message-checkbox { left: -26px; right: auto; }
.message.selection-mode-active.received .msg-bubble { margin-left: 25px; }

.message.revoked .message-checkbox {
  position: static;
  transform: none;
  margin-right: 5px;
}

/* --- 拉黑标记 --- */
.msg-bubble-box { display: flex; align-items: center; gap: 5px; }
.blocked-icon { width: 20px; height: 20px; color: #FF3B30; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>
