<template>
  <Teleport v-if="mounted && teleportReady" to="#phone-screen-container">
    <Transition name="slide-up">
      <div class="transfer-modal" v-if="visible">
        <!-- 顶部栏 -->
        <div class="app-header transfer-header">
          <div class="back-btn" @click="handleClose">
            <svg-icon name="back-btn" />
          </div>
          <div class="title">{{ mode === 'recharge' ? '充值' : '' }}</div>
          <div class="action-btn"></div>
        </div>

        <!-- 转账目标信息区域 (仅转账模式显示) -->
        <div class="target-section" v-if="mode === 'transfer'">
          <div class="target-info">
            <div class="target-text">
              <div class="transfer-to">转账给 {{ targetName }}</div>
            </div>
          </div>
          <img :src="targetAvatar" class="target-avatar" v-if="targetAvatar">
          <div class="target-avatar-placeholder" v-else>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#999"/>
            </svg>
          </div>
        </div>
        <!-- 充值模式下的占位，保持布局一致性 -->
        <div class="target-section" v-else style="visibility: hidden;">
          <div class="target-info"><div class="target-text"><div class="transfer-to">充值</div></div></div>
        </div>

        <!-- 转账金额卡片 -->
        <div class="amount-card">
          <div class="amount-label">{{ mode === 'recharge' ? '充值金额' : '转账金额' }}</div>
          <div class="amount-input-wrapper">
            <span class="currency-symbol">¥</span>
            <div class="amount-display" @click="focusInput">
              {{ displayAmount || '' }}
              <span class="cursor" v-if="isFocused">|</span>
            </div>
          </div>
          <div class="amount-divider"></div>
          
          <!-- 备注区域 (仅转账模式显示) -->
          <div class="note-section" v-if="mode === 'transfer'">
            <div class="note-label-row" v-if="!isNoteEditing" @click="startNoteEdit">
              <span class="note-text" :class="{ 'has-note': note }">
                {{ note || '添加转账说明' }}
              </span>
            </div>
            <div class="note-input-row" v-else>
              <input 
                type="text" 
                v-model="note" 
                class="base-input note-input" 
                placeholder="添加转账说明"
                maxlength="20"
                ref="noteInputRef"
                @blur="endNoteEdit"
                @keyup.enter="endNoteEdit"
              >
            </div>
          </div>
        </div>

        <!-- 数字键盘 -->
        <div class="number-keyboard">
          <div class="keyboard-grid">
            <!-- 第一行 -->
            <div class="key-btn" @click="inputNumber('1')">1</div>
            <div class="key-btn" @click="inputNumber('2')">2</div>
            <div class="key-btn" @click="inputNumber('3')">3</div>
            <div class="key-btn delete-btn" @click="deleteNumber">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" fill="#333"/>
              </svg>
            </div>
            <!-- 第二行 -->
            <div class="key-btn" @click="inputNumber('4')">4</div>
            <div class="key-btn" @click="inputNumber('5')">5</div>
            <div class="key-btn" @click="inputNumber('6')">6</div>
            <div 
              class="key-btn transfer-key" 
              :class="{ 'disabled': !isValidAmount }"
              @click="handleTransfer"
            >
              {{ mode === 'recharge' ? '确定' : '转账' }}
            </div>
            <!-- 第三行 -->
            <div class="key-btn" @click="inputNumber('7')">7</div>
            <div class="key-btn" @click="inputNumber('8')">8</div>
            <div class="key-btn" @click="inputNumber('9')">9</div>
            <!-- 第四行 -->
            <div class="key-btn zero-btn" @click="inputNumber('0')">0</div>
            <div class="key-btn" @click="inputNumber('.')">.</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

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
  },
  mode: {
    type: String,
    default: 'transfer', // 'transfer' | 'recharge'
    validator: (value) => ['transfer', 'recharge'].includes(value)
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const amount = ref('')
const note = ref('')
const mounted = ref(false)
const teleportTarget = ref(null)
const isFocused = ref(true)
const isNoteEditing = ref(false)
const noteInputRef = ref(null)

// 计算属性：检查 Teleport 目标是否准备好
const teleportReady = computed(() => {
  return !!teleportTarget.value
})

// 显示金额（格式化）
const displayAmount = computed(() => {
  return amount.value
})

// 检查 Teleport 目标是否存在
const checkTeleportTarget = () => {
  teleportTarget.value = document.querySelector('#phone-screen-container')
  return !!teleportTarget.value
}

onMounted(() => {
  nextTick(() => {
    if (checkTeleportTarget()) {
      mounted.value = true
    }
  })
})

onBeforeUnmount(() => {
  mounted.value = false
})

const isValidAmount = computed(() => {
  const val = parseFloat(amount.value)
  return !isNaN(val) && val > 0
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    amount.value = ''
    note.value = ''
    isFocused.value = true
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const focusInput = () => {
  isFocused.value = true
}

const startNoteEdit = () => {
  isNoteEditing.value = true
  nextTick(() => {
    if (noteInputRef.value) {
      noteInputRef.value.focus()
    }
  })
}

const endNoteEdit = () => {
  isNoteEditing.value = false
}

// 数字键盘输入
const inputNumber = (num) => {
  // 限制小数点
  if (num === '.') {
    if (amount.value.includes('.')) return
    if (amount.value === '') {
      amount.value = '0.'
      return
    }
  }
  
  // 限制小数位数为2位
  if (amount.value.includes('.')) {
    const parts = amount.value.split('.')
    if (parts[1] && parts[1].length >= 2) return
  }
  
  // 限制整数部分长度（最多8位）
  if (!amount.value.includes('.') && num !== '.') {
    if (amount.value.length >= 8) return
  }
  
  // 防止多个前导零
  if (amount.value === '0' && num !== '.') {
    amount.value = num
    return
  }
  
  amount.value += num
}

// 删除数字
const deleteNumber = () => {
  if (amount.value.length > 0) {
    amount.value = amount.value.slice(0, -1)
  }
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0;
  box-sizing: border-box;
}

/* 过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
}

/* 顶部栏 - 复用 app-header 样式，仅覆盖背景色和边框 */
.transfer-header {
  background: #f5f5f5 !important;
  border-bottom: none !important;
}

/* 转账目标区域 */
.target-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px 25px;
  background: #f5f5f5;
}

.target-info {
  flex: 1;
}

.transfer-to {
  font-size: 17px;
  color: #000;
  font-weight: 500;
}

.target-avatar {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
  margin-left: 15px;
}

.target-avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 15px;
}

/* 金额卡片 */
.amount-card {
  background: white;
  border-radius: 12px 12px 0 0;
  margin: 0;
  padding: 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.amount-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 20px;
}

.amount-input-wrapper {
  display: flex;
  align-items: flex-end;
  min-height: 50px;
}

.currency-symbol {
  font-size: 45px;
  font-weight: 500;
  color: #000;
  margin-right: 5px;
  line-height: 1;
}

.amount-display {
  flex: 1;
  font-size: 42px;
  font-weight: 500;
  color: #000;
  line-height: 1;
  min-height: 42px;
  display: flex;
  align-items: flex-end;
}

.cursor {
  animation: blink 1s infinite;
  color: #07C160;
  font-weight: normal;
  margin-left: 6px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.amount-divider {
  height: 1px;
  background: #E5E5E5;
  margin: 26px 0 20px;
}

.note-section {
  padding: 5px 0;
}

.note-label-row {
  cursor: pointer;
}

.note-text {
  font-size: 14px;
  color: #576B95;
}

.note-text.has-note {
  color: #333;
}

.note-input-row {
  margin: 0 -5px;
}

.note-input {
  font-size: 14px;
  padding: 8px 10px;
}

/* 数字键盘 */
.number-keyboard {
  background: #f5f5f5;
  padding: 10px;
  padding-bottom: 30px;
  flex-shrink: 0;
}

.keyboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 52px);
  gap: 6px;
}

.key-btn {
  background: white;
  border: none;
  border-radius: 5px;
  font-size: 24px;
  font-weight: 400;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
  box-shadow: 0 1px 0 rgba(0,0,0,0.1);
}

.key-btn:active {
  background: #f5f5f5;
}

.delete-btn {
  background: white;
}

.delete-btn:active {
  background: #f5f5f5;
}

.transfer-key {
  grid-row: 2 / 5;
  grid-column: 4;
  background: #07C160;
  color: white;
  font-size: 17px;
  font-weight: 500;
  box-shadow: none;
}

.transfer-key:active {
  background: #06AD56;
}

.transfer-key.disabled {
  background: #A5E6C2;
}

.zero-btn {
  grid-column: 1 / 3;
}
</style>
