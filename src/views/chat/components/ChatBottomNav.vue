<template>
  <div>
    <!-- 收藏夹角色选择弹窗 -->
    <Modal v-model:visible="showFavoritesCharModal" title="选择角色查看收藏">
      <div class="modal-options centered-text">
        <div 
          v-for="char in singleStore.characters" 
          :key="char.id" 
          class="modal-option"
          @click="selectFavoriteChar(char.id)"
        >
          <span class="option-text">{{ char.name }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="showFavoritesCharModal = false">取消</button>
      </template>
    </Modal>

    <!-- 底部导航栏 -->
    <div class="chat-bottom-nav">
      <div class="chat-nav-item" :class="{ active: currentTab === 'chat' }" @click="switchTab('chat')">
        <span class="nav-icon"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></span>
        <span class="nav-label">聊天</span>
      </div>
      <div class="chat-nav-item" :class="{ active: currentTab === 'moments' }" @click="switchTab('moments')">
        <span class="nav-icon">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="stroke-width: 1.4;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(0, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(45, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(90, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(135, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(180, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(225, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(270, 12, 12)"></line>
            <line x1="14.31" y1="8" x2="2.83" y2="8" transform="rotate(315, 12, 12)"></line>
          </svg>
          <div v-if="momentsStore.unread" class="unread-badge"></div>
        </span>
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

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { useSingleStore } from '@/stores/chat/singleStore';
import Modal from '@/components/common/Modal.vue';

const route = useRoute();
const router = useRouter();
const momentsStore = useMomentsStore();
const singleStore = useSingleStore();
const showFavoritesCharModal = ref(false);

const currentTab = computed(() => {
  const path = route.path;
  if (path.includes('/moments')) return 'moments';
  if (path.includes('/npc')) return 'npc';
  if (path.includes('/favorites')) return 'favorites';
  if (path.includes('/profile')) return 'profile';
  return 'chat';
});

const switchTab = (tab) => {
  if (tab === 'moments') {
    momentsStore.setMomentsRead();
  }
  
  if (tab === 'favorites') {
    showFavoritesCharModal.value = true;
    return;
  }

  const pathMap = {
    chat: '/chat/list',
    moments: '/chat/moments',
    npc: '/chat/npc',
    favorites: '/chat/favorites',
    profile: '/chat/profile',
  };
  router.push(pathMap[tab]);
};

const selectFavoriteChar = (charId) => {
  showFavoritesCharModal.value = false;
  router.push({ name: 'chat-favorites', params: { charId } });
};
</script>

<style scoped>
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
  position: relative;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: red;
  border-radius: 50%;
  border: 1px solid var(--bg-white);
}

.nav-label {
  font-size: 10px;
  transform: scale(0.9);
}
</style>
