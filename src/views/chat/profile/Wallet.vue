<template>
  <div class="wallet-page">
    <!-- 顶部栏 -->
    <div class="app-header" style="border-bottom: none;">
      <div class="back-btn" @click="router.back()">
        <svg-icon name="back-btn" />
      </div>
      <div class="title"></div>
      <div class="action-btn"></div>
    </div>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#FA9D3B">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-6-11c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      </div>
      <div class="balance-label">我的零钱</div>
      <div class="balance-amount">¥{{ walletStore.balance.toFixed(2) }}</div>
      
      <button class="recharge-btn" @click="showRechargeModal = true">充值</button>
    </div>

    <!-- 充值弹窗 -->
    <MoneyPacket
      v-model:visible="showRechargeModal"
      mode="recharge"
      @confirm="handleRecharge"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@/stores/chat/walletStore'
import { useThemeStore } from '@/stores/themeStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import MoneyPacket from '../components/MoneyPacket.vue'

const router = useRouter()
const walletStore = useWalletStore()
const themeStore = useThemeStore()

const showRechargeModal = ref(false)

const handleRecharge = ({ amount }) => {
  if (walletStore.recharge(amount)) {
    themeStore.showToast(`充值成功 ¥${amount}`, 'success')
  } else {
    themeStore.showToast('充值失败', 'error')
  }
}
</script>

<style scoped>
.wallet-page {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.balance-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
}

.balance-icon {
  margin-bottom: 20px;
}

.balance-label {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
}

.balance-amount {
  font-size: 40px;
  font-weight: 600;
  color: #000;
  margin-bottom: 40px;
}

.recharge-btn {
  width: 160px;
  height: 44px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.recharge-btn:active {
  background: #06AD56;
}
</style>
