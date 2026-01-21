<template>
  <app-layout :title="t('worldbook.title')">
    <template #action>
      <svg-icon name="plus" @click="worldBookStore.addNewWorldBook" class="header-action-icon" />
    </template>
    <draggable 
      v-model="worldBooks" 
      item-key="id" 
      handle=".book-drag-handle" 
      @end="onBookDragEnd"
      animation="200"
      ghost-class="ghost-card"
      :force-fallback="true"
    >
      <template #item="{ element: book, index: bookIndex }">
        <div class="card">
          <div class="card-header">
            <button class="book-drag-handle icon-btn"><svg-icon name="drag-handle" /></button>
            <span v-if="getPriorityDisplay(book.priority).label"
                  :style="{ color: getPriorityDisplay(book.priority).color, marginRight: '8px', fontWeight: 'bold', fontSize: '1.2em' }">
              {{ getPriorityDisplay(book.priority).label }}
            </span>
            <input type="text" :value="book.title" @input="updateBook(bookIndex, { title: $event.target.value })" :placeholder="t('worldbook.titlePlaceholder')" class="book-title-input" />
            <div class="header-controls">
              <button @click="updateBook(bookIndex, { collapsed: !book.collapsed })" class="collapse-btn icon-btn">
                <svg-icon name="chevron-down" class="collapse-arrow" :class="{ 'collapsed': book.collapsed }" />
              </button>
            </div>
          </div>
          <div v-if="!book.collapsed" class="card-content">
            <div class="content-controls">
              <div class="priority-selector">
                <span>{{ t('worldbook.priority') }}</span>
                <CustomSelect
                  class="priority-custom-select"
                  :modelValue="String(book.priority)"
                  @update:modelValue="worldBookStore.setPriority(bookIndex, $event)"
                  :options="priorityOptions"
                  textAlign="center"
                />
              </div>
              <div class="card-actions">
                <button @click="worldBookStore.addNewEntry(bookIndex)" class="add-entry-btn icon-btn">
                  <svg-icon name="plus" />
                </button>
                <button @click="openDeleteConfirmation('book', bookIndex)" class="delete-btn icon-btn">
                  <svg-icon name="trash" />
                </button>
              </div>
            </div>
            <draggable 
              v-model="book.entries" 
              item-key="id" 
              handle=".entry-drag-handle" 
              @end="onEntryDragEnd(bookIndex, $event)"
              animation="200"
              ghost-class="ghost-entry"
              :force-fallback="true"
            >
              <template #item="{ element: entry, index: entryIndex }">
                <div class="entry-item" :class="{ 'disabled': !book.enabled }">
                  <div class="entry-header">
                    <button class="entry-drag-handle icon-btn"><svg-icon name="drag-handle" /></button>
                    <input type="text" :value="entry.title" @input="updateEntry(bookIndex, entryIndex, { title: $event.target.value })" :placeholder="t('worldbook.entryTitlePlaceholder')" class="entry-title-input" />
                    <div class="entry-controls">
                      <button @click="openDeleteConfirmation('entry', bookIndex, entryIndex)" class="delete-btn icon-btn">
                        <svg-icon name="trash" />
                      </button>
                      <button @click="updateEntry(bookIndex, entryIndex, { collapsed: !entry.collapsed })" class="collapse-btn icon-btn">
                        <svg-icon name="chevron-down" class="collapse-arrow" :class="{ 'collapsed': entry.collapsed }" />
                      </button>
                    </div>
                  </div>
                  <div v-if="!entry.collapsed" class="entry-content">
                    <input type="text" :value="entry.notes" @input="updateEntry(bookIndex, entryIndex, { notes: $event.target.value })" :placeholder="t('worldbook.notesPlaceholder')" class="base-input" />
                    <textarea :value="entry.content" @input="updateEntry(bookIndex, entryIndex, { content: $event.target.value })" :placeholder="t('worldbook.contentPlaceholder')" class="base-input"></textarea>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </template>
    </draggable>

    <div v-if="!worldBooks.length" class="empty-state">
      <p>{{ t('worldbook.empty') }}</p>
      <p>{{ t('worldbook.emptyHint') }}</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-model:visible="showDeleteModal" :title="t('worldbook.confirmDelete')">
      <div style="text-align: center; padding-bottom: 25px;">
        {{ t('worldbook.confirmDeleteMsg') }}
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
import CustomSelect from '@/components/common/CustomSelect.vue';
import { useWorldBookStore } from '@/stores/worldBookStore';
import { storeToRefs } from 'pinia';
import draggable from 'vuedraggable';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/common/Modal.vue';

const { t } = useI18n();
const worldBookStore = useWorldBookStore();
const { sortedWorldBooks } = storeToRefs(worldBookStore);

const priorityOptions = computed(() => [
  { value: '1', label: t('worldbook.priorityOptions.high') },
  { value: '2', label: t('worldbook.priorityOptions.medium') },
  { value: '3', label: t('worldbook.priorityOptions.low') }
]);

const getPriorityDisplay = (priority) => {
  switch (String(priority)) {
    case '1':
      return { label: t('worldbook.priorityOptions.high'), color: 'red' };
    case '2':
      return { label: t('worldbook.priorityOptions.medium'), color: 'blue' };
    case '3':
      return { label: t('worldbook.priorityOptions.low'), color: 'green' };
    default:
      return { label: '', color: '' };
  }
};

// Use a computed property to allow v-model with draggable on a getter
const worldBooks = computed({
  get: () => sortedWorldBooks.value,
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
const deleteContext = ref({ type: null, bookIndex: null, entryIndex: null });

const openDeleteConfirmation = (type, bookIndex, entryIndex = null) => {
  deleteContext.value = { type, bookIndex, entryIndex };
  showDeleteModal.value = true;
};

const confirmDelete = () => {
  const { type, bookIndex, entryIndex } = deleteContext.value;
  if (type === 'book') {
    worldBookStore.deleteWorldBook(bookIndex);
  } else if (type === 'entry') {
    worldBookStore.deleteEntry(bookIndex, entryIndex);
  }
  cancelDelete();
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  deleteContext.value = { type: null, bookIndex: null, entryIndex: null };
};

const updateBook = (bookIndex, updates) => {
  worldBookStore.updateBook(bookIndex, updates);
};

const updateEntry = (bookIndex, entryIndex, updates) => {
  worldBookStore.updateEntry(bookIndex, entryIndex, updates);
};

const onEntryDragEnd = (bookIndex, event) => {
  worldBookStore.reorderEntries(bookIndex, { oldIndex: event.oldIndex, newIndex: event.newIndex });
};

const onBookDragEnd = (event) => {
  worldBookStore.onBookDragEnd({ oldIndex: event.oldIndex, newIndex: event.newIndex });
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
  font-weight: bold; /* Task 10 */
  min-width: 0;
}
.book-title-input:focus {
  outline: none;
}

.entry-title-input {
  flex-grow: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary); /* Task 10 */
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

/* Task 4: Disabled entry style */
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
