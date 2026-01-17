<template>
  <div class="moment-item"
       @touchstart="handlePressStart"
       @touchend="handlePressEnd"
       @mousedown="handlePressStart"
       @mouseup="handlePressEnd"
       @contextmenu.prevent>
    
    <!-- 动态: 头像 -->
    <div class="moment-avatar" :style="{ backgroundImage: `url(${getAvatar(moment.userId)})` }"></div>
    
    <div class="moment-content">
      <!-- 动态: 昵称 -->
      <div class="moment-name">{{ getName(moment.userId) }}</div>
      
      <!-- 动态: 文本内容 -->
      <div v-if="moment.content" class="moment-text">{{ moment.content }}</div>

      <!-- 动态: 图片内容 -->
      <div v-if="moment.images && moment.images.length > 0"
           class="moment-images"
           :class="[
             `grid-${moment.images.length}`,
             { 'single-image': moment.images.length === 1 }
           ]">
        <template v-for="(image, imageIndex) in moment.images" :key="imageIndex">
          <!-- 单张、非文字生成的图片，使用自适应容器 -->
          <div v-if="moment.images.length === 1 && !image.isTextGenerated"
               class="moment-single-image-adaptive"
               @click.stop="previewMomentImage(image)">
            <img :src="getImageUrl(image)" alt="moment image" />
          </div>
          <!-- 其他情况（多图或文字生成图） -->
          <div v-else
               class="image-item"
               :style="{ 
                 backgroundImage: isImageUrl(image) ? `url(${getImageUrl(image)})` : 'none',
                 backgroundColor: image.isTextGenerated ? 'var(--text-quaternary)' : '#e7e7e7'
               }"
               @click.stop="previewMomentImage(image)">
            <div v-if="image.isTextGenerated" 
                 class="moment-text-placeholder"
                 :ref="el => { if (el) textContainers[imageIndex] = el }">
              <div class="text-inner-scroll">
                {{ moment.images.length > 1 ? `第${imageIndex + 1}张图片` : '一张图片' }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 动态: 提醒和可见性 -->
      <div v-if="moment.remind && moment.remind.length > 0" class="moment-remind">
        提到了: {{ moment.remind.map(id => getName(id)).join(', ') }}
      </div>
      <div v-if="moment.visibility && moment.visibility.type !== 'public'" class="moment-visibility">
        <span v-if="moment.visibility.allowed.length > 0">部分可见: {{ moment.visibility.allowed.map(id => getName(id)).join(', ') }}</span>
        <span v-else>私密</span>
      </div>

      <!-- 动态: 底部 (时间, 地点, 操作按钮) -->
      <div class="moment-footer">
        <div class="time-and-location">
          <span class="time">{{ formatTime(moment.time) }}</span>
          <div v-if="moment.location" class="moment-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#576B95" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4.5"/>
              <rect x="11.4" y="12" width="2" height="9" />
            </svg>
            <span>{{ moment.location }}</span>
          </div>
        </div>
        
        <!-- 操作按钮 (...) -->
        <div class="actions">
          <div class="action-btn" @click.stop="toggleActionMenu">
            <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </div>
          <!-- 点赞/评论菜单 -->
          <div v-if="isMenuOpen" class="action-menu">
            <div class="menu-item" @click.stop="handleLike">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              {{ hasLiked ? '取消' : '赞' }}
            </div>
            <div class="menu-item" @click.stop="handleComment">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              评论
            </div>
          </div>
        </div>
      </div>

      <!-- 动态: 交互区域 (点赞和评论) -->
      <div class="moment-interactions" v-if="moment.likes.length || moment.comments.length">
        <div class="likes-list" v-if="moment.likes.length">
          <svg class="svg-icon like-icon" viewBox="0 0 24 24" fill="#576b95" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span v-for="(userId, idx) in moment.likes" :key="userId">
            {{ getName(userId) }}{{ idx < moment.likes.length - 1 ? ', ' : '' }}
          </span>
        </div>
        <div class="comments-list" v-if="moment.comments.length">
          <div v-for="comment in moment.comments" :key="comment.id" class="comment-item" @click.stop="handleReply(comment)">
            <span class="comment-user">{{ getName(comment.userId) }}</span>
            <span v-if="comment.replyTo" class="comment-reply">回复 <span class="comment-user">{{ comment.replyTo.name }}</span></span>
            <span class="comment-content">: {{ comment.content }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onUpdated } from 'vue';
import { useSingleStore } from '@/stores/chat/singleStore';
import { usePreviewStore } from '@/stores/previewStore';

const props = defineProps({
  moment: {
    type: Object,
    required: true
  },
  currentUserAvatar: String,
  currentUserName: String,
  isMenuOpen: Boolean
});

const emit = defineEmits([
  'toggle-menu', 
  'like', 
  'comment', 
  'reply', 
  'long-press'
]);

const singleStore = useSingleStore();
const previewStore = usePreviewStore();
const { getImageUrl, preview: previewMomentImage } = previewStore;

const textContainers = ref([]);
const pressTimer = ref(null);

// --- Helpers ---
const getAvatar = (userId) => {
  if (userId === 'user') return props.currentUserAvatar;
  const char = singleStore.getCharacter(userId);
  return char ? char.avatar : '';
};

const getName = (userId) => {
  if (userId === 'user') return props.currentUserName;
  const char = singleStore.getCharacter(userId);
  return char ? char.name : '未知用户';
};

const formatTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const isImageUrl = (image) => {
  if (!image || image.isTextGenerated) return false;
  const url = image.content || image.url;
  return typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image'));
};

const hasLiked = computed(() => props.moment.likes.includes('user'));

// --- Actions ---
const toggleActionMenu = () => {
  emit('toggle-menu', props.moment.id);
};

const handleLike = () => {
  emit('like', props.moment);
};

const handleComment = () => {
  emit('comment', props.moment);
};

const handleReply = (comment) => {
  emit('reply', props.moment, comment);
};

// --- Long Press ---
const handlePressStart = (e) => {
  if (e.target.closest('.image-item, .action-btn, .action-menu')) return;
  pressTimer.value = setTimeout(() => {
    emit('long-press', props.moment);
  }, 600);
};

const handlePressEnd = () => {
  if (pressTimer.value) clearTimeout(pressTimer.value);
  pressTimer.value = null;
};

// --- Overflow Check ---
const checkAllOverflows = () => {
  nextTick(() => {
    textContainers.value.forEach(el => {
      if (el) el.classList.toggle('is-overflowing', el.scrollHeight > el.clientHeight);
    });
  });
};

onUpdated(() => {
  checkAllOverflows();
});
</script>

<style scoped>
/* --- 动态条目 --- */
.moment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 20px;
}
.moment-avatar {
  width: 47px;
  height: 47px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}
.moment-content {
  flex: 1;
}
.moment-name {
  color: #576b95;
  font-weight: bold;
  font-size: 17px;
  margin-bottom: 7px; 
}
.moment-text {
  margin: 10px 0 8px;
  line-height: 1.4;
  font-size: 15px;
}

/* --- 动态: 图片宫格 --- */
.moment-images {
  display: grid;
  gap: 5px;
  margin-bottom: 10px;
}
.grid-2, .grid-4 { grid-template-columns: repeat(2, 1fr); max-width: 220px; }
.grid-3, .grid-5, .grid-6, .grid-7, .grid-8, .grid-9 { grid-template-columns: repeat(3, 1fr); max-width: 330px; }
.moment-images.single-image {
  max-width: 280px;
}
.moment-images.single-image .image-item { 
  aspect-ratio: 3 / 2; 
}

/* 新增：用于单张、非文字生成图片的自适应容器 */
.moment-single-image-adaptive {
  max-width: 240px; /* 限制最大宽度 */
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  background-color: #e7e7e7;
}
.moment-single-image-adaptive img {
  display: block;
  width: 100%; /* 宽度填充容器 */
  height: auto; /* 高度自适应 */
  max-height: 320px; /* 限制最大高度 */
  object-fit: cover; /* 高度超出时裁剪 */
}

.image-item {
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
}
.moment-text-placeholder {
  position: absolute;
  top: 4px; left: 4px; right: 4px; bottom: 4px;
  background-color: rgba(255, 255, 255, 0.5); 
  border: 1px solid rgba(255, 255, 255, 0.7); 
  border-radius: 4px;
  padding: 2px 0;
  overflow: hidden;
}
.moment-images.single-image .moment-text-placeholder {
  top: 10px; left: 10px; right: 10px; bottom: 10px;
}
.moment-images.single-image .text-inner-scroll { font-size: 16px; }
.text-inner-scroll {
  width: 100%; height: 100%;
  overflow-y: auto;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-primary);
  word-break: break-all;
  text-align: center;
  -ms-overflow-style: none;
  scrollbar-width: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.text-inner-scroll.is-overflowing { justify-content: flex-start; }
.text-inner-scroll::-webkit-scrollbar { display: none; }

/* --- 动态: 元信息 (位置, 提醒, 可见性) --- */
.moment-location {
  color: #576b95;
  font-size: 12px;
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 4px;
}
.moment-remind {
  color: #9b9b9b;
  font-size: 13px;
  margin-top: 8px;
}
.moment-visibility {
  font-size: 12px;
  color: #888;
  margin-top: 8px;
}

/* --- 动态: 底部与操作 --- */
.moment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
}
.time-and-location {
  display: flex;
  align-items: center;
  gap: 2px;
}
.time {
  color: #999;
  font-size: 12px;
}
.actions { position: relative; }
.action-btn {
  padding: 2px 8px;
  background: #f7f7f7;
  border-radius: 4px;
  cursor: pointer;
  color: #576b95;
}
.action-btn .svg-icon { width: 20px; height: 20px; }
.action-menu {
  position: absolute;
  right: 30px;
  top: -5px;
  background: #7c7c7c;
  border-radius: 4px;
  display: flex;
  overflow: hidden;
  animation: slideIn 0.2s ease;
  z-index: 10;
}
.menu-item {
  padding: 8px 10px;
  color: white;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
}
.menu-item:first-child { border-right: 1px solid #686868; }
.menu-item .svg-icon { width: 16px; height: 16px; fill: none; stroke: white; }

/* --- 动态: 交互 (点赞/评论) --- */
.moment-interactions {
  background: #f7f7f7;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 13px;
}
.likes-list {
  color: #576b95;
  border-bottom: 1px solid #ececec;
  padding-bottom: 5px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}
.like-icon { width: 14px; height: 14px; fill: #576b95; }
.comment-item { margin-bottom: 2px; cursor: pointer; }
.comment-item:active { background: #e0e0e0; }
.comment-user { color: #576b95; font-weight: bold; margin-right: 5px; }
.comment-reply { color: #333; margin-right: 5px; }
</style>
