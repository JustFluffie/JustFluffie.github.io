import { ref } from 'vue';

export function useMessageSender(chatStore, charId, themeStore, activePanel) {
  const inputText = ref('');
  const quotingMessage = ref(null);

  /**
   * 核心消息发送方法
   * @param {string} type - 消息类型
   * @param {any} content - 消息内容
   * @param {object} [extra={}] - 额外数据
   */
  const sendMsg = (type, content, extra = {}) => {
    console.log(`[useMessageSender] sendMsg called with type: ${type}`);
    const newExtra = { ...extra };
    if (quotingMessage.value) {
      newExtra.quote = {
        id: quotingMessage.value.id,
        sender: quotingMessage.value.sender,
        content: quotingMessage.value.content,
      };
    }

    if (!chatStore.messages[charId.value]) {
      chatStore.messages[charId.value] = [];
    }
    chatStore.messages[charId.value].push({
      id: Date.now().toString() + Math.random(), // 增加随机性防止ID重复
      sender: 'user',
      type: type,
      content: content,
      timestamp: Date.now(),
      ...newExtra
    });
    chatStore.saveData();
    if (activePanel) activePanel.value = null; // 发送后关闭面板
    quotingMessage.value = null; // 发送后清除引用
  };

  /**
   * 发送文本消息
   */
  const sendMessage = () => {
    console.log('[useMessageSender] sendMessage triggered');
    const text = inputText.value.trim();
    if (!text) return;
    sendMsg('text', text);
    inputText.value = '';
  };

  /**
   * 发送表情包
   * @param {object} sticker - 表情包对象
   */
  const sendSticker = (sticker) => {
    console.log('[useMessageSender] sendSticker triggered');
    sendMsg('sticker', sticker.url, { name: sticker.name });
  };

  /**
   * 发送语音消息
   * @param {string} content - 语音转文字的内容
   */
  const sendVoiceMessage = (content) => {
    console.log('[useMessageSender] sendVoiceMessage triggered');
    if (content) {
      sendMsg('voice', content);
    }
  };

  /**
   * 处理并发送图片
   * @param {object} imageData - 图片数据
   */
  const handleSendImage = (imageData) => {
    console.log('[useMessageSender] handleSendImage triggered');
    if (imageData.isTextGenerated) {
      sendMsg('image', imageData.description, { isTextGenerated: true });
    } else if (imageData.type === 'base64' || imageData.type === 'url') {
      sendMsg('image', imageData.content);
    }
  };

  /**
   * 确认并发送位置
   * @param {string} locationName - 位置名称
   * @param {string} locationDetail - 详细地址
   */
  const confirmSendLocation = (locationName, locationDetail) => {
    console.log('[useMessageSender] confirmSendLocation triggered');
    if (!locationName) {
      themeStore.showToast('请输入位置名称', 'info');
      return;
    }
    sendMsg('location', locationName, { detail: locationDetail });
  };

  /**
   * 发送转账
   * @param {string} amount - 转账金额
   * @param {string} note - 转账说明
   */
  const sendTransfer = (amount, note) => {
    console.log('[useMessageSender] sendTransfer triggered', amount, note);
    sendMsg('transfer', amount, { note, status: 'pending' });
  };

  return {
    inputText,
    quotingMessage,
    sendMessage,
    sendMsg,
    sendSticker,
    sendVoiceMessage,
    handleSendImage,
    confirmSendLocation,
    sendTransfer,
  };
}
