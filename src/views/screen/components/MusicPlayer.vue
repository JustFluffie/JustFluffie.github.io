<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  homeData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['show-source-select', 'save-home-data', 'update:homeData'])

const showSourceSelect = (type) => {
  emit('show-source-select', type)
}

const saveHomeData = () => {
  emit('save-home-data')
}

const updateMusicText = (index, value) => {
  const newMusicTexts = [...props.homeData.musicTexts]
  newMusicTexts[index] = value
  emit('update:homeData', { ...props.homeData, musicTexts: newMusicTexts })
}
</script>

<template>
  <div class="music-player-container">
    <!-- 模块1：左侧控制区 -->
    <div class="music-left">
      <!-- 歌词/文本输入 -->
      <input 
        type="text" 
        class="music-text-input title" 
        :value="homeData.musicTexts[0]"
        @input="updateMusicText(0, $event.target.value)"
        @blur="saveHomeData"
      >
      <input 
        v-for="(text, index) in homeData.musicTexts.slice(1)" 
        :key="index"
        type="text" 
        class="music-text-input" 
        :value="homeData.musicTexts[index + 1]"
        @input="updateMusicText(index + 1, $event.target.value)"
        @blur="saveHomeData"
      >
      
      <!-- 播放控制图标 -->
      <div class="music-controls">
        <svg class="svg-icon" viewBox="0 0 24 24"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
        <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
        <svg class="svg-icon play-btn" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
        <svg class="svg-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      </div>
    </div>
    
    <!-- 模块2：右侧CD展示区 -->
    <div class="music-right">
      <div class="cd-wrapper" @click="showSourceSelect('cdCover')">
        <!-- CD光盘 -->
        <div class="cd-disc"></div>
        <!-- CD外壳 -->
        <div class="cd-case">
          <!-- 封面图片 -->
          <div class="cd-cover" :style="homeData.cdCover ? { backgroundImage: `url('${homeData.cdCover}')` } : {}"></div>
          <!-- 表面反光和纹理 -->
          <div class="cd-overlay"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 
   所有尺寸单位已转换为 em，以便通过父容器的 font-size 进行整体缩放。
   基准：假设 1em ≈ 10px (仅作为转换参考，实际大小由父级决定)
*/

/* --- 布局容器 --- */
.music-player-container {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 1.8em;
    padding: 1em;
    box-sizing: border-box;
    color: var(--home-text-color, var(--text-darkest));
    align-items: center;
    position: absolute;
}

/* --- 模块1：左侧控制区样式 --- */
.music-left {
    flex: 1; /* 占据剩余空间 */
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.3em;
    min-width: 0; /* 防止内容溢出 */
    /* 单独调整左侧位置：translate(水平偏移, 垂直偏移) */
    /* 例如：transform: translate(0.5em, -0.5em); 向右移0.5em，向上移0.5em */
    transform: translate(1%, 0);
}

.music-text-input {
    background: transparent;
    border: none;
    color: inherit;
    text-align: center;
    width: 100%;
    outline: none;
    text-shadow: 0 0.1em 0.2em rgba(0,0,0,0.2);
    font-family: inherit;
    padding: 0;
    line-height: 1.3;
    cursor: text;
}

.music-text-input.title {
    font-size: 1.4em;
    font-weight: 600;
    margin-bottom: 0.2em;
}

.music-text-input:not(.title) {
    font-size: 1em;
}

.music-text-input:focus {
    background: rgba(255,255,255,0.1);
    border-radius: 0.4em;
}

.music-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.6em;
    padding: 0 1em;
}

.music-controls .svg-icon {
    width: 1.3em;
    height: 1.3em;
    stroke: currentColor;
    opacity: 0.9;
    fill: none;
}

.music-controls .play-btn {
    width: 1.9em;
    height: 1.9em;
    fill: currentColor;
    stroke: none;
}

/* --- 模块2：右侧CD展示区样式 --- */
.music-right {
    /* 移除 flex: 1，让它根据内容（CD）自动调整宽度 */
    /* 或者给一个固定的 flex-basis，比如 45% */
    flex: 0 0 auto; 
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5em;
    /* 单独调整右侧位置：translate(水平偏移, 垂直偏移) */
    /* 例如：transform: translate(-0.5em, 0.5em); 向左移0.5em，向下移0.5em */
    transform: translate(0, 0);
}

.cd-wrapper {
    /* 恢复固定 em 尺寸，确保不消失 */
    width: 10em; 
    height: 10em;
    position: relative;
    /* 如果需要响应式，可以考虑 max-height: 100% 并配合 aspect-ratio */
    /* 但为了稳定性，先用固定 em */
}

/* CD外壳主体 */
.cd-case {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    cursor: pointer;
    border-radius: 0.3em;
    background: rgba(240, 240, 240, 0.8); /* 乳白色半透明底 */
    box-shadow: 
        0.3em 0.3em 1em rgba(0,0,0,0.2), /* 投影 */
        inset 0.1em 0.1em 0.2em rgba(255,255,255,0.8), /* 顶部高光 */
        inset -0.1em -0.1em 0.2em rgba(0,0,0,0.1); /* 底部阴影 */
    padding: 0.2em; /* 塑料壳厚度 */
    padding-left: 0.9em; /* 左侧合页宽度 */
    box-sizing: border-box;
    backdrop-filter: blur(2px); /* 增加一点磨砂质感 */
    border: 1px solid rgba(255,255,255,0.4);
}

/* CD封面图片 */
.cd-cover {
    width: 100%;
    height: 100%;
    background-color: #f0f0f0;
    background-size: cover;
    background-position: center;
    border-radius: 0.1em;
    box-shadow: 
        inset 0.2em 0 0.4em rgba(0,0,0,0.4), /* 左侧合页投影 */
        0 0 0.2em rgba(0,0,0,0.1);
    position: relative;
    z-index: 1;
}

/* 塑料壳表面反光和合页纹理 */
.cd-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    pointer-events: none;
    border-radius: 0.3em;
    
    /* 合页部分的纹理 */
    background: linear-gradient(
        to right,
        rgba(255,255,255,0.4) 0,
        rgba(255,255,255,0.1) 0.2em,
        rgba(0,0,0,0.05) 0.3em,
        rgba(255,255,255,0.2) 0.4em,
        transparent 1.2em
    );
}

/* 整体反光 */
.cd-overlay::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        125deg,
        rgba(255,255,255,0.6) 0%,
        rgba(255,255,255,0.1) 30%,
        transparent 50%,
        rgba(255,255,255,0.1) 70%,
        rgba(255,255,255,0.3) 100%
    );
    border-radius: 0.3em;
}

/* CD光盘 */
.cd-disc {
    width: 88%;
    height: 88%;
    border-radius: 50%;
    position: absolute;
    top: 6%;
    left: -30%;
    z-index: 1;
    box-shadow: -0.2em 0.2em 0.5em rgba(0,0,0,0.3);
    background: repeating-radial-gradient(
      #111 0, 
      #111 0.2em,
      #222 0.3em,
      #222 0.4em
    );
}

.cd-disc::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20%;
    height: 20%;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    border: 0.2em solid rgba(255,255,255,0.2);
}
</style>
