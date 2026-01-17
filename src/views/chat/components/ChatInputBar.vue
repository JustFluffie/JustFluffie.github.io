<template>
  <div class="chat-footer">
    <!-- 引用消息预览 -->
    <div v-if="quotingMessage" class="quote-preview">
      <div class="quote-content">
        <div class="quote-sender">{{ quotingMessage.sender === 'user' ? t('chat.self') : t('chat.other') }}:</div>
        <div class="quote-text">{{ quotingMessage.content }}</div>
      </div>
      <div class="quote-close" @click="$emit('cancel-quote')">&times;</div>
    </div>

    <!-- 输入行 -->
    <div class="chat-input-row">
      <!-- 语音按钮 -->
      <div class="chat-tool-btn" @click="$emit('trigger-voice')">
        <SvgIcon name="voice-circle" class="svg-icon" />
      </div>
      <!-- 输入框 -->
      <div class="chat-input-wrapper">
        <input 
          type="text" 
          class="chat-input" 
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @keypress.enter="handleSendMessage"
          id="messageInput"
        >
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
        <svg class="svg-icon" viewBox="0 0 24 24" style="stroke: white; width: 21px; height: 21px; position: relative; top: 1px; left: -1px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
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
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StickersPanel from './StickersPanel.vue'
import MorePanel from './MorePanel.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

const { t } = useI18n()

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
  padding: 8px 12px;
  background-color: #eaeaea;
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
}

.quote-sender {
  font-weight: bold;
  margin-bottom: 2px;
}

.quote-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote-close {
  cursor: pointer;
  font-size: 20px;
  padding: 0 5px;
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
}

/* --- 按钮 --- */
.chat-tool-btn {
    width: 30px; 
    height: 30px; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    color: #333; 
    cursor: pointer; 
    flex-shrink: 0;
}

.send-btn-icon {
    width: 30px; 
    height: 30px; 
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
