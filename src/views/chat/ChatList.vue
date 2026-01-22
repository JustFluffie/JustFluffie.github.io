<template>
  <div class="chat-page active">
    <!-- ==================== 顶部备注模块 ==================== -->
    <div class="chat-top-note">
      <div class="chat-top-note-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <input 
        type="text" 
        class="chat-top-note-input" 
        :placeholder="t('chat.topNotePlaceholder')" 
        v-model="topNote"
        @blur="saveTopNote"
      >
    </div>

    <!-- ==================== 聊天列表模块 ==================== -->
    <div class="chat-list">
      <!-- 空状态 -->
      <div v-if="chatStore.sessionList.length === 0" class="empty-state">
        <div class="empty-text">{{ t('chat.empty') }}</div>
        <div class="empty-text" style="font-size: 12px;">{{ t('chat.emptyHint') }}</div>
      </div>

      <!-- 列表项 -->
      <div 
        v-else
        v-for="session in chatStore.sessionList" 
        :key="session.id" 
        class="chat-list-item" 
        :class="{ 'pinned': session.isPinned }"
        @mousedown.prevent="handlePressStart(session, $event)"
        @mouseup.prevent="handlePressEnd(session)"
        @mouseleave.prevent="handlePressLeave"
        @touchstart.prevent="handlePressStart(session, $event)"
        @touchend.prevent="handlePressEnd(session)"
      >
        <div class="chat-avatar" :style="session.avatar ? 'background: transparent;' : ''">
          <img v-if="session.avatar" :src="session.avatar" alt="">
          <span v-else class="default-avatar-text">{{ session.name[0] || '?' }}</span>
        </div>
        <div class="chat-info">
          <div class="chat-name">{{ session.name }}</div>
          <div class="chat-preview">{{ getPreview(session) }}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">{{ getLastTime(session) }}</div>
          <div class="chat-unread-badge" v-if="session.unreadCount > 0">{{ session.unreadCount }}</div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <ChatBottomNav />

    <!-- ==================== 弹窗模块 ==================== -->
    
    <!-- 长按菜单弹窗 -->
    <Modal v-model:visible="showContextMenu" :title="selectedSession?.name">
      <div class="modal-options centered-text">
        <div class="modal-option" @click="togglePin">
          <span class="option-text">{{ selectedSession?.isPinned ? t('chat.unpin') : t('chat.pin') }}</span>
        </div>
        <div class="modal-option btn-danger" @click="confirmDelete">
          <span class="option-text" style="color: inherit;">{{ t('delete') }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="showContextMenu = false">{{ t('cancel') }}</button>
      </template>
    </Modal>

    <!-- 添加角色/群聊选择弹窗 -->
    <Modal v-model:visible="showAddModal" :title="t('chat.newConversation')">
      <div class="modal-options centered-text">
        <div class="modal-option" @click="showCreateCharModal = true; showAddModal = false">
          <span class="option-text">{{ t('chat.createCharacter') }}</span>
        </div>
        <div class="modal-option" @click="createGroup">
          <span class="option-text">{{ t('chat.createGroup') }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="showAddModal = false">{{ t('cancel') }}</button>
      </template>
    </Modal>

    <!-- 创建角色输入弹窗 -->
    <Modal v-model:visible="showCreateCharModal" :title="t('chat.createCharacter')">
      <input 
        type="text" 
        class="base-input" 
        v-model="newCharName" 
        :placeholder="t('chat.characterNamePlaceholder')"
        ref="newCharInput"
      >
      <template #footer>
        <button class="modal-btn cancel" @click="closeCreateCharModal">{{ t('cancel') }}</button>
        <button class="modal-btn confirm" @click="confirmCreateChar">{{ t('create') }}</button>
      </template>
    </Modal>

  </div>
</template>

<script setup>
// ==========================================
// 1. 导入与基础设置
// ==========================================
import { ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import Modal from '@/components/common/Modal.vue'
import ChatBottomNav from './components/ChatBottomNav.vue'

const { t } = useI18n()
const router = useRouter()
const chatStore = useChatStore()
const singleStore = useSingleStore()
const themeStore = useThemeStore()

// ==========================================
// 2. 状态定义 (State & Refs)
// ==========================================
const topNote = ref('')
const showAddModal = ref(false)
const showCreateCharModal = ref(false)
const newCharName = ref('')
const newCharInput = ref(null)
const showContextMenu = ref(false)
const selectedSession = ref(null)
let pressTimer = null
let isClick = true

// ==========================================
// 3. 生命周期与监听
// ==========================================
onMounted(() => {
  topNote.value = chatStore.topNote
})

watch(showCreateCharModal, (val) => {
  if (val) {
    nextTick(() => {
      newCharInput.value?.focus()
    })
  }
})

// ==========================================
// 4. 暴露方法 (Expose)
// ==========================================
defineExpose({
  openAddModal: () => {
    showAddModal.value = true
  }
})

// ==========================================
// 5. 业务逻辑方法
// ==========================================

// --- 顶部备注逻辑 ---
const saveTopNote = () => {
  chatStore.saveTopNote(topNote.value)
}

// --- 列表显示逻辑 ---
const getPreview = (session) => {
  const lastMsg = session.lastMessage
  if (!lastMsg) return t('chat.start')
  
  if (lastMsg.type === 'text') return lastMsg.content
  if (lastMsg.type === 'voice') return t('chat.messageTypes.voice')
  if (lastMsg.type === 'image') return t('chat.messageTypes.image')
  if (lastMsg.type === 'sticker') return t('chat.messageTypes.sticker')
  if (lastMsg.type === 'location') return t('chat.messageTypes.location')
  if (lastMsg.type === 'transfer') return t('chat.messageTypes.transfer')
  if (lastMsg.type === 'call_summary') return lastMsg.content
  return t('chat.messageTypes.unknown')
}

const getLastTime = (session) => {
  const lastMsg = session.lastMessage
  if (!lastMsg) return ''
  
  const time = lastMsg.timestamp || lastMsg.time
  if (!time) return ''

  const date = new Date(time)
  if (isNaN(date.getTime())) return ''

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// --- 导航逻辑 ---

const openChatRoom = (session) => {
  if (!session || !session.id) {
    console.error('Attempted to open chat room with invalid session:', session);
    themeStore.showToast(t('chat.toast.openChatFailed'), 'error');
    return;
  }
  
  if (session.type === 'single') {
    router.push({ name: 'single-chat', params: { id: session.id } })
  } else if (session.type === 'group') {
    // 假设群聊路由名称为 'group-chat'
    // router.push({ name: 'group-chat', params: { id: session.id } })
    themeStore.showToast(t('chat.toast.groupChatWip'), 'info')
  }
}

// --- 创建角色/群聊逻辑 ---
const createGroup = () => {
  showAddModal.value = false
  themeStore.showToast(t('chat.toast.groupChatWip'), 'info')
}

const closeCreateCharModal = () => {
  showCreateCharModal.value = false
  newCharName.value = ''
}

const confirmCreateChar = () => {
  const name = newCharName.value.trim()
  if (!name) {
    themeStore.showToast(t('chat.enterCharacterName'), 'info')
    return
  }
  
  const newId = singleStore.addCharacter(name)
  closeCreateCharModal()
  // 重新获取 session 对象以跳转
  // 由于 sessionList 是计算属性，可能需要一点时间更新，或者我们可以手动构造一个临时 session 对象跳转
  // 这里简单处理，直接跳转路由，因为 openChatRoom 主要是为了处理不同类型
  router.push({ name: 'single-chat', params: { id: newId } })
}

// --- 长按菜单逻辑 ---
const handlePressStart = (session, event) => {
  // 仅处理左键点击或触摸事件
  if (event.type === 'mousedown' && event.button !== 0) return;
  
  isClick = true;
  pressTimer = setTimeout(() => {
    isClick = false;
    selectedSession.value = session;
    showContextMenu.value = true;
  }, 800); // 800ms 算作长按
}

const togglePin = () => {
  if (selectedSession.value) {
    chatStore.togglePin(selectedSession.value.id);
    showContextMenu.value = false;
  }
}

const confirmDelete = () => {
  showContextMenu.value = false;
  const session = selectedSession.value;
  if (!session) return;
  
  themeStore.showConfirm(
    t('chat.deleteCharacterTitle'),
    t('chat.deleteCharacterConfirm', { name: session.name }),
    () => {
      if (session.type === 'single') {
        singleStore.deleteCharacter(session.id);
        themeStore.showToast(t('chat.toast.deleteSuccess'), 'success');
      } else {
        themeStore.showToast('群组删除功能暂未开放', 'info');
      }
    },
    { messageStyle: { whiteSpace: 'pre-wrap', color: '#FF3B30' }, confirmText: 'delete' }
  );
}

const handlePressEnd = (session) => {
  clearTimeout(pressTimer);
  if (isClick) {
    // 如果是短按（点击），则执行跳转
    openChatRoom(session);
  }
}

const handlePressLeave = () => {
  clearTimeout(pressTimer);
}
</script>

<style scoped>
/* ==================== 页面布局 ==================== */
.chat-page {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: white;
}

/* ==================== 顶部备注样式 ==================== */
.chat-top-note {
  margin: 0;
  padding: 10px 23px;
  background: #f5f5f5;
  border-radius: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: text;
  border-top: 1px solid #ebebeb;
  border-bottom: 1px solid #ebebeb;
}

.chat-top-note-icon {
  width: 22px;
  height: 22px;
  color: #666;
  display: flex;
  transform: translate(2px, 0px);
  align-items: center;
  justify-content: center;
}

.chat-top-note-icon svg {
  width: 100%;
  height: 100%;
  stroke-width: 1.5;
}

.chat-top-note-input {
  background: transparent;
  border-color: transparent;
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333;
}

.chat-top-note-input:focus {
  background: var(--bg-light);
  border-color: var(--border-color);
  box-shadow: none;
}

/* ==================== 列表项样式 ==================== */
.chat-list-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #ebebeb;
}

.chat-list-item:active {
  background: #f5f5f5;
}

.chat-list-item.pinned {
  background-color: #f5f5f5;
}

.chat-avatar {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #333;
  flex-shrink: 0;
  overflow: hidden;
}

.default-avatar-text {
  font-weight: 600;
  font-size: 18px;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.chat-preview {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  text-align: right;
}

.chat-time {
  font-size: 11px;
  color: var(--text-quaternary);
  margin-bottom: 6px;
}

.chat-unread-badge {
  background-color: #FF3B30;
  color: white;
  font-size: 11px;
  font-weight: 500;
  padding: 0px 5px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

/* 空状态样式已移至 Business.css */
/* 弹窗样式已移至 components/Modal.css */

/* 修复删除按钮样式被覆盖的问题 */
.modal-option.btn-danger {
  background-color: var(--danger-bg, #ff3b30);
  color: white;
}
</style>
