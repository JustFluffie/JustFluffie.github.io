<template>
  <div>
    <!-- 左侧图标组：传送到父组件的左侧区域 -->
    <Teleport to="#chatRoomLeftArea" v-if="isMounted">
      <div class="btn-icon bell-btn" @click="$emit('trigger-ai')" ref="bellBtn">
        <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      </div>
    </Teleport>
    
    <!-- 中间标题和状态：传送到父组件的标题区域 -->
    <Teleport to="#chatRoomTitleArea" v-if="isMounted">
      <div class="header-title-area">
        <div class="chat-room-title" v-if="!isTyping">{{ charName }}</div>
        <div class="typing-indicator" v-else>
          <span>{{ t('chat.singleChat.typing') }}</span>
          <span class="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>

      <div class="chat-room-status" @click="editStatus">
        <span>{{ charStatus.icon || '✨' }}</span>
        <span>{{ charStatus.text || t('chat.singleChat.addStatus') }}</span>
      </div>
    </Teleport>

    <!-- 右侧图标组：传送到父组件的右侧区域 -->
    <Teleport to="#chatRoomActionArea" v-if="isMounted">
      <div class="right-icons-group">
        <div class="btn-icon memory-btn" @click="openMemoryBank">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <div class="btn-icon more-btn" @click="$emit('open-settings')">
          <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </div>
      </div>
    </Teleport>

    <!-- 弹窗：状态设置 -->
    <Modal v-model:visible="showStatusModal" :title="t('chat.singleChat.setStatus')">
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <input type="text" class="base-input" v-model="statusIconInput" :placeholder="t('chat.singleChat.statusIcon')" style="width: 60px; text-align: center;">
        <input type="text" class="base-input" v-model="statusTextInput" :placeholder="t('chat.singleChat.statusText')" style="flex: 1;">
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="showStatusModal = false">{{ t('cancel') }}</button>
        <button class="modal-btn confirm" @click="confirmStatus">{{ t('confirm') }}</button>
      </template>
    </Modal>

  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
// Pinia
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
// 组件
import Modal from '@/components/common/Modal.vue'

// ================================================================================================
// 属性、事件和插槽
// ================================================================================================
const props = defineProps({
  charId: {
    type: String,
    required: true
  },
  charName: {
    type: String,
    default: ''
  },
  charStatus: {
    type: Object,
    default: () => ({})
  },
  isTyping: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['trigger-ai', 'open-settings'])

// ================================================================================================
// 组合式函数
// ================================================================================================
const { t } = useI18n()
const router = useRouter()
const singleStore = useSingleStore()
const themeStore = useThemeStore()

// ================================================================================================
// 响应式状态
// ================================================================================================
const showStatusModal = ref(false)
const statusIconInput = ref('')
const statusTextInput = ref('')
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

// ================================================================================================
// 方法
// ================================================================================================

/**
 * @description 打开状态编辑弹窗
 */
const editStatus = () => {
    const currentStatus = props.charStatus || {}
    statusIconInput.value = currentStatus.icon || '✨'
    statusTextInput.value = currentStatus.text || ''
    showStatusModal.value = true
}

/**
 * @description 确认并保存状态
 */
const confirmStatus = () => {
    const icon = statusIconInput.value.trim() || '✨'
    const text = statusTextInput.value.trim()
    
    const char = singleStore.getCharacter(props.charId)
    if (char) {
        if (text) {
            char.status = { icon, text }
        } else {
            char.status = null
        }
        singleStore.saveData()
        themeStore.showToast(t('saveSuccess'))
    }
    showStatusModal.value = false
}

/**
 * @description 打开记忆库
 */
const openMemoryBank = () => {
    router.push({ name: 'memory-bank', params: { charId: props.charId } })
}
</script>

<style scoped>
/* --- 组件样式 --- */
.header-title-area {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 27px;
}

.chat-room-title {
    max-width: 100%;
    overflow: hidden;
    font-size: 16.5px;
    font-weight: normal;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-top: 9px; 
}

.chat-room-status {
    display: flex;
    gap: 2px;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    margin-top: 2px;
    color: #999;
    cursor: pointer;
}

/* --- 按钮与图标 --- */
.btn-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #1a1a1a;
}

.bell-btn {
    margin-left: 5px; 
}

.right-icons-group {
    display: flex;
    align-items: center;
}

.more-btn {
    margin-left: 5px; 
}
.memory-btn {
    margin-right: 0;
}

.bell-btn svg,
.memory-btn svg {
    width: 20px;
    height: 20px;
    stroke-width: 2;
}

.more-btn svg {
    width: 23px;
    height: 23px;
    fill: currentColor;
}

/* --- 输入状态提示 --- */
.typing-indicator {
    position: relative;
    display: flex;
    align-items: baseline;
    font-size: 16.5px;
    font-weight: normal;
    position: relative;
    left: 6px; 
    color: #333;
    margin-top: 9px; 
}

.typing-indicator .dots {
    display: inline-block;
    width: 1.5em;
    text-align: left;
}

.typing-indicator .dots span {
    font-weight: bold;
    animation: blink 1.4s infinite both;
}

.typing-indicator .dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-indicator .dots span:nth-child(3) {
    animation-delay: 0.4s;
}

/* --- 动画 --- */
@keyframes blink {
    0% { opacity: .2; }
    20% { opacity: 1; }
    100% { opacity: .2; }
}
</style>
