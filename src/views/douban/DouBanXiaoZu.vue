<template>
  <AppLayout title="豆瓣小组">
    <div class="group-selection-page">
        <header class="page-header">
            <h1>选择你的世界</h1>
            <p>发现与你同频的角落</p>
        </header>

        <main class="group-list">
            <!-- 小组1: 校园 -->
            <div class="group-card" @click="goToGroup('校园热线')">
                <div class="group-icon">
                    <!-- 书本图标 -->
                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h2a1 1 0 100-2H9z" clip-rule="evenodd"></path></svg>
                </div>
                <div class="group-info">
                    <h2>校园热线</h2>
                    <p>你的课表、我的吐槽，青春的回忆与回响。</p>
                    <div class="group-stats">
                        <span>成员 1.2M</span>
                        <span>在线 15.3k</span>
                    </div>
                </div>
            </div>

            <!-- 小组2: 职场 -->
            <div class="group-card" @click="goToGroup('职场茶水间')">
                <div class="group-icon">
                    <!-- 公文包图标 -->
                    <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2h2zm5-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1h4V5z" clip-rule="evenodd"></path></svg>
                </div>
                <div class="group-info">
                    <h2>职场茶水间</h2>
                    <p>摸鱼、八卦、生存指南，成年人的世界没有容易二字。</p>
                    <div class="group-stats">
                        <span>成员 890k</span>
                        <span>在线 22.1k</span>
                    </div>
                </div>
            </div>

            <!-- 小组3: 娱乐八卦 (兔区/天涯风格) -->
            <div class="group-card" @click="goToGroup('自由吃瓜基地')">
                <div class="group-icon">
                    <!-- 火焰图标 -->
                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6c0 1.887.832 3.575 2.145 4.662a.5.5 0 01.355.468V16.5a.5.5 0 00.5.5h6a.5.5 0 00.5-.5v-3.37a.5.5 0 01.355-.468C15.168 11.575 16 9.887 16 8a6 6 0 00-6-6zm0 1.5a.5.5 0 01.5.5v1.66a.5.5 0 01-1 0V4a.5.5 0 01.5-.5zM6.35 6.35a.5.5 0 01.707 0l.707.707a.5.5 0 01-.707.707l-.707-.707a.5.5 0 010-.707zm6.593 0a.5.5 0 010 .707l-.707.707a.5.5 0 01-.707-.707l.707-.707a.5.5 0 01.707 0z"></path></svg>
                </div>
                <div class="group-info">
                    <h2>自由吃瓜基地</h2>
                    <p>内娱、外娱、网红圈，开帖拉踩请遵守版规。</p>
                    <div class="group-stats">
                        <span>成员 3.4M</span>
                        <span>在线 98.6k</span>
                    </div>
                </div>
            </div>
            
            <!-- 小组4: 情感交流 -->
            <div class="group-card" @click="goToGroup('情感树洞')">
                <div class="group-icon">
                    <!-- 爱心图标 -->
                    <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>
                </div>
                <div class="group-info">
                    <h2>情感树洞</h2>
                    <p>那些说不出口的话，在这里可以找到回声。</p>
                    <div class="group-stats">
                        <span>成员 560k</span>
                        <span>在线 8.9k</span>
                    </div>
                </div>
            </div>

            <!-- 小组5: NSFW -->
            <div class="group-card" @click="goToGroup('深夜食堂')">
                <div class="group-icon">
                    <!-- 月亮图标 -->
                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                </div>
                <div class="group-info">
                    <h2>深夜食堂</h2>
                    <p>仅限成年人，探讨一些成熟的话题。</p>
                    <div class="group-stats">
                        <span>成员 4.2M</span>
                        <span>在线 150.2k</span>
                    </div>
                </div>
            </div>

        </main>
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
:root {
    --douban-green: #007722;
    --background-color: #f6f6f6;
    --card-background: #ffffff;
    --text-primary: #111;
    --text-secondary: #888;
    --border-color: #e8e8e8;
    --icon-bg: #f0f0f0;
}

.group-selection-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 10px 15px;
    background-color: var(--background-color);
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
    height: 100%;
    overflow-y: auto;
}

.page-header {
    text-align: center;
    margin-bottom: 20px;
}

.page-header h1 {
    font-size: 22px;
    color: #333;
    margin: 0 0 6px 0;
}

.page-header p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
}

/* --- 小组卡片网格布局 --- */
.group-list {
    display: grid;
    /* 关键：响应式网格布局 */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

/* --- 单个小组卡片 --- */
.group-card {
    display: flex;
    align-items: flex-start; /* 图标和文字顶部对齐 */
    background-color: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    text-decoration: none;
    color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.group-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.group-icon {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: var(--icon-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
}

.group-icon svg {
    width: 28px;
    height: 28px;
    color: var(--text-secondary);
}

.group-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.group-info h2 {
    font-size: 18px;
    margin: 0 0 6px 0;
    color: #333;
}

.group-info p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    line-height: 1.5;
}

.group-stats {
    font-size: 12px;
    color: #aaa;
    display: flex;
    gap: 15px;
}

.group-stats span {
    font-weight: 500;
}
</style>
