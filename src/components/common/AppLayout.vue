<template>
  <div class="app-screen active">
    <div class="app-header">
      <div class="back-btn" @click="handleBack">
        <svg-icon name="chevron-left" />
      </div>
      <div class="title">{{ title }}</div>
      <div class="action-btn">
        <slot name="action"></slot>
      </div>
    </div>
    <div class="app-content" :class="{ 'no-padding': noPadding }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  backAction: {
    type: Function,
    default: null
  },
  noPadding: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

function handleBack() {
  if (props.backAction) {
    props.backAction()
  } else {
    router.back()
  }
}
</script>

<style>
/*
 * 模块：应用屏幕布局 (App Screen Layout)
 * 范围：应用于所有需要从侧边滑入的全屏页面容器，如设置页、聊天室页等。
 * 作用：定义了应用内页面的基本容器样式。它默认在屏幕外，
 *      通过添加 'active' 类实现从右侧滑入的过渡效果，
 *      并使用 Flexbox 进行垂直布局。
 */
.app-screen {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background: var(--bg-light);
    z-index: 200;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
}
.app-screen.active {
    transform: translateX(0);
}

/*
 * 模块：应用通用顶部栏 (App Header)
 * 范围：适用于所有 `app-screen` 内部的页面顶部。
 * 作用：定义了应用内页面的通用顶部导航栏样式。
 *      包括返回按钮、居中标题和右侧操作按钮的布局与样式。
 */
.app-header {
    height: 70px;
    padding: 30px 15px 8px;
    background: var(--bg-white);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
}
.app-header .back-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
    border-radius: 50%;
    transition: background 0.2s;
}
.app-header .back-btn svg {
    width: 24px;
    height: 24px;
    stroke-width: 2;
}
.app-header .title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
    width: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.app-header .action-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
    border-radius: 50%;
    transition: background 0.2s;
}
.app-header .action-btn svg {
    width: 24px;
    height: 24px;
    stroke-width: 1.5;
}

/*
 * 模块：应用通用内容区 (App Content)
 * 范围：适用于所有 `app-screen` 内部，位于 `app-header` 下方的内容区域。
 * 作用：定义了页面主要内容的容器样式。它会占据剩余的可用空间，
 *      并提供垂直滚动功能。同时，为避免底部留白，
 *      最后一个卡片元素的下边距被移除。
 */
.app-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px 15px;
    background: #f5f5f5;
    /* 隐藏滚动条但允许滚动 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */
}
.app-content::-webkit-scrollbar {
    width: 0;
    background: transparent; /* Chrome/Safari/Webkit */
}
.app-content.no-padding {
    padding: 0;
}
.app-content > .card:last-child {
    margin-bottom: 0;
}
</style>
