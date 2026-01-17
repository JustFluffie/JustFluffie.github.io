<template>
  <Modal v-model:visible="isVisible" title="发送位置">
    <input type="text" class="base-input" v-model="locationName" placeholder="位置名称 (如: 广州塔)">
    <input type="text" class="base-input" v-model="locationDetail" placeholder="详细地址 (可选)" style="margin-top: 10px;">
    <template #footer>
      <button class="modal-btn cancel" @click.stop="isVisible = false">取消</button>
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

const locationName = ref('')
const locationDetail = ref('')

// 每次打开弹窗时清空输入
watch(() => props.visible, (newVal) => {
  if (newVal) {
    locationName.value = ''
    locationDetail.value = ''
  }
})

const handleConfirm = () => {
  const name = locationName.value.trim()
  const detail = locationDetail.value.trim()
  
  if (name) {
    emit('confirm', { name, detail })
    isVisible.value = false
  }
}
</script>
