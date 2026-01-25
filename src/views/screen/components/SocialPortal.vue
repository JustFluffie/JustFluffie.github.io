<script setup>
import { defineEmits } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const emit = defineEmits(['close']);
const router = useRouter();

const themeStore = useThemeStore();
const { appIcons } = storeToRefs(themeStore);

const socialApps = [
  { id: 'xiaohongshu', name: '小红书' },
  { id: 'weibo', name: '微博' },
  { id: 'anonymous', name: '豆瓣', route: '/douban' }
];

const handleAppClick = (app) => {
  if (app.route) {
    router.push(app.route);
    close();
  }
};

const close = () => {
  emit('close');
};
</script>

<template>
  <div class="social-portal-overlay" @click.self="close">
    <div class="social-portal">
      <div class="social-app-grid">
        <div v-for="app in socialApps" :key="app.id" class="social-app-icon" @click="handleAppClick(app)">
          <div class="icon">
            <img v-if="appIcons[app.id]" :src="appIcons[app.id]" class="custom-app-icon" :alt="app.name" />
          </div>
          <span class="label">{{ app.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.social-portal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.social-portal {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 20px;
  width: 85%;
  max-width: 320px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.social-app-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.social-app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.social-app-icon .icon {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-white);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.icon:has(img.custom-app-icon) {
    background: transparent;
}

.custom-app-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
}

.social-app-icon .label {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}
</style>
