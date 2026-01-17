import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';

export const useNotificationStore = defineStore('notification', () => {
  // --- State ---
  // App-internal notification banner state
  const show = ref(false);
  const title = ref('');
  const content = ref('');
  const icon = ref('');
  const time = ref('');
  const onClick = ref(null);
  const duration = ref(3000);
  
  // Desktop notification state
  const permission = ref(Notification.permission);
  const desktopNotificationsEnabled = useStorage('settings-desktop-notifications', false);

  let timer = null;

  // --- Actions ---

  // Request permission for desktop notifications
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      desktopNotificationsEnabled.value = false;
      return;
    }

    const status = await Notification.requestPermission();
    permission.value = status;
    if (status === 'granted') {
      desktopNotificationsEnabled.value = true;
    } else {
      desktopNotificationsEnabled.value = false;
    }
  };

  // Trigger a notification
  const triggerNotification = (notifyTitle, notifyContent, notifyIcon, notifyOnClick = null, notifyDuration = 3000, type = 'text') => {
    // Format content based on type
    let formattedContent = notifyContent;
    switch (type) {
      case 'image': formattedContent = '[图片]'; break;
      case 'sticker': formattedContent = '[表情包]'; break;
      case 'voice': formattedContent = '[语音]'; break;
      case 'location': formattedContent = '[位置]'; break;
      case 'transfer': formattedContent = '[转账]'; break;
      case 'call_summary': formattedContent = '[通话]'; break;
      default: break;
    }

    // Logic for showing desktop vs. in-app notification
    if (desktopNotificationsEnabled.value && permission.value === 'granted') {
      // Use system notification
      const notification = new Notification(notifyTitle, {
        body: formattedContent,
        icon: notifyIcon,
        tag: `chat-message-${Date.now()}` // Unique tag to prevent stacking
      });

      notification.onclick = () => {
        window.focus(); // Focus the window on click
        if (notifyOnClick) {
          notifyOnClick();
        }
        notification.close();
      };
    } else {
      // Use in-app notification banner
      title.value = notifyTitle;
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
    }
  };

  // Hide the in-app notification banner
  const hideNotification = () => {
    show.value = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  
  // When the enabled setting is turned off, ensure permission isn't requested again automatically
  watch(desktopNotificationsEnabled, (newValue) => {
    if (!newValue) {
      // If user disables it from settings, we don't change the browser permission state
      // but we stop showing desktop notifications.
    }
  });

  return {
    // In-app banner state
    show,
    title,
    content,
    icon,
    time,
    onClick,
    // Desktop notification state
    permission,
    desktopNotificationsEnabled,
    // Actions
    requestPermission,
    triggerNotification,
    hideNotification
  };
});
