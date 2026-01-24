import { defineStore } from 'pinia';

export const useMemoStore = defineStore('memo', {
  state: () => ({
    memos: {}, // { charId: [memo] }
  }),
  
  actions: {
    addMemo(charId, content) {
      if (!this.memos[charId]) {
        this.memos[charId] = [];
      }
      // 备忘录是多条，所以 content 应该是数组
      const newMemos = content.map(item => ({
        id: Date.now().toString() + Math.random(), // Add random to avoid collision
        content: item,
        timestamp: Date.now()
      }));
      this.memos[charId].unshift(...newMemos);
    },

    updateMemo(charId, memoId, content) {
      if (!this.memos[charId]) return;
      const memo = this.memos[charId].find(m => m.id === memoId);
      if (memo) {
        memo.content = content;
      }
    },

    getMemos(charId) {
      return this.memos[charId] || [];
    },

    deleteMemo(charId, memoId) {
      if (this.memos[charId]) {
        const index = this.memos[charId].findIndex(m => m.id === memoId);
        if (index !== -1) {
          this.memos[charId].splice(index, 1);
        }
      }
    },

    clearMemos(charId) {
        if (this.memos[charId]) {
            this.memos[charId] = [];
        }
    }
  },
  persist: true,
});
