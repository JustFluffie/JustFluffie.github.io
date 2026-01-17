<template>
  <div class="chat-panel" id="morePanel">
    <div class="more-panel-content">
        <!-- 图片 -->
        <div class="more-item" @click="$emit('trigger-image-upload')">
            <div class="more-icon">
                <svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <span class="more-label">{{ t('chat.morePanel.image') }}</span>
        </div>
        <!-- 视频通话 -->
        <div class="more-item" @click="$emit('start-video-call')">
            <div class="more-icon">
                <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            </div>
            <span class="more-label">{{ t('chat.morePanel.videoCall') }}</span>
        </div>
        <!-- 位置 -->
        <div class="more-item" @click="$emit('send-location')">
            <div class="more-icon">
                <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <span class="more-label">{{ t('chat.morePanel.location') }}</span>
        </div>
        <!-- 转账 -->
        <div class="more-item" @click="$emit('send-transfer')">
            <div class="more-icon">
                <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <span class="more-label">{{ t('chat.morePanel.transfer') }}</span>
        </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
// ================================================================================================
// 属性、事件
// ================================================================================================
defineEmits([
  'trigger-image-upload', 
  'start-video-call', 
  'send-location', 
  'send-transfer'
])
</script>

<style scoped>
/* --- 根容器 --- */
.chat-panel {
    height: 250px;
    background: #F7F7F7;
    border-top: 1px solid #E5E5E5;
    display: flex;
    flex-direction: column;
}

/* --- 内容区域 --- */
.more-panel-content {
    padding: 20px; 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 20px;
}

/* --- 项目 --- */
.more-item { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    gap: 8px; 
    cursor: pointer; 
}

.more-icon {
    width: 60px; 
    height: 60px; 
    background: white; 
    border-radius: 16px;
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 28px; 
    border: 1px solid #E5E5E5;
}

.more-label { 
    font-size: 12px; 
    color: #666; 
}
</style>
