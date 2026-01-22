<!-- SingleCharStatus.vue (角色心声) -->
<template>
  <div v-if="visible" class="note-modal-mask" @click.self="handleClose">
    <div class="note-container">
      <!-- 胶带切换按钮 -->
      <div class="tape-button" @click="toggleHistoryView"></div>

      <!-- 便签主体 -->
      <div class="note" :class="{ 'history-mode': isHistoryView }">
        <!-- 纸张纹理 -->
        <div class="paper-texture"></div>

        <!-- ===== 实时心声视图 ===== -->
        <div v-if="!isHistoryView" class="content-wrapper">
          <!-- 头部：头像 + 名字 + 关闭 -->
          <div class="note-header current-header">
            <img v-if="avatar" :src="avatar" class="avatar-img" alt="avatar" />
            <div v-else class="avatar-placeholder">{{ name ? name.charAt(0) : '?' }}</div>
            <div class="character-name">{{ name }}</div>
            <button class="close-btn" @click="handleClose">✕</button>
          </div>

          <!-- 状态区域 -->
          <div class="status-section">
            <div class="status-row">
              <span class="status-label">情绪</span>
              <span class="status-value">{{ currentVoice.emotion || '无' }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">穿着</span>
              <span class="status-value">{{ currentVoice.outfit || '无' }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">姿态</span>
              <span class="status-value">{{ currentVoice.posture || '无' }}</span>
            </div>
          </div>

          <!-- Inner Voice -->
          <div class="inner-voice-section">
            <div class="section-title">Inner Voice</div>
            <div class="inner-voice-box">
              <p>{{ currentVoice.innerVoice || '（没有内心独白）' }}</p>
            </div>
          </div>

          <!-- 没说出口的话 -->
          <div class="unspoken-section">
            <div class="unspoken-title">没说出口的话</div>
            <div class="unspoken-text">{{ currentVoice.unspokenWords || '（没有想说的话）' }}</div>
          </div>
        </div>

        <!-- ===== 历史心声视图 ===== -->
        <div v-else class="content-wrapper history-wrapper">
          <!-- 历史视图头部 -->
          <div class="note-header history-header">
            <div class="header-title">历史心声</div>
            <button class="close-btn" @click="handleClose">✕</button>
          </div>

          <!-- 滚动列表 -->
          <div class="scroll-container">
            <div v-for="item in voiceHistory" :key="item.id" class="history-item">
              <div class="item-header">
                <div class="header-left">
                  <button class="star-btn" @click.stop="toggleFavorite(item)">
                    <!-- 实心星星 (已收藏) -->
                    <svg v-if="isFavorited(item)" viewBox="0 0 24 24" width="16" height="16" fill="#f39c12" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <!-- 空心星星 (未收藏) -->
                    <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                  <span>{{ item.title }}</span>
                </div>
                <span class="item-date">{{ formatDate(item.timestamp) }}</span>
              </div>
              <div class="prop-row"><span class="prop-label">情绪：</span>{{ item.emotion }}</div>
              <div class="prop-row"><span class="prop-label">穿着：</span>{{ item.outfit }}</div>
              <div class="prop-row"><span class="prop-label">姿态：</span>{{ item.posture }}</div>
              <div class="prop-row"><span class="prop-label">内心独白：</span>{{ item.innerVoice }}</div>
              <div class="prop-row"><span class="prop-label">没说出口的话：</span>{{ item.unspokenWords }}</div>
            </div>
          </div>
        </div>

        <!-- 撕边效果 -->
        <div class="torn-edge"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSingleStore } from '@/stores/chat/singleStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  visible: { type: Boolean, default: false },
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  charId: { type: String, required: true }
})

const singleStore = useSingleStore()
const { currentInnerVoice, innerVoices } = storeToRefs(singleStore)

// 获取当前角色的实时心声
const currentVoice = computed(() => {
  const voice = currentInnerVoice.value[props.charId]
  return voice || { emotion: '', outfit: '', posture: '', innerVoice: '', unspokenWords: '' }
})

// 获取当前角色的历史心声
const voiceHistory = computed(() => {
  return innerVoices.value[props.charId] || []
})

// 检查是否已收藏
const isFavorited = (item) => {
  if (!singleStore.favorites) return false
  return singleStore.favorites.some(f => 
    String(f.charId) === String(props.charId) && 
    f.type === 'thoughts' && 
    f.originalId === item.id
  )
}

// 切换收藏
const toggleFavorite = (item) => {
  singleStore.toggleThoughtFavorite(props.charId, item)
}

// 格式化日期
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')
}

const emit = defineEmits(['close'])

const isHistoryView = ref(false)

const toggleHistoryView = () => {
  isHistoryView.value = !isHistoryView.value
}

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    document.body.style.overflow = 'hidden'
    isHistoryView.value = false; // 每次打开时重置为实时心声视图
  } else {
    document.body.style.overflow = ''
  }
})

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
/* ===== 基础和遮罩层 ===== */
.note-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(29, 29, 29, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  font-family: 'Georgia', 'Noto Serif SC', serif;
  z-index: 1000;
}

.note-container {
  position: relative;
  width: 100%;
  max-width: 480px;
}

/* ===== 缎光胶带按钮 ===== */
.tape-button {
  position: absolute;
  top: -15px;
  left: -20px;
  z-index: 20;
  width: 90px; 
  height: 33px;
  cursor: pointer;
  transform: rotate(-28deg); 
  opacity: 0.85;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  background:
    /* 波点 */
    radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.7) 1.5px, transparent 1.5px),
    radial-gradient(circle at 10px 10px, rgba(0,0,0,0.2) 1.5px, transparent 1.5px),
    /* 渐变 */
    linear-gradient(
      148deg, 
      #b6b6b6 0%, 
      #e0e0e0 8%, 
      #e4e4e4 18%, 
      #ffffff 30%, 
      #e6e6e6 60%, 
      #8f8f8f 100% 
    );
  background-size: 15px 15px, 15px 15px, 100%;
  clip-path: polygon(
    0% 0%, 2% 10%, 0% 22%, 3% 35%, 0% 50%, 4% 65%, 1% 80%, 3% 92%, 0% 100%,
    100% 100%,
    98% 90%, 96% 75%, 99% 60%, 95% 45%, 98% 30%, 96% 15%, 100% 0%
  );
}
/* ===== 便签主体 ===== */
.note {
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%);
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 10px 50px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  transition: height 0.4s ease;
}
.note.history-mode {
  height: 600px;
}
.content-wrapper {
  width: 100%;
}
.history-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 装饰元素 ===== */
.note::before { /* 左侧装饰线 */
  content: "";
  position: absolute;
  left: 18px; top: 20px; bottom: 40px;
  width: 1.5px;
  background: linear-gradient(180deg, transparent 0%, #d0d0d0 5%, #d0d0d0 95%, transparent 100%);
  opacity: 0.6;
}
.paper-texture { /* 纸张纹理 */
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.02;
  pointer-events: none;
  z-index: -1;
}

/* ===== 头部 (共享与特定样式) ===== */
.note-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  position: relative;
}
.current-header {
  padding: 18px 22px 15px 32px;
}
.history-header {
  height: 60px;
  justify-content: center;
}
.header-title {
  font-size: 15px;
  letter-spacing: 2px;
  color: #333;
  font-weight: 600;
}
.close-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  border: none; background: transparent;
  color: #999; font-size: 18px;
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
}
.close-btn:hover {
  color: #555;
  transform: translateY(-50%) scale(1.1);
}

/* ===== 头像和名字 (实时视图) ===== */
.avatar-img, .avatar-placeholder {
  width: 42px; height: 42px;
  margin-bottom: -3px;
  border-radius: 3px;
  flex-shrink: 0;
}
.avatar-img { object-fit: cover; }
.avatar-placeholder {
  background: linear-gradient(135deg, #e0e0e0 0%, #c8c8c8 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #666;
}
.character-name {
  margin-left: 10px;
  margin-top: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  letter-spacing: 1px;
  flex-grow: 1;
}

/* ===== 实时状态视图区域 ===== */
.status-section {
  margin: 18px 22px 18px 32px;
  background: rgba(245, 245, 245, 0.8);
  border-radius: 6px;
  padding: 2px 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.status-row {
  display: flex; padding: 7px 0;
  font-size: 13px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}
.status-row:last-child { border-bottom: none; }
.status-label {
  width: 45px; color: #888;
  flex-shrink: 0; font-weight: 400;
}
.status-value { color: #444; flex-grow: 1; word-break: break-word; }

.inner-voice-section { padding: 0 22px 0 32px; }
.section-title {
  font-size: 10px; letter-spacing: 2.5px;
  color: #aaa; text-transform: uppercase;
  margin-bottom: 10px; font-weight: 400;
}
.inner-voice-box {
  background: rgba(248, 248, 248, 0.6);
  border-left: 2px solid #bbb;
  padding: 14px 16px; margin-bottom: 18px;
  font-size: 13.5px; line-height: 1.85;
  color: #3a3a3a; font-style: italic;
  min-height: 80px;
}
.inner-voice-box p { margin: 0; word-break: break-word; }

.unspoken-section {
  padding: 0 22px 28px 32px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  margin-top: 5px; padding-top: 15px;
}
.unspoken-title {
  font-size: 11px; color: #999;
  margin-bottom: 8px; font-weight: 400;
}
.unspoken-text {
  font-size: 13px; color: #555;
  line-height: 1.6; padding-left: 14px;
  position: relative; word-break: break-word;
}
.unspoken-text::before {
  content: '"'; position: absolute;
  left: 0; top: -2px;
  font-size: 18px; color: #bbb;
}

/* ===== 历史视图区域 ===== */
.scroll-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 25px 40px 25px;
}
.history-item {
  border: 1px solid #dcdcdc;
  padding: 10px;
  margin: -5px 5px 15px;
  margin-right: -15px;
  background: #fff;
}
.item-header {
  display: flex; justify-content: space-between;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px; margin-bottom: 8px;
  font-size: 12px; color: #333; font-weight: bold;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.star-btn {
  background: none; border: none; padding: 0; cursor: pointer;
  display: flex; align-items: center;
  transition: transform 0.2s;
}
.star-btn:hover {
  transform: scale(1.1);
}
.item-date { font-weight: normal; color: #999; }
.prop-row { font-size: 10px; line-height: 1.6; color: #333; }
.prop-label { color: #777; margin-right: 5px; }

/* ===== 撕边效果 ===== */
.torn-edge {
  position: absolute;
  bottom: -18px; left: 0; right: 0;
  height: 22px;
  background: linear-gradient(180deg, #f5f5f5 0%, #f0f0f0 100%);
  clip-path: polygon(0% 0%,2% 35%,4% 8%,6% 42%,8% 15%,10% 50%,12% 20%,14% 55%,16% 12%,18% 45%,20% 25%,22% 60%,24% 18%,26% 48%,28% 8%,30% 52%,32% 22%,34% 58%,36% 15%,38% 45%,40% 28%,42% 62%,44% 12%,46% 50%,48% 20%,50% 55%,52% 25%,54% 48%,56% 10%,58% 52%,60% 18%,62% 58%,64% 28%,66% 45%,68% 15%,70% 55%,72% 22%,74% 48%,76% 8%,78% 52%,80% 20%,82% 60%,84% 25%,86% 45%,88% 12%,90% 50%,92% 18%,94% 55%,96% 28%,98% 42%,100% 0%);
  filter: drop-shadow(0 3px 3px rgba(0,0,0,0.08));
  z-index: 5;
}

/* ===== 滚动条样式 ===== */
.scroll-container::-webkit-scrollbar { width: 4px; }
.scroll-container::-webkit-scrollbar-track { background: transparent; }
.scroll-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
.scroll-container::-webkit-scrollbar-thumb:hover { background: #999; }
</style>
