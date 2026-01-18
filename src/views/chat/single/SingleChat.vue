<template>
  <div class="chat-room active" :class="{ 'selection-mode': isSelectionMode }" @click="handleGlobalClick" ref="chatRoomRef">
    <!-- 背景层 -->
    <div class="chat-bg" :style="chatBackground ? { backgroundImage: `url(${chatBackground})` } : {}"></div>

    <!-- 顶部导航栏 -->
    <ChatRoomHeader 
      :charId="props.charId" 
      :charName="charName" 
      :charStatus="charStatus" 
      :isTyping="isTyping" 
      @trigger-ai="triggerAiResponse" 
      @open-settings="isSettingsVisible = true"
    />

    <!-- 消息列表区域 -->
    <ChatRoomMessageList
      ref="messageListRef"
      :messages="messages"
      :charName="charName"
      :charAvatar="charAvatar"
      :userAvatar="userAvatar"
      :bubbleStyle="bubbleStyle"
      :isSelectionMode="isSelectionMode"
      :selectedMessageIds="selectedMessageIds"
      :isBlocked="isBlocked"
      :editingMessageId="editingMessageId"
      :activePanel="activePanel"
      @save-edit="handleSaveEdit"
      @cancel-edit="editingMessageId = null"
      @toggle-selection="toggleMessageSelection"
      @long-press="startLongPress"
      @cancel-long-press="cancelLongPress"
      @touch-move="handleTouchMove"
      @click-msg="handleClick"
      @unblock="unblockCharacter"
    />

    <!-- 底部输入与工具栏 (非多选模式下显示) -->
    <ChatRoomInputBar
      v-if="!isSelectionMode"
      v-model="inputText"
      v-model:activePanel="activePanel"
      :quotingMessage="quotingMessage"
      @cancel-quote="quotingMessage = null"
      @send-message="sendMessage"
      @send-sticker="sendSticker"
      @trigger-voice="showVoiceInput"
      @trigger-image="triggerImageUpload"
      @trigger-video="startVideoCall"
      @trigger-location="sendLocation"
      @trigger-transfer="sendTransfer"
    />

    <!-- 多选操作栏 (多选模式下显示) -->
    <ChatRoomSelectionBar
      v-if="isSelectionMode"
      @action="handleBatchAction"
      @cancel="exitSelectionMode"
    />

    <!-- 弹窗组件区域 -->
    <!-- 语音输入弹窗 -->
    <VoiceInputModal 
      v-model:visible="showVoiceInputModal" 
      @confirm="sendVoiceMessage" 
    />

    <!-- 图片上传弹窗 -->
    <ImageUploadModal v-model:visible="showImageUploadModal" @send-image="handleSendImage" />

    <!-- 位置发送弹窗 -->
    <LocationInputModal 
      v-model:visible="showLocationInput" 
      @confirm="confirmSendLocation" 
    />

    <!-- 消息长按菜单 -->
    <ChatRoomMessageMenu
      :visible="messageMenu.visible"
      :targetEl="messageMenu.targetEl"
      :messageId="messageMenu.messageId"
      :charId="props.charId"
      :isSelectionMode="isSelectionMode"
      :selectedMessageIds="selectedMessageIds"
      @close="messageMenu.visible = false"
      @enter-selection-mode="enterSelectionMode"
      @trigger-ai-response="triggerAiResponse"
      @update:inputText="updateInputText"
      @quote-message="handleQuoteMessage"
      @edit-message="handleEditMessage"
    />

    <!-- 转发选择弹窗 -->
    <ForwardSelectionModal
      :visible="isForwarding"
      @close="isForwarding = false"
      @confirm="handleConfirmForward"
    />
  </div>
</template>

<script setup>
// ==========================================
// 1. 导入 (Imports)
// ==========================================
import { ref, computed, watch, onMounted, onUnmounted, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import { useApiStore } from '@/stores/apiStore'
import { useMessageSelection } from '@/composables/chat/useMessageSelection.js'
import { useAiResponder } from '@/composables/chat/useAiResponder.js'
import { useMessageEditing } from '@/composables/chat/useMessageEditing.js'
import { useMessageSender } from '@/composables/chat/useMessageSender.js'
import { useMessageInteraction } from '@/composables/chat/useMessageInteraction.js'

// 组件导入
import ChatRoomHeader from './components/SingleChatHeader.vue'
import ChatRoomInputBar from '../components/ChatInputBar.vue'
import ChatRoomMessageMenu from '../components/MessageMenu.vue'
import ChatRoomSelectionBar from '../components/SelectionBar.vue'
import ChatRoomMessageList from '../components/MessageList.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import VoiceInputModal from '../components/VoiceInput.vue'
import LocationInputModal from '../components/LocationInput.vue'
import Modal from '@/components/common/Modal.vue'
import ForwardSelectionModal from '../components/ForwardSelection.vue'

// ==========================================
// 2. 路由与状态管理 (Router & Stores)
// ==========================================
const props = defineProps({
  charId: {
    type: String,
    required: true,
  },
});

const router = useRouter()
const { t } = useI18n()
const singleStore = useSingleStore()
const themeStore = useThemeStore()
const apiStore = useApiStore()

// ==========================================
// 3. 基础状态与引用 (State & Refs)
// ==========================================
// DOM 引用
const messageListRef = ref(null)
const chatRoomRef = ref(null)

// UI 状态
const activePanel = ref(null) // 'emoji' | 'more' | null
const isSettingsVisible = ref(false)

// 消息菜单状态
const messageMenu = ref({
  visible: false,
  messageId: null,
  targetEl: null, // 用于定位菜单的目标元素
})

// 弹窗状态
const showImageUploadModal = ref(false)
const showVoiceInputModal = ref(false)
const showLocationInput = ref(false)

// ==========================================
// 4. 计算属性 (Computed)
// ==========================================
// 角色相关
const character = computed(() => singleStore.getCharacter(props.charId))
const isBlocked = computed(() => character.value?.isBlocked || false)
const charName = computed(() => character.value?.nickname || character.value?.name || t('chat.unknownCharacter'))
const charAvatar = computed(() => character.value?.avatar)
const charStatus = computed(() => character.value?.status || {})
const chatBackground = computed(() => character.value?.chatBackground || '')

// 用户相关
const userAvatar = computed(() => {
    // 确保 userPersonas 是响应式的
    const personas = singleStore.userPersonas;
    if (character.value?.userPersona && character.value.userPersona !== 'default') {
        const persona = personas.find(p => p.id === character.value.userPersona);
        if (persona && persona.avatar) return persona.avatar;
    }
    return localStorage.getItem('homeAvatar') || '';
});

// 消息列表
const messages = computed(() => singleStore.messages[props.charId] || [])

// 气泡样式
const bubbleSettings = computed(() => character.value?.bubbleSettings || {})

// --- 组合式函数 ---
const {
  isSelectionMode,
  selectedMessageIds,
  isForwarding,
  enterSelectionMode,
  exitSelectionMode,
  toggleMessageSelection,
  handleBatchAction,
  handleConfirmForward,
} = useMessageSelection(toRef(props, 'charId'))

const { isTyping, triggerAiResponse } = useAiResponder(toRef(props, 'charId'), apiStore)

const {
  inputText,
  quotingMessage,
  sendMessage,
  sendMsg,
  sendSticker,
  sendVoiceMessage: sendVoice,
  handleSendImage,
  confirmSendLocation: confirmSendLoc,
  sendTransfer,
} = useMessageSender(singleStore, toRef(props, 'charId'), themeStore, activePanel)

const {
  editingMessageId,
  handleEditMessage,
  handleSaveEdit,
  updateInputText,
} = useMessageEditing(singleStore, toRef(props, 'charId'), inputText)

const {
  startLongPress,
  cancelLongPress,
  handleTouchMove,
  wasClickAfterLongPress,
} = useMessageInteraction(messageMenu)


const bubbleStyle = computed(() => {
    const settings = bubbleSettings.value
    const base = {
        fontSize: settings.fontSize ? `${settings.fontSize}px` : '14px'
    }
    
    if (settings.css) {
        const styles = {}
        settings.css.split(';').forEach(rule => {
            const parts = rule.split(':')
            if (parts.length >= 2) {
                const prop = parts[0].trim()
                const val = parts.slice(1).join(':').trim()
                if (prop && val) {
                    styles[prop] = val
                }
            }
        })
        return { ...base, ...styles }
    }
    
    return base
})

// ==========================================
// 5. 监听器 (Watchers)
// ==========================================
watch(isSettingsVisible, (newValue) => {
  if (newValue) {
    router.push({ name: 'single-chat-settings', params: { id: props.charId } });
    isSettingsVisible.value = false; // 重置以避免返回时再次触发
  }
});
// 滚动逻辑已下沉到 MessageList 组件

// ==========================================
// 6. 生命周期 (Lifecycle)
// ==========================================
onMounted(() => {
  singleStore.clearUnreadCount(props.charId)
})

// 滚动逻辑已下沉到 MessageList 组件

// ==========================================
// 7. 方法 (Methods)
// ==========================================

// --- 核心消息逻辑 ---

// 解除拉黑
const unblockCharacter = () => {
    if (character.value) {
        character.value.isBlocked = false
        // 清除所有消息的 blocked 标记
        if (singleStore.messages[props.charId]) {
            singleStore.messages[props.charId].forEach(msg => {
                if (msg.blocked) {
                    msg.blocked = false
                }
            })
        }
        singleStore.saveData()
        themeStore.showToast(t('chat.toast.unblocked'))
    }
}

// --- UI 交互与控制 ---

// 全局点击处理 (关闭弹窗/面板)
const handleGlobalClick = (e) => {
    const target = e.target;

    // 如果点击在弹窗内，则不执行任何操作
    if (target.closest('.modal-overlay.active')) {
        return;
    }

    // 点击空白处关闭面板
    if (activePanel.value && !target.closest('.chat-footer')) {
        activePanel.value = null;
    }

    // 点击空白处退出多选模式
    if (isSelectionMode.value) {
        if (!target.closest('.message') && !target.closest('.chat-action-row') && !target.closest('.message-checkbox') && !target.closest('.message-menu')) {
            exitSelectionMode();
        }
    }

    // 点击空白处关闭菜单
    if (messageMenu.value.visible && !target.closest('.message-menu')) {
        messageMenu.value.visible = false;
    }
}

// --- 消息菜单与长按逻辑 ---

// 处理消息点击
const handleClick = (event, msgId) => {
  if (wasClickAfterLongPress()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  // 如果在多选模式下，点击即选中/取消选中
  if (isSelectionMode.value) {
    toggleMessageSelection(msgId);
  }
};

// 处理引用消息
const handleQuoteMessage = (msgId) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (msg) {
    quotingMessage.value = msg;
  }
};

// --- 扩展功能 (语音/图片/位置/视频) ---

// 语音输入
const showVoiceInput = () => {
    showVoiceInputModal.value = true
}

const sendVoiceMessage = (content) => {
    sendVoice(content)
    showVoiceInputModal.value = false
}

// 图片上传
const triggerImageUpload = () => {
    activePanel.value = null; // 关闭更多面板
    showImageUploadModal.value = true;
}

// 位置发送
const sendLocation = () => {
    showLocationInput.value = true
}

const confirmSendLocation = ({ name, detail }) => {
    confirmSendLoc(name, detail)
    showLocationInput.value = false
}

// 视频通话
const startVideoCall = () => {
    singleStore.startVideoCall(props.charId)
}

</script>

<style scoped>
.chat-room {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f5f5f5;
    position: relative;
    overflow: hidden;
}

.chat-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    pointer-events: none;
}
</style>
