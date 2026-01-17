<template>
  <div class="custom-select-wrapper" ref="selectWrapper">
    <div class="custom-select-trigger" :class="`text-${textAlign}`" @click="toggleDropdown">
      <span>{{ selectedOption ? selectedOption.label : '请选择' }}</span>
      <div class="arrow-icon" :class="{ open: isOpen }">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
    <Teleport :to="teleportTarget">
      <transition name="slide-fade">
        <div 
          v-if="isOpen" 
          class="custom-options"
          :style="dropdownStyle"
        >
          <div
            v-for="option in options"
            :key="option.value"
            class="custom-option"
            :class="{ selected: modelValue === option.value }"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [] // { value: '1', label: 'Option 1' }
  },
  modelValue: {
    type: [String, Number],
    required: true
  },
  textAlign: {
    type: String,
    default: 'right' // 'left' or 'right'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const selectWrapper = ref(null);
const dropdownStyle = ref({});
const teleportTarget = ref('body');

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue);
});

const updatePosition = () => {
  if (selectWrapper.value) {
    const rect = selectWrapper.value.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const isRightSide = rect.left + rect.width / 2 > screenWidth / 2;

    let style = {
      position: 'absolute',
      top: `${rect.bottom + 4}px`,
      width: 'auto', // Let width be determined by content
      zIndex: 9999
    };

    if (isRightSide) {
      style.right = `${screenWidth - rect.right}px`;
      style.left = 'auto';
    } else {
      style.left = `${rect.left}px`;
      style.right = 'auto';
    }
    
    // Handle teleporting inside phone-frame
    if (teleportTarget.value === '.phone-frame') {
      const phoneFrame = document.querySelector('.phone-frame');
      if (phoneFrame) {
        const frameRect = phoneFrame.getBoundingClientRect();
        style.top = `${rect.bottom - frameRect.top + 4}px`;
        if (isRightSide) {
          style.right = `${frameRect.right - rect.right}px`;
          style.left = 'auto';
        } else {
          style.left = `${rect.left - frameRect.left}px`;
          style.right = 'auto';
        }
      }
    }

    dropdownStyle.value = style;
  }
};

const toggleDropdown = async () => {
  if (!isOpen.value) {
    const phoneFrame = document.querySelector('.phone-frame');
    teleportTarget.value = phoneFrame ? '.phone-frame' : 'body';
    
    isOpen.value = true;
    await nextTick();
    updatePosition();
  } else {
    isOpen.value = false;
  }
};

const selectOption = (option) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  // Check if click is inside the wrapper
  const isClickInsideWrapper = selectWrapper.value && selectWrapper.value.contains(event.target);
  
  // Check if click is inside the dropdown (since it's teleported to body)
  // We can't easily check this with a ref since it's teleported and v-if'd
  // But we can check if the target is inside .custom-options
  const isClickInsideDropdown = event.target.closest('.custom-options');

  if (!isClickInsideWrapper && !isClickInsideDropdown) {
    isOpen.value = false;
  }
};

// Handle scroll and resize to update position or close
const handleScrollOrResize = () => {
  if (isOpen.value) {
    // Option 1: Close on scroll/resize (simpler)
    isOpen.value = false;
    
    // Option 2: Update position (better UX but more complex)
    // updatePosition();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleScrollOrResize, true); // true for capturing scroll on any element
  window.addEventListener('resize', handleScrollOrResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleScrollOrResize, true);
  window.removeEventListener('resize', handleScrollOrResize);
});
</script>

<style scoped>
.custom-select-wrapper {
  position: relative;
  width: auto;
  min-width: 80px;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
  justify-content: space-between; /* Ensure space between text and icon */
  background: transparent;
  border: none;
  padding: 0;
  height: auto;
}

.custom-select-trigger.text-left {
  text-align: left;
}

.custom-select-trigger.text-right {
  text-align: right;
}

.custom-select-trigger span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1; /* Allow text to take available space */
}

.arrow-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  line-height: 1;
  flex-shrink: 0; /* Prevent icon from shrinking */
}

.arrow-icon.open {
  transform: rotate(90deg);
}

.custom-options {
  /* Position is handled by inline style */
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--bg-white);
  border: 1px solid var(--text-quaternary);
  border-radius: 8px;
  box-shadow: var(--shadow-medium); /* Use medium shadow for floating element */
}

.custom-option {
  padding: 10px 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
  white-space: nowrap; /* Prevent text from wrapping */
}

.custom-option:hover {
  background-color: var(--bg-light);
}

.custom-option.selected {
  font-weight: 600;
  color: var(--text-primary);
}

/* Transition for dropdown */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

