<template>
  <CPhoneAppsLayout 
    :title="scheduleTitle" 
    :show-clear="true"
    :show-refresh="true"
    @close="handleClose"
    @clear="clearSchedule"
    @refresh="generateSchedule"
    background="#f0f4f8"
    color="#37474f"
    themeColor="#546e7a"
  >
    <div class="schedule-paper" v-if="currentSchedule || isGenerating">
      <div class="paper-content">
        <div class="schedule-header">
          <div class="clip"></div>
          <div class="date-stamp">{{ isGenerating ? getDateString(Date.now()) : getDateString(currentSchedule.timestamp) }}</div>
        </div>
        <div class="schedule-body">
          <div v-if="isGenerating" class="generating-text">正在确认行程...</div>
          <div v-else class="handwritten-text">
            <div v-for="(item, index) in parseSchedule(currentSchedule.content)" :key="index" class="schedule-item">
              <div class="time-col">{{ item.time }}</div>
              <div class="event-col">{{ item.event }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-hint">行程表是空的...<br>点击右上角，看看我今天做了什么吧</div>
    </div>
  </CPhoneAppsLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useScheduleStore } from '@/stores/charphone/scheduleStore'
import { useApiStore } from '@/stores/apiStore'
import CPhoneAppsLayout from '../components/CPhoneAppsLayout.vue'

const emit = defineEmits(['close'])
const route = useRoute()
const singleStore = useSingleStore()
const scheduleStore = useScheduleStore()
const apiStore = useApiStore()

const charId = route.params.charId

const isGenerating = ref(false)

const character = computed(() => singleStore.getCharacter(charId))
const schedules = computed(() => scheduleStore.getSchedules(charId))
const currentSchedule = computed(() => schedules.value.length > 0 ? schedules.value[0] : null)
const scheduleTitle = computed(() => character.value ? `${character.value.name}的行程` : '行程表')

const handleClose = () => {
  emit('close')
}

const getDateString = (timestamp) => {
  const date = new Date(Number(timestamp))
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${weekDays[date.getDay()]}`
}

const clearSchedule = () => {
  if (currentSchedule.value) {
    if (confirm('确定要撕掉这张行程表吗？')) {
      scheduleStore.deleteSchedule(charId, currentSchedule.value.id)
    }
  }
}

const parseSchedule = (content) => {
  if (!content) return []
  // 简单的解析逻辑：假设每行是 "时间 内容" 或 "时间：内容"
  return content.split('\n').map(line => {
    line = line.trim()
    if (!line) return null
    
    // 尝试匹配时间格式 (HH:MM 或 H:MM)
    const timeMatch = line.match(/^(\d{1,2}:\d{2})/)
    if (timeMatch) {
      const time = timeMatch[1]
      let event = line.substring(time.length).trim()
      // 去除可能的分隔符
      if (event.startsWith(':') || event.startsWith('：') || event.startsWith('-')) {
        event = event.substring(1).trim()
      }
      return { time, event }
    } else {
      // 如果没有明确时间，作为普通项
      return { time: '', event: line }
    }
  }).filter(item => item !== null)
}

const generateSchedule = async () => {
  if (isGenerating.value) return
  isGenerating.value = true
  
  try {
    if (!character.value) return

    // 获取最近聊天记录作为上下文
    // 减少上下文数量以加快生成速度
    const recentMessages = singleStore.getFormattedRecentMessages(charId, 10)
    const chatLog = recentMessages.map(msg => {
      const role = msg.role === 'user' ? '用户' : '我'
      return `${role}: ${msg.content}`
    }).join('\n')

    // 检查是否已有今日行程
    const today = new Date()
    const todayStr = `${today.getFullYear()}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}`
    
    let existingSchedule = null
    if (currentSchedule.value) {
      const scheduleDate = new Date(Number(currentSchedule.value.timestamp))
      const scheduleDateStr = `${scheduleDate.getFullYear()}.${(scheduleDate.getMonth() + 1).toString().padStart(2, '0')}.${scheduleDate.getDate().toString().padStart(2, '0')}`
      if (scheduleDateStr === todayStr) {
        existingSchedule = currentSchedule.value
      }
    }

    const currentTimeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`

    let prompt = ''
    if (existingSchedule) {
      // 增量更新模式
      prompt = `角色:${character.value.name}
当前时间:${todayStr} ${currentTimeStr}
任务:根据参考聊天和角色设定，补充现有行程表(仅补充${currentTimeStr}之前未记录的)。

规则:
1.严禁包含晚于${currentTimeStr}的时间点。
2.格式:HH:MM 事件内容
3.输出完整列表(含旧数据)，按时间排序。
4.内容基于角色人设的日常（如工作、爱好、生活习惯），体现角色性格和生活气息，要有真实感。
5.每条字数控制在15-30字。
6.【重要】直接输出行程列表，不要包含任何解释、标题或总结性文字。

现有行程:
${existingSchedule.content}

完整行程:`
    } else {
      // 全新生成模式
      prompt = `角色:${character.value.name}
当前时间:${todayStr} ${currentTimeStr}
任务:根据参考聊天和角色设定，生成截止到目前为止角色的今日行程(已发生的事)。

规则:
1.严禁包含晚于${currentTimeStr}的时间点。
2.格式:HH:MM 事件内容
3.内容基于角色人设的日常（如工作、爱好、生活习惯），体现角色性格和生活气息，要有真实感。
4.每条字数控制在15-30字。
5.【重要】直接输出行程列表，不要包含任何解释、标题或总结性文字。

参考聊天:
${chatLog}

行程:`
    }

    // 获取预设
    let presetToUse = null
    if (character.value.api && character.value.api !== 'default') {
        presetToUse = apiStore.presets.find(p => p.name === character.value.api)
    }

    const scheduleContent = await apiStore.getGenericCompletion(
        [{ role: 'user', content: prompt }],
        { preset: presetToUse }
    )
    
    if (scheduleContent && scheduleContent.content) {
      // 过滤掉未来时间点的兜底逻辑
      const filteredContent = scheduleContent.content.split('\n').filter(line => {
        const timeMatch = line.trim().match(/^(\d{1,2}:\d{2})/)
        if (timeMatch) {
          const [h, m] = timeMatch[1].split(':').map(Number)
          const itemTime = h * 60 + m
          const [curH, curM] = currentTimeStr.split(':').map(Number)
          const curTime = curH * 60 + curM
          return itemTime <= curTime
        }
        return true
      }).join('\n')

      if (existingSchedule) {
        scheduleStore.updateSchedule(charId, existingSchedule.id, filteredContent.trim())
      } else {
        scheduleStore.addSchedule(charId, filteredContent.trim())
      }
    }
  } catch (error) {
    console.error('Failed to generate schedule:', error)
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
.refresh-btn.spinning .action-icon {
  animation: spin 1s linear infinite;
}

:deep(.action-icon) {
  width: 20px;
  height: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* --- 行程表纸张核心样式 --- */
.schedule-paper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  position: relative;
  padding: 18px 20px 40px;
  background-color: #f0f4f8;
  /* 横线效果 */
  background-image: linear-gradient(#cfd8dc 1px, transparent 1px);
  background-size: 100% 40px; /* 行高稍大 */
  background-attachment: local;
}

.paper-content {
  padding-top: 5px;
  min-height: 100%;
}

/* --- 头部：日期和装饰 --- */
.schedule-header {
  margin-bottom: 20px;
  position: relative;
  padding-top: 5px;
  text-align: center;
}

/* 燕尾夹效果 */
.clip {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: #78909c;
  border-radius: 4px;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.clip::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 10px;
  right: 10px;
  height: 20px;
  border: 2px solid #b0bec5;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
}

.date-stamp {
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  color: #455a64;
  font-weight: bold;
  letter-spacing: 1px;
  display: inline-block;
  background: rgba(255,255,255,0.5);
  padding: 2px 10px;
  border-radius: 4px;
}

/* --- 行程正文 --- */
.schedule-body {
  margin-top: 10px;
}

.handwritten-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  line-height: 40px; /* 与背景行高一致 */
  color: #263238;
}

.schedule-item {
  display: flex;
  align-items: baseline;
  min-height: 40px;
}

.time-col {
  width: 42px;
  font-weight: bold;
  color: #546e7a;
  font-family: 'Courier New', Courier, monospace;
  flex-shrink: 0;
  font-size: 14px;
}

.event-col {
  flex: 1;
  padding-left: 10px;
  border-left: 2px solid #b0bec5;
  margin-left: 5px;
  line-height: 1.4; /* 减小行内间距 */
  padding-top: 10px; /* 垂直居中对齐 */
  padding-bottom: 10px;
}

.generating-text {
  font-family: 'ZCOOL KuaiLe', 'Noto Serif SC', serif;
  font-size: 18px;
  line-height: 40px;
  color: #90a4ae;
  text-align: center;
  margin-top: 60px;
  animation: fadeIn 1s infinite alternate;
}

@keyframes fadeIn {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

/* --- 空状态 --- */
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #eceff1;
  background-image: linear-gradient(#cfd8dc 1px, transparent 1px);
  background-size: 100% 40px;
}

.empty-hint {
  font-family: 'ZCOOL KuaiLe', 'Noto Serif SC', serif;
  font-size: 18px;
  color: #78909c;
  text-align: center;
  line-height: 1.6;
}
</style>
