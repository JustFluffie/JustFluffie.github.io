import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  const show = ref(false);
  const title = ref('');
  const content = ref('');
  const icon = ref('');
  const time = ref('');
  const onClick = ref(null);
  const duration = ref(3000);
  
  let timer = null;

  const triggerNotification = (notifyTitle, notifyContent, notifyIcon, notifyOnClick = null, notifyDuration = 3000, type = 'text') => {
    title.value = notifyTitle;
    
    // 根据消息类型格式化内容
    let formattedContent = notifyContent;
    switch (type) {
      case 'image':
        formattedContent = '[图片]';
        break;
      case 'sticker':
        formattedContent = '[表情包]';
        break;
      case 'voice':
        formattedContent = '[语音]';
        break;
      case 'location':
        formattedContent = '[位置]';
        break;
      case 'transfer':
        formattedContent = '[转账]';
        break;
      case 'call_summary':
        formattedContent = '[通话]';
        break;
      case 'text':
      default:
        // 文本消息保持原样
        break;
    }
    
    content.value = formattedContent;
    icon.value = notifyIcon;
    time.value = '现在';
    onClick.value = notifyOnClick;
    duration.value = notifyDuration;
    show.value = true;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      show.value = false;
    }, notifyDuration);
  };

  const hideNotification = () => {
    show.value = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    show,
    title,
    content,
    icon,
    time,
    onClick,
    triggerNotification,
    hideNotification
  };
});
