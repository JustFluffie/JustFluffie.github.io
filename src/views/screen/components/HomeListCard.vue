<script setup>
import { computed } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { formatISO } from 'date-fns';

const calendarStore = useCalendarStore();

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
</script>

<template>
  <div class="sticker-card todo-card">
    <h3 class="handwritten-title">To Do List</h3>
    <div class="black-dot-deco"></div>
    <div class="star-deco"></div>
    <div class="tape-deco"></div>
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

</template>

<style scoped>
/* Styles adapted from ToDoList.vue for a sticker/memo look */
.sticker-card {
  background: #ffffff;
  background-image: radial-gradient(circle, rgba(41, 41, 41, 0.08) 1.5px, transparent 1.5px),
    radial-gradient(circle, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px; 
  padding: 25px 15px;
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

.handwritten-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #333;
  margin: -15px -8px 0 -10px;
  transform: translateX(-31%) rotate(-4deg);
  text-align: right;
  flex-shrink: 0;
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

/* 容器：铺满卡片，不挡点击 */
.star-deco {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 鼠标穿透 */
  z-index: 1;
}

/* 定义星星的形状（公共样式） */
.star-deco::before,
.star-deco::after {
  content: "";
  position: absolute;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  
  /* 这里是内凹四角星的 SVG 代码 */
  /* 颜色我默认设为黑色，通过下面的 opacity 变灰 */
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 C55 35 65 45 100 50 C65 55 55 65 50 100 C45 65 35 55 0 50 C35 45 45 35 50 0 Z' fill='%23000000'/%3E%3C/svg%3E");
}

/* --- 第一颗星：标题左下方（稍大） --- */
.star-deco::before {
  bottom: 2%;   /* 根据你的标题位置调整 */
  left: -5px;  
  width: 19px; /* 星星大小 */
  height: 19px;
  opacity: 0.6; /* 透明度 */
  transform: rotate(-15deg); /* 稍微转一下更生动 */
}

/* --- 第二颗星：右下角（稍小，做平衡） --- */
.star-deco::after {
  bottom: 80px;
  right: 0;
  width: 12px;
  height: 12px;
  opacity: 0.3; /* 离得远，淡一点 */
  transform: rotate(10deg);
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 6px 0;
  overflow-y: auto;
  flex-grow: 1;
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
</style>
