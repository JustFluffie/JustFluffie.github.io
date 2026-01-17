<script setup>
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import StatusBar from '@/components/common/StatusBar.vue' // 引入新的状态栏组件
import VideoChat from './views/chat/single/components/SingleVideoChat.vue'
import Modal from '@/components/common/Modal.vue'
import GlobalPreviewer from '@/components/common/GlobalPreviewer.vue'
import NotificationBanner from '@/components/common/NotificationBanner.vue'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import HomeScreen from '@/views/screen/HomeScreen.vue'
import { useBatteryStore } from '@/stores/batteryStore' // 引入新的 battery store
import { useApiStore } from '@/stores/apiStore' // 引入 api store
import { useBackgroundService } from '@/composables/useBackgroundService'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const singleStore = useSingleStore()
const themeStore = useThemeStore()
const batteryStore = useBatteryStore() // 初始化 battery store
const apiStore = useApiStore() // 初始化 api store
const { t } = useI18n() // 初始化 i18n
const phoneScreenRef = ref(null) // Create a ref for the boundary element
provide('phoneScreenRef', phoneScreenRef) // Provide the ref to descendant components
const { requestPermission } = useNotifications()

const videoCall = computed(() => singleStore.videoCall)

// 启动后台服务
useBackgroundService();

onMounted(() => {
  batteryStore.initialize() // 初始化时间和电池监听
  themeStore.initTheme()
  apiStore.autoConnect() // 自动连接API并获取模型
  requestPermission() // 请求通知权限
})

// Global watcher to handle navigation when maximizing video call
watch(() => videoCall.value.isMinimized, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    const charId = videoCall.value.characterId;
    if (charId) {
      router.push(`/chat/room/${charId}`);
    }
  }
});
</script>

<template>
  <div class="phone-frame" :class="{ 'no-frame': !themeStore.showFrame }">
    <div class="phone-screen" ref="phoneScreenRef" id="phone-screen-container">
      <!-- 新的状态栏组件 -->
      <StatusBar />

      <!-- 路由视图 -->
      <router-view v-slot="{ Component, route }">
        <div :class="{ 'app-screen': route.path !== '/', 'active': route.path !== '/' }">
          <component :is="route.path === '/' ? HomeScreen : Component" />
        </div>
      </router-view>

      <!-- 全局视频悬浮窗 -->
      <VideoChat :boundary-ref="phoneScreenRef" />

      <!-- 全局预览组件 -->
      <GlobalPreviewer />

      <!-- 消息通知弹窗 -->
      <NotificationBanner />
    </div>

    <!-- 全局通知弹窗 -->
    <Toast 
      v-model:visible="themeStore.toastShow"
      :type="themeStore.toastType"
      :message="themeStore.toastMessage"
      :duration="themeStore.toastDuration"
    />

    <!-- 全局确认弹窗 -->
    <Modal v-model:visible="themeStore.confirmModal.show" :title="themeStore.confirmModal.title">
      <p style="text-align: center; font-size: 14px;" :style="themeStore.confirmModal.messageStyle">{{ themeStore.confirmModal.message }}</p>
      <template #footer>
        <button class="modal-btn cancel" @click="themeStore.hideConfirm">{{ $t('cancel') }}</button>
        <button class="modal-btn danger" @click="themeStore.handleConfirm">{{ $t(themeStore.confirmModal.confirmText || 'delete') }}</button>
      </template>
    </Modal>

    <!-- 全局输入弹窗 -->
    <Modal v-model:visible="themeStore.inputModal.show" :title="themeStore.inputModal.title">
      <div class="input-group">
        <input type="text" v-model="themeStore.inputModal.value" class="base-input" :placeholder="themeStore.inputModal.placeholder" @keyup.enter="themeStore.handleInputConfirm">
        <button class="modal-btn confirm" @click="themeStore.handleInputConfirm">{{ $t('confirm') }}</button>
        <button v-if="themeStore.inputModal.showUpload" class="modal-btn" @click="themeStore.handleUpload">本地</button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* 样式已在 global.css 中定义 */
</style>
