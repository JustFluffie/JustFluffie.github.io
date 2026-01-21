import { defineStore } from 'pinia';

export const usePresetStore = defineStore('preset', {
  state: () => ({
    presets: JSON.parse(localStorage.getItem('presets') || '[]').map((preset, index) => {
      if (preset.priority === 'front') preset.priority = 1;
      if (preset.priority === 'middle') preset.priority = 2;
      if (preset.priority === 'back') preset.priority = 3;
      if (typeof preset.priority !== 'number') preset.priority = 2;
      // Add order if it doesn't exist for migration
      if (typeof preset.order !== 'number') {
        preset.order = index;
      }
      return preset;
    }),
    nextId: parseInt(localStorage.getItem('presetNextId') || '1'),
  }),
  getters: {
    sortedPresets: (state) => {
      return [...state.presets].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (a.order || 0) - (b.order || 0);
      });
    },
  },
  actions: {
    _saveToLocalStorage() {
      localStorage.setItem('presets', JSON.stringify(this.presets));
      localStorage.setItem('presetNextId', this.nextId.toString());
    },
    // Helper to find the real preset from a sorted index
    _findPresetBySortedIndex(sortedIndex) {
        const sortedId = this.sortedPresets[sortedIndex]?.id;
        if (sortedId === undefined) return null;
        return this.presets.find(b => b.id === sortedId);
    },
    addNewPreset() {
      const newPreset = {
        id: this.nextId++,
        title: `新的预设 ${this.presets.length + 1}`,
        enabled: true,
        collapsed: false,
        priority: 2, // 1: 前, 2: 中, 3: 后
        order: Date.now(),
        entries: [],
      };
      this.presets.push(newPreset);
      this._saveToLocalStorage();
    },
    updatePreset(sortedIndex, updates) {
      const preset = this._findPresetBySortedIndex(sortedIndex);
      if (!preset) return;

      // Handle master switch logic
      if (updates.enabled === false && preset.enabled === true) {
        preset.entries.forEach(entry => {
          entry._beforeDisableEnabled = entry.enabled;
        });
      } else if (updates.enabled === true && preset.enabled === false) {
        preset.entries.forEach(entry => {
          if (typeof entry._beforeDisableEnabled === 'boolean') {
            entry.enabled = entry._beforeDisableEnabled;
            delete entry._beforeDisableEnabled;
          }
        });
      }
      
      Object.assign(preset, updates);
      this._saveToLocalStorage();
    },
    deletePreset(sortedIndex) {
        const presetId = this.sortedPresets[sortedIndex]?.id;
        if (presetId === undefined) return;
        const index = this.presets.findIndex(b => b.id === presetId);
        if (index > -1) {
            this.presets.splice(index, 1);
            this._saveToLocalStorage();
        }
    },
    setPriority(sortedIndex, priority) {
      const preset = this._findPresetBySortedIndex(sortedIndex);
      if (preset) {
        preset.priority = Number(priority);
        this._saveToLocalStorage();
      }
    },
    addNewEntry(sortedIndex) {
      const preset = this._findPresetBySortedIndex(sortedIndex);
      if (!preset) return;

      preset.entries.push({
        id: this.nextId++,
        title: `新条目 ${preset.entries.length + 1}`,
        notes: '',
        content: '',
        enabled: true,
        collapsed: false,
      });
      this._saveToLocalStorage();
    },
    updateEntry(sortedIndex, entryIndex, updatedEntry) {
        const preset = this._findPresetBySortedIndex(sortedIndex);
        if (preset && preset.entries[entryIndex]) {
            preset.entries[entryIndex] = { ...preset.entries[entryIndex], ...updatedEntry };
            this._saveToLocalStorage();
        }
    },
    deleteEntry(sortedIndex, entryIndex) {
      const preset = this._findPresetBySortedIndex(sortedIndex);
      if (preset) {
        preset.entries.splice(entryIndex, 1);
        this._saveToLocalStorage();
      }
    },
    reorderEntries(sortedIndex, { oldIndex, newIndex }) {
        // v-model in the component already updates the array order.
        // We just need to save the new state.
        this._saveToLocalStorage();
    },
    onPresetDragEnd({ oldIndex, newIndex }) {
      if (oldIndex === newIndex) return;

      const sortedList = this.sortedPresets;
      const movedItem = sortedList[oldIndex];
      const presetToMove = this.presets.find(b => b.id === movedItem.id);
      if (!presetToMove) return;

      const reorderedSortedList = [...sortedList];
      const [itemToMove] = reorderedSortedList.splice(oldIndex, 1);
      reorderedSortedList.splice(newIndex, 0, itemToMove);

      const prevItem = reorderedSortedList[newIndex - 1];
      const nextItem = reorderedSortedList[newIndex + 1];

      let newPriority;
      let newOrder;

      if (prevItem && nextItem) {
        if (prevItem.priority === nextItem.priority) {
          newPriority = prevItem.priority;
          newOrder = (prevItem.order + nextItem.order) / 2;
        } else if (prevItem.priority < nextItem.priority) {
          newPriority = prevItem.priority;
          newOrder = prevItem.order + 10;
        } else {
          newPriority = nextItem.priority;
          newOrder = nextItem.order - 10;
        }
      } else if (prevItem) {
        newPriority = prevItem.priority;
        newOrder = prevItem.order + 10;
      } else if (nextItem) {
        newPriority = nextItem.priority;
        newOrder = nextItem.order - 10;
      } else return;

      presetToMove.priority = newPriority;
      presetToMove.order = newOrder;
      this._saveToLocalStorage();
    },

    getPresetContext(entryIds) {
      if (!entryIds || entryIds.length === 0) return '';
      
      // 找到包含选中条目的预设
      // 我们需要保持预设的顺序（优先级），并在预设内保持条目的顺序
      
      // 1. 过滤并排序预设
      const sortedPresets = this.sortedPresets.filter(p => p.enabled);
      
      let context = '';
      
      sortedPresets.forEach(preset => {
        // 2. 在每个预设中，找到被选中且启用的条目
        const activeEntries = preset.entries.filter(e => 
          e.enabled && entryIds.some(id => String(id) === String(e.id))
        );
        
        if (activeEntries.length > 0) {
          context += `[预设: ${preset.title}]\n`;
          activeEntries.forEach(entry => {
            context += `【${entry.title}】: ${entry.content}\n`;
          });
          context += '\n';
        }
      });
      
      return context.trim();
    },
  },
});
