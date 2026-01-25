<template>
  <AppLayout :title="groupData.title">
    <template #header-actions>
      <span class="material-icons" @click="refreshPosts">refresh</span>
    </template>

    <div class="group-page">
      <!-- 小组头部 -->
      <header class="group-header">
        <h1>{{ groupData.title }}</h1>
        <p>{{ groupData.description }}</p>
      </header>

      <!-- 帖子列表 -->
      <main class="post-list">
        <div v-if="doubanStore.posts.length === 0" class="empty-state">
          <p>点击右上角刷新看看大家在说什么</p>
        </div>
        <article v-else v-for="post in doubanStore.posts" :key="post.id" class="post-item" @click="goToPost(post.id)">
            <div class="post-meta">
              <div class="avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" :fill="post.avatarColor"></circle>
                  <path d="M12 14C8.68629 14 6 16.6863 6 20H18C18 16.6863 15.3137 14 12 14Z" :fill="post.avatarColor"></path>
                </svg>
              </div>
              <div class="user-info">
                <div class="username">匿名豆友</div>
                <div class="timestamp">{{ post.timestamp }}</div>
              </div>
            </div>
            <div class="post-content">
              <h2>{{ post.title }}</h2>
              <p>{{ post.summary }}</p>
            </div>
            <footer class="post-footer">
              <span><span class="icon">💬</span>{{ post.comments }}</span>
              <span><span class="icon">👍</span>{{ post.likes }}</span>
            </footer>
        </article>
      </main>
    </div>

    <!-- 悬浮发帖按钮 -->
    <button class="fab-create-post" title="发新帖">+</button>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDoubanStore } from '@/stores/doubanStore';
import AppLayout from '@/components/common/AppLayout.vue';

const route = useRoute();
const router = useRouter();
const doubanStore = useDoubanStore();

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

const samplePostsData = [
    { id: 1, title: '今天中午吃什么，求推荐！', summary: '楼下那几家都吃腻了，黄焖鸡、麻辣烫、沙县... 感觉人生已经失去了乐趣。', fullText: '楼下那几家都吃腻了，黄焖鸡、麻辣烫、沙县... 感觉人生已经失去了乐趣。大家有什么外卖推荐吗？预算30以内，不要太油腻的，谢谢各位摸鱼搭子！', avatarColor: '#ccc', commentsList: [{id: 1, user: '摸鱼大师', text: '试试XX家的轻食沙拉，健康又好吃！', time: '10分钟前', likes: 25}] },
    { id: 2, title: '分享一个刚发现的宝藏歌手', summary: '最近疯狂循环一个叫Khruangbin的乐队，他们的音乐特别放松，简直是打工人的精神按摩油。', fullText: '最近疯狂循环一个叫Khruangbin的乐队，中文名叫“团员飞机”，他们的音乐特别放松，有点迷幻，又有点东南亚风情，简直是打工人的精神按摩油。强烈推荐《White Gloves》这首！', avatarColor: '#bada55', commentsList: [] },
    { id: 3, title: '大家会介意开会的时候领导突然cue你发言吗？', summary: '我真的会心跳漏一拍，本来在神游天外，突然被点名，大脑一片空白...', fullText: '我真的会心跳漏一拍，本来在神游天外，突然被点名，大脑一片空白，只能支支吾吾说一些没有营养的废话。感觉好社死啊，有什么办法可以破解吗？', avatarColor: '#ffc0cb', commentsList: [{id: 1, user: '会议隐形人', text: '同感！我一般会说“XX总刚才的观点我非常认同，我补充两点...”，然后开始临场发挥。', time: '1小时前', likes: 102}] },
    { id: 4, title: '求助！租房合同里的这个条款是不是坑？', summary: '房东在补充协议里加了一条“因市场变化可调整租金”，这合法吗？我有点慌。', fullText: '房东在补充协议里加了一条“因市场变化可调整租金”，这合法吗？我有点慌。有没有懂法律的朋友帮忙看看？', avatarColor: '#add8e6', commentsList: [] },
    { id: 5, title: '有没有适合一个人周末去逛的地方？', summary: '不想总是宅在家里，求推荐一些人少、安静、适合放空自己的地方。', fullText: '不想总是宅在家里，求推荐一些人少、安静、适合放空自己的地方。博物馆、美术馆之类的都行。', avatarColor: '#f0e68c', commentsList: [] },
];

const refreshPosts = () => {
  const shuffled = [...samplePostsData].sort(() => 0.5 - Math.random());
  const postCount = Math.floor(Math.random() * 3) + 3;
  
  const newPosts = shuffled.slice(0, postCount).map((post, index) => ({
    ...post,
    id: index + 1, // Assign new sequential IDs
    timestamp: `${Math.floor(Math.random() * 59) + 1}分钟前`,
    comments: Math.floor(Math.random() * 500),
    likes: Math.floor(Math.random() * 2000),
  }));
  doubanStore.setPosts(newPosts);
};

const goToPost = (postId) => {
  router.push({ name: 'douban-post-detail', params: { postId } });
};

</script>

<style scoped>
/* --- 全局样式 --- */
:root {
    --douban-green: #007722;
    --background-color: #f6f6f6;
    --card-background: #ffffff;
    --text-primary: #111;
    --text-secondary: #999;
    --border-color: #e8e8e8;
}

.material-icons {
  cursor: pointer;
}

/* --- 页面主容器 --- */
.group-page {
    max-width: 800px;
    margin: 0 auto;
    background-color: var(--background-color);
    height: 100%;
    overflow-y: auto;
}

/* --- 小组头部 --- */
.group-header {
    background-color: var(--card-background);
    padding: 20px 16px;
    border-bottom: 1px solid var(--border-color);
}

.group-header h1 {
    font-size: 22px;
    margin: 0 0 8px 0;
    color: var(--douban-green);
}

.group-header p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
}

/* --- 帖子列表 --- */
.post-list {
    padding: 0;
    background-color: var(--card-background);
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  color: var(--text-secondary);
  background-color: var(--background-color);
}

/* --- 单个帖子卡片样式 --- */
.post-item {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s;
}

.post-item:hover {
    background-color: #f9f9f9;
}

/* --- 帖子头部：头像和昵称 --- */
.post-meta {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.post-meta .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #eee; /* 匿名头像底色 */
    margin-right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.post-meta .user-info .username {
    font-size: 15px;
    font-weight: 500;
    color: #444;
}

.post-meta .user-info .timestamp {
    font-size: 12px;
    color: var(--text-secondary);
}

/* --- 帖子内容：标题和摘要 --- */
.post-content h2 {
    font-size: 18px;
    margin: 0 0 8px 0;
    line-height: 1.4;
    color: var(--text-primary);
}

.post-content p {
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* --- 帖子底部：互动数据 --- */
.post-footer {
    margin-top: 16px;
    font-size: 13px;
    color: var(--text-secondary);
    display: flex;
    gap: 20px; /* 控制图标间距 */
}

.post-footer span {
    display: inline-flex;
    align-items: center;
}

.post-footer .icon {
    margin-right: 5px;
}

/* --- 悬浮发帖按钮 --- */
.fab-create-post {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px;
    height: 56px;
    background-color: var(--douban-green);
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: background-color 0.2s ease;
    z-index: 100;
}

.fab-create-post:hover {
    background-color: #005f1c; /* 鼠标悬浮时颜色加深 */
}
</style>
