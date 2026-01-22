<script setup>
// ========================================================================
// 1. 模块导入 (Imports)
// ========================================================================
import { computed, ref, onMounted } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { formatISO, startOfDay, differenceInDays } from 'date-fns';
import { getPeriodStatusForDate, predictFuturePeriods } from '@/composables/usePeriodTracking';
import SvgIcon from '@/components/common/SvgIcon.vue';
import Modal from '@/components/common/Modal.vue';

// ========================================================================
// 2. Store 初始化 (Store Initialization)
// ========================================================================
const calendarStore = useCalendarStore();

// ========================================================================
// 3. 待办事项逻辑 (To-Do List Logic)
// ========================================================================
const todos = computed(() => {
  const todayStr = formatISO(new Date(), { representation: 'date' });
  return calendarStore.getEventsByDate(todayStr)
    .filter(event => event.type === 'todo')
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
});

const toggleStatus = (id) => {
  calendarStore.toggleTodoStatus(id);
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// ========================================================================
// 4. 经期追踪核心逻辑 (Period Tracking Core)
// ========================================================================
const periodStatus = computed(() => {
  return getPeriodStatusForDate(formatISO(new Date(), { representation: 'date' }), calendarStore.periodHistory, calendarStore.ongoingPeriod);
});

const futurePredictions = computed(() => {
  return predictFuturePeriods(calendarStore.periodHistory, calendarStore.ongoingPeriod, 1);
});

const periodDisplayInfo = computed(() => {
  const { status, dayCount } = periodStatus.value;

  switch (status) {
    case 'actual':
    case 'ongoing':
      return { prefix: '经期第 ', number: dayCount, suffix: ' 天' };
    case 'predicted':
      return { prefix: '预测第 ', number: dayCount, suffix: ' 天' };
    default:
      if (futurePredictions.value.length > 0) {
        const nextStart = startOfDay(new Date(futurePredictions.value[0].start));
        const today = startOfDay(new Date());
        const daysUntil = differenceInDays(nextStart, today);
        if (daysUntil > 0) {
          return { prefix: '预计 ', number: daysUntil, suffix: ' 天后' };
        } else if (daysUntil === 0) {
          return { text: '预测今日开始' };
        }
      }
      return { text: '添加历史记录以开始预测' };
  }
});

const periodTextColor = computed(() => {
  switch (periodStatus.value.status) {
    case 'actual':
    case 'ongoing':
      return 'var(--C-red)'; // 红色
    case 'predicted':
      return 'var(--C-pink)'; // 粉色
    default:
      return 'var(--text-tertiary, #999)'; // 灰色
  }
});

// ========================================================================
// 5. 通用事件显示与交互逻辑 (Event Display & Interaction)
// ========================================================================
const showSelectionModal = ref(false);
const displayPreference = ref({ type: 'period' });

// 5.1 生命周期：加载用户偏好
onMounted(() => {
  const saved = localStorage.getItem('homeCardDisplayPreference');
  if (saved) {
    try {
      displayPreference.value = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse display preference', e);
    }
  }
});

// 5.2 计算属性：筛选候选事件
const candidateEvents = computed(() => {
  return calendarStore.events.filter(e =>
    e.type !== 'todo' &&
    e.type !== 'period_day' &&
    e.type !== 'predicted_period_day' &&
    e.title && e.date
  );
});

// 5.3 计算属性：最终显示信息
const finalDisplayInfo = computed(() => {
  if (displayPreference.value.type === 'period') {
    return {
      ...periodDisplayInfo.value,
      color: periodTextColor.value
    };
  } else if (displayPreference.value.type === 'event') {
    const event = calendarStore.events.find(e => e.id === displayPreference.value.eventId);
    if (!event) {
      return { text: '事件已删除', color: '#999' };
    }
    
    const today = startOfDay(new Date());
    const eventDate = startOfDay(new Date(event.date));
    const diff = differenceInDays(today, eventDate);
    
    if (diff > 0) {
      return {
        title: event.title,
        prefix: '已经 ',
        number: diff,
        suffix: ' 天',
        color: 'var(--C-yellow)' 
      };
    } else if (diff < 0) {
      return {
        title: event.title,
        prefix: '还有 ',
        number: Math.abs(diff),
        suffix: ' 天',
        color: 'var(--C-blue)'
      };
    } else {
      return {
        title: event.title,
        text: '就是今天',
        color: 'var(--C-red)'
      };
    }
  }
  return { text: '请选择显示内容', color: '#999' };
});

// 5.4 方法：弹窗控制
const openSelectionModal = () => {
  showSelectionModal.value = true;
};

const selectDisplay = (preference) => {
  displayPreference.value = preference;
  localStorage.setItem('homeCardDisplayPreference', JSON.stringify(preference));
  showSelectionModal.value = false;
};

</script>

<template>
  <!-- ========================================================================
       1. 弹窗组件 (Modal)
       ======================================================================== -->
  <Modal 
    v-model:visible="showSelectionModal" 
    title="选择显示内容" 
    :showFooter="false"
    containerClass="selection-modal-container"
  >
    <div class="selection-list">
      <!-- 选项：经期追踪 -->
      <div 
        class="selection-item" 
        :class="{ active: displayPreference.type === 'period' }"
        @click="selectDisplay({ type: 'period' })"
      >
        <div class="item-content">
          <span class="item-title">经期追踪</span>
          <span class="item-desc">显示当前经期状态或预测</span>
        </div>
        <div class="item-check" v-if="displayPreference.type === 'period'">✓</div>
      </div>
      
      <div class="divider-small" v-if="candidateEvents.length > 0"></div>

      <!-- 选项：通用事件列表 -->
      <div 
        v-for="event in candidateEvents" 
        :key="event.id"
        class="selection-item"
        :class="{ active: displayPreference.type === 'event' && displayPreference.eventId === event.id }"
        @click="selectDisplay({ type: 'event', eventId: event.id })"
      >
        <div class="item-content">
          <span class="item-title">{{ event.title }}</span>
          <span class="item-desc">{{ event.date }}</span>
        </div>
        <div class="item-check" v-if="displayPreference.type === 'event' && displayPreference.eventId === event.id">✓</div>
      </div>

      <!-- 空状态提示 -->
      <div v-if="candidateEvents.length === 0" class="no-events-tip">
        暂无其他事件，请在日历中添加。
      </div>
    </div>
  </Modal>

  <!-- ========================================================================
       2. 主卡片容器
       ======================================================================== -->
  <div class="list-card-wrapper" v-bind="$attrs">
    <div class="list-card-container">
      <div class="sticker-card">
        <!-- 2.1 装饰元素 -->
        <h3 class="handwritten-title">To Do List</h3>
        <div class="black-dot-deco1"></div>
        <div class="black-dot-deco2"></div>
        <div class="star-deco"></div>
        <svg class="circle-deco" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" />
        </svg>
        <div class="tape-deco"></div>
        <div class="cross-sparkle-container">
          <SvgIcon name="cross-sparkle" viewBox="0 0 100 100" class="cross-sparkle-svg" />
        </div>
        
        <!-- 2.2 待办事项列表区域 -->
        <div class="todo-list-container">
          <ul v-if="todos.length > 0" class="todo-list">
            <li
              v-for="todo in todos"
              :key="todo.id"
              :class="{ 'done': todo.done }"
            >
              <div class="checkbox" :class="{ 'checked': todo.done }" @click="toggleStatus(todo.id)"></div>
              <span class="todo-time">{{ formatTime(todo.date) }}</span>
              <span class="todo-content">{{ todo.content }}</span>
            </li>
          </ul>
          <p v-else class="no-todos">今天没有待办事项</p>
        </div>

        <!-- 2.3 分割线 -->
        <div class="divider"></div>

        <!-- 2.4 底部信息展示区域 (经期/事件) -->
        <div class="bottom-info-container" @click="openSelectionModal">
          <div 
            class="info-content" 
            :style="{ color: finalDisplayInfo.color }"
          >
            <template v-if="finalDisplayInfo.number !== undefined">
              <!-- 如果有标题（事件），显示标题 -->
              <div v-if="finalDisplayInfo.title" class="info-title">{{ finalDisplayInfo.title }}</div>
              
              <!-- 详细信息行：前缀 + 数字 + 后缀 -->
              <div class="info-detail">
                <span class="info-prefix">{{ finalDisplayInfo.prefix }}</span>
                <span class="info-number">{{ finalDisplayInfo.number }}</span>
                <span class="info-suffix">{{ finalDisplayInfo.suffix }}</span>
              </div>
            </template>
            <template v-else>
              <!-- 纯文本情况 -->
              <div v-if="finalDisplayInfo.title" class="info-title">{{ finalDisplayInfo.title }}</div>
              <span class="info-text-single">{{ finalDisplayInfo.text }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========================================================================
   1. 布局容器 (Layout Containers)
   ======================================================================== */
.list-card-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
}

.list-card-container {
    /* 1. 整体大小 (Zoom) */
    /* 提示：如果切到有边框模式觉得卡片太大，可以把这个 1.6vh稍微改小一点，比如 1.4vh */
    font-size: 1.2vh; 
    /* 2. 散布范围 (Spread) */
    width: 100%;  
    height: 100%; 
    /* 3. 整体位置移动 (Move) */
    position: relative;
    top: 0;   /* 原来是 -1.5em */
    left: 0;  /* 原来是 0em */
    --font-serif: 'Georgia', 'Times New Roman', serif;
}

/* ========================================================================
   2. 卡片样式与背景 (Card Styles)
   ======================================================================== */
.sticker-card {
  background: #ffffff;
  background-image: radial-gradient(circle, rgba(41, 41, 41, 0.08) 0.15em, transparent 0.15em),
    radial-gradient(circle, rgba(0, 0, 0, 0.08) 0.15em, transparent 0.15em);
  background-size: 2em 2em;
  background-position: 0 0, 1em 1em; 
  padding: 2.5em 1.5em 1em;
  border-radius: 0.4em;
  box-shadow: 
    0 0.1em 0.2em rgba(0,0,0,0.05), 
    0 0.8em 1.6em rgba(0,0,0,0.08);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #333;
  box-sizing: border-box; 
  width: 100%;
  height: 100%; 
}

/* ========================================================================
   3. 装饰元素 (Decorations)
   ======================================================================== */
.handwritten-title {
  font-family: 'Caveat', cursive;
  font-size: 2.7em;
  color: #333;
  margin: -0.625em -0.33em 0 -0.41em;
  transform: translateX(1%) translateY(-10%) rotate(-4deg);
  text-align: left;
  flex-shrink: 0; /* 防止标题被压缩 */
}

.tape-deco {
  position: absolute;
  top: -1em;
  left: 50%;
  transform: translateX(15%) rotate(10deg);
  width: 6em;
  height: 2em;
  background-color: rgba(220, 220, 220, 0.5);
  backdrop-filter: blur(0.2em);
  z-index: 4;
}

.cross-sparkle-container {
  position: absolute;
  top: -1.5em;
  right: 3em;
  z-index: 5;
  transform: rotate(0deg);
}

.cross-sparkle-svg {
  width: 1.5em; /* 修改这里调整大小 */
  height: 1.5em; /* 修改这里调整大小 */
  color: var(--home-text-color); 
  opacity: 0.4; 
}

.black-dot-deco1,.black-dot-deco2 {
  position: absolute;
  top: calc(1% + 0.4em);
  right: 1em;
  width: 1.7em;
  height: 1.7em;
  background: var(--home-text-color);
  border-radius: 50%;
  opacity: 0.6;
  z-index: 5;
}

.black-dot-deco2 {
  top: auto;
  right: auto;
  bottom: -1.5em;
  left: 3.5em;
  width: 0.65em;
  height: 0.65em;
  opacity: 0.7;
}

.star-deco {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.star-deco::before,
.star-deco::after {
  content: "";
  position: absolute;
  /* 这里设定大小 */
  width: 2em; 
  height: 2em;
  background-color: var(--home-text-color);
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0 Z' fill='black'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0 Z' fill='black'/%3E%3C/svg%3E");
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.star-deco::before {
  bottom: 2%;
  left: -0.82em;  
  width: 1.9em;
  height: 1.9em;
  opacity: 0.8;
  transform: rotate(-22deg);
}

.star-deco::after {
  bottom: 8em;
  right: -0.2em;
  width: 1.2em;
  height: 1.2em;
  opacity: 0.4;
  transform: rotate(10deg);
}

.circle-deco {
  position: absolute;
  bottom: -2.2em;
  left: -0.5em;
  width: 3.5em;
  height: 3.5em;
  color: var(--home-text-color);
  opacity: 0.3;
  pointer-events: none;
  z-index: 1;
}

.circle-deco circle {
  stroke-width: 6; /* 在这里调整线条粗细 */
}

/* ========================================================================
   4. 待办事项列表样式 (To-Do List Styles)
   ======================================================================== */
.todo-list-container {
  flex-grow: 1; 
  overflow-y: auto; 
  min-height: 0;
  display: flex;        /* 新增：设为 Flex 容器 */
  flex-direction: column; /* 新增：垂直排列 */
  
  /* 隐藏滚动条的样式 */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.todo-list-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, and Opera */
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0.7em 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 0.3em;
  margin-bottom: 1.2em;
  border-bottom: 0.1em dashed #bebebe;
  padding-bottom: 0.35em;
  font-size: 1.2em;
}

.checkbox {
  width: 1.1em;
  height: 1.1em;
  border: 0.2em solid #ddd;
  border-radius: 0.4em;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #ccc;
  border-color: #ccc;
}

.done .todo-content,
.done .todo-time {
  text-decoration: line-through;
  color: #bbb;
}

.todo-time {
  color: #999;
  font-size: 0.8em;
  flex-shrink: 0;
}

.todo-content {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9em;
  font-family: "Noto Serif SC", serif;
}

.no-todos {
  font-size: 1em;
  font-family: "Noto Serif SC", serif;
  text-align: center;
  color: #aaa;
  margin: auto;
  font-family: 'Caveat', cursive;
}

/* --- 分割线 --- */
.divider {
  border-bottom: 0.1em dashed #bebebe;
  margin: 0.9em 0;
  flex-shrink: 0; /* 防止分割线被压缩 */
}

/* ========================================================================
   5. 底部信息区域样式 (Bottom Info Area)
   ======================================================================== */
.bottom-info-container {
  flex-shrink: 0; /* 防止此容器被压缩 */
  text-align: center;
  padding: 0; 
  margin: 0.5em 0;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.bottom-info-container:active {
  transform: scale(0.98);
}

.info-content {
  font-family: 'ZCOOL KuaiLe', cursive;
  color: var(--text-secondary);
  margin: -5px 0;
  letter-spacing: 0.1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.info-title {
  font-size: 1.2em;
  margin-bottom: 0em;
  opacity: 0.9;
  line-height: 1.2;
}

.info-detail {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.info-prefix, .info-suffix {
  font-size: 1em;
}

.info-number {
  font-size: 1.7em;
  font-weight: bold;
  font-family: var(--font-serif);
  margin: 0 0.3em;
  line-height: 1;
  transform: translateY(0.05em); /* 微调数字垂直对齐 */
}

.info-text-single {
  font-size: 1.2em;
  padding: 0.2em 0;
}

/* ========================================================================
   6. 选择弹窗样式 (Selection Modal)
   ======================================================================== */
.selection-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  max-height: 60vh;
  overflow-y: auto;
}

.selection-item {
  display: flex;
  align-items: center;
  padding: 0.8em;
  border-radius: 0.8em;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.selection-item:hover {
  background: #f0f0f0;
}

.selection-item.active {
  background: var(--text-quaternary);
  border-color: var(--text-tertiary);
}

.item-icon {
  font-size: 1.5em;
  margin-right: 0.5em;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.item-title {
  font-weight: bold;
  color: var(--text-primary);
  font-size: 1.1em;
  text-align: center;
}

.item-desc {
  font-size: 0.85em;
  color: var(--text-tertiary);
}

.item-check {
  color: #e66262;
  font-weight: bold;
  font-size: 1.2em;
}

.divider-small {
  height: 1px;
  background: #eee;
  margin: 0.2em 0;
}

.no-events-tip {
  text-align: center;
  color: var(--text-tertiary);
  padding: 1em;
  font-size: 0.9em;
}

/* ========================================================================
   7. 响应式调整 (Responsive Adjustments)
   ======================================================================== */
</style>
