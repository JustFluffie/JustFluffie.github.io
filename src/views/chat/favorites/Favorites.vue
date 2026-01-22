<template>
  <div class="ins-layout">
    <!-- 日记本主体容器 -->
    <div class="diary-book">
      
      <!-- 左侧：金属线圈 (Binder Rings) -->
      <div class="binder-spine">
        <div class="ring" v-for="i in 8" :key="i"></div>
      </div>

      <!-- 中间：纸张区域 -->
      <div class="paper-area">
        <!-- 1. 顶部：标题 -->
        <header class="paper-header">
          <h2 class="favorites-title">和 {{ charName }} 的回忆</h2>
        </header>

        <!-- 2. 内容区：卡片容器 -->
        <div class="content-viewport">
          <Transition name="fade" mode="out-in">
            <div class="card-container" :key="activeTab">
              
              <!-- 消息收藏 -->
              <template v-if="activeTab === 'messages'">
                <div v-if="favoriteMessages.length === 0" class="empty-state">
                  <p>暂无收藏的消息</p>
                </div>
                <div v-else class="favorites-list">
                  <div class="memory-card" v-for="item in favoriteMessages" :key="item.id">
                    <div class="card-header">
                      <span class="card-date">收藏于 {{ formatDate(item.timestamp) }}</span>
                      <button class="delete-btn" @click.stop="deleteFavorite(item.id)">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div class="card-content">
                      {{ item.content }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 心声收藏 -->
              <template v-else-if="activeTab === 'thoughts'">
                <div v-if="favoriteThoughts.length === 0" class="empty-state">
                  <p>暂无收藏的心声</p>
                </div>
                <div v-else class="favorites-list">
                  <div class="memory-card thought-card" v-for="item in favoriteThoughts" :key="item.id">
                    <div class="card-header">
                      <span class="card-date">收藏于 {{ formatDate(item.timestamp) }}</span>
                      <button class="delete-btn" @click.stop="deleteFavorite(item.id)">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div class="thought-content">
                      <div class="thought-row time-row">{{ formatDateTime(item.content.timestamp) }}</div>
                      <div class="thought-row"><span class="thought-label">情绪：</span>{{ item.content.emotion }}</div>
                      <div class="thought-row"><span class="thought-label">穿着：</span>{{ item.content.outfit }}</div>
                      <div class="thought-row"><span class="thought-label">姿态：</span>{{ item.content.posture }}</div>
                      <div class="thought-row"><span class="thought-label">内心独白：</span>{{ item.content.innerVoice }}</div>
                      <div class="thought-row"><span class="thought-label">没说出口的话：</span>{{ item.content.unspokenWords }}</div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 朋友圈收藏 -->
              <template v-else-if="activeTab === 'moments'">
                <div v-if="favoriteMoments.length === 0" class="empty-state">
                  <p>暂无收藏的朋友圈</p>
                </div>
                <div v-else class="favorites-list">
                  <div class="memory-card moment-card" v-for="item in favoriteMoments" :key="item.id">
                    <div class="card-header">
                      <span class="card-date">收藏于 {{ formatDate(item.timestamp) }}</span>
                      <button class="delete-btn" @click.stop="deleteFavorite(item.id)">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div class="moment-content-preview">
                      <div v-if="item.content.content" class="moment-text">{{ item.content.content }}</div>
                      
                      <!-- 图片文本描述 -->
                      <div v-if="item.content.images && item.content.images.length > 0" class="moment-images-text">
                        <div v-for="(img, idx) in item.content.images" :key="idx">
                          [图片：{{ img.imageDescription || img.content || (item.content.images.length > 1 ? `图片${idx + 1}` : '图片') }}]
                        </div>
                      </div>

                      <div class="moment-meta">
                        <span class="moment-time">{{ formatDate(item.content.time) }}</span>
                        <span v-if="item.content.location" class="moment-location">
                          📍 {{ item.content.location }}
                        </span>
                      </div>

                      <!-- 评论列表 -->
                      <div v-if="item.content.comments && item.content.comments.length > 0" class="moment-comments">
                        <div v-for="comment in item.content.comments" :key="comment.id" class="comment-item">
                          <span class="comment-user">{{ getName(comment.userId) }}</span>
                          <span v-if="comment.replyTo" class="comment-reply">回复 <span class="comment-user">{{ comment.replyTo.id === 'user' ? '我' : comment.replyTo.name }}</span></span>
                          <span class="comment-content">: {{ comment.content }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 记忆收藏 -->
              <template v-else-if="activeTab === 'memory'">
                <div v-if="favoriteMemories.length === 0" class="empty-state">
                  <p>暂无收藏的记忆</p>
                </div>
                <div v-else class="favorites-list">
                  <div class="memory-card" v-for="(item, index) in favoriteMemories" :key="item.id || index">
                    <div class="card-header">
                      <span class="card-date">收藏于 {{ formatDate(item.timestamp) }}</span>
                      <button class="delete-btn" @click.stop="deleteFavoriteMemory(item)">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div class="card-content">
                      {{ item.content }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 其他标签页 (暂为空) -->
              <div v-else class="empty-state">
                <p>暂无收藏的{{ currentTabLabel }}</p>
              </div>
              
            </div>
          </Transition>
        </div>
      </div>

      <!-- 顶部：索引标签 (Tabs) -->
      <div class="top-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSingleStore } from '@/stores/chat/singleStore'

const props = defineProps({
  charId: {
    type: [String, Number],
    required: true
  }
})

const singleStore = useSingleStore()
const activeTab = ref('messages')

const tabs = [
  { key: 'messages', label: '消息' },
  { key: 'thoughts', label: '心声' },
  { key: 'moments', label: '朋友圈' },
  { key: 'memory', label: '记忆' }
]

const charName = computed(() => {
  if (!singleStore.characters || !Array.isArray(singleStore.characters)) return ''
  // 确保 ID 类型一致（Store 中通常存储为字符串）
  const char = singleStore.characters.find(c => String(c.id) === String(props.charId))
  return char ? char.name : ''
})

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : ''
})

const favoriteMessages = computed(() => {
  if (!singleStore.favorites || !Array.isArray(singleStore.favorites)) return []
  return singleStore.favorites.filter(f => 
    String(f.charId) === String(props.charId) && f.type === 'messages'
  )
})

const favoriteThoughts = computed(() => {
  if (!singleStore.favorites || !Array.isArray(singleStore.favorites)) return []
  return singleStore.favorites.filter(f => 
    String(f.charId) === String(props.charId) && f.type === 'thoughts'
  )
})

const favoriteMoments = computed(() => {
  if (!singleStore.favorites || !Array.isArray(singleStore.favorites)) return []
  return singleStore.favorites.filter(f => 
    String(f.charId) === String(props.charId) && f.type === 'moments'
  )
})

const favoriteMemories = computed(() => {
  if (!singleStore.favorites || !Array.isArray(singleStore.favorites)) return []
  return singleStore.favorites.filter(f => 
    String(f.charId) === String(props.charId) && f.type === 'memory'
  )
})

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
}

const deleteFavorite = (id) => {
  const index = singleStore.favorites.findIndex(f => f.id === id)
  if (index !== -1) {
    singleStore.favorites.splice(index, 1)
    singleStore.saveData()
  }
}

const deleteFavoriteMemory = (favItem) => {
  // 1. 从 favorites 移除
  const index = singleStore.favorites.indexOf(favItem);
  if (index !== -1) {
    singleStore.favorites.splice(index, 1);
  }
  
  // 2. 尝试更新原记忆状态
  const char = singleStore.getCharacter(props.charId);
  if (char && char.memories) {
    const originalMem = char.memories.find(m => {
       if (favItem.originalId && m.id === favItem.originalId) return true;
       // 匹配内容（去除时间头）
       let storedContent = favItem.content;
       if (storedContent.includes('\n')) {
           storedContent = storedContent.split('\n').slice(1).join('\n');
       }
       return m.content === storedContent && Math.abs((m.time || 0) - (favItem.memoryTime || favItem.timestamp)) < 1000;
    });
    if (originalMem) {
      originalMem.isFavorite = false;
    }
  }
  singleStore.saveData();
}

const getName = (userId) => {
  if (userId === 'user') return '我';
  const char = singleStore.getCharacter(userId);
  return char ? char.name : '未知用户';
};

onMounted(() => {
  console.log('Favorites page mounted, charId:', props.charId)
})
</script>

<style scoped>
/* --- 1. 全局布局 (ins-layout) --- */
.ins-layout {
  height: 100%;
  width: 100%;
  /* 加了一点噪点纹理的背景，更有质感 */
  background-color: #f6f7f9;
  background-image: 
    radial-gradient(circle, #ffffff 2.5px, transparent 0),
    radial-gradient(circle, var(--text-quaternary) 2.5px, transparent 0);
  background-size: 40px 40px;
  background-position: 0 0, 20px 20px;
  display: flex;
  justify-content: flex-start; /* 改为靠左对齐 */
  align-items: center;
  font-family: 'Noto Serif SC', serif;
  overflow: hidden;
  padding-top: 50px; /* 为顶部返回按钮留出空间 */
  padding-left: 10px; /* 左边保留 5px 间距 */
  padding-right: 10px;
}

/* --- 2. 日记本主体 (Glass/Paper Effect) --- */
.diary-book {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 85%;
  background: #fdfdfd;
  border-radius: 16px 20px 20px 16px;
  /* 柔和投影：Ins风的关键 */
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.05), 
    0 10px 40px -10px rgba(0,0,0,0.15),
    inset -1px 0 2px rgba(0,0,0,0.02); /* 书脊内阴影 */
  display: flex;
  padding: 10px 0;
  padding-left: 4px; /* 恢复左边内边距，给线圈留空间 */
}

/* --- 3. 左侧线圈 (Binder Spine) --- */
.binder-spine {
  width: 35px; /* 增加宽度，调整线圈和撕纸线的间距 */
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  border-right: 2px dashed #E5E5E5; /* 撕纸线 */
  margin-right: 20px;
  flex-shrink: 0;
}

.ring {
  width: 16px;
  height: 16px;
  background: #F0F0F0;
  border-radius: 50%;
  box-shadow: inset 1px 1px 3px rgba(0,0,0,0.15), 1px 1px 0 #fff; /* 凹陷感 */
}

/* --- 4. 纸张内容区 --- */
.paper-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 顶部 Header */
.paper-header {
  width: 94%;
  display: flex;
  justify-content: center; /* 标题居中 */
  align-items: center;
  border-bottom: 3px double var(--text-tertiary); /* 黑色强调线 */
  padding-bottom: 12px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.favorites-title {
  font-family: 'ZCOOL KuaiLe','Noto Serif SC', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #222;
  margin: 0;
  letter-spacing: 2px;
  position: relative;
  top: 5px
}

/* 内容视口 */
.content-viewport {
  flex: 1;
  position: relative;
  overflow-y: auto; /* 允许内容滚动 */
  overflow-x: hidden;
  padding-right: 5px; /* 滚动条间距 */
  
  /* 隐藏滚动条 */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.content-viewport::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 卡片容器 */
.card-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-bottom: 20px;
  min-height: 100%;
}

/* 收藏列表 */
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 15px 8px 0 8px;
  position: relative;
  left: -8px;
}

.memory-card {
  background-color: #fffbf0;
  background-image: linear-gradient(to bottom right, #fffbf0 0%, #fffdf7 100%);
  border: none;
  border-radius: 2%;
  padding: 15px;
  padding-top: 5px;
  /* 纸张悬浮阴影 */
  box-shadow: 0 2px 10px rgba(0,0,0,0.06), 0 10px 20px -5px rgba(0,0,0,0.04);
  transition: transform 0.3s ease;
  position: relative;
}

.memory-card:nth-child(even) {
  background-color: var(--text-quaternary);
  background-image: linear-gradient(to bottom right, var(--text-quaternary) 0%, #f5f5f5 100%);
}

/* ★ 视觉糖果：胶带效果 (Tape Effect) ★ */
.memory-card::before {
  content: "";
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%) rotate(-1.5deg); /* 随机微倾斜 */
  width: 80px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.45); /* 半透明 */
  border-left: 1px dashed rgba(0,0,0,0.1);
  border-right: 1px dashed rgba(0,0,0,0.1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  backdrop-filter: blur(1px);
  z-index: 10;
}

/* 让偶数项的胶带换个方向，看起来更自然 */
.memory-card:nth-child(even)::before {
  transform: translateX(-50%) rotate(1.2deg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05); /* 极细的分割线 */
  padding-bottom: 5px;
}

.card-date {
  font-size: 10px;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #f5f5f5;
  color: #ff4d4f;
}

.card-content {
  font-size: 12px;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap; /* 保留换行 */
  font-family: 'Noto Serif SC', serif;
}

/* 心声卡片样式 */
.thought-content {
  font-size: 12px;
  color: #333;
}
.thought-row {
  margin-bottom: 4px;
  line-height: 1.5;
}
.time-row {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: bold;
}
.thought-label {
  color: var(--text-tertiary);
  margin-right: 5px;
  font-weight: 500;
}

/* 朋友圈卡片样式 */
.moment-content-preview {
  font-size: 12px;
  color: #333;
}
.moment-text {
  margin-bottom: 8px;
  line-height: 1.5;
}
.moment-images-text {
  margin-bottom: 8px;
  color: #576b95;
  font-size: 12px;
}
.moment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #999;
  margin-top: 5px;
  margin-bottom: 8px;
}
.moment-location {
  color: #576b95;
}
.moment-comments {
  background: #f7f7f7;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  margin-top: 8px;
}
.comment-item {
  margin-bottom: 2px;
  line-height: 1.4;
}
.comment-user {
  color: #576b95;
  font-weight: bold;
  margin-right: 5px;
}
.comment-reply {
  color: #333;
  margin-right: 5px;
}
.comment-content {
  color: #333;
}

/* --- 通用空状态 --- */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-size: 14px;
  font-family: 'Noto Serif SC', serif;
  flex: 1; /* 撑满剩余空间 */
}

/* --- 5. 顶部标签栏 (Top Tabs) --- */
.top-tabs {
  position: absolute;
  top: -40px; /* 移出书本顶部 */
  left: 40px;
  height: 40px;
  display: flex;
  flex-direction: row;
  align-items: flex-end; /* 底部对齐，让选中的标签向上生长 */
  gap: 5px;
}

.tab {
  padding: 0 20px;
  height: 32px;
  background: var(--text-quaternary);
  border-radius: 10px 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 1px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05);
  border-bottom: none;
  box-shadow: inset 0 -5px 10px rgba(0,0,0,0.02); /* 内阴影增加立体感 */
}

.tab.active {
  background: #fdfdfd; 
  color: var(--text-secondary);
  height: 40px; /* 变高 */
  z-index: 2;
  font-weight: 700;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
  transform: translateY(0);
}

/* --- 动画 --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
