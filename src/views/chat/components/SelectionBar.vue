<template>
    <div class="chat-action-row">
        <!-- 收藏 -->
        <div class="action-btn" @click="$emit('action', 'favorite')">
            <div class="action-btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <span>{{ t('favorite') }}</span>
        </div>
        <!-- 转发 -->
        <div class="action-btn" @click="$emit('action', 'forward')">
            <div class="action-btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8L22 12L18 16"></path><path d="M2 12H22"></path></svg>
            </div>
            <span>{{ t('forward') }}</span>
        </div>
        <!-- 删除 -->
        <div class="action-btn" @click="$emit('action', 'delete')">
            <div class="action-btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <span>{{ t('delete') }}</span>
        </div>
        <!-- 完成 -->
        <div class="action-btn" @click="$emit('cancel')">
            <div class="action-btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <span>{{ t('done') }}</span>
        </div>
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
// ================================================================================================
// 属性、事件
// ================================================================================================
defineEmits(['action', 'cancel'])
</script>

<style scoped>
/* --- 根容器 --- */
.chat-action-row {
    height: 56px; 
    display: flex; 
    align-items: center; 
    justify-content: space-around; 
    background: #F7F7F7;
}

/* --- 按钮 --- */
.action-btn {
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    gap: 2px;
    color: #333; 
    font-size: 10px; 
    cursor: pointer; 
    padding: 5px 15px;
}

.action-btn-icon {
    width: 24px; 
    height: 24px; 
    background: transparent; 
    border-radius: 6px;
    display: flex; 
    align-items: center; 
    justify-content: center;
}

.action-btn-icon svg { 
    width: 16px; 
    height: 16px; 
    stroke: #333; 
    stroke-width: 1.5; 
}
</style>
