<template>
  <div class="transfer-modal" v-if="visible">
    <div class="transfer-header">
      <div class="back-btn" @click="handleClose">
        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"></path></svg>
      </div>
      <div class="title">转账</div>
      <div class="placeholder"></div>
    </div>

    <div class="transfer-content">
      <div class="target-info">
        <img :src="targetAvatar" class="target-avatar" v-if="targetAvatar">
        <div class="target-name">{{ targetName }}</div>
      </div>

      <div class="amount-card">
        <div class="amount-label">转账金额</div>
        <div class="amount-input-wrapper">
          <span class="currency-symbol">¥</span>
          <input 
            type="number" 
            v-model="amount" 
            class="amount-input" 
            placeholder="0.00"
            ref="amountInput"
          >
        </div>
        
        <div class="note-section">
          <input 
            type="text" 
            v-model="note" 
            class="note-input" 
            placeholder="添加转账说明"
            maxlength="20"
          >
        </div>

        <div class="action-section">
          <button 
            class="transfer-btn" 
            :disabled="!isValidAmount"
            @click="handleTransfer"
          >
            转账
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  targetName: {
    type: String,
    default: ''
  },
  targetAvatar: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const amount = ref('')
const note = ref('')
const amountInput = ref(null)

const isValidAmount = computed(() => {
  const val = parseFloat(amount.value)
  return !isNaN(val) && val > 0
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    amount.value = ''
    note.value = ''
    nextTick(() => {
      if (amountInput.value) {
        amountInput.value.focus()
      }
    })
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleTransfer = () => {
  if (!isValidAmount.value) return
  
  emit('confirm', {
    amount: parseFloat(amount.value).toFixed(2),
    note: note.value
  })
  handleClose()
}
</script>

<style scoped>
.transfer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #EDEDED;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.transfer-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: #EDEDED;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.title {
  font-size: 17px;
  font-weight: 500;
}

.placeholder {
  width: 40px;
}

.transfer-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.target-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.target-avatar {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  margin-bottom: 10px;
  object-fit: cover;
}

.target-name {
  font-size: 16px;
  color: #333;
}

.amount-card {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.amount-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 15px;
}

.amount-input-wrapper {
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid #E5E5E5;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.currency-symbol {
  font-size: 30px;
  font-weight: bold;
  margin-right: 10px;
  line-height: 1;
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 40px;
  font-weight: bold;
  line-height: 1;
  padding: 0;
  background: transparent;
}

.amount-input::placeholder {
  color: #CCCCCC;
}

.note-section {
  margin-bottom: 30px;
}

.note-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
  padding: 0;
}

.note-input::placeholder {
  color: #999;
}

.transfer-btn {
  width: 100%;
  height: 44px;
  background-color: #07C160;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.transfer-btn:disabled {
  background-color: #A5E6C2;
  cursor: not-allowed;
}

.transfer-btn:active:not(:disabled) {
  opacity: 0.9;
}
</style>
