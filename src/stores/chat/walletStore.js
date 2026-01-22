import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWalletStore = defineStore('chat-wallet', () => {
  // 余额，默认为 0.00
  const balance = ref(0.00)

  // 充值
  const recharge = (amount) => {
    const val = parseFloat(amount)
    if (!isNaN(val) && val > 0) {
      balance.value += val
      return true
    }
    return false
  }

  // 消费（转账支出）
  const consume = (amount) => {
    const val = parseFloat(amount)
    if (!isNaN(val) && val > 0) {
      if (balance.value >= val) {
        balance.value -= val
        return true
      }
    }
    return false
  }

  // 收入（接收转账）
  const income = (amount) => {
    const val = parseFloat(amount)
    if (!isNaN(val) && val > 0) {
      balance.value += val
      return true
    }
    return false
  }

  return {
    balance,
    recharge,
    consume,
    income
  }
}, {
  persist: true // 需要持久化
})
