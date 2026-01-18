<script setup>
defineProps({
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
  <div class="section-middle">
    <div class="music-player-container">
      <!-- 左侧：歌词/文本 -->
      <div class="music-left">
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
      
      <!-- 右侧：CD封面 -->
      <div class="music-right">
        <div class="cd-wrapper" @click="showSourceSelect('cdCover')">
          <div class="cd-disc"></div>
          <div class="cd-case" :style="homeData.cdCover ? { backgroundImage: `url('${homeData.cdCover}')` } : {}"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-middle {
    flex: 0.85;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: none;
    box-shadow: none;
    padding: 5px 10px;
    margin-top: 0px;
    margin-bottom: 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: var(--home-text-color, var(--text-darkest));
}

.music-player-container {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 30px;
}

.music-left {
    flex: 1.2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    margin-left: -15px;
    margin-right: 0px;
    padding-left: 0px;
}

.music-text-input {
    background: transparent;
    border: none;
    color: var(--home-text-color, var(--text-darkest));
    text-align: center;
    width: 100%;
    outline: none;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    font-family: inherit;
    padding: 0;
    line-height: 1.3;
    cursor: text;
}

.music-text-input:nth-child(1) { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
.music-text-input:nth-child(2) { font-size: 8.5px; opacity: 0.7; }
.music-text-input:nth-child(3) { font-size: 10px; }
.music-text-input:nth-child(4) { font-size: 12px; }
.music-text-input:nth-child(5) { font-size: 10px; }

.music-text-input:focus {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: none;
}

.music-text-input.title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
}

.music-text-input::placeholder {
    color: rgba(255,255,255,0.6);
}

.music-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    padding: 0 10px;
}

.music-controls .svg-icon {
    width: 13px;
    height: 13px;
    stroke: var(--home-text-color, var(--text-darkest));
    opacity: 0.9;
    fill: none;
}

.music-controls .play-btn {
    width: 19px;
    height: 19px;
    fill: var(--home-text-color, var(--text-darkest));
    stroke: none;
}

.music-right {
    flex: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-right: -20px;
    margin-left: 0px;
}

.cd-wrapper {
    width: 97px;
    height: 97px;
    position: relative;
    transform: translateX(0px);
}

.cd-case {
    width: 100%;
    height: 100%;
    background-color: var(--bg-white);
    border-radius: 5px;
    position: absolute;
    cursor: pointer;
    top: 0;
    right: 0;
    z-index: 2;
    background-size: cover;
    background-position: center;
    box-shadow: 
        2px 2px 10px 2px rgba(0,0,0,0.2),
        inset 1px 1px 0 rgba(255,255,255,0.4),
        inset -1px -1px 0 rgba(0,0,0,0.1);
    border: 2px solid rgba(255,255,255,0.1);
}

.cd-case::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 2px;
    bottom: 2px;
    width: 2px;
    background: rgba(255,255,255,0.3);
    box-shadow: 1px 0 2px rgba(0,0,0,0.1);
}

.cd-disc {
    width: 85px;
    height: 85px;
    border-radius: 50%;
    position: absolute;
    top: 5px;
    left: -30px;
    z-index: 1;
    box-shadow: -2px 2px 5px rgba(0,0,0,0.3);
    background: repeating-radial-gradient(
      #111 0, 
      #111 2px, 
      #222 3px, 
      #222 4px
    );
}

.cd-disc::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
}
</style>
