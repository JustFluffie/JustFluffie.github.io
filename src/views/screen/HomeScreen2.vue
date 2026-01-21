<script setup>
import { defineProps, defineEmits } from 'vue'
import WidgetContainer2 from './components/WidgetContainer2.vue'

// 定义 props
const props = defineProps({
  homeData: {
    type: Object,
    required: true
  },
  showFrame: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits(['update:homeData', 'show-source-select', 'save-home-data'])

// 事件处理函数
const handleUpdateHomeData = (newData) => emit('update:homeData', newData)
const handleShowSourceSelect = (type) => emit('show-source-select', type)
const handleSaveHomeData = () => emit('save-home-data')
</script>

<template>
  <div class="home-screen-2">
    <WidgetContainer2
      :homeData="homeData"
      :show-frame="showFrame"
      @update:homeData="handleUpdateHomeData"
      @show-source-select="handleShowSourceSelect"
      @save-home-data="handleSaveHomeData"
    />
  </div>
</template>

<style scoped>
.home-screen-2 {
  width: 100%;
  height: 100%;
}
</style>
