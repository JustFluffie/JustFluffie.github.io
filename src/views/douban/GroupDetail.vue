<template>
  <AppLayout :title="''" no-padding no-header-border>
    <template #action>
      <SvgIcon name="refresh" @click="refreshPosts" class="icon-refresh"/>
    </template>

    <div class="group-page">
      <!-- 选择器横条 -->
      <div class="controls-bar">
        <div class="post-controls">
          <div class="control-group">
            <select id="character-select" v-model="selectedCharacterId">
              <option :value="null" disabled>角色</option>
              <option v-for="char in characters" :key="char.id" :value="char.id">
                {{ char.name }}
              </option>
            </select>
          </div>
          <div class="control-group">
            <select id="persona-select" v-model="selectedUserPersonaId">
              <option :value="null" disabled>用户</option>
              <option v-for="persona in userPersonas" :key="persona.id" :value="persona.id">
                {{ persona.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 小组头部 -->
      <header class="group-header">
        <div class="group-info">
          <h1>{{ groupData.title }}</h1>
          <p>{{ groupData.description }}</p>
        </div>
      </header>

      <!-- 帖子列表 -->
      <main class="post-list">
        <div v-if="doubanStore.posts.length === 0" class="empty-state">
          <p>选择角色和人设后，点击右上角刷新</p>
        </div>
        <article v-else v-for="post in doubanStore.posts" :key="post.id" class="post-item" @click="goToPost(post.id)">
          <div class="post-stats">
            <SvgIcon name="comment" class="comment-icon" />
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

const selectedCharacterId = ref(null);
const selectedUserPersonaId = ref(null);

const characters = computed(() => singleStore.characters);
const userPersonas = computed(() => singleStore.userPersonas);

const groupInfoMap = {
  '校园热线': { description: '你的课表、我的吐槽，青春的回忆与回响。' },
  '职场茶水间': { description: '摸鱼、八卦、生存指南，成年人的世界没有容易二字。' },
  '自由吃瓜基地': { description: '内娱、外娱、网红圈，开帖拉踩请遵守版规。' },
  '情感树洞': { description: '那些说不出口的话，在这里可以找到回声。' },
  '深夜食堂': { description: '仅限成年人，探讨一些成熟的话题。' },
};

const groupData = computed(() => {
  const title = route.params.groupName || '豆瓣小组';
  const info = groupInfoMap[title] || { description: '欢迎来到这个小组。' };
  return {
    title,
    description: info.description,
  };
});

const refreshPosts = () => {
  if (!selectedCharacterId.value || !selectedUserPersonaId.value) {
    console.log("Waiting for character and persona selection...");
    return;
  }
  doubanStore.fetchAndSetPosts(
    groupData.value.title,
    selectedCharacterId.value,
    selectedUserPersonaId.value
  );
};

const goToPost = (postId) => {
  router.push({ name: 'douban-post-detail', params: { postId } });
};

onMounted(() => {
  // 清空旧数据
  doubanStore.setPosts([]);

  // 初始化选择器数据，但不自动选择
  selectedCharacterId.value = null;
  selectedUserPersonaId.value = null;
});

</script>

<style scoped>
/* --- 页面主容器 --- */
.group-page {
    background-color: var(--bg-light);
    height: 100%;
    overflow-y: auto;
}

/* --- 小组头部 --- */
.group-header {
    background-color: var(--bg-white);
    padding: 0px 16px 16px;
    border-bottom: 1px solid var(--border-color);
}

.icon-refresh {
  cursor: pointer;
  font-size: 24px;
  color: var(--text-darkest);
}

.group-info {
  flex-grow: 1;
}

.group-header h1 {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #007722;
}

.group-header p {
    font-size: 14px;
    color: var(--text-tertiary);
    margin: 0;
}

.controls-bar {
  background-color: var(--bg-white);
  padding: 0px 12px;
}

.post-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
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
  color: #3890f5;
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
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s;
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
}

.comment-icon {
  font-size: 20px;
  margin-bottom: 2px;
  color: var(--C-pink);
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
  font-size: 17px;
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
