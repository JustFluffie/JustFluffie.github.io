<template>
  <div 
    :class="['base-card', isAnniversary ? 'anniversary-card' : 'countdown-card']"
    @touchstart="startPress"
    @touchend="cancelPress"
    @touchmove="cancelPress"
    @mousedown="startPress"
    @mouseup="cancelPress"
    @mouseleave="cancelPress"
  >
    
    <!-- ========================================
         2. 纪念日卡片 - 拍立得风格
    ======================================== -->
    <template v-if="isAnniversary">
      <!-- 拍立得组件 -->
      <div class="polaroid-wrapper">
        <div class="tape"></div>
        <div class="photo-area" @click.stop="$emit('upload-photo', event)">
          <img v-if="event.photoUrl" :src="event.photoUrl" class="polaroid-img" />
          <div v-else class="placeholder">
            <SvgIcon name="camera" className="camera-icon" />
            <span class="upload-text">点击上传</span>
          </div>
        </div>
        <div class="caption">
          <input 
            type="text" 
            :value="event.polaroidText"
            @input="$emit('update:polaroidText', $event.target.value)"
            placeholder="写点什么..."
            @click.stop
          >
        </div>
      </div>

      <!-- 右侧信息 -->
      <div class="info">
        <div class="tag">ANNIVERSARY</div>
        <div class="label">{{ event.title || '纪念日' }}</div>
        <div class="days-row">
          <span class="big-num">{{ daysCount }}</span>
          <span class="unit">Days</span>
        </div>
        <span class="date-tag">Since {{ formattedDate }}</span>
      </div>
    </template>

    <!-- ========================================
         3. 倒计时卡片 - 简约线框风格
    ======================================== -->
    <template v-else>
      <div class="corner-line"></div>
      <span class="star-deco">✦</span>
      <div class="left">
        <div class="tag-line">
          <span class="tag">COUNTDOWN</span>
          <span class="line"></span>
        </div>
        <h2 class="title">{{ event.title || '倒计时' }}</h2>
        <p class="date">{{ formattedDateWithWeekday }}</p>
      </div>
      <div class="days-block">
        <span class="num">{{ daysCount }}</span>
        <span class="unit">days</span>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { differenceInDays, format } from 'date-fns';
import SvgIcon from '@/components/common/SvgIcon.vue';

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  selectedDate: {
    type: Date,
    default: () => new Date()
  }
});

const emit = defineEmits(['update:polaroidText', 'delete', 'upload-photo']);

let pressTimer = null;

const startPress = () => {
  pressTimer = setTimeout(() => {
    emit('delete', props.event);
  }, 800);
};

const cancelPress = () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
};

const isAnniversary = computed(() => props.event.type === 'anniversary');

const daysCount = computed(() => {
  if (!props.event.date) return 0;
  const target = new Date(props.event.date);
  const current = new Date(props.selectedDate);
  return Math.abs(differenceInDays(current, target));
});

const formattedDate = computed(() => {
  if (!props.event.date) return '';
  const d = new Date(props.event.date);
  return format(d, 'yyyy.MM.dd');
});

const formattedDateWithWeekday = computed(() => {
  if (!props.event.date) return '';
  const d = new Date(props.event.date);
  return format(d, 'yyyy.MM.dd EEEE');
});
</script>

<style scoped>
/* 引入字体 (如果全局未引入，这里作为备用，实际项目中通常在 index.html 或全局 CSS 中引入) */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Caveat&family=Quicksand:wght@500;700&display=swap');

/* 变量定义 */
.base-card {
  width: 100%;
  position: relative;
  background: white;
  border-radius: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
  /* 基础阴影 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* ========================================
   2. 纪念日卡片 - 拍立得风格
======================================== */
.anniversary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 3.9px dotted var(--border-color);
  padding: 10px 20px;
  overflow: visible;
}

/* 角落小十字装饰 */
.anniversary-card::before {
  content: '+';
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 10px;
  color: #ddd;
  font-weight: 300;
}

.anniversary-card::after {
  content: '+';
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 10px;
  color: #ddd;
  font-weight: 300;
}

/* 拍立得 */
.polaroid-wrapper {
  position: relative;
  background: #fff;
  padding: 5px 5px 18px 5px;
  box-shadow: 2px 3px 10px rgba(0,0,0,0.06);
  transform: rotate(-3deg);
  margin-left: 10px;
  flex-shrink: 0;
}

.polaroid-wrapper .tape {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(2deg);
  width: 24px;
  height: 8px;
  background: rgba(255, 224, 123, 0.65);
}

.polaroid-wrapper .photo-area {
  width: 70px;
  height: 70px;
  background: #f4f4f4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.polaroid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.polaroid-wrapper .placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #ccc;
}

.placeholder .camera-icon {
  width: 24px;
  height: 24px;
  color: #ddd;
}

.placeholder .upload-text {
  font-size: 9px;
  color: #ccc;
}

.polaroid-wrapper .caption {
  position: absolute;
  bottom: 2px;
  left: 0;
  width: 100%;
  text-align: center;
}

.polaroid-wrapper .caption input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-family: 'Caveat', cursive;
  font-size: 16px;
  color: #666;
  text-align: center;
  padding: 0;
}

.polaroid-wrapper .caption input::placeholder {
  color: #ccc;
}

/* 纪念日右侧 */
.anniversary-card .info {
  flex: 1;
  text-align: right;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.anniversary-card .tag {
  font-size: 0.55rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.anniversary-card .label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 2px;
  font-weight: 500;
}

.anniversary-card .days-row {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
  margin: 4px 0;
}

.anniversary-card .big-num {
  font-family: 'Quicksand', sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: var(--text-darkest);
  line-height: 1;
}

.anniversary-card .unit {
  font-size: 11px;
  color: var(--text-tertiary);
}

.anniversary-card .date-tag {
  font-size: 0.6rem;
  background: var(--bg-light);
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--text-tertiary);
  display: inline-block;
}

/* ========================================
   3. 倒计时卡片 - 简约线框风格
======================================== */
.countdown-card {
  padding: 22px 24px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 左上角线条装饰 */
.countdown-card .corner-line {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 18px;
  height: 18px;
  border-left: 1.5px solid #e0e0e0;
  border-top: 1.5px solid #e0e0e0;
}

/* 右下角小星星 */
.countdown-card .star-deco {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 8px;
  color: #ddd;
}

.countdown-card .left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.countdown-card .tag-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.countdown-card .tag {
  font-size: 0.5rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: var(--bg-light);
  padding: 2px 8px;
  border-radius: 8px;
  position: relative;
  top: -3px;
}

.countdown-card .line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #eee, transparent);
  max-width: 60px;
}

.countdown-card .title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-darkest);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.countdown-card .title::before {
  content: '—';
  color: #ccc;
  font-weight: 300;
}

.countdown-card .date {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  padding-left: 16px;
  position: relative;
  top: 9px;
}

/* 倒计时数字块 */
.countdown-card .days-block {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: var(--bg-light);
  padding: 10px 14px;
  border-radius: 10px;
  position: relative;
  flex-shrink: 0;
}

.countdown-card .days-block::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 6px;
  right: 6px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e5e5, transparent);
}

.countdown-card .num {
  font-family: 'Space Mono', monospace;
  font-size: 40px;
  font-weight: 700;
  color: var(--text-darkest);
  line-height: 1;
}

.countdown-card .unit {
  font-size: 13px;
  color: var(--text-tertiary);
  text-transform: uppercase;
}
</style>
