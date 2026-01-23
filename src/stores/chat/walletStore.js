import { defineStore } from 'pinia'
import { ref } from 'vue'
import LZString from 'lz-string'

export const useWalletStore = defineStore('chat-wallet', () => {
  // 余额，默认为 0.00
  const balance = ref(0.00)
  // 交易记录
  const transactions = ref([])

  // 初始化数据
  const initData = () => {
    const savedData = localStorage.getItem('aiPhoneWalletData')
    if (savedData) {
      try {
        // 尝试解压缩
        let data
        try {
          const decompressed = LZString.decompressFromUTF16(savedData)
          data = decompressed ? JSON.parse(decompressed) : JSON.parse(savedData)
        } catch (e) {
          // 如果解压失败，尝试直接解析（兼容非压缩数据）
          data = JSON.parse(savedData)
        }

        if (data) {
          balance.value = data.balance !== undefined ? data.balance : 0.00
          transactions.value = data.transactions || []
        }
      } catch (e) {
        console.error('Failed to load wallet data', e)
        balance.value = 0.00
        transactions.value = []
      }
    }
  }

  // 保存数据
  const saveData = () => {
    const data = {
      balance: balance.value,
      transactions: transactions.value
    }
    try {
      const jsonString = JSON.stringify(data)
      const compressed = LZString.compressToUTF16(jsonString)
      localStorage.setItem('aiPhoneWalletData', compressed)
    } catch (e) {
      console.error('Failed to save wallet data', e)
    }
  }

  const addTransaction = (type, amount, title) => {
    transactions.value.unshift({
      id: Date.now(),
      type, // 'recharge', 'expense', 'income'
      amount: parseFloat(amount),
      title,
      time: new Date().toISOString()
    })
    
    // 限制只保存最近的 10 条记录
    if (transactions.value.length > 10) {
      transactions.value = transactions.value.slice(0, 10)
    }
    
    saveData()
  }

  // 充值
  const recharge = (amount) => {
    const val = parseFloat(amount)
    if (!isNaN(val) && val > 0) {
      balance.value += val
      addTransaction('recharge', val, '充值')
      return true
    }
    return false
  }

  // 消费（转账支出）
  const consume = (amount, title = '转账支出') => {
    const val = parseFloat(amount)
    if (!isNaN(val) && val > 0) {
      if (balance.value >= val) {
        balance.value -= val
        addTransaction('expense', val, title)
        return true
      }
    }
    return false
  }

  // 收入（接收转账）
  const income = (amount, title = '转账收入') => {
    const val = parseFloat(amount)
    if (!isNaN(val) && val > 0) {
      balance.value += val
      addTransaction('income', val, title)
      return true
    }
    return false
  }

  return {
    balance,
    transactions,
    initData,
    recharge,
    consume,
    income
  }
})
