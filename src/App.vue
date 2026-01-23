<script setup>
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import StatusBar from '@/components/common/StatusBar.vue' // 引入新的状态栏组件
import VideoChat from './views/chat/single/components/SingleVideoChat.vue'
import Modal from '@/components/common/Modal.vue'
import Loading from '@/components/common/Loading.vue'
import GlobalPreviewer from '@/components/common/GlobalPreviewer.vue'
import NotificationBanner from '@/components/common/NotificationBanner.vue'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import HomeScreen from '@/views/screen/HomeScreen.vue'
import { useBatteryStore } from '@/stores/batteryStore' // 引入新的 battery store
import { useApiStore } from '@/stores/apiStore' // 引入 api store
import { useBackgroundService } from '@/composables/useBackgroundService'
import { useProactiveNotifier } from '@/composables/useProactiveNotifier' // 引入主动通知服务
import { useNotificationStore } from '@/stores/notificationStore'
import DebugConsole from '@/components/common/DebugConsole.vue' // 引入调试控制台

const router = useRouter()

// 调试模式相关
const isDebugEnabled = ref(false);
const isConsoleVisible = ref(true);
let debugTapCount = 0;
let debugTapTimer = null;

const handleDebugTrigger = () => {
  debugTapCount++;
  clearTimeout(debugTapTimer);
  debugTapTimer = setTimeout(() => {
    debugTapCount = 0;
  }, 1500); // 1.5秒内无新点击则重置计数器

  if (debugTapCount >= 7) { // 连续点击7次
    clearTimeout(debugTapTimer);
    debugTapCount = 0;
    const currentState = localStorage.getItem('debug-mode') === 'true';
    if (currentState) {
      if (!isConsoleVisible.value) {
        isConsoleVisible.value = true;
        return;
      }
      localStorage.removeItem('debug-mode');
      alert('调试模式已禁用。应用即将刷新。');
      window.location.reload();
    } else {
      localStorage.setItem('debug-mode', 'true');
      alert('调试模式已启用。应用即将刷新。');
      window.location.reload();
    }
  }
};

const singleStore = useSingleStore()
const themeStore = useThemeStore()
const batteryStore = useBatteryStore() // 初始化 battery store
const apiStore = useApiStore() // 初始化 api store
const notificationStore = useNotificationStore()
const { t } = useI18n() // 初始化 i18n
const phoneScreenRef = ref(null) // Create a ref for the boundary element
provide('phoneScreenRef', phoneScreenRef) // Provide the ref to descendant components

const videoCall = computed(() => singleStore.videoCall)

// 启动后台服务
useBackgroundService();
useProactiveNotifier(); // 启动主动通知服务

onMounted(() => {
  // 检查是否启用调试模式
  isDebugEnabled.value = localStorage.getItem('debug-mode') === 'true';

  batteryStore.initialize() // 初始化时间和电池监听
  themeStore.initTheme()
  apiStore.autoConnect() // 自动连接API并获取模型
  notificationStore.requestPermission() // 请求通知权限

  // 全局错误捕获
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.message, event.filename, event.lineno, event.colno, event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // 清理
  onUnmounted(() => {
    document.removeEventListener('touchmove', preventPullToRefresh);
  });

  // PWA下拉刷新
  const preventPullToRefresh = (e) => {
    // 检查是否在可滚动元素内部
    let target = e.target;

    // 检查是否是微小移动（点击抖动）
    if (e.touches.length > 0 && window.startTouchX !== undefined && window.startTouchY !== undefined) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - window.startTouchX);
        const deltaY = Math.abs(touch.clientY - window.startTouchY);
        // 如果移动距离很小，认为是点击，不阻止默认行为
        if (deltaX < 10 && deltaY < 10) {
            return;
        }
    }

    while (target && target !== document.body) {
      if (target.scrollHeight > target.clientHeight) {
        // 如果是在可滚动元素内，并且滚动到了顶部，则阻止默认行为
        if (target.scrollTop === 0 && e.touches[0].clientY > (window.lastTouchY || 0)) {
           // e.preventDefault();
        }
        window.lastTouchY = e.touches[0].clientY;
        return; // 不阻止默认行为，允许滚动
      }
      target = target.parentNode;
    }
    // 如果不在可滚动元素内，或者在不可滚动的元素上，则阻止默认行为
    e.preventDefault();
  };

  document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      window.lastTouchY = e.touches[0].clientY;
      window.startTouchX = e.touches[0].clientX;
      window.startTouchY = e.touches[0].clientY;
    }
  }, { passive: true });
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
      <!-- 新的状态栏组件 (添加调试触发器) -->
      <StatusBar @click="handleDebugTrigger" />

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

    <!-- 全局加载指示器 -->
    <Loading />

    <!-- 调试控制台 -->
    <DebugConsole v-if="isDebugEnabled" v-show="isConsoleVisible" @hide="isConsoleVisible = false" />
  </div>
</template>

<style scoped>
/* 样式已在 global.css 中定义 */
</style>
