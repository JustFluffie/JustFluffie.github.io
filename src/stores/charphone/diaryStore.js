import { defineStore } from 'pinia';
import LZString from 'lz-string';

export const useDiaryStore = defineStore('diary', {
  state: () => ({
    diaries: {}, // { charId: [diary] }
  }),
  
  actions: {
    initData() {
      const savedData = localStorage.getItem('aiPhoneDiaryData');
      
      if (savedData) {
        try {
          const decompressed = LZString.decompressFromUTF16(savedData);
          const data = decompressed ? JSON.parse(decompressed) : JSON.parse(savedData);
          this.diaries = data.diaries || {};
        } catch (e) {
          console.error("Failed to parse diary data", e);
          this.diaries = {};
        }
      } else {
        // 尝试从旧的 singleStore 数据迁移
        this.migrateFromSingleStore();
      }
    },

    migrateFromSingleStore() {
      try {
        const oldDataRaw = localStorage.getItem('aiPhoneSingleChatData');
        if (oldDataRaw) {
          const decompressed = LZString.decompressFromUTF16(oldDataRaw);
          const oldData = decompressed ? JSON.parse(decompressed) : JSON.parse(oldDataRaw);
          
          if (oldData && oldData.diaries) {
            this.diaries = oldData.diaries;
            this.saveData();
            console.log('Successfully migrated diaries from singleStore');
          }
        }
      } catch (e) {
        console.error("Failed to migrate diary data", e);
      }
    },
    
    saveData() {
      setTimeout(() => {
        const data = {
          diaries: this.diaries
        };
        try {
          const jsonString = JSON.stringify(data);
          const compressed = LZString.compressToUTF16(jsonString);
          localStorage.setItem('aiPhoneDiaryData', compressed);
        } catch (e) {
          console.error('Error saving diary data', e);
        }
      }, 0);
    },
    
    addDiary(charId, content) {
      if (!this.diaries[charId]) {
        this.diaries[charId] = [];
      }
      this.diaries[charId].unshift({
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now()
      });
      this.saveData();
    },

    getDiaries(charId) {
      return this.diaries[charId] || [];
    },

    deleteDiary(charId, diaryId) {
      if (this.diaries[charId]) {
        const index = this.diaries[charId].findIndex(d => d.id === diaryId);
        if (index !== -1) {
          this.diaries[charId].splice(index, 1);
          this.saveData();
        }
      }
    },
    
    // 清空指定角色的日记（用于删除角色时）
    clearDiaries(charId) {
        if (this.diaries[charId]) {
            delete this.diaries[charId];
            this.saveData();
        }
    }
  }
});
