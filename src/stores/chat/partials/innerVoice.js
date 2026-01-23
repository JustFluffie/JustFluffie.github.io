export const innerVoiceState = {
  // 新增：实时心声
  innerVoices: {}, // { charId: [voice] }
  currentInnerVoice: {}, // { charId: voice }
};

export const innerVoiceActions = {
  // --- 心声 Actions ---
  addInnerVoice(charId, voiceData) {
    if (!this.innerVoices[charId]) {
      this.innerVoices[charId] = [];
    }
    
    // 添加时间戳和唯一ID
    const newVoice = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...voiceData
    };

    // 更新当前心声用于实时显示
    this.currentInnerVoice[charId] = newVoice;

    // 存入历史记录
    this.innerVoices[charId].unshift(newVoice);

    // 保持最多20条历史记录
    if (this.innerVoices[charId].length > 20) {
      this.innerVoices[charId].pop();
    }

    this.saveData();
  },

  clearInnerVoices(charId) {
    if (this.innerVoices[charId]) {
      this.innerVoices[charId] = [];
      this.currentInnerVoice[charId] = null;
      this.saveData();
    }
  },

  deleteInnerVoice(charId, voiceId) {
    if (this.innerVoices[charId]) {
      const index = this.innerVoices[charId].findIndex(v => v.id === voiceId);
      if (index !== -1) {
        this.innerVoices[charId].splice(index, 1);
        
        // 如果删除的是当前显示的心声，更新为最新的（如果有）
        if (this.currentInnerVoice[charId] && this.currentInnerVoice[charId].id === voiceId) {
             this.currentInnerVoice[charId] = null;
        }
        
        this.saveData();
      }
    }
  },

  // 切换心声收藏状态
  toggleThoughtFavorite(charId, thought) {
    if (!this.favorites) this.favorites = [];
    
    const index = this.favorites.findIndex(f => 
      String(f.charId) === String(charId) && 
      f.type === 'thoughts' && 
      f.originalId === thought.id
    );

    if (index !== -1) {
      // 已收藏，移除
      this.favorites.splice(index, 1);
    } else {
      // 未收藏，添加
      this.favorites.unshift({
        id: Date.now().toString(),
        charId: charId,
        type: 'thoughts',
        originalId: thought.id,
        content: thought, // 存储完整的心声对象
        timestamp: Date.now()
      });
    }
    this.saveData();
  },
};
