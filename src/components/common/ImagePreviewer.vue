<template>
  <div v-if="visible" class="preview-overlay" @click="close">
    <!-- Text Content Viewer -->
    <div v-if="textContent" class="text-viewer-content" :style="contentStyle" @click.stop>
      <div class="text-wrapper" ref="textWrapper">
        {{ textContent }}
      </div>
    </div>
    <!-- Image Viewer -->
    <img v-else :src="imageUrl" class="preview-image" @click.stop />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  visible: Boolean,
  imageUrl: String,
  textContent: String,
});

const emit = defineEmits(['update:visible']);

const textWrapper = ref(null);
const isLongText = ref(false);

watch(() => props.visible, async (newVal) => {
  if (newVal && props.textContent) { // Only run for text content
    await nextTick();
    if (textWrapper.value) {
      isLongText.value = textWrapper.value.scrollHeight > textWrapper.value.clientHeight;
    }
  }
});

const contentStyle = computed(() => {
  const baseRatio = 3 / 2;
  const longRatio = 2 / 3;
  
  let aspectRatio = baseRatio;
  let overflowY = 'hidden';

  if (isLongText.value) {
    aspectRatio = longRatio;
    overflowY = 'auto';
  }

  return {
    aspectRatio: `${aspectRatio}`,
    overflowY: overflowY
  };
});

const close = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

.preview-image {
  max-width: 95%;
  max-height: 95%;
  object-fit: contain;
  cursor: default;
  border-radius: 4px;
}

.text-viewer-content {
  background-color: #fff;
  color: #333;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 400px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.3s ease;
  cursor: default;
}

.text-wrapper {
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  font-size: 16px;
  line-height: 1.5;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE 10+ */
  white-space: pre-wrap;
  word-wrap: break-word;
}

.text-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera*/
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
