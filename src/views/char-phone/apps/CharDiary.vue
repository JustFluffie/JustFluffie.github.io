<template>
  <CPhoneAppsLayout 
    :title="diaryTitle" 
    :show-clear="true"
    :show-refresh="true"
    @close="handleClose" 
    @clear="clearDiary"
    @refresh="generateDiary"
    background="#f8f6f3"
    color="#37474f"
    themeColor="#555"
  >
    <div class="diary-container" :class="{ 'is-open': currentDiary || isGenerating }">
      <!-- 装饰背景元素：一支笔或者桌面纹理 -->
      <div class="desktop-texture"></div>

      <div class="diary-notebook-container" v-if="currentDiary || isGenerating">
        <!-- 皮革底衬（打开的书壳） -->
        <div class="open-book-leather">
          <!-- 丝带书签 -->
          <div class="bookmark-ribbon"></div>
          <!-- 纸张堆叠层 -->
          <div class="paper-stack">
            <!-- 实际书写页 -->
            <div class="paper-sheet">
              <!-- 角色拍立得 (夹在书页里) -->
              <div class="polaroid" v-if="characterInfo">
                <div class="photo-frame">
                  <img :src="characterInfo.avatar" alt="char" @error="handleImgError" />
                </div>
                <!-- 名字用手写体写在照片边框上 -->
                <div class="photo-name">{{ characterInfo.name }}</div>
              </div>

              <!-- 内容区域 -->
              <div class="paper-content">
                <div class="diary-header">
                  <div class="date-group">
                    <span class="day">{{ getDay(currentTimestamp) }}</span>
                    <div class="month-year-group">
                      <span class="month">{{ getMonth(currentTimestamp) }}</span>
                      <span class="year">{{ getYear(currentTimestamp) }}</span>
                    </div>
                    <div class="weekday-badge">{{ getWeekday(currentTimestamp) }}</div>
                  </div>
              
                  <!-- 天气/心情印章 -->
                  <div class="stamp-mark">
                    <div class="stamp-inner">CONFIDENTIAL</div>
                  </div>
                </div>

                <div class="diary-divider"></div>

                <div class="diary-body">
                  <div v-if="isGenerating" class="generating-container">
                    <div class="fountain-pen-loading">
                      <svg-icon name="pencil" class="pen-icon" />
                      <span>{{ characterInfo?.name || 'Ta' }} 正在提笔...</span>
                    </div>
                  </div>
                  <div v-else class="handwritten-text">
                    <p v-for="(paragraph, index) in formattedContent" :key="index">
                      {{ paragraph }}
                    </p>
                  </div>
                </div>

                <!-- 页码装饰 -->
                <div class="page-number">- {{ new Date(Number(currentTimestamp)).getDate() }} -</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="diary-book-cover" v-else @click="generateDiary">
        <!-- 书脊阴影 -->
        <div class="book-spine"></div>
  
        <!-- 封面纹理层 -->
        <div class="cover-texture">
          <!-- 缝线装饰 -->
          <div class="stitching-border"></div>
      
          <!-- 封面标签 -->
          <div class="cover-label">
            <div class="label-border">
              <h2 class="book-title">DIARY</h2>
              <div class="book-subtitle">
                <span class="owner-name">{{ characterInfo?.name || 'Character' }}</span>
                <span class="of-word">'s</span>
              </div>
              <div class="label-line"></div>
              <div class="book-hint">打开日记本</div>
            </div>
          </div>

          <!-- 装饰：绑带 -->
          <div class="elastic-band"></div>
        </div>
      </div>
    </div>
  </CPhoneAppsLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useDiaryStore } from '@/stores/charphone/diaryStore'
import { useApiStore } from '@/stores/apiStore'
import CPhoneAppsLayout from '../components/CPhoneAppsLayout.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

// --- 1. 设置与钩子 ---
const emit = defineEmits(['close'])
const route = useRoute()
const singleStore = useSingleStore()
const diaryStore = useDiaryStore()
const apiStore = useApiStore()

// --- 2. 状态 ---
const charId = route.params.charId
const isGenerating = ref(false)

// --- 3. 计算属性 ---
const characterInfo = computed(() => singleStore.getCharacter(charId))
const diaryTitle = computed(() => characterInfo.value ? `${characterInfo.value.name}的日记` : '日记')
const diaries = computed(() => diaryStore.getDiaries(charId))
const currentDiary = computed(() => diaries.value.length > 0 ? diaries.value[0] : null)
const currentTimestamp = computed(() => isGenerating.value ? Date.now() : (currentDiary.value?.timestamp || Date.now()))

const formattedContent = computed(() => {
  if (!currentDiary.value?.content) return []
  return currentDiary.value.content.split('\n').filter(line => line.trim())
})

// --- 4. 辅助方法 ---
const getDay = (ts) => new Date(Number(ts)).getDate().toString().padStart(2, '0')
const getMonth = (ts) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return months[new Date(Number(ts)).getMonth()]
}
const getYear = (ts) => new Date(Number(ts)).getFullYear()
const getWeekday = (ts) => {
  const days = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
  return days[new Date(Number(ts)).getDay()]
}

const handleImgError = (e) => {
  e.target.style.display = 'none'
  e.target.parentElement.style.backgroundColor = '#eee'
}

// --- 5. 动作方法 ---
const handleClose = () => {
  emit('close')
}

const clearDiary = () => {
  if (currentDiary.value && confirm('确定要撕掉这页日记吗？')) {
    diaryStore.deleteDiary(charId, currentDiary.value.id)
  }
}

const generateDiary = async () => {
  if (isGenerating.value) return
  isGenerating.value = true
  
  try {
    const character = singleStore.getCharacter(charId)
    if (!character) return

    const recentMessages = singleStore.getFormattedRecentMessages(charId, 20)
    const chatLog = recentMessages.map(msg => {
      const role = msg.role === 'user' ? '用户' : '我'
      return `${role}: ${msg.content}`
    }).join('\n')

    const prompt = `你现在是${character.name}。请根据以下最近的聊天记录，写一篇简短的日记（100-200字）。
日记应该以第一人称“我”的视角，记录最近发生的事情、你的心情和对用户的想法。
请直接输出日记内容，不要包含任何其他解释或格式。

聊天记录：
${chatLog}

日记内容：`

    let presetToUse = null
    if (character.api && character.api !== 'default') {
        presetToUse = apiStore.presets.find(p => p.name === character.api)
    }

    const diaryContent = await apiStore.getGenericCompletion(
        [{ role: 'user', content: prompt }], 
        { preset: presetToUse }
    )
    
    if (diaryContent) {
      diaryStore.addDiary(charId, diaryContent.trim())
    }
  } catch (error) {
    console.error('Failed to generate diary:', error)
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Noto+Serif+SC:wght@400;600&display=swap');

/* --- 布局与容器 --- */
.diary-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  background-color: #f8f6f3; 
  padding: 0px 10px 20px 10px;
}

.diary-container.is-open {
  padding: 0px 10px 20px 0;
}

.diary-notebook-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- 打开的书本结构 --- */
.open-book-leather {
  width: 100%;
  max-width: 620px;
  height: 560px;
  margin: 10px 0;
  background-color: #5d4037;
  background-image: 
    url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
  border-radius: 0 6px 6px 0;
  box-shadow: 
    0 20px 50px rgba(0,0,0,0.5),
    inset 0 0 10px rgba(0,0,0,0.5);
  padding: 12px 16px 12px 8px;
  position: relative;
  box-sizing: border-box;
}

.paper-stack {
  width: 100%;
  height: 100%;
  background: #e0e0e0;
  border-radius: 2px 4px 4px 2px;
  box-shadow: 
    1px 1px 0 #f5f5f5,
    2px 2px 0 #e0e0e0,
    3px 3px 0 #f5f5f5,
    4px 4px 0 #e0e0e0,
    6px 6px 12px rgba(0,0,0,0.2);
  padding-right: 2px;
}

.paper-sheet {
  background-color: #fffbf6;
  width: 100%;
  height: 100%;
  border-radius: 2px 4px 4px 2px;
  position: relative;
  overflow: hidden;
  padding: 30px 24px 15px;
  box-sizing: border-box;
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0) 15%),
    radial-gradient(#d7ccc8 1px, transparent 1px);
  background-size: 100% 100%, 20px 20px;
}

.bookmark-ribbon {
  position: absolute;
  top: -10px;
  left: 40px;
  width: 20px;
  height: 100px;
  background: #b71c1c;
  box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  z-index: 10;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
}

.polaroid {
  position: absolute;
  top: 2%;
  right: 4%;
  width: 25%;
  background: #fff;
  padding: 6px;
  box-shadow: 2px 4px 10px rgba(0,0,0,0.15);
  transform: rotate(3deg);
  z-index: 5;
}

.photo-frame {
  width: 100%;
  aspect-ratio: 1/1;
  background: #f0f0f0;
  overflow: hidden;
  border: 1px solid #eee;
}

.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-name {
  font-family: 'Patrick Hand', cursive, sans-serif;
  font-size: 12px;
  text-align: center;
  color: #555;
  margin-top: 6px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.paper-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.diary-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-left: 50px; 
  padding-right: 100px; 
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #a1887f;
  position: relative;
  flex-shrink: 0;
}

.date-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.day {
  font-family: 'Times New Roman', serif;
  font-size: 56px;
  font-weight: bold;
  line-height: 0.8;
  color: #3e2723;
}

.month-year-group {
  display: flex;
  flex-direction: column;
}

.month {
  font-family: 'Noto Serif SC', serif;
  font-weight: bold;
  font-size: 16px;
  color: #5d4037;
  text-transform: uppercase;
  line-height: 1;
}

.year {
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  color: #8d6e63;
}

.weekday-badge {
  font-family: 'Patrick Hand', cursive;
  font-size: 18px;
  color: #bb3a3a;
  margin-left: 5px;
}

.stamp-mark {
  position: absolute;
  right: 110px;
  bottom: 5px;
  opacity: 0.3;
  transform: rotate(-15deg);
  pointer-events: none;
}

.stamp-inner {
  border: 2px solid #d84315;
  color: #d84315;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  font-family: sans-serif;
  border-radius: 4px;
}

.diary-body {
  position: relative;
  padding: 5px 10px 10px 10px; 
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.diary-body::-webkit-scrollbar { 
  display: none;
}

.handwritten-text {
  font-family: 'KaiTi', 'STKaiti', 'DFKai-SB', '楷体', 'Georgia', serif;
  font-size: 16px;
  color: #3e2723;
  line-height: 35px; 
  text-align: justify;
  background-image: linear-gradient( to bottom, transparent 29px, #e0d8cf 30px );
  background-size: 100% 30px;
  background-attachment: local;
  padding-top: 2px; 
}

.handwritten-text p {
  text-indent: 2em;
  margin: 0;
}

.page-number {
  text-align: center;
  font-family: 'Times New Roman', serif;
  font-size: 12px;
  color: #a1887f;
  padding-bottom: 0px;
  flex-shrink: 0;
}

.generating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #8d6e63;
  font-family: 'KaiTi', '楷体', serif;
  font-size: 18px;
  animation: breathe 2s infinite ease-in-out;
}

.fountain-pen-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.pen-icon {
  width: 40px;
  height: 40px;
  color: #8d6e63;
  animation: writing 1s infinite alternate ease-in-out;
}

@keyframes writing {
  from { transform: rotate(-15deg) translate(0, 0); }
  to { transform: rotate(5deg) translate(5px, -5px); }
}

.diary-book-cover {
  width: 100%;
  max-width: 400px;
  height: 560px;
  margin: 10px auto;
  position: relative;
  cursor: pointer;
  perspective: 1000px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cover-texture {
  width: 100%;
  height: 100%;
  background-color: #5d4037;
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.1) 10%, rgba(0,0,0,0) 15%),
    url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
  border-radius: 6px 16px 16px 6px;
  box-shadow: 
    10px 15px 30px rgba(0,0,0,0.25),
    inset 2px 0 5px rgba(255,255,255,0.1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.book-spine {
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 24px;
  background: #3e2723;
  border-radius: 4px 0 0 4px;
  z-index: -1;
  box-shadow: -2px 2px 8px rgba(0,0,0,0.3);
}

.stitching-border {
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  bottom: 15px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 4px 12px 12px 4px;
  pointer-events: none;
}

.cover-label {
  background: #fdfbf7;
  padding: 6px;
  width: 65%;
  height: auto;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transform: rotate(-2deg);
  position: relative;
  z-index: 2;
}

.label-border {
  border: 3px double #8d6e63;
  padding: 20px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.book-title {
  font-family: 'Times New Roman', serif;
  font-size: 32px;
  margin: 0;
  letter-spacing: 4px;
  font-weight: bold;
  background: linear-gradient(45deg, #d3bfa4, #a18446, #d6cba4);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 1px 1px rgba(255,255,255,0.5);
}

.book-subtitle {
  margin-top: 8px;
  font-family: 'Patrick Hand', cursive;
  font-size: 18px;
  color: #5d4037;
}

.owner-name {
  font-weight: bold;
  font-size: 20px;
  margin-right: 2px;
  border-bottom: 1px solid #5d4037;
}

.label-line {
  width: 40%;
  height: 1px;
  background: #d7ccc8;
  margin: 15px 0;
}

.book-hint {
  font-size: 12px;
  color: #a1887f;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 2px;
}

.elastic-band {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 40px;
  width: 12px;
  background: #212121;
  box-shadow: 2px 0 4px rgba(0,0,0,0.4);
  z-index: 3;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes breathe {
  0%, 100% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1); }
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
