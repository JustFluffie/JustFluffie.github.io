import { defineStore } from 'pinia';

export const useDiaryStore = defineStore('diary', {
  state: () => ({
    diaries: {}, // { charId: [diary] }
  }),
  
  actions: {
    addDiary(charId, content) {
      if (!this.diaries[charId]) {
        this.diaries[charId] = [];
      }
      this.diaries[charId].unshift({
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now()
      });
    },

    getDiaries(charId) {
      return this.diaries[charId] || [];
    },

    deleteDiary(charId, diaryId) {
      if (this.diaries[charId]) {
        const index = this.diaries[charId].findIndex(d => d.id === diaryId);
        if (index !== -1) {
          this.diaries[charId].splice(index, 1);
        }
      }
    },
    
    // 清空指定角色的日记（用于删除角色时）
    clearDiaries(charId) {
        if (this.diaries[charId]) {
            delete this.diaries[charId];
        }
    }
  },
  persist: true,
});
