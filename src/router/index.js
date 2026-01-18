import { createRouter, createWebHistory } from 'vue-router'
import HomeScreen from '../views/screen/HomeScreen.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeScreen
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
          component: () => import('../views/chat/ChatList.vue') // 暂时复用
        },
        {
          path: 'favorites',
          name: 'chat-favorites',
          component: () => import('../views/chat/ChatList.vue') // 暂时复用
        },
        {
          path: 'profile',
          name: 'chat-profile',
          component: () => import('../views/chat/ChatList.vue') // 暂时复用
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
      component: () => import('../views/preset/Preset.vue')
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
      path: '/memory/:charId',
      name: 'memory-bank',
      component: () => import('../views/chat/single/components/SingleMemoryBank.vue'),
      props: true
    },
  ]
})

export default router
