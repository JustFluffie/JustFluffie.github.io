<template>
  <AppLayout :title="post ? '帖子详情' : '加载中...'">
    <div v-if="post" class="post-detail-page">
      <article class="post-full-content">
        <header class="post-meta">
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
        </header>
        <div class="post-body">
          <h1>{{ post.title }}</h1>
          <p>{{ post.fullText || post.summary }}</p>
        </div>
      </article>

      <section class="comments-section">
        <div class="comments-header">
          <h3>热门评论</h3>
        </div>
        <div v-if="areCommentsLoading" class="loading-state">
          <p>评论加载中...</p>
        </div>
        <div v-else-if="post.commentsList && post.commentsList.length > 0" class="comments-list">
          <div v-for="comment in post.commentsList" :key="comment.id" class="comment-item">
            <div class="comment-meta">
              <div class="comment-avatar"></div>
              <span class="comment-username">{{ comment.user }}</span>
            </div>
            <p class="comment-text">{{ comment.text }}</p>
            <div class="comment-footer">
              <span class="comment-time">{{ comment.time }}</span>
              <span class="comment-likes">👍 {{ comment.likes }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-comments">
          <p>还没有评论，快来抢沙发！</p>
        </div>
      </section>
    </div>
    <div v-else class="loading-state">
      <p>帖子加载中...</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDoubanStore } from '@/stores/doubanStore';
import AppLayout from '@/components/common/AppLayout.vue';

const route = useRoute();
const doubanStore = useDoubanStore();
const postId = parseInt(route.params.postId, 10);

// 从 store 中响应式地获取帖子
const post = computed(() => doubanStore.getPostById(postId));

const areCommentsLoading = ref(false);

onMounted(async () => {
  // 确保 post.value 存在后再执行
  if (post.value) {
    if (post.value.commentsList && post.value.commentsList.length === 0) {
      areCommentsLoading.value = true;
      try {
        await doubanStore.fetchCommentsForPost(postId);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        areCommentsLoading.value = false;
      }
    }
  }
});
</script>

<style scoped>
.post-detail-page { background-color: #fff; height: 100%; overflow-y: auto; }
.post-full-content { padding: 16px; border-bottom: 10px solid #f6f6f6; }
.post-meta { display: flex; align-items: center; margin-bottom: 16px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; display: inline-flex; align-items: center; justify-content: center; background-color: #eee; }
.user-info .username { font-size: 16px; font-weight: 500; }
.user-info .timestamp { font-size: 12px; color: #999; }
.post-body h1 { font-size: 22px; margin: 0 0 16px; line-height: 1.4; }
.post-body p { font-size: 16px; line-height: 1.7; color: #333; white-space: pre-wrap; }

.comments-section { padding: 16px; }
.comments-header { margin-bottom: 16px; font-size: 16px; color: #333; border-bottom: 1px solid #e8e8e8; padding-bottom: 10px; }
.comments-list .comment-item { padding: 12px 0; border-bottom: 1px solid #f6f6f6; }
.comment-meta { display: flex; align-items: center; margin-bottom: 8px; }
.comment-avatar { width: 28px; height: 28px; border-radius: 50%; background-color: #f0f0f0; margin-right: 10px; }
.comment-username { font-size: 14px; font-weight: 500; color: #555; }
.comment-text { font-size: 15px; color: #333; margin: 0 0 8px; }
.comment-footer { display: flex; justify-content: space-between; font-size: 12px; color: #aaa; }
.no-comments, .loading-state { text-align: center; padding: 60px 20px; color: #999; }
</style>
