<template>
  <Transition name="notification-slide">
    <div v-if="store.show" class="notification-banner" @click="handleClick">
      <div class="notification-content-wrapper">
        <div class="notification-header">
          <div class="notification-app-info">
            <div class="notification-icon">
              <img :src="store.icon || DEFAULT_ICON" alt="icon" @error="handleImageError">
            </div>
            <span class="notification-title">{{ store.title }}</span>
          </div>
          <span class="notification-time">{{ store.time }}</span>
        </div>
        <div class="notification-body">
          {{ store.content }}
        </div>
      </div>
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
  top: 10px;
  left: 10px;
  right: 10px;
  background: white;
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 12px 12px;
  min-height: 60px; /* 增加最小高度 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  display: flex; /* 使用 flex 布局使内容垂直居中 */
  align-items: center; /* 垂直居中 */
}

.notification-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-app-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
  background: #f0f0f0;
}

.notification-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notification-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.notification-time {
  font-size: 11px;
  color: #888;
}

.notification-body {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dark mode support (temporarily disabled) */
/*
@media (prefers-color-scheme: dark) {
  .notification-banner {
    background: rgba(40, 40, 40, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .notification-title {
    color: #fff;
  }
  
  .notification-body {
    color: #ddd;
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
