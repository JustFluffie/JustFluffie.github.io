<template>
  <CPhoneAppsLayout 
    :title="memoTitle" 
    :show-clear="true"
    :show-refresh="true"
    @close="handleClose"
    @clear="clearMemos"
    @refresh="generateMemos"
    background="#ba9e76"
    color="#3e2723"
    themeColor="#795548"
  >
    <div class="memo-list cork-board" v-if="memos.length > 0 || isGenerating">
      <div v-if="isGenerating" class="generating-overlay">
        <div class="generating-text">正在写备忘录...</div>
      </div>
      <!-- 为每个便利贴添加一个包裹容器 -->
      <div v-for="memo in memos" :key="memo.id" class="memo-item-wrapper">
        <div class="memo-item">
          <div class="pin"></div>
          <p class="memo-content">{{ memo.content }}</p>
          <div class="memo-footer">
            <span class="memo-date">{{ formatDate(memo.timestamp) }}</span>
            <div class="delete-btn" @click="deleteMemo(memo.id)">
              <SvgIcon name="delete" class="delete-icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="empty-state cork-board" v-else>
      <div class="empty-hint">
        备忘录是空的...
        <br>
        <small>点击右上角，让我写点东西吧</small>
      </div>
    </div>
  </CPhoneAppsLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useMemoStore } from '@/stores/charphone/memoStore'
import { useApiStore } from '@/stores/apiStore'
import CPhoneAppsLayout from '../components/CPhoneAppsLayout.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

const emit = defineEmits(['close'])
const route = useRoute()
const singleStore = useSingleStore()
const memoStore = useMemoStore()
const apiStore = useApiStore()

const charId = route.params.charId

const isGenerating = ref(false)

const character = computed(() => singleStore.getCharacter(charId))
const memos = computed(() => memoStore.getMemos(charId))
const memoTitle = computed(() => character.value ? `${character.value.name}的备忘录` : '备忘录')

const handleClose = () => {
  emit('close')
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-CA') // YYYY-MM-DD
}

const deleteMemo = (memoId) => {
  memoStore.deleteMemo(charId, memoId)
}

const clearMemos = () => {
  if (memos.value.length > 0) {
    if (confirm('确定要清空所有备忘录吗？')) {
      memoStore.clearMemos(charId)
    }
  }
}

const generateMemos = async () => {
  if (isGenerating.value) return
  isGenerating.value = true
  
  try {
    if (!character.value) return

    const recentMessages = singleStore.getFormattedRecentMessages(charId, 15)
    const chatLog = recentMessages.map(msg => {
      const role = msg.role === 'user' ? '用户' : '我'
      return `${role}: ${msg.content}`
    }).join('\n')

    const prompt = `角色: ${character.value.name}
任务: 你正在写一些私密的备忘录便利贴。请基于你的人设的日常琐事（如工作、爱好、生活习惯）以及最近和用户的聊天内容，写5-8条简短的备忘录。

规则:
1.  输出5-8条备忘录，每条字数控制在10-20字以内。
2.  每条备忘录都是独立的、零散的想法。
3.  内容可以关于你的日常生活、不为人知的小秘密、对用户的真实想法、或和用户聊天中产生的想法。
4.  风格要口语化、生活化，就像随手写下的笔记，体现角色性格和生活气息。
5.  每条内容占一行，不要带序号或任何标记。

参考聊天记录:
${chatLog}

备忘录内容:`

    let presetToUse = null
    if (character.value.api && character.value.api !== 'default') {
        presetToUse = apiStore.presets.find(p => p.name === character.value.api)
    }

    const memoContent = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }], presetToUse)
    
    if (memoContent) {
      const newMemos = memoContent.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      if (newMemos.length > 0) {
        memoStore.addMemo(charId, newMemos)
      }
    }
  } catch (error) {
    console.error('Failed to generate memos:', error)
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
/* --- 核心：软木板背景 --- */
.cork-board {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  background-color: #ba9e76;
  background-image: 
    radial-gradient(hsla(34, 40%, 30%, 0.1) 15%, transparent 16%), 
    radial-gradient(hsla(34, 40%, 30%, 0.1) 15%, transparent 16%);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.3);
  overflow-y: auto; /* 允许垂直滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.cork-board::-webkit-scrollbar {
  display: none;
}

.memo-list {
  column-count: 2;
  column-gap: 20px;
}

/* --- 新增：便利贴包裹容器，负责布局和旋转 --- */
.memo-item-wrapper {
  margin-bottom: 20px;
  break-inside: avoid; /* 尝试避免在元素内部断行 */
  display: inline-block; /* 增强 break-inside 的效果 */
  width: 100%; /* 确保项目填满列宽 */
  transition: transform 0.2s;
}

/* --- 便利贴卡片 (内部元素)，负责内容和定位上下文 --- */
.memo-item {
  position: relative; /* 关键：为图钉提供定位上下文 */
  border-radius: 2px;
  padding: 25px 15px 10px 15px;
  box-shadow: 
    0 4px 6px rgba(0,0,0,0.15),
    0 10px 20px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%); /* 默认背景 */
}

/* 悬停时，包裹容器进行缩放和层级提升 */
.memo-item-wrapper:hover {
  z-index: 10;
  position: relative; /* 使 z-index 生效 */
}

/* --- 拟真图钉 --- */
.pin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d32f2f; /* 默认红色 */
  box-shadow: 
    inset -3px -3px 5px rgba(0,0,0,0.3),
    inset 2px 2px 5px rgba(255,255,255,0.5),
    2px 5px 5px rgba(0,0,0,0.3);
  z-index: 5;
}

/* --- 多彩便利贴逻辑 --- */
/* 旋转应用于包裹容器，背景和图钉颜色应用于内部元素 */

/* 第1个：黄色，向左歪 */
.memo-item-wrapper:nth-child(3n+1) { transform: rotate(-3deg); }
.memo-item-wrapper:nth-child(3n+1):hover { transform: rotate(-3deg) scale(1.02); }
.memo-item-wrapper:nth-child(3n+1) .memo-item { background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%); }
.memo-item-wrapper:nth-child(3n+1) .pin { background: #d32f2f; } /* 红钉子 */

/* 第2个：蓝色，向右歪 */
.memo-item-wrapper:nth-child(3n+2) { transform: rotate(3deg); }
.memo-item-wrapper:nth-child(3n+2):hover { transform: rotate(3deg) scale(1.02); }
.memo-item-wrapper:nth-child(3n+2) .memo-item { background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%); }
.memo-item-wrapper:nth-child(3n+2) .pin { background: #1976d2; } /* 蓝钉子 */

/* 第3个：粉色，摆正 */
.memo-item-wrapper:nth-child(3n+3) { transform: rotate(1deg); }
.memo-item-wrapper:nth-child(3n+3):hover { transform: rotate(1deg) scale(1.02); }
.memo-item-wrapper:nth-child(3n+3) .memo-item { background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); }
.memo-item-wrapper:nth-child(3n+3) .pin { background: #c2185b; } /* 紫红钉子 */


/* --- 内容与字体 --- */
.memo-content {
  font-family: 'Kaiti', 'STKaiti', 'KaiTi', '楷体', cursive;
  font-size: 16px;
  color: #3e2723;
  line-height: 1.5;
  outline: none;
  flex-grow: 1;
  overflow: hidden;
}

.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed rgba(0,0,0,0.1);
  padding-top: 8px;
  margin-top: auto;
  flex-shrink: 0;
}

.memo-date {
  font-family: 'Patrick Hand', sans-serif;
  font-size: 12px;
  color: rgba(0,0,0,0.5);
}

.delete-btn {
  padding: 4px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.delete-icon {
  width: 16px;
  height: 16px;
  color: #5d4037;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-hint {
  color: rgba(62, 39, 35, 0.4);
  font-family: 'Kaiti', cursive;
  font-size: 18px;
  text-shadow: 0 1px 0 rgba(255,255,255,0.2);
}

.empty-hint small {
  font-size: 14px;
}

.generating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(186, 158, 118, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.generating-text {
  font-family: 'ZCOOL KuaiLe', 'Noto Serif SC', serif;
  font-size: 18px;
  color: #5d4037;
  padding: 10px 20px;
  background: #fffde7;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  animation: fadeIn 1s infinite alternate;
}

@keyframes fadeIn {
  from { opacity: 0.7; }
  to { opacity: 1; }
}
</style>
