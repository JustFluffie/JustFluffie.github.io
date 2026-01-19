<script setup>
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
</script>

<template>
  <div class="section-bottom-left">
    <div class="polaroid-container">
      
      <!-- 装饰层：星星 -->
      <div class="deco-layer">
        <div class="star s-four pos-1"></div>
        <div class="star s-dot pos-2"></div>
        <div class="star s-four pos-3"></div>
        <div class="star s-cross pos-4"></div>
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

      <!-- 字素1 -->
      <input type="text" class="custom-text-input photo-wall-input1" placeholder="about">
      <input type="text" class="custom-text-input photo-wall-input2" placeholder="sunshine and fantasy">
      <input type="text" class="custom-text-input photo-wall-input3" placeholder="Life is...">
      
    </div>
  </div>
</template>

<style scoped>
.section-bottom-left {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible; 
}

/* =========================================================
   【全局控制台】
   ========================================================= */
.polaroid-container {
    /* 1. 整体大小 (Zoom) */
    font-size: 11px; 
    /* 2. 散布范围 (Spread) */
    width: 16em;  
    height: 14em; 
    /* 3. 整体位置移动 (Move) */
    position: relative;
    top: -2em;   
    left: 0em;   
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

/* 十字星：背景透明，但线条要用变量色 */
.s-cross { width: 1.2em; height: 1.2em; background: transparent; }
.s-cross::before, .s-cross::after { content: ''; position: absolute; background: var(--home-text-color); }
.s-cross::before { top: 45%; left: 0; width: 100%; height: 1px; }
.s-cross::after { top: 0; left: 45%; width: 1px; height: 100%; }

/* 圆点：稍微淡一点，增加层次 (用 0.8 透明度) */
.s-dot { width: 0.4em; height: 0.4em; border-radius: 50%; background: var(--home-text-color); }

/* --- 星星位置 --- */
.pos-1 { top: -7%; left: 25%; transform: rotate(-15deg); } 
.pos-2 { top: 5%; left: 20%; }
/* 中间那个特别的大星星 */
.pos-3 { top: 48%; left: 45%; transform: scale(1.2); }
.pos-4 { top: 40%; left: 51%; transform: rotate(20deg); }
.pos-5 { top: 15%; left: 95%; transform: scale(0.7); }
.pos-6 { top: 25%; left: 90%; transform: rotate(45deg); }
.pos-7 { top: 95%; left: 54%; }
.pos-8 { top: 90%; left: 6%; transform: rotate(10deg); }

/* --- 拍立得卡片 --- */
.polaroid {
    width: 6.8em; 
    height: 8.8em;
    padding: 0.5em 0.5em 1.8em 0.5em; /* 底部留白加大 */ 
    margin-left: -5%;
    /* 纸张质感背景：渐变 + SVG噪点纹理 */
    background-color: #ffffff;
    background-image: 
        linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");    
    /* 高级阴影 */
    box-shadow: 
        0 1px 3px rgba(0,0,0,0.08),
        0 3px 6px rgba(0,0,0,0.06),
        inset 0 1px 0 rgba(255,255,255,0.8);
    position: absolute;
    /* 丝滑的贝塞尔曲线过渡 */
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
    top: 0%; 
    left: 52%; /* 稍微调整了下位置以配合星星 */
    transform: rotate(10deg); 
    z-index: 12; 
}
.polaroid.p1 { 
    top: 43%; 
    left: 12%; 
    transform: rotate(-10deg); 
    z-index: 11; 
}

/* --- 字素1 --- */
.photo-wall-input1,
.photo-wall-input2,
.photo-wall-input3 {
    position: absolute;
    top: 65%;
    left: 48%;
    width: 10em; /* 紧凑一点 */
    background: transparent;
    border: none;
    color: var(--home-text-color);
    padding: 5px;
    font-size: 0.8em; 
    font-weight: 500;
    font-family: inherit;
    font-style: italic;
    text-align: left;
    outline: none;
    z-index: 13; /* 比 p1 和 p2 高 */
    text-shadow: 0 1px 1px rgba(0,0,0,0.3);
    border-radius: 8px;
    transition: background 0.2s ease;
}

.photo-wall-input2 { position: absolute; top: 75%; left: 48%; width: 15em;}
.photo-wall-input3 { position: absolute; top: 14%; left: 0%; text-align: center;}


.photo-wall-input1:focus,
.photo-wall-input2:focus,
.photo-wall-input3:focus {
    box-shadow: none;
    text-shadow: none;
}

.photo-wall-input1::placeholder,
.photo-wall-input2::placeholder,
.photo-wall-input3::placeholder {
    color: var(--home-text-color);
    font-style: italic;
}

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
