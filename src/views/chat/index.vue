<template>
  <div class="chat-module">
    <!-- 如果不是聊天室，则显示完整的 App 布局 -->
    <template v-if="!isChatRoom">
      <div class="chat-app-layout">
        <!-- 顶部栏 -->
        <div class="app-header" :class="{ 'moments-header-style': currentTab === 'moments' }" id="chatAppHeader">
          <div class="back-btn" @click="goBack" :class="{ 'white-icon': currentTab === 'moments' }">
            <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </div>
          <div class="title" id="chatAppTitle" v-if="currentTab !== 'moments'">WeChat</div>
          <div class="action-btn" id="chatAppActionBtn" @click="openAddModal" v-if="currentTab !== 'moments'">
            <svg-icon name="plus-circle" />
          </div>
          <div class="action-btn" id="momentsActionBtn" @click="openMomentsModal" v-if="currentTab === 'moments' && showMomentsCamera">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="chat-app-content">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" ref="childRef" />
            </keep-alive>
          </router-view>
        </div>

        <!-- 底部导航栏 -->
        <div class="chat-bottom-nav" v-if="currentTab !== 'moments'">
          <div class="chat-nav-item" :class="{ active: currentTab === 'chat' }" @click="switchTab('chat')">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></span>
            <span class="nav-label">聊天</span>
          </div>
          <div class="chat-nav-item" :class="{ active: currentTab === 'moments' }" @click="switchTab('moments')">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></span>
            <span class="nav-label">朋友圈</span>
          </div>
          <div class="chat-nav-item" :class="{ active: currentTab === 'npc' }" @click="switchTab('npc')">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>
            <span class="nav-label">NPC</span>
          </div>
          <div class="chat-nav-item" :class="{ active: currentTab === 'favorites' }" @click="switchTab('favorites')">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></span>
            <span class="nav-label">收藏</span>
          </div>
          <div class="chat-nav-item" :class="{ active: currentTab === 'profile' }" @click="switchTab('profile')">
            <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
            <span class="nav-label">我</span>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 如果是聊天室，则直接渲染子路由组件 -->
    <router-view v-if="isChatRoom" />
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const childRef = ref(null);
const showMomentsCamera = ref(true);

// 判断当前是否为聊天室
const isChatRoom = computed(() => ['single-chat', 'single-chat-settings', 'memory-bank'].includes(route.name));

// --- 以下逻辑从 ChatAppLayout.vue 迁移过来 ---

const setShowMomentsCamera = (visible) => {
  showMomentsCamera.value = visible;
};
provide('setShowMomentsCamera', setShowMomentsCamera);

const currentTab = computed(() => {
  const path = route.path;
  if (path.includes('/moments')) return 'moments';
  if (path.includes('/npc')) return 'npc';
  if (path.includes('/favorites')) return 'favorites';
  if (path.includes('/profile')) return 'profile';
  // 默认或 /chat/list 都属于 'chat'
  return 'chat';
});

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

const openAddModal = () => {
  if (childRef.value && childRef.value.openAddModal) {
    childRef.value.openAddModal();
  }
};

const openMomentsModal = () => {
  if (childRef.value && childRef.value.openPostMomentModal) {
    childRef.value.openPostMomentModal();
  }
};

const switchTab = (tab) => {
  const pathMap = {
    chat: '/chat/list',
    moments: '/chat/moments',
    npc: '/chat/npc',
    favorites: '/chat/favorites',
    profile: '/chat/profile',
  };
  router.push(pathMap[tab]);
};
</script>

<style scoped>
.chat-module, .chat-app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.app-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 15px 8px;
  background: #f5f5f5;
  border-bottom: none;
  flex-shrink: 0;
}

.app-header .title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.app-header .back-btn,
.app-header .action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1a1a1a;
}

.chat-app-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: white;
}

.chat-bottom-nav {
  height: auto;
  padding: 5px 0 5px;
  background: var(--bg-white, #FFFFFF);
  border-top: 1px solid var(--border-color, #EFEFEF);
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  flex-shrink: 0;
}

.chat-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 5px 15px;
  border-radius: 10px;
  transition: background 0.2s;
  color: #1a1a1a;
}

.chat-nav-item.active {
  color: #4A4A4A; /* accent-charcoal */
}

.nav-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 10px;
  transform: scale(0.9);
}

.moments-header-style {
  background: transparent !important;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  border-bottom: none !important;
}

.white-icon {
  color: white !important;
}
</style>
