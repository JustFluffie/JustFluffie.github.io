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

    getPresetContext(selectedIds) {
      if (!selectedIds || selectedIds.length === 0) return '';

      const contextByPreset = {};

      // 遍历所有预设和条目，构建一个快速查找表
      const entryMap = new Map();
      this.presets.forEach(preset => {
        preset.entries.forEach(entry => {
          entryMap.set(entry.id, { ...entry, presetTitle: preset.title, presetPriority: preset.priority, presetOrder: preset.order });
        });
      });

      selectedIds.forEach(id => {
        // 检查这个 ID 是否是一个条目的 ID
        if (entryMap.has(id)) {
          const entry = entryMap.get(id);
          if (entry.enabled) {
            if (!contextByPreset[entry.presetTitle]) {
              contextByPreset[entry.presetTitle] = {
                priority: entry.presetPriority,
                order: entry.presetOrder,
                entries: []
              };
            }
            contextByPreset[entry.presetTitle].entries.push(`${entry.title}: ${entry.content}`);
          }
        } else {
          // 否则，假设它是一个预设的 ID
          const preset = this.presets.find(p => p.id === id && p.enabled);
          if (preset) {
            const activeEntries = preset.entries.filter(e => e.enabled);
            if (activeEntries.length > 0) {
              if (!contextByPreset[preset.title]) {
                contextByPreset[preset.title] = {
                  priority: preset.priority,
                  order: preset.order,
                  entries: []
                };
              }
              activeEntries.forEach(entry => {
                contextByPreset[preset.title].entries.push(`${entry.title}: ${entry.content}`);
              });
            }
          }
        }
      });

      // 将收集到的内容排序并格式化
      const sortedPresetTitles = Object.keys(contextByPreset).sort((a, b) => {
        const presetA = contextByPreset[a];
        const presetB = contextByPreset[b];
        if (presetA.priority !== presetB.priority) return presetA.priority - presetB.priority;
        return (presetA.order || 0) - (presetB.order || 0);
      });

      let finalContext = '';
      sortedPresetTitles.forEach(title => {
        const presetData = contextByPreset[title];
        if (presetData.entries.length > 0) {
          finalContext += `[${title}]\n`;
          finalContext += presetData.entries.join('\n') + '\n\n';
        }
      });

      return finalContext.trim();
    },
  },
});
