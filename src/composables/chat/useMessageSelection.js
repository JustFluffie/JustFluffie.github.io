import { ref, nextTick } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';

export function useMessageSelection(charId) {
  const singleStore = useSingleStore();
  const themeStore = useThemeStore();

  // --- 状态 (State) ---
  const isSelectionMode = ref(false);
  const selectedMessageIds = ref(new Set());
  const isForwarding = ref(false);

  // --- 方法 (Methods) ---

  /**
   * 进入多选模式
   * @param {string} [msgId] - 可选，初始要选中的消息ID
   * @param {HTMLElement} [targetEl] - 可选，触发多选模式的目标元素
   */
  const enterSelectionMode = (msgId, targetEl) => {
    console.log('[useMessageSelection] enterSelectionMode triggered');
    
    let initialScrollTop = 0;
    let targetElTop = 0;
    const messageListEl = document.querySelector('.message-list');

    if (targetEl && messageListEl) {
      initialScrollTop = messageListEl.scrollTop;
      targetElTop = targetEl.getBoundingClientRect().top;
    }

    isSelectionMode.value = true;
    selectedMessageIds.value.clear();
    if (msgId) {
      selectedMessageIds.value.add(msgId);
    }

    if (targetEl && messageListEl) {
      nextTick(() => {
        const selectionBar = document.querySelector('.selection-bar');
        const selectionBarHeight = selectionBar ? selectionBar.offsetHeight : 0;
        const newTargetElTop = targetEl.getBoundingClientRect().top;
        const topDiff = newTargetElTop - targetElTop;
        
        messageListEl.scrollTop = initialScrollTop + topDiff - selectionBarHeight;
      });
    }
  };

  /**
   * 退出多选模式
   */
  const exitSelectionMode = () => {
    console.log('[useMessageSelection] exitSelectionMode triggered');
    isSelectionMode.value = false;
    selectedMessageIds.value.clear();
  };

  /**
   * 切换单条消息的选中状态
   * @param {string} msgId - 消息ID
   */
  const toggleMessageSelection = (msgId) => {
    console.log(`[useMessageSelection] toggleMessageSelection for msgId: ${msgId}`);
    if (selectedMessageIds.value.has(msgId)) {
      selectedMessageIds.value.delete(msgId);
    } else {
      selectedMessageIds.value.add(msgId);
    }
  };

  /**
   * 处理批量操作
   * @param {string} action - 操作类型 ('forward', 'delete', 'favorite')
   */
  const handleBatchAction = (action) => {
    console.log(`[useMessageSelection] handleBatchAction: ${action}`);
    if (selectedMessageIds.value.size === 0) return;

    const msgs = singleStore.messages[charId.value];

    if (action === 'forward') {
      isForwarding.value = true;
    } else if (action === 'delete') {
      themeStore.showConfirm(
        '删除消息',
        '确定删除选中的消息吗？',
        () => {
          console.log('[useMessageSelection] Deleting selected messages');
          singleStore.messages[charId.value] = msgs.filter(m => !selectedMessageIds.value.has(m.id));
          singleStore.saveData();
          exitSelectionMode();
        }
      );
    } else if (action === 'favorite') {
      if (!singleStore.favorites) singleStore.favorites = [];
      msgs.forEach(m => {
        if (selectedMessageIds.value.has(m.id)) {
          if (!singleStore.favorites.some(f => f.id === m.id)) {
            singleStore.favorites.push(m);
          }
        }
      });
      singleStore.saveData();
      themeStore.showToast('已收藏', 'success');
      exitSelectionMode();
    }
  };

  /**
   * 处理确认转发
   * @param {Array<string>} targetChatIds - 目标聊天ID列表
   */
  const handleConfirmForward = (targetChatIds) => {
    console.log('[useMessageSelection] handleConfirmForward triggered');
    isForwarding.value = false;

    const messages = singleStore.messages[charId.value] || [];
    const messagesToForward = messages.filter(msg => selectedMessageIds.value.has(msg.id));

    if (messagesToForward.length === 0) return;

    targetChatIds.forEach(targetId => {
      if (!singleStore.messages[targetId]) {
        singleStore.messages[targetId] = [];
      }
      messagesToForward.forEach(msg => {
        const newMsg = { ...msg, id: Date.now().toString() + Math.random() };
        singleStore.messages[targetId].push(newMsg);
      });
    });

    singleStore.saveData();
    themeStore.showToast(`已转发 ${messagesToForward.length} 条消息`);
    exitSelectionMode();
  };

  return {
    // 状态
    isSelectionMode,
    selectedMessageIds,
    isForwarding,
    // 方法
    enterSelectionMode,
    exitSelectionMode,
    toggleMessageSelection,
    handleBatchAction,
    handleConfirmForward,
  };
}
