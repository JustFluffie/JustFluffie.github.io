<template>
  <!-- 消息操作菜单 -->
  <div v-if="visible"
       ref="menuRef"
       class="message-menu"
       :class="{ 'menu-top': position === 'top', 'menu-bottom': position === 'bottom' }"
       :style="menuStyle"
       >
    <!-- 菜单项 -->
    <div class="menu-grid">
      <div class="menu-item" @click="handleAction('copy')">{{ t('copy') }}</div>
      <div class="menu-item" @click="handleAction('favorite')">{{ t('favorite') }}</div>
      <div class="menu-item" @click="handleAction('delete')">{{ t('delete') }}</div>
      <div class="menu-item" @click="handleAction('revoke')">{{ t('revoke') }}</div>
      <div class="menu-item" @click="handleAction('select')">{{ t('select') }}</div>
      <div class="menu-item" @click="handleAction('quote')">{{ t('quote') }}</div>
      <div class="menu-item" @click="handleAction('retry')">{{ t('retry') }}</div>
      <div class="menu-item" @click="handleAction('edit')">{{ t('edit') }}</div>
    </div>
    <!-- 指示箭头 -->
    <div class="menu-arrow" :style="{ left: arrowLeft + 'px' }"></div>
  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, watch, nextTick, inject } from 'vue';
import { useI18n } from 'vue-i18n';
// Pinia
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';

// ================================================================================================
// 属性、事件和注入
// ================================================================================================
const props = defineProps({
  visible: { type: Boolean, default: false },
  targetEl: { type: Object, default: null },
  messageId: { type: String, default: null },
  charId: { type: String, required: true },
});

const emit = defineEmits([
  'close', 'enter-selection-mode', 'trigger-ai-response', 
  'quote-message', 'edit-message'
]);

const phoneScreenRef = inject('phoneScreenRef');

// ================================================================================================
// 组合式函数
// ================================================================================================
const { t } = useI18n();
const singleStore = useSingleStore();
const themeStore = useThemeStore();

// ================================================================================================
// 响应式状态
// ================================================================================================
const menuRef = ref(null);
const menuStyle = ref({});
const arrowLeft = ref(0);
const position = ref('top'); // 'top' or 'bottom'

// ================================================================================================
// 侦听器
// ================================================================================================
watch(() => props.visible, async (isVisible) => {
  if (isVisible && props.targetEl) {
    await nextTick();
    calculateMenuPosition();
  }
});

// ================================================================================================
// 方法
// ================================================================================================
/**
 * @description 计算菜单的位置和箭头的位置
 */
const calculateMenuPosition = () => {
  const menuEl = menuRef.value;
  if (!menuEl) return;

  const targetRect = props.targetEl.getBoundingClientRect();
  const menuWidth = menuEl.offsetWidth;
  const menuHeight = menuEl.offsetHeight;
  const margin = 8;

  const container = phoneScreenRef.value;
  const containerRect = container ? container.getBoundingClientRect() : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

  // 决定菜单在目标上方还是下方
  position.value = 'top';
  let menuTop = targetRect.top - menuHeight - margin;
  if (menuTop < containerRect.top + margin) {
    position.value = 'bottom';
    menuTop = targetRect.bottom + margin;
  }

  // 计算菜单的水平位置
  const targetCenter = targetRect.left + targetRect.width / 2;
  let menuLeft = targetCenter - menuWidth / 2;

  // 边界检查
  if (menuLeft < containerRect.left + margin) menuLeft = containerRect.left + margin;
  if (menuLeft + menuWidth > containerRect.left + containerRect.width - margin) {
    menuLeft = containerRect.left + containerRect.width - menuWidth - margin;
  }

  // 计算箭头的位置
  let finalArrowLeft = targetCenter - menuLeft;
  const arrowWidth = 12;
  const minArrowLeft = arrowWidth / 2 + 5;
  const maxArrowLeft = menuWidth - arrowWidth / 2 - 5;
  finalArrowLeft = Math.max(minArrowLeft, Math.min(finalArrowLeft, maxArrowLeft));

  menuStyle.value = { top: `${menuTop}px`, left: `${menuLeft}px` };
  arrowLeft.value = finalArrowLeft;
};

/**
 * @description 处理菜单项的点击事件
 * @param {string} action - 操作类型
 */
const handleAction = (action) => {
  const msgId = props.messageId;
  if (!msgId) return;

  const msgs = singleStore.messages[props.charId];
  const msgIndex = msgs.findIndex(m => m.id === msgId);
  const msg = msgs[msgIndex];

  const actions = {
    copy: () => {
      if (msg.content) {
        navigator.clipboard.writeText(msg.content);
        themeStore.showToast(t('chat.messageMenu.toast.copied'));
      }
    },
    favorite: () => {
      if (!singleStore.favorites) singleStore.favorites = [];
      if (!singleStore.favorites.some(f => f.id === msg.id)) {
        singleStore.favorites.push(msg);
        singleStore.saveData();
        themeStore.showToast(t('chat.messageMenu.toast.favorited'));
      } else {
        themeStore.showToast(t('chat.messageMenu.toast.alreadyFavorited'));
      }
    },
    delete: () => {
      themeStore.showConfirm(t('chat.messageMenu.confirmDelete'), t('chat.messageMenu.confirmDeleteMsg'), () => {
        singleStore.messages[props.charId].splice(msgIndex, 1);
        singleStore.saveData();
      });
    },
    revoke: () => {
      if (msg) {
        msg.type = 'revoked';
        singleStore.saveData();
        themeStore.showToast(t('chat.messageMenu.toast.revoked'));
      }
    },
    select: () => emit('enter-selection-mode', msgId),
    quote: () => emit('quote-message', msgId),
    retry: () => {
      if (msg.sender !== 'user') {
        // 如果是AI消息，删除当前消息并重新生成
        singleStore.messages[props.charId].splice(msgIndex, 1);
      } else {
        // 如果是用户消息，删除此条消息之后的所有消息
        singleStore.retryFromMessage(props.charId, msgId);
      }
      singleStore.saveData();
      emit('trigger-ai-response');
    },
    edit: () => {
       if (msg.type === 'text') {
        emit('edit-message', msgId);
      } else {
        themeStore.showToast(t('chat.messageMenu.toast.editTextOnly'), 'info');
      }
    }
  };

  if (actions[action]) {
    actions[action]();
  }
  
  emit('close');
};
</script>

<style scoped>
/* --- 根容器 --- */
.message-menu {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 1000;
  width: 300px;
  padding: 4px;
}

/* --- 菜单项 --- */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.menu-item {
  width: auto;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: white;
  border-radius: 4px;
}

.menu-item:active {
  background: rgba(255, 255, 255, 0.1);
}

/* --- 箭头 --- */
.menu-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  transform: translateX(-50%);
}

.message-menu.menu-top .menu-arrow {
  bottom: -5px;
  border-top: 6px solid rgba(0, 0, 0, 0.9);
}

.message-menu.menu-bottom .menu-arrow {
  top: -5px;
  border-bottom: 6px solid rgba(0, 0, 0, 0.9);
}
</style>
