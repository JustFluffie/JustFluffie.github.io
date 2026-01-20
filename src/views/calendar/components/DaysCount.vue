<template>
  <div 
    class="sticker-card count-card" 
    :class="{ anniversary: isAnniversary }"
    @touchstart="startPress"
    @touchend="cancelPress"
    @touchmove="cancelPress"
    @mousedown="startPress"
    @mouseup="cancelPress"
    @mouseleave="cancelPress"
  >
    
    <!-- 拍立得组件 (仅纪念日显示) -->
    <div class="polaroid-wrapper" v-if="isAnniversary">
      <!-- 胶带 -->
      <div class="tape-small"></div>
      
      <!-- 照片区域 -->
      <div class="photo-area" @click.stop="$emit('upload-photo', event)">
        <img v-if="event.photoUrl" :src="event.photoUrl" class="polaroid-img" />
        <div v-else class="placeholder-text">点击<br>上传</div>
      </div>
      
      <!-- 可编辑的手写文字 -->
      <div class="handwriting-container">
        <input 
          type="text" 
          :value="event.polaroidText"
          @input="$emit('update:polaroidText', $event.target.value)"
          class="polaroid-input" 
          placeholder="点击输入"
        />
      </div>
    </div>

    <!-- 右侧信息 -->
    <div class="content">
      <span class="label">{{ event.title || defaultLabel }}</span>
      <div class="big-days">
        {{ daysCount }} <span class="unit">Days</span>
      </div>
      <span class="target-date">{{ datePrefix }} {{ formattedDate }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { differenceInDays } from 'date-fns';

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

const defaultLabel = computed(() => isAnniversary.value ? 'Anniversary' : 'Countdown');

const datePrefix = computed(() => isAnniversary.value ? 'Since' : 'Target');

const daysCount = computed(() => {
  if (!props.event.date) return 0;
  const target = new Date(props.event.date);
  const current = new Date(props.selectedDate);
  return Math.abs(differenceInDays(current, target));
});

const formattedDate = computed(() => {
  if (!props.event.date) return '';
  const d = new Date(props.event.date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});
</script>

<style scoped>
.sticker-card { 
  background: #fff; 
  border-radius: 16px; 
  padding: 20px; 
  padding-bottom: 10px;
  margin-bottom: 11px; 
  position: relative; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.02); 
  border: 1px solid #f2f2f2; 
}

.count-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px;
  overflow: visible;
}

/* 拍立得容器 */
.polaroid-wrapper {
  position: relative;
  background: #fff;
  padding: 8px 8px 25px 8px;
  box-shadow: 2px 4px 15px rgba(0,0,0,0.1);
  transform: translate(20%, -5%) rotate(-4deg);
  transition: transform 0.3s;
  z-index: 5;
}

/* 照片胶带 */
.tape-small {
  position: absolute;
  top: -8px; left: 50%; transform: translateX(-50%) rotate(2deg);
  width: 30px; height: 10px;
  background: rgba(248, 232, 143, 0.4);
  backdrop-filter: blur(1px);
}

/* 照片灰底区域 */
.photo-area {
  width: 70px; height: 70px;
  background: #f4f4f4;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.placeholder-text { 
  font-size: 12px; 
  color: #ddd; 
  text-align: center; 
  line-height: 1.2; 
}

.polaroid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 手写输入框 */
.handwriting-container {
  position: absolute;
  bottom: 2px; left: 0; width: 100%;
  text-align: center;
}

.polaroid-input {
  width: 90%;
  border: none; background: transparent; outline: none;
  font-family: 'Caveat', cursive;
  font-size: 16px;
  color: #555;
  text-align: center;
  padding: 0;
}
.polaroid-input::placeholder { color: #ddd; }

/* 右侧信息 */
.content { flex: 1; text-align: right; z-index: 1; }
.label { 
  font-family: 'ZCOOL KuaiLe', cursive; 
  font-size: 16px; 
  color: #999; 
  margin-right: 4px;
  /* 使用相对定位微调位置，不影响布局 */
  position: relative;
  top: -5px; /* 向上移动 2px，您可以调整这个值 */
}
.big-days { font-family: 'Quicksand', sans-serif; font-size: 40px; font-weight: 700; color: #333; line-height: 1; margin: 5px 0; }
.unit { font-size: 14px; font-weight: 500; color: #666; }
.target-date { font-size: 10px; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; color: #888; letter-spacing: 0.5px; }
</style>
