<template>
  <AppLayout title="豆瓣小组" no-padding>
    <div class="group-list-page">
      <ul class="group-list">
        <!-- 小组1: 校园 -->
        <li class="group-item" @click="goToGroup('同学，我有一个朋友...')">
          <div class="group-avatar">
            <img src="https://i.ibb.co/kgMW0jrx/1-1-1-1.png" alt="Group Avatar">
          </div>
          <div class="group-info">
            <h2 class="group-name">同学，我有一个朋友...</h2>
            <p class="group-description">...想问一下。懂的都懂，你的“朋友”就是我朋友。</p>
            <p class="group-members">1.2M 成员</p>
          </div>
          <div class="more-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </div>
        </li>

        <!-- 小组2: 职场 -->
        <li class="group-item" @click="goToGroup('我今天就要离职！(明天再说)')">
          <div class="group-avatar">
            <img src="https://i.ibb.co/GvJDfFDK/2-1-1.png" alt="Group Avatar">
          </div>
          <div class="group-info">
            <h2 class="group-name">我今天就要离职！(明天再说)</h2>
            <p class="group-description">从甲方槽点到办公室秘闻，专治各种职场内伤。今日摸鱼，明日再议离职。</p>
            <p class="group-members">890k 成员</p>
          </div>
          <div class="more-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </div>
        </li>

        <!-- 小组3: 娱乐八卦 (兔区/天涯风格) -->
        <li class="group-item" @click="goToGroup('野生瓜田种植与品鉴')">
          <div class="group-avatar">
            <img src="https://i.ibb.co/x8srgXRV/1-1.png" alt="Group Avatar">
          </div>
          <div class="group-info">
            <h2 class="group-name">野生瓜田种植与品鉴</h2>
            <p class="group-description">不造谣，不传谣，我们只用放大镜看明星的每一步，这里的瓜保熟。</p>
            <p class="group-members">3.4M 成员</p>
          </div>
          <div class="more-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </div>
        </li>
        
        <!-- 小组4: 情感交流 -->
        <li class="group-item" @click="goToGroup('恋爱细节放大镜小组')">
          <div class="group-avatar">
            <img src="https://i.ibb.co/gZHjgXq7/1-1-1-1.png" alt="Group Avatar">
          </div>
          <div class="group-info">
            <h2 class="group-name">恋爱细节放大镜小组</h2>
            <p class="group-description">一个标点符号都要开会讨论，一个“哦”字就能分析三天。在这里，我们都是爱情里的显微镜学家。</p>
            <p class="group-members">560k 成员</p>
          </div>
          <div class="more-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </div>
        </li>

        <!-- 小组5: NSFW -->
        <li class="group-item" @click="goToGroup('深夜食堂')">
          <div class="group-avatar">
            <img src="https://i.ibb.co/hxZN0XGb/1-2-1-1.png" alt="Group Avatar">
          </div>
          <div class="group-info">
            <h2 class="group-name">深夜食堂</h2>
            <p class="group-description">今晚，你吃了吗？这里是性的游乐场，尊重差异，谢绝说教。</p>
            <p class="group-members">4.2M 成员</p>
          </div>
          <div class="more-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
          </div>
        </li>
      </ul>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/common/AppLayout.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToGroup = (groupName) => {
  router.push({ name: 'group-detail', params: { groupName } });
};
</script>

<style scoped>
.group-list-page {
  background-color: #fff;
  height: 100%;
  overflow-y: auto;
}

.group-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.group-item {
  display: flex;
  align-items: center; /* 改为 center 以帮助垂直对齐 */
  padding: 18px 16px; /* 增加垂直内边距以使布局更宽松 */
  position: relative;
  cursor: pointer;
}

.group-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 92px; /* 16px padding + 60px avatar + 16px margin */
  right: 16px;
  height: 1px;
  background-color: #f0f0f0;
}

.group-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-right: 15px; /* 增加右边距 */
  flex-shrink: 0;
  overflow: hidden;
  background-color: #f0f0f0;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly; /* 使三行文字间距相等 */
  min-width: 0; /* 允许 flex item 收缩 */
  height: 60px; /* 与头像高度一致 */
}

.group-name {
  font-size: 17px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
  font-family: "SimHei", "黑体", sans-serif;
}

.group-description,
.group-members {
  font-size: 13px; /* 缩小字体 */
  color: #8a8a8a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-btn {
  flex-shrink: 0;
  margin-left: 12px;
  color: #cccccc;
  align-self: center;
}
</style>
