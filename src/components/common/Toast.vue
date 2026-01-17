<template>
  <div class="toast-overlay" :class="{ active: visible }">
    <div class="toast-container">
      <SvgIcon :name="type" class="toast-icon" :class="type" />
      <span class="toast-text">{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
import { watch, onUnmounted } from 'vue';
import SvgIcon from './SvgIcon.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success', // 'success' | 'error' | 'info'
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 1500
  }
});

const emit = defineEmits(['update:visible']);

let timer = null;

const close = () => {
  emit('update:visible', false);
};

const startTimer = () => {
  if (props.visible && props.duration > 0) {
    clearTimer();
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
};

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    startTimer();
  } else {
    clearTimer();
  }
});

onUnmounted(() => {
  clearTimer();
});
</script>

<style scoped>
/* 样式已抽离至 src/assets/css/components/Toast.css */
</style>
