<template>
  <Teleport :to="teleportTo" :disabled="!appendToBody || !mounted">
    <div 
      v-if="mounted"
      class="modal-overlay" 
      :class="[{ active: visible }, maskClass]" 
      :style="teleportTo !== 'body' || !appendToBody ? { position: 'absolute' } : {}"
      v-bind="$attrs"
      @click.self="handleOverlayClick"
    >
      <div class="modal-container" :class="containerClass">
        <!-- 标题区域 -->
        <div class="modal-header" v-if="showHeader && (title || $slots.header)">
          <slot name="header">
            <h3>{{ title }}</h3>
          </slot>
        </div>

        <!-- 内容区域 -->
        <div class="modal-body">
          <slot></slot>
        </div>

        <!-- 底部按钮区域 -->
        <div class="modal-footer" v-if="showFooter && $slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  // 显隐控制
  visible: {
    type: Boolean,
    default: false
  },
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 自定义遮罩类名
  maskClass: {
    type: String,
    default: ''
  },
  // 自定义容器类名
  containerClass: {
    type: String,
    default: ''
  },
  // 是否显示标题
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: true
  },
  // 是否挂载到 body
  appendToBody: {
    type: Boolean,
    default: true
  },
  // Teleport 目标
  teleportTo: {
    type: String,
    default: 'body'
  }
});

const emit = defineEmits(['update:visible']);

const handleOverlayClick = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
/* 
 * Modal.vue 仅保留 scoped 差异化样式
 * 通用样式已抽离至 src/assets/css/components/Modal.css
 */
</style>
