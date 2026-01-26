<template>
  <AppLayout :title="'Archive of Our Own'" no-padding class="ao3-layout">
    <template #action>
      <SvgIcon name="refresh" @click="handleRefresh" class="icon-refresh"/>
    </template>

    <div class="ao3-page">
      <!-- 元数据卡片 -->
      <div class="work-meta-card">
        <div class="work-meta">
          <div class="preface-group">
            <span class="meta-label">评级：</span>
            <a href="#" class="tag">Explicit</a>
          </div>

          <div class="preface-group">
            <span class="meta-label">关系：</span>
            <a href="#" class="tag">关系1</a>
            <a href="#" class="tag">关系2</a>
          </div>

          <div class="preface-group">
            <span class="meta-label">人物：</span>
            <a href="#" class="tag">人物1</a>
            <a href="#" class="tag">人物2</a>
          </div>

          <div class="preface-group">
            <span class="meta-label">其他标签：</span>
            <a href="#" class="tag">标签1</a>
            <a href="#" class="tag">标签2</a>
            <a href="#" class="tag">标签3</a>
          </div>

          <!-- 统计数据 -->
          <div class="preface-group">
            <span class="meta-label">统计数据：</span>
            <div class="stats-row">
              <span class="stat-item">发布: <strong>2026-01-26</strong></span>
              <span class="stat-item">字数: <strong>8,432</strong></span>
              <span class="stat-item">章节: <strong>1/1</strong></span>
              <span class="stat-item">Kudos: <strong>247</strong></span>
              <span class="stat-item">书签: <strong>83</strong></span>
              <span class="stat-item">点击: <strong>1,502</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 作品标题 -->
      <div class="work-title">
        <h2>作品标题</h2>
        <div class="byline">作者名</div>
      </div>

      <!-- 摘要 -->
      <div class="summary">
        <h3>Summary：</h3>
        <div class="summary-text">
          <p>摘要内容</p>
        </div>
      </div>

      <!-- 正文 -->
      <div class="userstuff">
        <p>正文段落...</p>
      </div>

      <!-- 底部导航 -->
      <div class="chapter-navigation">
        <a href="#">返回顶部 ↑</a>
      </div>

      <!-- 页脚 -->
      <div class="footer">
        <p>Archive of Our Own, a project of the <a href="#">Organization for Transformative Works</a></p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/common/AppLayout.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

const handleRefresh = () => {
  // TODO: 实现刷新功能
  console.log('Refresh clicked')
}
</script>

<style>
/* 自定义顶部栏样式 */
.ao3-layout .app-header {
  background-color: #990000;
  border-bottom: none;
}

.ao3-layout .app-header .back-btn,
.ao3-layout .app-header .action-btn {
  color: white;
}

.ao3-layout .app-header .title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 20px;
  font-weight: normal;
  letter-spacing: 0.5px;
  color: white;
  text-align: left;
  left: 50px;
  transform: none;
  width: auto;
}
</style>

<style scoped>
/* --- 页面主容器 --- */
.ao3-page {
  background-color: #ffffff;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #2a2a2a;
}

.icon-refresh {
  cursor: pointer;
  font-size: 20px;
  color: white;
}

/* 元数据卡片容器 */
.work-meta-card {
  margin: 15px 15px 20px;
  background-color: #fbfbfb;
  border-radius: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* 元数据框 */
.work-meta {
  padding: 10px 15px;
}

.preface-group {
  margin-bottom: 5px;
  padding-bottom: 5px;
}

.preface-group:last-of-type {
  padding-bottom: 0;
}

.meta-label {
  font-weight: bold;
  color: #555;
  font-size: 12px;
  display: inline-block;
  margin-bottom: 5px;
  margin-right: 0px;
}

.tag {
  display: inline-block;
  background-color: transparent;
  border-bottom: 1px dotted var(--text-tertiary);
  padding: 2px 0;
  margin: 0 8px 0 0;
  font-size: 12px;
  color: #333;
  text-decoration: none;
}

/* 统计信息 */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 20px;
  line-height: 1.6;
}

.stat-item {
  font-size: 12px;
  color: #666;
}

/* 作品标题 */
.work-title {
  padding: 15px 15px 10px;
  text-align: center;
}

.work-title h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 24px;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.3;
  font-weight: normal;
}

.byline {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13px;
  color: #990000;
  text-decoration: none;
}

/* 摘要 */
.summary {
  padding: 0px 70px;
  background-color: transparent;
}

.summary h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 14px;
  font-weight: bold;
  color: #555;
  margin-bottom: 10px;
  margin-left: 0.5em;
  border-bottom: 1px solid #000000;
}

.summary-text {
  margin: 0 auto;
  padding: 0 15px;
  background-color: transparent;
  font-size: 13px;
  line-height: 1.7;
  color: #333;
  text-align: left;
  max-width: 100%;
}

/* 正文内容 */
.userstuff {
  padding: 25px 15px;
  font-size: 14px;
  line-height: 1.4;
  color: #2a2a2a;
}

.userstuff p {
  margin-bottom: 15px;
}

/* 底部导航 - 使用与顶部栏相同的颜色 */
.chapter-navigation {
  padding: 15px;
  text-align: center;
  background-color: #ffffff00;
}

.chapter-navigation a {
  color: #000000;
  text-decoration: none;
  font-size: 13px;
  font-weight: bold;
}

/* 页脚 */
.footer {
  background-color: #990000;
  color: #ccc;
  padding: 20px 15px;
  text-align: center;
  font-size: 11px;
}

.footer a {
  color: #fff;
  text-decoration: none;
}
</style>
