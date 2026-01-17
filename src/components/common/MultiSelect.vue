<template>
  <div class="multi-select-wrapper" ref="selectWrapper" :style="{ width: selectorWidth }">
    <div class="custom-select-trigger" :class="`text-${textAlign}`" @click="toggleDropdown">
      <span>{{ selectionText }}</span>
      <div class="arrow-icon" :class="{ open: isOpen }">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
    <Teleport :to="teleportTarget">
      <transition name="slide-fade">
        <div v-if="isOpen" class="custom-options" :style="dropdownStyle">
          <template v-if="isGrouped">
            <div v-for="group in options" :key="group[valueKey]" class="group-item">
              <div class="group-header" @click="toggleGroup(group[valueKey])">
                <input v-if="multiple" type="checkbox" :checked="isGroupSelected(group)" @change="selectGroup(group, $event.target.checked)" @click.stop />
                <span class="group-title">{{ group[labelKey] }}</span>
                <svg class="collapse-arrow" :class="{ collapsed: !isGroupOpen(group[valueKey]) }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div v-if="isGroupOpen(group[valueKey])" class="option-list">
                <div 
                  v-for="option in group[childrenKey]" 
                  :key="option[valueKey]" 
                  class="option-item"
                  :class="{ 'is-selected': isSelected(option[valueKey]), 'clickable': !multiple }"
                  @click="!multiple && selectOption(option[valueKey])"
                >
                  <input v-if="multiple" type="checkbox" :checked="isSelected(option[valueKey])" @change="selectOption(option[valueKey], $event.target.checked)" />
                  <span>{{ option[labelKey] }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div 
              v-for="option in options" 
              :key="option[valueKey]" 
              class="option-item flat-option"
              :class="{ 'is-selected': isSelected(option[valueKey]), 'clickable': !multiple }"
              @click="!multiple && selectOption(option[valueKey])"
            >
              <input v-if="multiple" type="checkbox" :checked="isSelected(option[valueKey])" @change="selectOption(option[valueKey], $event.target.checked)" />
              <span>{{ option[labelKey] }}</span>
            </div>
          </template>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Array, String, Number],
    required: true,
    default: () => [] // Array of selected IDs or single ID
  },
  options: {
    type: Array,
    default: () => [] // Grouped or flat data
  },
  multiple: {
    type: Boolean,
    default: true
  },
  textAlign: {
    type: String,
    default: 'right' // 'left' or 'right'
  },
  selectorWidth: {
    type: String,
    default: 'auto'
  },
  dropdownWidth: {
    type: String,
    default: 'auto'
  },
  // Field mapping props
  labelKey: {
    type: String,
    default: 'title'
  },
  valueKey: {
    type: String,
    default: 'id'
  },
  childrenKey: {
    type: String,
    default: 'entries'
  },
  placeholder: {
    type: String,
    default: '未选择'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const openGroups = ref([]);
const selectWrapper = ref(null);
const dropdownStyle = ref({});
const teleportTarget = ref('body');

const isGrouped = computed(() => {
  return props.options.length > 0 && props.childrenKey in props.options[0];
});

const selectionText = computed(() => {
  if (props.multiple) {
    if (!Array.isArray(props.modelValue) || props.modelValue.length === 0) return props.placeholder;
    return `已选择 ${props.modelValue.length} 个条目`;
  } else {
    if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return props.placeholder;
    
    // Find label for single selection
    if (isGrouped.value) {
      for (const group of props.options) {
        const found = (group[props.childrenKey] || []).find(opt => opt[props.valueKey] === props.modelValue);
        if (found) return found[props.labelKey];
      }
    } else {
      const found = props.options.find(opt => opt[props.valueKey] === props.modelValue);
      if (found) return found[props.labelKey];
    }
    return props.modelValue;
  }
});

const isSelected = (id) => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(id);
  } else {
    return props.modelValue === id;
  }
};

const isGroupOpen = (id) => openGroups.value.includes(id);

const toggleGroup = (id) => {
  if (isGroupOpen(id)) {
    openGroups.value = openGroups.value.filter(gId => gId !== id);
  } else {
    openGroups.value.push(id);
  }
};

const isGroupSelected = (group) => {
  const children = group[props.childrenKey] || [];
  const ids = children.map(c => c[props.valueKey]);
  return ids.length > 0 && ids.every(id => props.modelValue.includes(id));
};

const selectGroup = (group, isSelected) => {
  const children = group[props.childrenKey] || [];
  const ids = children.map(c => c[props.valueKey]);
  let currentSelection = [...props.modelValue];
  
  if (isSelected) {
    ids.forEach(id => {
      if (!currentSelection.includes(id)) {
        currentSelection.push(id);
      }
    });
  } else {
    currentSelection = currentSelection.filter(id => !ids.includes(id));
  }
  emit('update:modelValue', currentSelection);
};

const selectOption = (id, isSelected) => {
  if (props.multiple) {
    let currentSelection = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    if (isSelected) {
      if (!currentSelection.includes(id)) {
        currentSelection.push(id);
      }
    } else {
      currentSelection = currentSelection.filter(val => val !== id);
    }
    emit('update:modelValue', currentSelection);
  } else {
    emit('update:modelValue', id);
    isOpen.value = false;
  }
};

const updatePosition = () => {
  if (selectWrapper.value) {
    const rect = selectWrapper.value.getBoundingClientRect();
    let positionStyle = {};

    if (teleportTarget.value === '.phone-frame') {
      const phoneFrame = document.querySelector('.phone-frame');
      if (phoneFrame) {
        const frameRect = phoneFrame.getBoundingClientRect();
        positionStyle = {
          position: 'absolute',
          top: `${rect.bottom - frameRect.top + 4}px`,
        };
        if (props.textAlign === 'right') {
          positionStyle.right = `${frameRect.right - rect.right}px`;
        } else {
          positionStyle.left = `${rect.left - frameRect.left}px`;
        }
      }
    } else {
      positionStyle = {
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
      };
      if (props.textAlign === 'right') {
        positionStyle.right = `${window.innerWidth - rect.right}px`;
      } else {
        positionStyle.left = `${rect.left}px`;
      }
    }

    dropdownStyle.value = {
      ...positionStyle,
      minWidth: props.dropdownWidth === 'auto' ? `${rect.width}px` : 'none',
      width: props.dropdownWidth,
      zIndex: 9999
    };
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

const handleClickOutside = (event) => {
  const isClickInsideWrapper = selectWrapper.value && selectWrapper.value.contains(event.target);
  const isClickInsideDropdown = event.target.closest('.custom-options');
  if (!isClickInsideWrapper && !isClickInsideDropdown) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true);
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});
</script>

<style scoped>
.multi-select-wrapper {
  position: relative;
  width: auto;
  min-width: 80px;
  font-size: 14px;
}
.custom-select-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
  justify-content: space-between;
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
.arrow-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  line-height: 1;
  flex-shrink: 0;
}
.arrow-icon.open {
  transform: rotate(90deg);
}
.custom-options {
  max-height: 300px;
  overflow-y: auto;
  background-color: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-medium);
  padding: 5px;
}
.group-item {
  margin-bottom: 5px;
}
.group-header {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  background-color: var(--bg-light);
  border-radius: 4px;
}
.group-header:hover {
  background-color: var(--border-color);
}
.group-title {
  flex-grow: 1;
  margin: 0 10px;
  font-weight: bold;
}
.option-list {
  padding-left: 20px;
}
.option-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
.option-item.flat-option {
  padding: 8px 10px;
}
.option-item.clickable {
  cursor: pointer;
}
.option-item.clickable:hover {
  background-color: var(--bg-light);
}
.option-item.is-selected {
  font-weight: bold;
  color: var(--primary-color);
}
.option-item input {
  margin-right: 10px;
}
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
