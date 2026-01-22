<template>
  <div v-if="todos.length > 0" class="sticker-card todo-card">
    <h3 class="handwritten-title">To Do List</h3>
    <div class="tape-deco"></div>
    <ul class="todo-list">
      <li 
        v-for="todo in todos" 
        :key="todo.id" 
        :class="{ 'done': todo.done }"
      >
        <div class="checkbox" :class="{ 'checked': todo.done }" @click="toggleStatus(todo.id)"></div>
        
        <div 
          v-if="editingTodo && editingTodo.id === todo.id" 
          class="edit-container" 
          ref="editContainerRef"
        >
          <label class="all-day-label">
            <input type="checkbox" v-model="editingTodo.isAllDay" class="hidden-checkbox">
            <span class="custom-checkbox" :class="{ checked: editingTodo.isAllDay }"></span>
            <span class="checkbox-text">全天</span>
          </label>
          <input 
            v-if="!editingTodo.isAllDay"
            type="time"
            v-model="editingTodo.time"
            class="base-input-mini"
          />
          <input 
            type="text"
            v-model="editingTodo.content"
            @keyup.enter="saveTodo"
            class="base-input"
            ref="editInputRef"
          />
          <button class="delete-btn" @click="deleteTodo(todo.id)">
            <SvgIcon name="x-mark" />
          </button>
        </div>
        <template v-else>
          <span class="todo-time">{{ formatTime(todo) }}</span>
          <span class="todo-content" @click="startEditing(todo)">{{ (todo.content || '').trim() || '[空内容]' }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import SvgIcon from '@/components/common/SvgIcon.vue';

const props = defineProps({
  todos: {
    type: Array,
    required: true,
  },
});

const calendarStore = useCalendarStore();
const editingTodo = ref(null);
const editInputRef = ref(null);
const editContainerRef = ref(null);

const handleOutsideClick = (event) => {
  // 如果点击的是 edit-container 内部，不处理
  const container = editContainerRef.value?.[0];
  if (container && container.contains(event.target)) {
    return;
  }
  // 点击外部，保存
  saveTodo();
};

const startEditing = (todo) => {
  // 如果已经在编辑其他项，先保存
  if (editingTodo.value) {
    saveTodo();
  }

  editingTodo.value = { 
    ...todo,
    isAllDay: !todo.time,
    time: todo.time || new Date().toTimeString().slice(0, 5)
  };
  
  nextTick(() => {
    editInputRef.value?.[0]?.focus();
    // 添加全局点击监听，使用 setTimeout 避免立即触发（如果是点击触发的编辑）
    setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 0);
  });
};

const saveTodo = () => {
  document.removeEventListener('mousedown', handleOutsideClick);
  
  if (!editingTodo.value) return;

  // If content is cleared, delete the todo
  if (!editingTodo.value.content.trim()) {
    deleteTodo(editingTodo.value.id);
    return;
  }

  const updatedTodo = {
    ...editingTodo.value,
    time: editingTodo.value.isAllDay ? '' : editingTodo.value.time
  };
  delete updatedTodo.isAllDay; // Clean up temporary property

  calendarStore.updateEvent(updatedTodo);
  editingTodo.value = null;
};

const deleteTodo = (todoId) => {
  document.removeEventListener('mousedown', handleOutsideClick);
  calendarStore.removeEvent(todoId);
  editingTodo.value = null; // Exit editing mode after deletion
};

const toggleStatus = (eventId) => {
  calendarStore.toggleTodoStatus(eventId);
};

const formatTime = (todo) => {
  if (!todo.time) return '全天';
  return todo.time;
};

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick);
});
</script>

<style scoped>
/* 待办清单 */
.handwritten-title { 
  font-family: 'Caveat', cursive; 
  font-size: 26px; 
  color: #333; 
  margin: 0 0 15px 0; 
  transform: rotate(-2deg); 
}
.tape-deco { 
  position: absolute; 
  top: -10px; 
  right: 30px; 
  width: 60px; 
  height: 15px; 
  background: rgba(220, 220, 220, 0.5); 
  transform: rotate(3deg); 
  backdrop-filter: blur(2px); 
  z-index: 10; 
}
.todo-list li { 
  display: flex; 
  align-items: flex-start; 
  gap: 10px; 
  margin-bottom: 12px; 
  font-size: 14px; 
  color: #555; 
}
.checkbox { 
  width: 18px; 
  height: 18px; 
  border: 2px solid #ddd; 
  border-radius: 6px; 
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px; /* Align with text top */
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
.todo-time, .edit-time-input {
  color: #999;
  font-size: 12px;
  flex-shrink: 0; /* Prevent time from shrinking */
  min-width: 35px; /* Ensure enough width for time or "全天" */
  text-align: right;
  margin-top: 3px; /* Align with text top */
  line-height: 1.4;
}
.edit-container {
  display: flex;
  flex-grow: 1;
  align-items: center;
  gap: 8px;
  min-width: 0; /* Allow container to shrink */
}
.all-day-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
}
.hidden-checkbox {
  display: none;
}
.custom-checkbox {
  width: 14px;
  height: 14px;
  border: 1px solid #999;
  border-radius: 3px;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
}
.custom-checkbox.checked {
  border-color: #666;
}
.custom-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0px;
  width: 4px;
  height: 8px;
  border: solid #555;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.checkbox-text {
  font-size: 12px;
}
.todo-content {
  flex-grow: 1;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: pointer;
  line-height: 1.4;
}

.edit-container .base-input {
  padding: 2px 8px; /* 进一步减小 padding 以对齐 */
  font-size: 14px;
  height: 24px; /* 设定一个明确的高度 */
  box-sizing: border-box;
  flex-grow: 1; /* 占据剩余空间 */
}

.base-input-mini {
  height: 24px; /* 设定一个明确的高度 */
  padding: 2px 4px;
  box-sizing: border-box;
}
.delete-btn {
  background: #eee;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #888;
  flex-shrink: 0;
}
.delete-btn:hover {
  background: #e0e0e0;
  color: #333;
}
.delete-btn .svg-icon {
  width: 12px;
  height: 12px;
}
</style>
