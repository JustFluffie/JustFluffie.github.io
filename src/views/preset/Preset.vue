<template>
  <app-layout :title="t('preset.title')">
    <template #action>
      <svg-icon name="plus" @click="presetStore.addNewPreset" class="header-action-icon" />
    </template>
    <draggable 
      v-model="presets" 
      item-key="id" 
      handle=".book-drag-handle" 
      @end="onPresetDragEnd"
      animation="200"
      ghost-class="ghost-card"
      :force-fallback="true"
    >
      <template #item="{ element: preset, index: presetIndex }">
        <div class="card">
          <div class="card-header">
            <button class="book-drag-handle icon-btn"><svg-icon name="drag-handle" /></button>
            <span v-if="getPriorityDisplay(preset.priority).label"
                  :style="{ color: getPriorityDisplay(preset.priority).color, marginRight: '8px', fontWeight: 'bold', fontSize: '1.2em' }">
              {{ getPriorityDisplay(preset.priority).label }}
            </span>
            <input type="text" :value="preset.title" @input="updatePreset(presetIndex, { title: $event.target.value })" :placeholder="t('preset.titlePlaceholder')" class="book-title-input" />
            <div class="header-controls">
              <button @click="updatePreset(presetIndex, { collapsed: !preset.collapsed })" class="collapse-btn icon-btn">
                <svg-icon name="chevron-down" class="collapse-arrow" :class="{ 'collapsed': preset.collapsed }" />
              </button>
            </div>
          </div>
          <div v-if="!preset.collapsed" class="card-content">
            <div class="content-controls">
              <div class="priority-selector">
                <span>{{ t('preset.priority') }}</span>
                <MultiSelect
                  class="priority-custom-select"
                  :modelValue="String(preset.priority)"
                  @update:modelValue="presetStore.setPriority(presetIndex, $event)"
                  :options="priorityOptions"
                  :multiple="false"
                  labelKey="label"
                  valueKey="value"
                  textAlign="center"
                  selectorWidth="70px"
                />
              </div>
              <div class="card-actions">
                <button @click="presetStore.addNewEntry(presetIndex)" class="add-entry-btn icon-btn">
                  <svg-icon name="plus" />
                </button>
                <button @click="openDeleteConfirmation('preset', presetIndex)" class="delete-btn icon-btn">
                  <svg-icon name="trash" />
                </button>
              </div>
            </div>
            <draggable 
              v-model="preset.entries" 
              item-key="id" 
              handle=".entry-drag-handle" 
              @end="onEntryDragEnd(presetIndex, $event)"
              animation="200"
              ghost-class="ghost-entry"
              :force-fallback="true"
            >
              <template #item="{ element: entry, index: entryIndex }">
                <div class="entry-item" :class="{ 'disabled': !preset.enabled }">
                  <div class="entry-header">
                    <button class="entry-drag-handle icon-btn"><svg-icon name="drag-handle" /></button>
                    <input type="text" :value="entry.title" @input="updateEntry(presetIndex, entryIndex, { title: $event.target.value })" :placeholder="t('preset.entryTitlePlaceholder')" class="entry-title-input" />
                    <div class="entry-controls">
                      <button @click="openDeleteConfirmation('entry', presetIndex, entryIndex)" class="delete-btn icon-btn">
                        <svg-icon name="trash" />
                      </button>
                      <button @click="updateEntry(presetIndex, entryIndex, { collapsed: !entry.collapsed })" class="collapse-btn icon-btn">
                        <svg-icon name="chevron-down" class="collapse-arrow" :class="{ 'collapsed': entry.collapsed }" />
                      </button>
                    </div>
                  </div>
                  <div v-if="!entry.collapsed" class="entry-content">
                    <input type="text" :value="entry.notes" @input="updateEntry(presetIndex, entryIndex, { notes: $event.target.value })" :placeholder="t('preset.notesPlaceholder')" class="base-input" />
                    <textarea :value="entry.content" @input="updateEntry(presetIndex, entryIndex, { content: $event.target.value })" :placeholder="t('preset.contentPlaceholder')" class="base-input"></textarea>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </template>
    </draggable>

    <div v-if="!presets.length" class="empty-state">
      <p>{{ t('preset.empty') }}</p>
      <p>{{ t('preset.emptyHint') }}</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-model:visible="showDeleteModal" :title="t('preset.confirmDelete')">
      <div style="text-align: center; padding-bottom: 25px;">
        {{ t('preset.confirmDeleteMsg') }}
      </div>
      <template #footer>
        <button @click="cancelDelete" class="modal-btn cancel">{{ t('cancel') }}</button>
        <button @click="confirmDelete" class="modal-btn danger">{{ t('delete') }}</button>
      </template>
    </Modal>
  </app-layout>
</template>

<script setup>
import AppLayout from '@/components/common/AppLayout.vue';
import SvgIcon from '@/components/common/SvgIcon.vue';
import MultiSelect from '@/components/common/MultiSelect.vue';
import { usePresetStore } from '@/stores/presetStore';
import { storeToRefs } from 'pinia';
import draggable from 'vuedraggable';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/common/Modal.vue';

const { t } = useI18n();
const presetStore = usePresetStore();
const { sortedPresets } = storeToRefs(presetStore);

const priorityOptions = computed(() => [
  { value: '1', label: t('preset.priorityOptions.high') },
  { value: '2', label: t('preset.priorityOptions.medium') },
  { value: '3', label: t('preset.priorityOptions.low') }
]);

const getPriorityDisplay = (priority) => {
  switch (String(priority)) {
    case '1':
      return { label: t('preset.priorityOptions.high'), color: 'red' };
    case '2':
      return { label: t('preset.priorityOptions.medium'), color: 'blue' };
    case '3':
      return { label: t('preset.priorityOptions.low'), color: 'green' };
    default:
      return { label: '', color: '' };
  }
};

// Use a computed property to allow v-model with draggable on a getter
const presets = computed({
  get: () => sortedPresets.value,
  set: (value) => {
    // This is tricky. We can't directly set the sorted list.
    // Instead, we'll find the moved item and its new position relative to priority.
    // For simplicity, we'll delegate reordering to a new store action.
    // This setter is mainly to satisfy vuedraggable's requirement.
    // The @end event is the source of truth.
  }
});

// Modal state
const showDeleteModal = ref(false);
const deleteContext = ref({ type: null, presetIndex: null, entryIndex: null });

const openDeleteConfirmation = (type, presetIndex, entryIndex = null) => {
  deleteContext.value = { type, presetIndex, entryIndex };
  showDeleteModal.value = true;
};

const confirmDelete = () => {
  const { type, presetIndex, entryIndex } = deleteContext.value;
  if (type === 'preset') {
    presetStore.deletePreset(presetIndex);
  } else if (type === 'entry') {
    presetStore.deleteEntry(presetIndex, entryIndex);
  }
  cancelDelete();
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  deleteContext.value = { type: null, presetIndex: null, entryIndex: null };
};

const updatePreset = (presetIndex, updates) => {
  presetStore.updatePreset(presetIndex, updates);
};

const updateEntry = (presetIndex, entryIndex, updates) => {
  presetStore.updateEntry(presetIndex, entryIndex, updates);
};

const onEntryDragEnd = (presetIndex, event) => {
  presetStore.reorderEntries(presetIndex, { oldIndex: event.oldIndex, newIndex: event.newIndex });
};

const onPresetDragEnd = (event) => {
  presetStore.onPresetDragEnd({ oldIndex: event.oldIndex, newIndex: event.newIndex });
};
</script>

<style scoped>
.card {
  background: var(--bg-white);
  border-radius: var(--app-radius);
  margin-bottom: 15px;
  overflow: hidden;
  padding: 15px;
}

.card-header, .entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
}

.book-title-input {
  flex-grow: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1.2em;
  font-weight: bold;
  min-width: 0;
}
.book-title-input:focus {
  outline: none;
}

.entry-title-input {
  flex-grow: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1em;
  min-width: 0;
}
.entry-title-input:focus {
  outline: none;
}

.header-controls, .entry-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  background: transparent;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--text-primary);
}

.icon-btn .svg-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2.2;
}

.header-action-icon {
  cursor: pointer;
}

.delete-btn.icon-btn {
  color: var(--danger-color);
}

.add-entry-btn.icon-btn {
  color: var(--text-primary);
}


.card-content {
  padding: 10px 0 0 5px;
  border-top: 1px solid var(--border-color);
}

.content-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.priority-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.priority-custom-select {
  width: 70px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-item {
  border: 1px solid var(--border-color);
  background-color: var(--bg-white);
  border-radius: 8px;
  padding: 10px;
  margin-top: 10px;
  transition: opacity 0.3s ease;
}

.entry-item.disabled {
  opacity: 0.5;
  pointer-events: none;
  background-color: var(--bg-light);
}
.entry-item.disabled .simple-switch {
  background-color: #E5E5EA !important;
}


.book-drag-handle, .entry-drag-handle {
  cursor: grab;
}
.book-drag-handle:active, .entry-drag-handle:active {
  cursor: grabbing;
}

.entry-content {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  text-align: center;
  margin-top: 50px;
  color: var(--text-tertiary);
  font-size: 1.1em;
}

.ghost-card {
  opacity: 0.5;
  background: var(--bg-light);
  border: 2px dashed var(--primary-color);
}

.ghost-entry {
  opacity: 0.5;
  background: var(--bg-light);
  border: 1px dashed var(--primary-color);
}
</style>
