import { createRouter, createWebHistory } from 'vue-router'
import HomeScreen from '../views/screen/HomeScreen.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeScreen
    },
      {
        path: '/prompt-presets',
        name: 'PromptPresets',
        component: () => import('@/views/preset/PromptPresets.vue')
      },
    {
      path: '/chat',
      component: () => import('../views/chat/index.vue'),
      children: [
        {
          path: 'list',
          name: 'chat-list',
          component: () => import('../views/chat/ChatList.vue')
        },
        {
          path: 'room/:id',
          name: 'single-chat',
          component: () => import('../views/chat/single/SingleChat.vue'),
          props: route => ({ charId: route.params.id }),
        },
        {
          path: 'room/:id/settings',
          name: 'single-chat-settings',
          component: () => import('../views/chat/single/components/SingleChatSettings.vue'),
          props: true
        },
        {
          path: 'moments',
          name: 'moments',
          component: () => import('../views/chat/moments/Moments.vue')
        },
        {
          path: 'moments/post',
          name: 'moment-post',
          component: () => import('../views/chat/moments/PostMoment.vue')
        },
        {
          path: 'npc',
          name: 'chat-npc',
          component: () => import('../views/chat/npc/NpcManager.vue')
        },
        {
          path: 'favorites/:charId',
          name: 'chat-favorites',
          component: () => import('../views/chat/favorites/Favorites.vue'),
          props: true
        },
        {
          path: 'profile',
          name: 'chat-profile',
          component: () => import('../views/chat/profile/Profile.vue')
        },
        {
          path: 'profile/wallet',
          name: 'profile-wallet',
          component: () => import('../views/chat/profile/Wallet.vue')
        },
        {
          path: 'profile/persona',
          name: 'profile-persona',
          component: () => import('../views/chat/profile/PersonaManager.vue')
        },
        {
          path: '',
          redirect: '/chat/list'
        }
      ]
    },
    {
      path: '/world-book',
      name: 'world-book',
      component: () => import('../views/worldbook/WorldBook.vue')
    },
    {
      path: '/preset',
      name: 'preset',
      component: () => import('../views/preset/PromptPresets.vue')
    },
    {
      path: '/api',
      name: 'api',
      component: () => import('../views/api/API.vue')
    },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('../views/theme/Theme.vue')
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/calendar/Calendar.vue')
    },
    {
      path: '/memory/:charId',
      name: 'memory-bank',
      component: () => import('../views/chat/single/components/SingleMemoryBank.vue'),
      props: true
    },
    {
      path: '/char-phone/:charId',
      name: 'char-phone',
      component: () => import('../views/char-phone/CharPhone.vue'),
      props: true
    },
    {
      path: '/douban',
      name: 'douban',
      component: () => import('../views/douban/DouBanXiaoZu.vue')
    },
    {
      path: '/douban/group/:groupName',
      name: 'group-detail',
      component: () => import('../views/douban/GroupDetail.vue'),
      props: true
    },
    {
      path: '/douban/post/:postId',
      name: 'douban-post-detail',
      component: () => import('../views/douban/DoubanPostDetail.vue'),
      props: true
    },
  ]
})

export default router
