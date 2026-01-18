import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';

export const useNotificationStore = defineStore('notification', () => {
  // --- State ---
  
  // 1. In-app notification banner state
  const show = ref(false);
  const title = ref('');
  const content = ref('');
  const icon = ref('');
  const time = ref('');
  const onClick = ref(null);
  const duration = ref(3000);
  let bannerTimer = null;

  // 2. Desktop notification state
  const permission = ref('Notification' in window ? Notification.permission : 'unsupported');
  const desktopNotificationsEnabled = useStorage('settings-desktop-notifications', false);

  // --- Actions ---

  // Action to request permission for desktop notifications
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      permission.value = 'unsupported';
      desktopNotificationsEnabled.value = false;
      return;
    }

    if (permission.value !== 'granted') {
        const status = await Notification.requestPermission();
        permission.value = status;
        // Only enable by default if user grants permission
        if (status === 'granted') {
          desktopNotificationsEnabled.value = true;
        }
    }
  };

  // Unified action to trigger a notification
  const triggerNotification = (notifyTitle, notifyContent, notifyIcon, notifyOnClick = null, notifyDuration = 3000, type = 'text') => {
    // Format content based on message type
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

    // Always show in-app notification first
    showInAppNotification(notifyTitle, formattedContent, notifyIcon, notifyOnClick, notifyDuration);

    // Then, if enabled, also send a desktop notification
    if (desktopNotificationsEnabled.value && permission.value === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(notifyTitle, {
          body: formattedContent,
          icon: notifyIcon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `chat-message-${Date.now()}`
        });
      }).catch(err => {
        console.error('Service Worker not ready for desktop notification:', err);
      });
    }
  };

  // Internal function to show the in-app banner
  const showInAppNotification = (notifyTitle, formattedContent, notifyIcon, notifyOnClick, notifyDuration) => {
    title.value = notifyTitle;
    content.value = formattedContent;
    icon.value = notifyIcon;
    time.value = '现在';
    onClick.value = () => {
      if (typeof notifyOnClick === 'function') {
        notifyOnClick();
      }
      hideNotification(); // Hide banner on click
    };
    duration.value = notifyDuration;
    show.value = true;

    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      hideNotification();
    }, notifyDuration);
  }

  // Action to hide the in-app notification banner
  const hideNotification = () => {
    show.value = false;
    if (bannerTimer) {
      clearTimeout(bannerTimer);
      bannerTimer = null;
    }
  };
  
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
