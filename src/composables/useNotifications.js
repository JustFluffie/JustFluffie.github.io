import { ref } from 'vue'

export function useNotifications() {
  const notificationPermission = ref(Notification.permission)

  async function requestPermission() {
    if (!('Notification' in window)) {
      console.error('This browser does not support desktop notification')
      return
    }

    if (notificationPermission.value !== 'granted') {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission
    }
  }

  function sendNotification(title, options) {
    console.log('Attempting to send notification...');
    if (notificationPermission.value !== 'granted') {
      console.error('Notification permission is not granted. Current status:', notificationPermission.value);
      return;
    }
    
    console.log('Notification permission is granted.');

    if (!('serviceWorker' in navigator)) {
        console.error('Service Worker not supported in this browser.');
        return;
    }

    navigator.serviceWorker.ready.then(registration => {
      console.log('Service Worker is ready. Registration:', registration);
      registration.showNotification(title, options)
        .then(() => {
          console.log('showNotification promise resolved.');
        })
        .catch(err => {
          console.error('showNotification promise rejected:', err);
        });
    }).catch(err => {
        console.error('Service Worker not ready:', err);
    });
  }

  return {
    requestPermission,
    sendNotification,
    notificationPermission,
  }
}
