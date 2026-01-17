import { ref, nextTick } from 'vue';

export function useMessageEditing(chatStore, charId, inputText) {
  const editingMessageId = ref(null);

  /**
   * 触发消息的内联编辑模式
   * @param {string} msgId - 要编辑的消息ID
   */
  const handleEditMessage = (msgId) => {
    console.log('[useMessageEditing] handleEditMessage for msgId:', msgId);
    editingMessageId.value = msgId;
  };

  /**
   * 保存内联编辑后的消息内容
   * @param {object} payload - 包含 msgId 和 newContent 的对象
   */
  const handleSaveEdit = ({ msgId, newContent }) => {
    console.log('[useMessageEditing] handleSaveEdit for msgId:', msgId);
    const msgs = chatStore.messages[charId.value];
    const msg = msgs.find(m => m.id === msgId);
    if (msg) {
      msg.content = newContent;
      chatStore.saveData();
    }
    editingMessageId.value = null;
  };

  /**
   * 将消息内容更新到主输入框（用于“在输入框中编辑”等功能）
   * @param {string} content - 要放入输入框的内容
   */
  const updateInputText = (content) => {
    console.log('[useMessageEditing] updateInputText called');
    if (inputText) {
      inputText.value = content;
      // 聚焦输入框是一个UI副作用，理想情况下应由组件处理，
      // 但为满足需求，此处一并处理。
      nextTick(() => {
        const inputEl = document.querySelector('.chat-input');
        if (inputEl) inputEl.focus();
      });
    }
  };

  return {
    editingMessageId,
    handleEditMessage,
    handleSaveEdit,
    updateInputText,
  };
}
