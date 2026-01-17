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
      <!-- 装饰星星 -->
      <div class="polaroid-star star-1"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="polaroid-star star-2"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="polaroid-star star-3"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="polaroid-star star-4"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="polaroid-star star-5"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="polaroid-star star-6"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      <div class="polaroid-star star-7"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
      
      <!-- 照片卡片 -->
      <div class="polaroid p2" @click="showSourceSelect('photo2')">
        <div class="photo" :style="homeData.photo2 ? { backgroundImage: `url('${homeData.photo2}')` } : {}"></div>
      </div>
      <div class="polaroid p1" @click="showSourceSelect('photo1')">
        <div class="photo" :style="homeData.photo1 ? { backgroundImage: `url('${homeData.photo1}')` } : {}"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-bottom-left {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.polaroid-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 500px;
    font-size: 11px;
}

.polaroid-star {
    position: absolute;
    width: 1.2em;
    height: 1.2em;
    pointer-events: none;
    z-index: 15;
}

.polaroid-star svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: var(--text-darkest);
    stroke-width: 1.5;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.polaroid-star.star-1 { top: 0%; left: 3%; width: 3em; height: 3em; transform: rotate(-15deg); }
.polaroid-star.star-2 { top: 13%; right: 30%; width: 2em; height: 2em; transform: rotate(20deg); }
.polaroid-star.star-3 { top: 48%; left: 0%; width: 2em; height: 2em; transform: rotate(-5deg); }
.polaroid-star.star-4 { bottom: 20%; right: -6%; width: 2.8em; height: 2.8em; transform: rotate(10deg); }
.polaroid-star.star-5 { bottom: 15%; left: 35%; width: 2em; height: 2em; transform: rotate(-25deg); }
.polaroid-star.star-6 { top: 25%; right: 23%; width: 1.4em; height: 1.4em; transform: rotate(35deg); }
.polaroid-star.star-7 { bottom: -15%; left: 55%; width: 1.6em; height: 1.6em; transform: rotate(15deg); }

.polaroid {
    width: 7em;
    height: 9em;
    background: linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%);
    padding: 0.5em 0.5em 1.8em 0.5em;
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
    background-image: 
        linear-gradient(145deg, #ffffff 0%, #f8f8f8 50%, #f0f0f0 100%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

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

.polaroid.p2 { transform: rotate(-10deg) translate(2.5em, 5em); z-index: 1; }
.polaroid.p1 { transform: rotate(10deg) translate(-3em, -1.5em); z-index: 2; }

.photo {
    width: 100%;
    height: 100%;
    background-color: var(--bg-white);
    background-size: cover;
    background-position: center;
    border: none;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 1px rgba(0,0,0,0.1);
}

.photo::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%);
    pointer-events: none;
}
</style>
