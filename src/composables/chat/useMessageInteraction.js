import { ref } from 'vue';

export function useMessageInteraction(messageMenu) {
  const longPressTimer = ref(null);
  const wasLongPress = ref(false);
  const touchStartPos = ref({ x: 0, y: 0 });

  /**
   * 内部方法：显示消息操作菜单
   */
  const showMenu = (event, messageId) => {
    console.log('[useMessageInteraction] showMenu triggered');
    event.preventDefault();
    const targetEl = event.target.closest('.msg-bubble, .system-message-wrapper');
    if (targetEl) {
      messageMenu.value = {
        visible: true,
        messageId: messageId,
        targetEl: targetEl
      };
    }
  };

  /**
   * 开始长按计时
   */
  const startLongPress = (event, messageId) => {
    console.log('[useMessageInteraction] startLongPress triggered');
    event.stopPropagation();
    wasLongPress.value = false;
    clearTimeout(longPressTimer.value);

    const isTouchEvent = event.type.startsWith('touch');
    if (isTouchEvent) {
      touchStartPos.value = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }

    longPressTimer.value = setTimeout(() => {
      wasLongPress.value = true;
      showMenu(event, messageId);
    }, 400);
  };

  /**
   * 取消长按计时
   */
  const cancelLongPress = () => {
    console.log('[useMessageInteraction] cancelLongPress triggered');
    clearTimeout(longPressTimer.value);
  };

  /**
   * 处理触摸移动，如果移动距离过大则取消长按
   */
  const handleTouchMove = (event) => {
    console.log('[useMessageInteraction] handleTouchMove triggered');
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.value.x);
    const dy = Math.abs(touch.clientY - touchStartPos.value.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.value);
    }
  };

  /**
   * 检查并处理点击事件是否发生在长按之后
   * @returns {boolean} - 如果是长按后的点击，返回 true，否则返回 false
   */
  const wasClickAfterLongPress = () => {
    if (wasLongPress.value) {
      wasLongPress.value = false; // 重置标志
      return true; // 阻止后续的点击逻辑
    }
    return false;
  };

  return {
    startLongPress,
    cancelLongPress,
    handleTouchMove,
    wasClickAfterLongPress,
  };
}
