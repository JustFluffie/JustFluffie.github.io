<template>
  <!-- 消息列表容器 -->
  <div class="chat-messages" ref="messagesContainer">
    <!-- 空状态提示 -->
    <div v-if="messages.length === 0" class="empty-message">
      开始和 {{ charName }} 聊天吧~
    </div>
    
    <!-- 消息项 -->
    <template v-for="(msg, index) in messages" :key="msg.id">
      <!-- 时间戳 -->
      <div v-if="shouldShowTimestamp(index)" class="timestamp">
        {{ formatTimestamp(msg.timestamp) }}
      </div>
      <MessageItem
        :msg="msg"
        :charName="charName"
        :charAvatar="charAvatar"
        :userAvatar="userAvatar"
        :bubbleStyle="bubbleStyle"
        :isSelectionMode="isSelectionMode"
        :isSelected="selectedMessageIds.has(msg.id)"
        :editingMessageId="editingMessageId"
        @save-edit="(payload) => $emit('save-edit', payload)"
        @cancel-edit="$emit('cancel-edit')"
        @toggle-selection="$emit('toggle-selection', $event)"
        @long-press="(e, id) => $emit('long-press', e, id)"
        @cancel-long-press="$emit('cancel-long-press')"
        @touch-move="$emit('touch-move', $event)"
        @click-msg="(e, id) => $emit('click-msg', e, id)"
        @show-text-content="(content) => $emit('show-text-content', content)"
        @show-thought="(msgId) => $emit('show-thought', msgId)"
        @accept-transfer="(msgId) => $emit('accept-transfer', msgId)"
      />
    </template>
  </div>

  <!-- 拉黑遮罩层 -->
  <div class="blocked-overlay" v-if="isBlocked">
      <div class="blocked-content">
          <div class="blocked-text">对方已被你拉黑</div>
          <button class="blocked-btn" @click="$emit('unblock')">解除拉黑</button>
      </div>
  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, watch, nextTick, onMounted } from 'vue'
// 组件
import MessageItem from './MessageItem.vue'

// ================================================================================================
// 属性、事件
// ================================================================================================
const props = defineProps({
  messages: { type: Array, default: () => [] },
  charName: String,
  charAvatar: String,
  userAvatar: String,
  bubbleStyle: Object,
  isSelectionMode: Boolean,
  selectedMessageIds: Set,
  isBlocked: Boolean,
  editingMessageId: String,
  activePanel: String // [修改] 接收 activePanel 以便内部监听滚动
})

defineEmits([
  'save-edit', 'cancel-edit', 'toggle-selection',
  'long-press', 'cancel-long-press', 'touch-move', 'click-msg',
  'unblock', 'show-text-content', 'show-thought', 'accept-transfer'
])

// ================================================================================================
// 响应式状态
// ================================================================================================
const messagesContainer = ref(null)

// ================================================================================================
// 方法
// ================================================================================================
const TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * @description 判断是否应该显示时间戳
 * @param {number} index - 当前消息的索引
 */
const shouldShowTimestamp = (index) => {
  if (index === 0) return true;
  
  const currentMsg = props.messages[index];
  const prevMsg = props.messages[index - 1];
  
  if (!currentMsg.timestamp || !prevMsg.timestamp) return false;

  const currentTime = new Date(currentMsg.timestamp).getTime();
  const prevTime = new Date(prevMsg.timestamp).getTime();

  return (currentTime - prevTime) > TIME_THRESHOLD;
};

/**
 * @description 格式化时间戳
 * @param {number | string} timestamp - 时间戳
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  // 在中国，一周从周一开始。 getDay() 周日是0。
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const weekStart = new Date(todayStart.getTime() - (dayOfWeek - 1) * 86400000);

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (date.getTime() >= todayStart.getTime()) {
    // 今天
    return timeStr;
  } else if (date.getTime() >= yesterdayStart.getTime()) {
    // 昨天
    return `昨天 ${timeStr}`;
  } else if (date.getTime() >= weekStart.getTime()) {
    // 本周
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${weekdays[date.getDay()]} ${timeStr}`;
  } else {
    // 更早
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    if (year === now.getFullYear()) {
      return `${month}月${day}日 ${timeStr}`;
    }
    return `${year}年${month}月${day}日 ${timeStr}`;
  }
};

/**
 * @description 滚动到消息列表底部
 */
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// [修改] 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// [修改] 监听面板变化，自动滚动到底部
watch(() => props.activePanel, (newVal) => {
  if (newVal) {
    nextTick(() => {
      scrollToBottom()
    })
  }
})

// [修改] 初始化滚动
onMounted(() => {
  scrollToBottom()
})

// ================================================================================================
// 暴露方法
// ================================================================================================
defineExpose({
  scrollToBottom
})
</script>

<style scoped>
/* --- 消息列表容器 --- */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    z-index: 1;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

/* --- 自定义滚动条 --- */
.chat-messages::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}
.chat-messages::-webkit-scrollbar-track {
    background-color: transparent;
}

/* --- 空状态 --- */
.empty-message {
    text-align: center;
    color: #999;
    margin-top: 20px;
    font-size: 13px;
}

/* --- 拉黑遮罩 --- */
.blocked-overlay {
    position: absolute;
    bottom: 56px; /* 留出输入栏高度 */
    left: 0;
    right: 0;
    top: 70px; /* 留出头部栏高度 */
    background: rgba(245, 245, 245, 0.8);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
}

.blocked-content {
    background: rgba(0, 0, 0, 0.7);
    padding: 15px 25px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: white;
}

.blocked-text {
    font-size: 14px;
}

.blocked-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

/* --- 时间戳 --- */
.timestamp {
  text-align: center;
  color: #999;
  font-size: 11px;
  padding: 10px 0;
}
</style>
