<template>
  <div class="profile-page">
    <div class="profile-content">
      <!-- 顶部用户信息 -->
      <div class="profile-header">
        <div class="user-info">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="User Avatar">
        </div>
        <div class="user-details">
          <div class="user-name">我</div>
          <div class="user-id">ID: user_001</div>
        </div>
        <div class="qr-code-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
            <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" />
          </svg>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="#999" fill="none" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>

      <!-- 功能列表 -->
      <div class="menu-list">
        <!-- 钱包 -->
        <div class="menu-item" @click="router.push({ name: 'profile-wallet' })">
          <div class="menu-icon wallet-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#07C160" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4.5" width="20" height="15" rx="2" />
              <path d="M22 9h-7a3 3 0 0 0 0 6h7" />
              <circle cx="15" cy="12" r="1.5" fill="#07C160" stroke="none" />
            </svg>
          </div>
          <div class="menu-content">
            <span class="menu-text">钱包</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" width="16" height="16" stroke="#999" fill="none" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div class="menu-list">
        <!-- 人设管理 -->
        <div class="menu-item" @click="showPersonaToast">
          <div class="menu-icon settings-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#576B95" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="menu-content">
            <span class="menu-text">人设管理</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" width="16" height="16" stroke="#999" fill="none" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <ChatBottomNav />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import ChatBottomNav from '../components/ChatBottomNav.vue'

const router = useRouter()
const themeStore = useThemeStore()

const showPersonaToast = () => {
  themeStore.showToast('人设管理功能开发中', 'info')
}
</script>

<style scoped>
.profile-page {
  flex: 1;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.profile-content {
  flex: 1;
  overflow-y: auto;
}

.profile-header {
  background: white;
  padding: 30px 25px 40px;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 20px;
  background: #eee;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
}

.user-id {
  font-size: 14px;
  color: #666;
}

.qr-code-icon {
  display: flex;
  align-items: center;
  color: #666;
  gap: 10px;
}

.menu-list {
  background: white;
  margin-bottom: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-icon {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid transparent; /* 占位 */
}

.menu-text {
  font-size: 16px;
  color: #000;
}

.arrow-icon {
  opacity: 0.5;
}
</style>
