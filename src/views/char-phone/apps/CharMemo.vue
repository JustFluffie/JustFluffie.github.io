<template>
  <!-- 背景色改为深木色，模拟软木板的边框或底色 -->
  <CPhoneAppsLayout 
    :title="memoTitle" 
    :show-clear="true"
    :show-refresh="true"
    @close="handleClose"
    @clear="handleClear"
    @refresh="handleRefresh"
    background="#8d6e63" 
    color="#fff"
    themeColor="#d7ccc8"
  >
    <!-- 增加 cork-board 类名来做纹理 -->
    <div class="memo-list cork-board">
      <Loading v-if="isLoading" text="正在与AI同步备忘录..."></Loading>
      
      <template v-if="!isLoading">
        <div v-for="memo in memos" :key="memo.id" class="memo-item">
          <!-- 纯装饰用的图钉 -->
          <div class="pin"></div>
          
          <div class="memo-content" contenteditable="true" @blur="updateMemo(memo.id, $event)">
            {{ memo.content }}
          </div>
          
          <div class="memo-footer">
            <span class="memo-date">{{ getDateString(memo.timestamp) }}</span>
            <div class="delete-btn" @click="deleteMemo(memo.id)">
              <svg-icon name="trash" class="delete-icon" />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="memos.length === 0" class="empty-state">
          <div class="empty-hint">
            <span>墙上空空如也...</span>
            <br>
            <small>点击右上角贴一张新的便利贴吧</small>
          </div>
        </div>
      </template>
    </div>
  </CPhoneAppsLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useMemoStore } from '@/stores/charphone/memoStore'
import CPhoneAppsLayout from '../components/CPhoneAppsLayout.vue'
import Loading from '@/components/common/Loading.vue'

const emit = defineEmits(['close'])
const route = useRoute()
const singleStore = useSingleStore()
const memoStore = useMemoStore()

// CharPhone.vue 传递的 charId 是在路由参数里的
const charId = route.params.charId

const character = computed(() => singleStore.getCharacter(charId))
const memos = computed(() => memoStore.getMemos(charId))
const isLoading = computed(() => memoStore.isLoading)
const memoTitle = computed(() => character.value ? `${character.value.name}的备忘录` : '备忘录')

onMounted(() => {
  memoStore.fetchMemos(charId)
})

const handleClose = () => {
  emit('close')
}

const getDateString = (timestamp) => {
  const date = new Date(Number(timestamp))
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const addMemo = async () => {
  await memoStore.addMemo(charId, '新备忘录')
}

const handleRefresh = async () => {
  // “刷新”按钮现在将用于添加新的备忘录
  await addMemo()
}

const handleClear = async () => {
  if (confirm('确定要清除所有备忘录吗？')) {
    await memoStore.clearMemos(charId)
  }
}

const updateMemo = async (id, event) => {
  const content = event.target.innerText
  await memoStore.updateMemo(charId, id, content)
}

const deleteMemo = async (id) => {
  if (confirm('确定要删除这条备忘录吗？')) {
    await memoStore.deleteMemo(charId, id)
  }
}
</script>

<style scoped>
.action-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s;
  pointer-events: auto;
  padding: 5px;
}

.action-btn:hover {
  background: rgba(255,255,255,0.2);
}

.action-btn:active {
  transform: scale(0.9);
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* --- 核心：软木板背景 --- */
.memo-list.cork-board {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  /* 软木板纹理 */
  background-color: #ba9e76;
  background-image: 
    radial-gradient(hsla(34, 40%, 30%, 0.1) 15%, transparent 16%), 
    radial-gradient(hsla(34, 40%, 30%, 0.1) 15%, transparent 16%);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.3); /* 内阴影让它看起来像嵌在手机里的板子 */
}

/* --- 便利贴卡片 --- */
.memo-item {
  position: relative;
  border-radius: 2px; /* 纸张不需要圆角太大 */
  padding: 25px 15px 10px 15px; /* 顶部留多点给图钉 */
  margin-bottom: 25px; /* 增加间距 */
  box-shadow: 
    0 4px 6px rgba(0,0,0,0.15),
    0 10px 20px rgba(0,0,0,0.1); /* 双重阴影模拟纸张翘起 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s;
  
  /* 默认黄色便利贴 */
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
}

.memo-item:hover {
  transform: scale(1.02);
  z-index: 10;
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
  background: #d32f2f; /* 红色大头针 */
  box-shadow: 
    inset -3px -3px 5px rgba(0,0,0,0.3), /* 立体感 */
    inset 2px 2px 5px rgba(255,255,255,0.5), /* 高光 */
    2px 5px 5px rgba(0,0,0,0.3); /* 投影 */
  z-index: 5;
}

/* --- 多彩便利贴逻辑 --- */
/* 每3个循环一次颜色和旋转角度，让墙面看起来活泼 */

/* 第1个：黄色，向左歪 */
.memo-item:nth-child(3n+1) {
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
  transform: rotate(-2deg);
}
.memo-item:nth-child(3n+1) .pin { background: #d32f2f; } /* 红钉子 */

/* 第2个：蓝色，向右歪 */
.memo-item:nth-child(3n+2) {
  background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
  transform: rotate(2deg);
}
.memo-item:nth-child(3n+2) .pin { background: #1976d2; } /* 蓝钉子 */

/* 第3个：粉色，摆正 */
.memo-item:nth-child(3n+3) {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  transform: rotate(0deg);
}
.memo-item:nth-child(3n+3) .pin { background: #c2185b; } /* 紫红钉子 */


/* --- 内容与字体 --- */
.memo-content {
  font-family: 'Kaiti', 'STKaiti', 'KaiTi', '楷体', cursive; /* 手写字体 */
  font-size: 18px;
  color: #3e2723;
  line-height: 1.6;
  outline: none;
  min-height: 40px;
}

.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed rgba(0,0,0,0.1); /* 虚线分割 */
  padding-top: 8px;
  margin-top: 5px;
}

.memo-date {
  font-family: 'Patrick Hand', sans-serif; /* 英文手写体 */
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
  height: 300px;
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
</style>
