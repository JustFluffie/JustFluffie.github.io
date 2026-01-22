<template>
  <div class="chat-module">
    <div class="chat-app-layout">
      <!-- 顶部栏 -->
      <div class="app-header" :class="{ 'moments-header-style': currentTab === 'moments' || currentTab === 'favorites' }" id="chatAppHeader" v-if="showHeader">
        <div class="left-controls" style="display: flex; align-items: center;">
          <div class="back-btn" @click="goBack" :class="{ 'white-icon': currentTab === 'moments' }">
            <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </div>
          <div id="chatRoomLeftArea"></div>
        </div>

        <div class="title" id="chatAppTitle" v-if="!isChatRoom && currentTab !== 'moments' && currentTab !== 'favorites'">{{ pageTitle }}</div>
        <div id="chatRoomTitleArea" class="chat-room-title-area" v-show="isChatRoom"></div>

        <div class="right-controls" style="display: flex; align-items: center;">
          <div class="action-btn" id="chatAppActionBtn" @click="openAddModal" v-if="!isChatRoom && currentTab !== 'moments' && currentTab !== 'favorites'">
            <svg-icon name="plus-circle" />
          </div>
          <div class="action-btn" id="momentsActionBtn" @click="openMomentsModal" v-if="!isChatRoom && currentTab === 'moments' && showMomentsCamera">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          </div>
          <div id="chatRoomActionArea"></div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="chat-app-content">
        <router-view v-slot="{ Component }">
          <keep-alive :exclude="['SingleChat', 'SingleChatSettings', 'SingleMemoryBank']">
            <component :is="Component" ref="childRef" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { useSingleStore } from '@/stores/chat/singleStore';

const route = useRoute();
const router = useRouter();
const singleStore = useSingleStore();
const childRef = ref(null);
const showMomentsCamera = ref(true);
const momentsStore = useMomentsStore();

// 判断当前是否为聊天室
const isChatRoom = computed(() => ['single-chat', 'single-chat-settings', 'memory-bank'].includes(route.name));

// 判断是否显示顶部栏
const showHeader = computed(() => !['single-chat-settings', 'memory-bank'].includes(route.name));

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

const pageTitle = computed(() => {
  if (route.name === 'chat-favorites') {
    const charId = route.params.charId;
    if (!singleStore.characters) return '收藏';
    const char = singleStore.characters.find(c => c.id === Number(charId));
    return char ? `${char.name}的收藏` : '收藏';
  }
  return 'WeChat';
});

const goBack = () => {
  if (isChatRoom.value) {
    if (window.history.state && window.history.state.back) {
      router.back();
    } else {
      router.push('/chat/list');
    }
  } else {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
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

.app-header .title,
.chat-room-title-area {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
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
