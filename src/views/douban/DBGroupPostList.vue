<template>
  <AppLayout :title="''" no-padding no-header-border transparent-header>
    <template #action>
      <SvgIcon name="refresh" @click="refreshPosts" class="icon-refresh"/>
    </template>

    <div class="group-page">
      <!-- 小组头部 -->
      <header class="group-header" :style="{ backgroundColor: groupData.color }">
        <div class="header-content">
          <div class="group-main-info">
            <img :src="groupData.avatar" alt="Group Avatar" class="group-avatar"/>
            <div class="group-meta">
              <h1 class="group-name">{{ groupData.title }}</h1>
              <p class="group-members">{{ groupData.members }}</p>
            </div>
          </div>
          <p class="group-description" v-if="groupData.description">小组简介：{{ groupData.description }}</p>
        </div>
      </header>

      <!-- 选择器横条 -->
      <div class="controls-bar">
        <div class="post-controls">
          <div class="control-group">
            <select id="character-select" v-model="doubanStore.selectedCharacterId">
              <option :value="null" disabled>角色</option>
              <option v-for="char in characters" :key="char.id" :value="char.id">
                {{ char.name }}
              </option>
            </select>
          </div>
          <div class="control-group">
            <select id="persona-select" v-model="doubanStore.selectedUserPersonaId">
              <option :value="null" disabled>用户</option>
              <option v-for="persona in userPersonas" :key="persona.id" :value="persona.id">
                {{ persona.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 帖子列表 -->
      <main class="post-list">
        <div v-if="doubanStore.isLoading" class="empty-state">
          <p>正在刷新帖子...</p>
        </div>
        <div v-else-if="doubanStore.posts.length === 0" class="empty-state">
          <p>选择角色和人设后，点击右上角刷新</p>
        </div>
        <article v-else v-for="post in doubanStore.posts" :key="post.id" class="post-item" @click="goToPost(post.id)">
          <div class="post-stats">
            <svg class="comment-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20H7.22472C6.08033 20 5.50814 20 5.05439 19.7822C4.64931 19.5892 4.31983 19.2908 4.10191 18.9056C3.85714 18.4719 3.85714 17.9257 3.85714 16.8333V10.1667C3.85714 9.07431 3.85714 8.52812 4.10191 8.09444C4.31983 7.70917 4.64931 7.41081 5.05439 7.21781C5.50814 7 6.08033 7 7.22472 7H16.7753C17.9197 7 18.4919 7 18.9456 7.21781C19.3507 7.41081 19.6802 7.70917 19.8981 8.09444C20.1429 8.52812 20.1429 9.07431 20.1429 10.1667V16.8333C20.1429 17.9257 20.1429 18.4719 19.8981 18.9056C19.6802 19.2908 19.3507 19.5892 18.9456 19.7822C18.4919 20 17.9197 20 16.7753 20H14L10 24V20Z"/>
            </svg>
            <span class="comment-count">{{ post.comments }}</span>
          </div>
          <div class="post-details">
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-summary">{{ post.summary }}</p>
            <div class="post-meta">
              <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" :fill="post.avatarColor"></circle>
                  <path d="M12 14C8.68629 14 6 16.6863 6 20H18C18 16.6863 15.3137 14 12 14Z" :fill="post.avatarColor"></path>
                </svg>
              </div>
              <span class="username">匿名豆友</span>
              <span class="timestamp">{{ post.timestamp }}</span>
            </div>
          </div>
        </article>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDoubanStore } from '@/stores/doubanStore';
import { useSingleStore } from '@/stores/chat/singleStore';
import AppLayout from '@/components/common/AppLayout.vue';
import SvgIcon from '@/components/common/SvgIcon.vue';

const route = useRoute();
const router = useRouter();
const doubanStore = useDoubanStore();
const singleStore = useSingleStore();

const characters = computed(() => singleStore.characters);
const userPersonas = computed(() => singleStore.userPersonas);

const groupInfoMap = {
  '同学，我有一个朋友...': {
    description: '...想问一下。懂的都懂，你的“朋友”就是我朋友。校内秘闻一手速报，选课攻略到恋爱抓马，没有本组员不知道的。',
    avatar: 'https://i.ibb.co/kgMW0jrx/1-1-1-1.png',
    members: '1,203,312 成员',
    color: '#A5C8A5'
  },
  '我今天就要离职！(明天再说)': {
    description: '从甲方槽点到办公室秘闻，专治各种职场内伤。今日摸鱼，明日再议离职。',
    avatar: 'https://i.ibb.co/GvJDfFDK/2-1-1.png',
    members: '892,136 成员',
    color: '#F0A5A5'
  },
  '野生瓜田种植与品鉴': {
    description: '友情提示：入组先学会黑话。不造谣，不传谣，我们只用放大镜看明星的每一步，这里的瓜保熟。',
    avatar: 'https://i.ibb.co/x8srgXRV/1-1.png',
    members: '3,433,564 成员',
    color: '#F0DDAA'
  },
  '恋爱细节放大镜小组': {
    description: '一个标点符号都要开会讨论，一个“哦”字就能分析三天。在这里，我们都是爱情里的显微镜学家。',
    avatar: 'https://i.ibb.co/gZHjgXq7/1-1-1-1.png',
    members: '565,931 成员',
    color: '#A5B8C8'
  },
  '深夜食堂': {
    description: '今晚，你吃了吗？这里是性的游乐场，尊重差异，谢绝说教。',
    avatar: 'https://i.ibb.co/hxZN0XGb/1-2-1-1.png',
    members: '5,254,748 成员',
    color: '#C8A5C8'
  },
};

// Helper to generate a random color
const getRandomColor = () => {
  const letters = 'ABCDEF';
  let color = '#';
  // Generating a lighter color
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 6)];
  }
  return color;
};

const groupData = computed(() => {
  const title = route.params.groupName || '';
  const info = groupInfoMap[title] || {
    description: '',
    avatar: '',
    members: '',
    color: '#FFFFFF'
  };
  return {
    title,
    description: info.description,
    avatar: info.avatar,
    members: info.members,
    color: info.color,
  };
});

const refreshPosts = () => {
  if (!doubanStore.selectedCharacterId || !doubanStore.selectedUserPersonaId) {
    console.log("Waiting for character and persona selection...");
    return;
  }
  // 刷新时先清空旧帖子
  doubanStore.setPosts([]);
  doubanStore.fetchAndSetPosts(
    groupData.value.title,
    doubanStore.selectedCharacterId,
    doubanStore.selectedUserPersonaId
  );
};

const goToPost = (postId) => {
  router.push({ name: 'douban-post-detail', params: { postId } });
};

onMounted(() => {
  // onMounted is now empty as we persist state in the store
});

</script>

<style scoped>
/* --- 页面主容器 --- */
.group-page {
    background-color: var(--bg-light);
    height: 100%;
    overflow-y: auto;
    position: relative;
}

/* --- 小组头部 --- */
.group-header {
    padding: 80px 16px 16px; /* 为顶部栏(70px)和选择器(40px)留出空间 */
    color: white;
    position: relative;
}

.header-content {
    position: relative;
    z-index: 1;
}

.group-main-info {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.group-avatar {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    margin-right: 16px;
    object-fit: cover;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
}

.group-meta {
    display: flex;
    flex-direction: column;
}

.group-name {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

.group-members {
    font-size: 14px;
    margin: 4px 0 0 0;
    opacity: 0.9;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.group-description {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
    line-height: 1.5;
}

.icon-refresh {
  cursor: pointer;
  font-size: 24px;
  color: var(--text-lightest); /* 改为白色以在彩色背景上可见 */
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

.controls-bar {
  position: fixed;
  top: 75px; /* 位于顶部栏下方 */
  left: 0;
  width: 100%;
  z-index: 5;
  background-color: rgba(0, 0, 0, 0); /* 透明背景 */
  padding: 0px 12px;
  box-sizing: border-box;
}

.post-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0px;
}

.control-group {
  display: flex;
  align-items: center;
}

.control-group select {
  background-color: transparent;
  border: none;
  font-size: 14px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.2); 
  text-align: right;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 0;
  cursor: pointer;
}

.control-group select:focus {
  outline: none;
}

/* --- 帖子列表 --- */
.post-list {
    background-color: var(--bg-white);
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  color: var(--text-tertiary);
  background-color: var(--bg-light);
}

/* --- 单个帖子卡片样式 (新) --- */
.post-item {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
}

.post-item:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 72px; /* 16px padding + 40px stats width + 16px stats margin */
    right: 0;
    height: 1px;
    background-color: var(--border-color);
}
.post-item:hover {
    background-color: #f9f9f9;
}

.post-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
  flex-shrink: 0;
  width: 40px;
  color: var(--text-tertiary);
  margin-top: -3px; /* Move icon up */
}

.comment-icon {
  width: 24px;
  height: 28px;
  margin-bottom: 1px;
  color: #F4B16F;
}

.comment-count {
  font-size: 14px;
  font-weight: 500;
}

.post-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.post-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-darkest);
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.post-summary {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
  line-height: 1.5;
  
  /* Ellipsis for 1 line */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-tertiary);
}

.post-meta .avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.post-meta .username {
  margin-right: 8px;
  font-weight: 400;
}
</style>
