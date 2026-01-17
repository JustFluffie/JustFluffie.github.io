<template>
  <Modal v-model:visible="isModalVisible" title="选择聊天" @close="$emit('close')">
    <!-- 聊天列表 -->
    <div class="chat-list-container">
      <div v-for="char in characters" :key="char.id" class="chat-item" @click="selectChat(char.id)">
        <img :src="char.avatar" alt="avatar" class="avatar">
        <div class="chat-info">
          <div class="chat-name">{{ char.name }}</div>
        </div>
        <div class="checkbox" :class="{ selected: selectedChatIds.has(char.id) }"></div>
      </div>
    </div>
    <!-- 底部操作 -->
    <template #footer>
      <button class="modal-btn cancel" @click="$emit('close')">取消</button>
      <button class="modal-btn confirm" :disabled="selectedChatIds.size === 0" @click="confirmForward">
        确定 ({{ selectedChatIds.size }})
      </button>
    </template>
  </Modal>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, computed, watch } from 'vue';
// Pinia
import { useSingleStore } from '@/stores/chat/singleStore';
// 组件
import Modal from '@/components/common/Modal.vue';

// ================================================================================================
// 属性、事件
// ================================================================================================
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'confirm']);

// ================================================================================================
// 组合式函数
// ================================================================================================
const singleStore = useSingleStore();

// ================================================================================================
// 响应式状态
// ================================================================================================
const isModalVisible = ref(props.visible);
const selectedChatIds = ref(new Set());

// ================================================================================================
// 计算属性
// ================================================================================================
const characters = computed(() => singleStore.characters);

// ================================================================================================
// 侦听器
// ================================================================================================
watch(() => props.visible, (newVal) => {
  isModalVisible.value = newVal;
  // 弹窗关闭时清空选项
  if (!newVal) {
    selectedChatIds.value.clear();
  }
});

// ================================================================================================
// 方法
// ================================================================================================
/**
 * @description 选择或取消选择一个聊天
 * @param {string} chatId - 聊天ID
 */
const selectChat = (chatId) => {
  if (selectedChatIds.value.has(chatId)) {
    selectedChatIds.value.delete(chatId);
  } else {
    selectedChatIds.value.add(chatId);
  }
};

/**
 * @description 确认转发，发出带有选中ID的事件
 */
const confirmForward = () => {
  if (selectedChatIds.value.size > 0) {
    emit('confirm', Array.from(selectedChatIds.value));
  }
};
</script>

<style scoped>
/* --- 列表容器 --- */
.chat-list-container {
  max-height: 400px;
  overflow-y: auto;
  margin: -16px; /* 抵消 Modal 组件的默认内边距 */
}

/* --- 列表项 --- */
.chat-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.chat-item:hover {
  background-color: #f9f9f9;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.chat-info {
  flex-grow: 1;
}

.chat-name {
  font-weight: 500;
}

/* --- 复选框 --- */
.checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid #ccc;
  border-radius: 50%;
  transition: all 0.2s;
}

.checkbox.selected {
  background-color: #4CAF50;
  border-color: #4CAF50;
  position: relative;
}

.checkbox.selected::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 8px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
