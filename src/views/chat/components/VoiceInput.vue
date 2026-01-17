<template>
  <Modal v-model:visible="isVisible" title="发送语音">
    <input type="text" class="base-input" v-model="voiceInputText" placeholder="输入语音内容...">
    <template #footer>
      <button class="modal-btn cancel" @click="isVisible = false">取消</button>
      <button class="modal-btn confirm" @click="handleConfirm">发送</button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const isVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const voiceInputText = ref('')

// 每次打开弹窗时清空输入
watch(() => props.visible, (newVal) => {
  if (newVal) {
    voiceInputText.value = ''
  }
})

const handleConfirm = () => {
  const content = voiceInputText.value.trim()
  emit('confirm', content)
  isVisible.value = false
}
</script>
