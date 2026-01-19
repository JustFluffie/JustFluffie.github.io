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
        
        <div v-if="editingTodo && editingTodo.id === todo.id" class="edit-container">
          <input 
            type="time"
            v-model="editingTodo.time"
            class="base-input-mini"
            @mousedown="preventBlur"
          />
          <input 
            type="text"
            v-model="editingTodo.content"
            @blur="saveTodo"
            @keyup.enter="saveTodo"
            class="base-input"
            ref="editInputRef"
          />
          <button class="delete-btn" @mousedown="preventBlur" @click="deleteTodo(todo.id)">
            <SvgIcon name="x-mark" />
          </button>
        </div>
        <template v-else>
          <span class="todo-time">{{ formatTime(todo.date) }}</span>
          <span class="todo-content" @click="startEditing(todo)">{{ (todo.content || '').trim() || '[空内容]' }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
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
const isLosingFocusToInternalElement = ref(false);

const preventBlur = () => {
  isLosingFocusToInternalElement.value = true;
};

const startEditing = (todo) => {
  const todoDate = new Date(todo.date);
  editingTodo.value = { 
    ...todo,
    time: todoDate.toTimeString().slice(0, 5) // Extract HH:mm
  };
  nextTick(() => {
    editInputRef.value?.[0]?.focus();
  });
};

const saveTodo = () => {
  // This is a workaround to prevent the blur event from closing the edit mode
  // when clicking on other elements within the edit container (like the time input or delete button).
  // The mousedown event on those elements will set this flag to true.
  if (isLosingFocusToInternalElement.value) {
    isLosingFocusToInternalElement.value = false; // Reset the flag
    return; // And do not proceed with saving
  }

  if (!editingTodo.value) return;

  // If content is cleared, delete the todo
  if (!editingTodo.value.content.trim()) {
    deleteTodo(editingTodo.value.id);
    return;
  }

  const originalDate = new Date(editingTodo.value.date);
  const [hours, minutes] = editingTodo.value.time.split(':').map(Number);
  originalDate.setHours(hours, minutes);
  
  const updatedTodo = {
    ...editingTodo.value,
    date: originalDate.toISOString(),
  };
  delete updatedTodo.time; // Clean up temporary property

  calendarStore.updateEvent(updatedTodo);
  editingTodo.value = null;
};

const deleteTodo = (todoId) => {
  calendarStore.removeEvent(todoId);
  editingTodo.value = null; // Exit editing mode after deletion
};

const toggleStatus = (eventId) => {
  calendarStore.toggleTodoStatus(eventId);
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};
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
  align-items: center; 
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
}
.edit-container {
  display: flex;
  flex-grow: 1;
  align-items: center;
  gap: 8px;
  min-width: 0; /* Allow container to shrink */
}
.todo-content {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  /* 微调对齐 */
  position: relative;
  top: -1px;
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
