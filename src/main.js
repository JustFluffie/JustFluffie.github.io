import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useThemeStore } from '@/stores/themeStore'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

import SvgIcon from '@/components/common/SvgIcon.vue'
import AppLayout from '@/components/common/AppLayout.vue'
import Modal from '@/components/common/Modal.vue'
import Toast from '@/components/common/Toast.vue'

import './assets/css/global.css'
import './assets/css/GlobalBase.css'
import './assets/css/components/Button.css'
import './assets/css/components/Input.css'
import './assets/css/components/Modal.css'
import './assets/css/components/Toast.css'

const app = createApp(App)

app.component('svg-icon', SvgIcon)
app.component('AppLayout', AppLayout)
app.component('Modal', Modal)
app.component('Toast', Toast)
const pinia = createPinia()
app.use(pinia)

// 在挂载应用之前初始化 stores
const chatStore = useChatStore()
chatStore.initData()

const themeStore = useThemeStore()
// themeStore.initTheme() // 将在 App.vue 中初始化

app.use(router)
app.use(i18n)

// 延迟挂载以展示首屏加载动画 (2秒)
setTimeout(() => {
  app.mount('#app')
}, 1500)
