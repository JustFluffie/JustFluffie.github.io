<template>
  <Transition name="notification-slide">
    <div v-if="store.show" class="notification-banner" @click="handleClick">
      <div class="avatar">
        <img :src="store.icon || DEFAULT_ICON" alt="icon" @error="handleImageError">
      </div>
      <div class="content-area">
        <div class="character-remark">{{ store.title }}</div>
        <div class="message-content">{{ store.content }}</div>
      </div>
      <span class="notification-time">{{ store.time }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notificationStore';

const store = useNotificationStore();
const DEFAULT_ICON = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📱</text></svg>';

const handleClick = () => {
  if (store.onClick) {
    store.onClick();
  }
  store.hideNotification();
};

const handleImageError = (e) => {
  if (e.target.src !== DEFAULT_ICON) {
    e.target.src = DEFAULT_ICON;
  }
};
</script>

<style scoped>
.notification-banner {
  position: absolute;
  top: 30px;
  left: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 15px;
  min-height: 80px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 10px; /* Changed from 50% for a square look */
  overflow: hidden;
  background: #f0f0f0;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex-grow: 1;
  overflow: hidden;
  padding-right: 40px; /* 避免文字与时间重叠 */
}

.character-remark {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-content {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 11px;
  color: #888;
}

/* Dark mode support (temporarily disabled) */
/*
@media (prefers-color-scheme: dark) {
  .notification-banner {
    background: rgba(40, 40, 40, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .character-remark,
  .message-content {
    color: #fff;
  }
}
*/

/* Animation */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notification-slide-enter-from,
.notification-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
