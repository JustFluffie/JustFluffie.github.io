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
    if (notificationPermission.value === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options)
      })
    }
  }

  return {
    requestPermission,
    sendNotification,
    notificationPermission,
  }
}
