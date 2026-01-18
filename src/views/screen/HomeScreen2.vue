<template>
  <div class="page page-2">
    <MusicPlayer
      v-model:homeData="localHomeData"
      @show-source-select="showSourceSelect"
      @save-home-data="saveHomeData"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MusicPlayer from './components/MusicPlayer.vue'

// 定义从父组件接收的 props 和 emits
const props = defineProps({
  homeData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:homeData', 'show-source-select', 'save-home-data'])

// 创建一个可写的计算属性来代理 homeData
const localHomeData = computed({
  get: () => props.homeData,
  set: (value) => emit('update:homeData', value)
})

// 转发事件到父组件
const showSourceSelect = (type) => {
  emit('show-source-select', type)
}

const saveHomeData = () => {
  emit('save-home-data')
}
</script>

<style scoped>
.page-2 {
  width: 100%;
  height: 100%;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中 */
  align-items: center;   /* 水平居中 */
  gap: 10px;
}
</style>
