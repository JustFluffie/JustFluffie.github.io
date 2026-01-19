<script setup>
// ========================================================================
// 模块导入
// ========================================================================
import { computed } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { formatISO, startOfDay, differenceInDays } from 'date-fns';
import { getPeriodStatusForDate, predictFuturePeriods } from '@/composables/usePeriodTracking';

// ========================================================================
// Store 初始化
// ========================================================================
const calendarStore = useCalendarStore();

// ========================================================================
// 待办事项 (To-Do List) 逻辑
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
// 经期追踪 (Period Tracker) 逻辑
// ========================================================================
const periodStatus = computed(() => {
  return getPeriodStatusForDate(formatISO(new Date(), { representation: 'date' }), calendarStore.periodHistory, calendarStore.ongoingPeriod);
});

const futurePredictions = computed(() => {
  return predictFuturePeriods(calendarStore.periodHistory, calendarStore.ongoingPeriod, 1);
});

const periodDisplayText = computed(() => {
  const { status, dayCount } = periodStatus.value;

  switch (status) {
    case 'actual':
    case 'ongoing':
      return `经期第 ${dayCount} 天`;
    case 'predicted':
      return `预测第 ${dayCount} 天`;
    default:
      if (futurePredictions.value.length > 0) {
        const nextStart = startOfDay(new Date(futurePredictions.value[0].start));
        const today = startOfDay(new Date());
        const daysUntil = differenceInDays(nextStart, today);
        if (daysUntil > 0) {
          return `预计 ${daysUntil} 天后`;
        } else if (daysUntil === 0) {
          // This case might occur if the prediction starts today but isn't 'ongoing' yet.
          return '预测今日开始';
        }
      }
      return '添加历史记录以开始预测';
  }
});

const periodTextColor = computed(() => {
  switch (periodStatus.value.status) {
    case 'actual':
    case 'ongoing':
      return 'var(--period-color, #e66262)'; // 红色
    case 'predicted':
      return 'var(--color-pink, #ff8c94)'; // 粉色
    default:
      return 'var(--text-tertiary, #999)'; // 灰色
  }
});

</script>

<template>
  <div class="sticker-card todo-card">
    <!-- 装饰元素 -->
    <h3 class="handwritten-title">To Do List</h3>
    <div class="black-dot-deco"></div>
    <div class="star-deco"></div>
    <div class="tape-deco"></div>
    
    <!-- 待办事项列表容器 (可滚动) -->
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

    <!-- 分割线 -->
    <div class="divider"></div>

    <!-- 经期追踪容器 -->
    <div class="period-tracker-container">
      <p 
        class="period-text" 
        :style="{ color: periodTextColor }"
      >
        {{ periodDisplayText }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ========================================================================
   1. 主卡片布局与背景
   ======================================================================== */
.sticker-card {
  background: #ffffff;
  background-image: radial-gradient(circle, rgba(41, 41, 41, 0.08) 1.5px, transparent 1.5px),
    radial-gradient(circle, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px; 
  padding: 25px 15px 10px;
  border-radius: 4px;
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.05), 
    0 8px 16px rgba(0,0,0,0.08);
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #333;
}

/* ========================================================================
   2. 装饰元素 (标题、胶带、星星等)
   ======================================================================== */
.handwritten-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #333;
  margin: -15px -8px 0 -10px;
  transform: translateX(-2.7rem) rotate(-4deg);
  text-align: right;
  flex-shrink: 0; /* 防止标题被压缩 */
}

.tape-deco {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(15%) rotate(10deg);
  width: 60px;
  height: 20px;
  background-color: rgba(220, 220, 220, 0.5);
  backdrop-filter: blur(2px);
  z-index: 4;
}

.black-dot-deco {
  position: absolute;
  top: calc(1% + 4px);
  right: 10px;
  width: 17px;
  height: 17px;
  background: var(--home-text-color);
  border-radius: 50%;
  opacity: 0.8;
  z-index: 5;
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
  width: 20px; 
  height: 20px;
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
  left: -5px;  
  width: 19px;
  height: 19px;
  opacity: 0.6;
  transform: rotate(-15deg);
}

.star-deco::after {
  bottom: 80px;
  right: 0;
  width: 12px;
  height: 12px;
  opacity: 0.3;
  transform: rotate(10deg);
}

/* ========================================================================
   3. 内容区域布局与样式
   ======================================================================== */

/* --- 待办事项列表 --- */
.todo-list-container {
  flex-grow: 1; 
  overflow-y: auto; 
  min-height: 0;
  
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
  margin: 6px 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 12px;
  border-bottom: 1px dashed #e0e0e0;
  font-size: 10px;
}

.checkbox {
  width: 11px;
  height: 11px;
  border: 2px solid #ddd;
  border-radius: 4px;
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
  font-size: 8px;
  flex-shrink: 0;
}

.todo-content {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
}

.no-todos {
  font-size: 12px;
  text-align: center;
  color: #aaa;
  margin: auto;
  font-family: 'Caveat', cursive;
}

/* --- 分割线 --- */
.divider {
  border-bottom: 1px dashed #e0e0e0;
  margin: 5px 0;
  flex-shrink: 0; /* 防止分割线被压缩 */
}

/* --- 经期追踪 --- */
.period-tracker-container {
  flex-shrink: 0; /* 防止此容器被压缩 */
  text-align: center;
  padding: 0px 0; 
}

.period-text {
  font-size: 10px;
  color: #666;
  font-family: 'Caveat', cursive;
  margin: 0;
}
</style>
