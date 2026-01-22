<template>
  <div class="chat-footer">
    <!-- 引用消息预览 -->
    <div v-if="quotingMessage" class="quote-preview">
      <div class="quote-content">
<span class="quote-sender">{{ quoteSenderName }}: </span>
        <span class="quote-text">{{ quotingMessage.content }}</span>
      </div>
      <div class="quote-close" @click="$emit('cancel-quote')">
        <div class="quote-close-icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M576 512l277.333333 277.333333-64 64-277.333333-277.333333L234.666667 853.333333 170.666667 789.333333l277.333333-277.333333L170.666667 234.666667 234.666667 170.666667l277.333333 277.333333L789.333333 170.666667 853.333333 234.666667 576 512z" fill="currentColor"></path></svg>
        </div>
      </div>
    </div>

    <!-- 输入行 -->
    <div class="chat-input-row">
      <!-- 语音按钮 -->
      <div class="chat-tool-btn" @click="$emit('trigger-voice')">
        <SvgIcon name="voice-circle" class="svg-icon" />
      </div>
      <!-- 输入框 -->
      <div class="chat-input-wrapper">
        <textarea
          class="chat-input"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @keydown.enter.exact.prevent="handleSendMessage"
          id="messageInput"
          autocomplete="off"
          rows="1"
        ></textarea>
      </div>
      <!-- 表情按钮 -->
      <div class="chat-tool-btn" @click="togglePanel('sticker')">
        <SvgIcon name="sticker" class="svg-icon" />
      </div>
      <!-- 更多/发送按钮 -->
      <div class="chat-tool-btn" v-if="!modelValue" @click="togglePanel('more')">
        <SvgIcon name="plus-circle" class="svg-icon" />
      </div>
      <div class="send-btn-icon" v-else @click="handleSendMessage">
        <svg class="svg-icon" viewBox="0 0 24 24" style="stroke: white; width: 24px; height: 24px; position: relative; top: 1px; left: -1px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </div>
    </div>
    
    <!-- 面板区域 -->
    <!-- 表情包面板 -->
    <StickersPanel :visible="localActivePanel === 'sticker'" @send-sticker="handleSendSticker" />
    <!-- 更多面板 -->
    <MorePanel 
      v-if="localActivePanel === 'more'" 
      @trigger-image-upload="$emit('trigger-image')"
      @start-video-call="$emit('trigger-video')"
      @send-location="$emit('trigger-location')"
      @send-transfer="$emit('trigger-transfer')"
    />
  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// 组件
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSingleStore } from '@/stores/chat/singleStore'
import StickersPanel from './StickersPanel.vue'
import MorePanel from './MorePanel.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

const { t } = useI18n()
const singleStore = useSingleStore()

// ================================================================================================
// 属性、事件和插槽
// ================================================================================================
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  activePanel: {
    type: String,
    default: null
  },
  quotingMessage: {
    type: Object,
    default: null
  },
  charId: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:activePanel',
  'cancel-quote',
  'send-message',
  'send-sticker',
  'trigger-voice',
  'trigger-image',
  'trigger-video',
  'trigger-location',
  'trigger-transfer'
])

// 内部状态
const localActivePanel = ref(props.activePanel)

// 监听 props 变化同步到内部状态
watch(() => props.activePanel, (newVal) => {
  localActivePanel.value = newVal
})

// 监听内部状态变化通知父组件
watch(localActivePanel, (newVal) => {
  emit('update:activePanel', newVal)
})

// 计算引用的发送者名称
const quoteSenderName = computed(() => {
  if (!props.quotingMessage) return ''
  if (props.quotingMessage.sender === 'user') {
    // 这里可以根据需求获取用户的昵称，暂时用 "我"
    return t('chat.self')
  } else {
    const character = singleStore.getCharacter(props.charId)
    // 优先使用备注名，如果没有则使用角色名
    return character?.nickname || character?.name || t('chat.other')
  }
})

// ================================================================================================
// 方法
// ================================================================================================
/**
 * @description 切换功能面板（表情包、更多）
 * @param {string} panel - 面板名称
 */
const togglePanel = (panel) => {
  if (localActivePanel.value === panel) {
    localActivePanel.value = null
  } else {
    localActivePanel.value = panel
  }
}

/**
 * @description 处理发送消息事件
 */
const handleSendMessage = () => {
  if (!props.modelValue.trim()) return
  emit('send-message')
}

/**
 * @description 处理发送表情包事件
 * @param {object} sticker - 表情包对象
 */
const handleSendSticker = (sticker) => {
  emit('send-sticker', sticker)
  // 发送表情包后关闭面板
  localActivePanel.value = null
}
</script>

<style scoped>
/* --- 根容器 --- */
.chat-footer {
    background: #F7F7F7;
    border-top: 1px solid rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
    position: relative;
    z-index: 300;
}

/* --- 引用预览 --- */
.quote-preview {
  padding: 10px 25px;
  background-color: #E8E8E8; /* 比顶部栏深一点的灰色 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.quote-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-grow: 1;
}

.quote-sender {
  font-weight: bold;
}

.quote-close {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.quote-close-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #DCDCDC; /* 比引用框颜色再深一点的灰色 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

/* --- 输入行 --- */
.chat-input-row {
    padding: 8px 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
}

.chat-input-wrapper {
    flex: 1; 
    display: flex; 
    align-items: center; 
    background: white;
    border-radius: 6px; 
    min-height: 36px;
}

.chat-input {
    flex: 1;
    padding: 8px 10px;
    border: none;
    background: transparent;
    font-size: 16px;
    outline: none;
    resize: none; /* 隐藏右下角的大小调整手柄 */
    overflow-y: auto; /* 允许垂直滚动 */
    line-height: 1.4;
    box-sizing: border-box;
    /* 隐藏滚动条 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE 10+ */
}

.chat-input::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera*/
}

/* --- 按钮 --- */
.chat-tool-btn {
    width: 36px; 
    height: 36px; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    color: #333; 
    cursor: pointer; 
    flex-shrink: 0;
}

.chat-tool-btn :deep(.svg-icon) {
    width: 32px;
    height: 32px;
}

.send-btn-icon {
    width: 36px; 
    height: 36px; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    border-radius: 50%; 
    background: var(--accent-green); 
    cursor: pointer; 
    flex-shrink: 0;
}

/* --- 面板基类 --- */
.chat-panel {
    height: 250px;
    background: #F7F7F7;
    border-top: 1px solid #E5E5E5;
    display: flex;
    flex-direction: column;
}
</style>
