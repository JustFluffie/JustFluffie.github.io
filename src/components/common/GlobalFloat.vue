<template>
  <div 
    ref="floatEl"
    v-if="isActive" 
    class="global-float" 
    @click="handleClick"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
    @mousedown.prevent="startDrag"
    @touchstart="startDrag"
  >
    <slot>
      <img v-if="imageUrl" :src="imageUrl" alt="Float content">
      <div v-else class="default-content"></div>
    </slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  initialPosition: {
    type: Object,
    default: () => ({ x: 'auto', y: 100 }) // x can be 'auto' to position on the right
  },
  boundaryRef: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['click']);

const position = ref({ x: 0, y: 0 });
const dragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const posStart = ref({ x: 0, y: 0 });
const floatEl = ref(null);

const getBoundaryElement = () => {
  return props.boundaryRef;
}

onMounted(() => {
  const parent = getBoundaryElement();
  if (parent) {
    const xPos = props.initialPosition.x === 'auto' 
      ? parent.clientWidth - 80 
      : props.initialPosition.x;
    position.value = { x: xPos, y: props.initialPosition.y };
  }
});

watch(() => props.boundaryRef, (newParent) => {
  if (newParent) {
    const xPos = props.initialPosition.x === 'auto' 
      ? newParent.clientWidth - 80 
      : props.initialPosition.x;
    position.value = { x: xPos, y: props.initialPosition.y };
  }
});

const handleClick = () => {
  if (!dragging.value) {
    emit('click');
  }
};

const getEventPosition = (event) => {
  if (event.touches) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

const startDrag = (event) => {
  dragging.value = false;
  const { x, y } = getEventPosition(event);
  dragStart.value = { x, y };
  posStart.value = { ...position.value };

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
};

const onDrag = (event) => {
  const parent = getBoundaryElement();
  if (!parent) return;

  const { x, y } = getEventPosition(event);
  const dx = x - dragStart.value.x;
  const dy = y - dragStart.value.y;

  if (!dragging.value && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      dragging.value = true;
  }

  if (dragging.value) {
    event.preventDefault();
    const newX = posStart.value.x + dx;
    const newY = posStart.value.y + dy;
    
    const elWidth = floatEl.value?.offsetWidth || 70;
    const elHeight = floatEl.value?.offsetHeight || 70;

    if (elWidth > 0 && elHeight > 0) {
      position.value.x = Math.max(0, Math.min(parent.clientWidth - elWidth, newX));
      position.value.y = Math.max(0, Math.min(parent.clientHeight - elHeight, newY));
    }
  }
};

const endDrag = () => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchend', endDrag);
  
  setTimeout(() => {
    if (dragging.value) {
        dragging.value = false;
    }
  }, 50);
};

onUnmounted(() => {
  endDrag();
});
</script>

<style scoped>
.global-float {
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 12px;
  background: #333;
  z-index: 9999;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.global-float img, .default-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.default-content {
  background-color: #555;
}
</style>
