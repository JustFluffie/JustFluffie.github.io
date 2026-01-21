<script setup>
import { ref } from 'vue';
import SvgIcon from '@/components/common/SvgIcon.vue';

defineProps({
  homeData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['show-source-select'])

const showSourceSelect = (type) => {
  emit('show-source-select', type)
}

const textInputs = ref([
  { id: 1, class: 'photo-wall-input-1', placeholder: 'about', value: '' },
  { id: 2, class: 'photo-wall-input-2', placeholder: 'sunshine and fantasy', value: '' },
  { id: 3, class: 'photo-wall-input-3', placeholder: 'Life is...', value: '' },
]);

const getLangClass = (text) => {
  if (!text) return 'lang-en'; // 默认英文（为了让 Placeholder 显示 Georgia 斜体）
  // 韩文范围
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) {
    return 'lang-kr';
  }
  // 日文范围 (平假名/片假名)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return 'lang-ja';
  }
  // 中文范围
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return 'lang-zh';
  }
  // 默认英文
  return 'lang-en';
};
</script>

<template>
  <div class="section-bottom-left">
    <div class="polaroid-container">
      
      <!-- 装饰层：星星 -->
      <div class="deco-layer">
        <div class="star s-four pos-1"></div>
        <div class="star s-dot pos-2"></div>
        <div class="star s-four pos-3"></div>
        <SvgIcon name="cross-sparkle" viewBox="0 0 100 100" class="cross-sparkle-icon pos-4" />
        <div class="star s-four pos-5"></div>
        <div class="star s-cross pos-6"></div>
        <div class="star s-dot pos-7"></div>
        <div class="star s-cross pos-8"></div>
      </div>
      
      <!-- 照片层 -->
      <div class="polaroid p2" @click="showSourceSelect('photo2')">
        <div class="photo" :style="homeData.photo2 ? { backgroundImage: `url('${homeData.photo2}')` } : {}"></div>
      </div>
      <div class="polaroid p1" @click="showSourceSelect('photo1')">
        <div class="photo" :style="homeData.photo1 ? { backgroundImage: `url('${homeData.photo1}')` } : {}"></div>
      </div>

      <!-- 字素 -->
      <input 
        v-for="input in textInputs"
        :key="input.id"
        type="text" 
        v-model="input.value"
        :class="['custom-text-input', 'photo-wall-input', input.class, getLangClass(input.value)]"
        :placeholder="input.placeholder"
      >
      
    </div>
  </div>
</template>

<style scoped>
.section-bottom-left {
    /* 【修改 1】撑满父容器分配的空间 */
    width: 100%;
    height: 100%; 
    display: flex;
    align-items: center;
    justify-content: center;
    /* 允许装饰物溢出到 padding 区域，但不溢出屏幕 (由外部控制) */
    overflow: visible; 
    container-type: size;
}

/* =========================================================
   【全局控制台】
   ========================================================= */
.polaroid-container {
    /* 1. 整体大小 (Zoom) */
    /* 建议：在有边框模式下，稍微把这个值改小一点，比如 1.6vh，以防挤压 */
    font-size: 9cqmin;
    /* 2. 散布范围 (Spread) */
    /* 我们定义一个固定的“画布区域”，让里面的绝对定位元素以此为基准 */
    width: 16em;  
    height: 14em; 
    /* 3. 【重要修改】位置复位 */
    /* 不需要手动偏移了，Flexbox 会帮你居中 */
    position: relative;
    top: 0;   /* 原来是 -2.3em */
    left: 0;  
}

/* --- 装饰层（星星） --- */
.deco-layer {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 15; 
}

/* 基础星星 */
.star { position: absolute; background-color: var(--home-text-color); }
.s-four { width: 1.4em; height: 1.4em; clip-path: polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%); }

/* 十字：背景透明，但线条要用变量色 */
.s-cross { width: 1.3em; height: 1.3em; background: transparent; position: relative;}
.s-cross::before, .s-cross::after { content: ''; position: absolute; background: var(--home-text-color); border-radius: 2px; }
.s-cross::before { top: 45%; left: 0; width: 100%; height: 0.15em; transform: translateY(-50%); opacity: 0.7;}
.s-cross::after { top: 0; left: 45%; width: 0.15em; height: 100%; transform: translateX(-50%); opacity: 0.7;}

.cross-sparkle-icon {
  position: absolute; width: 1.2em; height: 1.2em; color: var(--home-text-color); }

/* 圆点：稍微淡一点，增加层次 (用 0.8 透明度) */
.s-dot { width: 0.4em; height: 0.4em; border-radius: 50%; background: var(--home-text-color); }

/* --- 星星位置 --- */
.pos-1 { top: -7%; left: 25%; transform: rotate(-15deg); opacity: 0.7;} 
.pos-2 { top: 5%; left: 20%; }
/* 中间那个特别的大星星 */
.pos-3 { top: 48%; left: 45%; transform: scale(1.15); opacity: 0.8;}
.pos-4 { top: 40%; left: 51%; transform: rotate(10deg); opacity: 0.7;}
.pos-5 { top: 15%; left: 105%; transform: scale(0.7); }
.pos-6 { top: 25%; left: 100%; transform: rotate(45deg); opacity: 0.7;}
.pos-7 { top: 99%; left: 20%; }
.pos-8 { top: 75%; left: 5%; transform: rotate(10deg); opacity: 0.8;}

/* --- 拍立得卡片 --- */
.polaroid {
    width: 6.5em; 
    height: 8.5em;
    padding: 0.5em 0.5em 1.8em 0.5em; 
    margin-left: -5%; /* 这个负 margin 是为了视觉重叠效果，可以保留 */
    background-color: #ffffff;
    background-image: 
        linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");    
    
    box-shadow: 
        0 1px 3px rgba(0,0,0,0.08),
        0 3px 6px rgba(0,0,0,0.06),
        inset 0 1px 0 rgba(255,255,255,0.8);
    position: absolute;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                z-index 0s,
                box-shadow 0.3s ease;
    cursor: pointer;
    border-radius: 2px;
}

/* 底部隐约的压痕线条细节 */
.polaroid::before {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent);
}

/* 卡片定位 (使用百分比，随容器自适应) */
.polaroid.p2 { 
    top: -5%; 
    left: 53%; /* 稍微调整了下位置以配合星星 */
    transform: rotate(10deg); 
    z-index: 12; 
}
.polaroid.p1 { 
    top: 42%; 
    left: 11%; 
    transform: rotate(-10deg); 
    z-index: 11; 
}

/* --- 字素1 --- */
.photo-wall-input {
    position: absolute;
    background: transparent;
    border: none;
    color: var(--home-text-color);
    padding: 5px;
    font-weight: 600;
    text-align: left;
    outline: none;
    z-index: 13;
    text-shadow: 0 2px 3px rgba(0,0,0,0.3);
    border-radius: 8px;
    transition: background 0.2s ease;
    font-family: inherit;
    font-style: italic; 
    font-size: 0.9em; 
}

.photo-wall-input:focus { box-shadow: none; text-shadow: none; }

.photo-wall-input::placeholder { color: var(--home-text-color); font-style: italic; }

/* --- 语言特定样式 --- */
/* 英文 */
.photo-wall-input.lang-en {
    font-family: 'Open Sans', 'Segoe UI', sans-serif; font-size: 0.9em; font-weight: 600; font-style: italic; }

/* 中文 */
.photo-wall-input.lang-zh {
    font-family: 'Noto Serif SC', 'SimSun', serif;  font-size: 0.8em; font-style: normal; }

/* 日文 */
.photo-wall-input.lang-ja {
    font-family: 'Kiwi Maru', serif; font-size: 0.79em; font-weight: 400; font-style: normal; text-shadow:  0 1px 1px rgba(0,0,0,0.2); }

/* 韩文 */
.photo-wall-input.lang-kr {
    font-family: 'Gaegu', cursive; font-size: 1.05em; font-weight: 500; font-style: normal; text-shadow:  0 1px 1px rgba(0,0,0,0.15); }

.photo-wall-input-1 { top: 75%; left: 49%; width: 10em; }
.photo-wall-input-2 { top: 85%; left: 49%; width: 15em; }
.photo-wall-input-3 { top: 14%; left: -22%; text-align: center; }

/* --- 照片区域样式 --- */
.photo {
    width: 100%;
    height: 100%;
    background-color: #fff; /* 默认白色背景 */
    background-size: cover;
    background-position: center;
    border: none;
    position: relative;
    overflow: hidden;
    /* 内部微阴影，增加层次感 */
    box-shadow: inset 0 0 1px rgba(0,0,0,0.1);
    filter: sepia(0.05); /* 稍微一点点复古色调 */
}

/* 照片表面的光泽感叠加 */
.photo::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%);
    pointer-events: none;
}
</style>
