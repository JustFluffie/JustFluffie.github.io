<template>
  <header class="c-phone-app-header">
    <div class="back-btn" @click="handleBack">
      <svg-icon name="back-btn" class="back-icon" />
    </div>
    <h1 class="title">{{ title }}</h1>
    <div class="header-actions">
      <div v-if="showClear" class="action-btn" @click="emit('clear')">
        <svg-icon name="trash" />
      </div>
      <div v-if="showRefresh" class="action-btn" @click="emit('refresh')">
        <svg-icon name="refresh" />
      </div>
      <slot name="action"></slot>
    </div>
  </header>
</template>

<script setup>
import SvgIcon from '@/components/common/SvgIcon.vue';

defineProps({
  title: {
    type: String,
    default: ''
  },
  showClear: {
    type: Boolean,
    default: false
  },
  showRefresh: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['back', 'clear', 'refresh']);

const handleBack = () => {
  emit('back');
};
</script>

<style scoped>
.c-phone-app-header {
  background: var(--app-bg);
  box-shadow: none;
  height: 60px;
  padding: 25px 15px 0px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  flex-shrink: 0;
  color: var(--app-text);
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.title {
  display: block;
  font-size: 16px;
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', sans-serif;
  font-weight: 600;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  margin: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.back-btn {
  opacity: 1;
  pointer-events: auto;
  position: relative;
  z-index: 50;
  cursor: pointer;
}

.header-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.action-btn {
  cursor: pointer;
  color: var(--app-theme);
}

.back-icon {
  width: 22px;
  height: 22px;
  color: var(--app-theme);
}
</style>
