<template>
  <div class="check-phone-dock">
    <!-- 对方的消息（上行） -->
    <div class="message-row other-message">
      <div 
        class="avatar"
        :style="getAvatarStyle('other')"
        @click="handleAvatarClick('other')"
      >
        <div v-if="!dockData.avatars.other" class="upload-hint">
          点击上传
        </div>
      </div>
      <div 
        ref="bubbleOtherRef"
        class="bubble bubble-other" 
        @click.stop
        contenteditable="true"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd($event, 'other')"
        @input="handleInput($event, 'other')"
        @blur="handleContentBlur($event, 'other')"
        :data-placeholder="messages.other ? '' : '点击输入文字'"
      ></div>
    </div>

    <!-- 我方的消息（下行） -->
    <div class="message-row my-message">
      <div 
        ref="bubbleMineRef"
        class="bubble bubble-mine" 
        @click.stop
        contenteditable="true"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd($event, 'mine')"
        @input="handleInput($event, 'mine')"
        @blur="handleContentBlur($event, 'mine')"
        :data-placeholder="messages.mine ? '' : '点击输入文字'"
      ></div>
      <div 
        class="avatar"
        :style="getAvatarStyle('mine')"
        @click="handleAvatarClick('mine')"
      >
        <div v-if="!dockData.avatars.mine" class="upload-hint">
          点击上传
        </div>
      </div>
    </div>

    <!-- 图片上传弹窗 -->
    <ImageUploadModal
      v-model:visible="showUploadModal"
      :type="'basic'"
      :biz-type="currentUploadType"
      @upload-complete="handleUploadComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

// Props & Emits
const props = defineProps({
  dockData: {
    type: Object,
    default: () => ({
      avatars: {
        other: '',
        mine: ''
      },
      messages: {
        other: '',
        mine: ''
      }
    })
  }
})

const emit = defineEmits(['update:dockData'])

// 状态管理
const showUploadModal = ref(false)
const currentUploadType = ref('avatar-other')
const messages = ref({
  other: props.dockData.messages?.other || '',
  mine: props.dockData.messages?.mine || ''
})
const isComposing = ref(false) // 输入法组合状态标志
const bubbleOtherRef = ref(null)
const bubbleMineRef = ref(null)

// 监听 messages 变化，同步到 DOM
watch(() => messages.value.other, (newVal) => {
  if (bubbleOtherRef.value && bubbleOtherRef.value.textContent !== newVal) {
    bubbleOtherRef.value.textContent = newVal
  }
}, { immediate: true })

watch(() => messages.value.mine, (newVal) => {
  if (bubbleMineRef.value && bubbleMineRef.value.textContent !== newVal) {
    bubbleMineRef.value.textContent = newVal
  }
}, { immediate: true })

// 处理输入法组合事件
const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = (event, type) => {
  isComposing.value = false
  // 组合结束时更新数据
  messages.value[type] = event.target.textContent
}

// 处理 contenteditable 输入
const handleInput = (event, type) => {
  // 只在非组合状态下更新数据，避免拼音字母被识别
  if (!isComposing.value) {
    messages.value[type] = event.target.textContent
  }
}

const handleContentBlur = (event, type) => {
  messages.value[type] = event.target.textContent
  handleMessageBlur(type)
}

// 样式计算
const getAvatarStyle = (type) => {
  const avatar = props.dockData.avatars?.[type]
  if (avatar) {
    return {
      backgroundImage: `url('${avatar}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: 'transparent'
    }
  }
  return { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  }
}

// 事件处理
const handleAvatarClick = (type) => {
  currentUploadType.value = `avatar-${type}`
  showUploadModal.value = true
}

const handleUploadComplete = (image) => {
  const newData = { 
    ...props.dockData,
    avatars: { ...props.dockData.avatars }
  }
  
  if (currentUploadType.value === 'avatar-other') {
    newData.avatars.other = image.content
  } else if (currentUploadType.value === 'avatar-mine') {
    newData.avatars.mine = image.content
  }
  
  emit('update:dockData', newData)
}

const handleMessageBlur = (type) => {
  const newData = { 
    ...props.dockData,
    messages: { ...messages.value }
  }
  emit('update:dockData', newData)
}
</script>

<style scoped>
.check-phone-dock {
  position: absolute;
  bottom: max(15px, env(safe-area-inset-bottom) + 25px);
  left: 50%;
  transform: translateX(-50%);
  min-height: 6.875em;
  width: calc(100% - 2.5em);
  max-width: 21.875em;
  padding: 0.75em 1.875em;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(1.25em) saturate(150%);
  -webkit-backdrop-filter: blur(1.25em) saturate(150%);
  border-radius: 3em;
  box-shadow: 
    0 0.25em 0.375em rgba(0, 0, 0, 0.05),
    0 0.625em 1.875em rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5em;
  z-index: 500;
  font-size: 16px; /* 基准字体大小，调整这个值可以整体缩放 */
}

/* 消息行容器 */
.message-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  justify-content: center;
}

/* 对方消息靠左 */
.other-message {
  justify-content: flex-start;
}

/* 我方消息靠右 */
.my-message {
  justify-content: flex-end;
}

/* 头像样式 */
.avatar {
  width: 2.5em;
  height: 2.5em;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0.125em 0.375em rgba(0, 0, 0, 0.1);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 对话气泡基础样式 - 纯净玻璃气泡 */
.bubble {
  position: relative;
  display: inline-block;
  min-width: 3em;
  max-width: 15em;
  padding: 0.5em 0.875em;
  border-radius: 1.125em;
  font-size: 0.7em;
  line-height: 1.5;
  word-wrap: break-word;
  backdrop-filter: blur(1.5625em) saturate(200%);
  -webkit-backdrop-filter: blur(1.5625em) saturate(200%);
  border: 0.09375em solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 0.5em 2em rgba(31, 38, 135, 0.15),
    inset 0 0.125em 0.25em rgba(255, 255, 255, 0.7),
    inset 0 -0.125em 0.25em rgba(255, 255, 255, 0.3),
    0 0 0 0.0625em rgba(255, 255, 255, 0.2);
  cursor: text;
  outline: none;
  white-space: pre-wrap;
}

/* contenteditable 占位符 */
.bubble:empty:before {
  content: attr(data-placeholder);
  color: rgba(26, 26, 46, 0.5);
  font-weight: 400;
  pointer-events: none;
}

.bubble:focus {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.35) 50%,
    rgba(255, 255, 255, 0.25) 100%
  );
}

/* 对方的气泡（左侧） - 透明到透明白渐变 */
.bubble-other {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.15) 100%
  );
  color: #1a1a2e;
  text-shadow: 0 0.0625em 0.1875em rgba(255, 255, 255, 0.9);
}

/* 我方的气泡（右侧） - 透明到透明白渐变（稍微更亮） */
.bubble-mine {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.2) 100%
  );
  color: #1a1a2e;
  text-shadow: 0 0.0625em 0.1875em rgba(255, 255, 255, 0.9);
}

.bubble span {
  display: block;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

/* 头像上传提示 */
.avatar {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.avatar:hover {
  transform: scale(1.05);
}

.upload-hint {
  color: #999;
  font-size: 0.5em;
  pointer-events: none;
  text-align: center;
  line-height: 1.2;
}

</style>
