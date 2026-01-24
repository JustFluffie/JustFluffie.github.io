import { defineStore } from 'pinia';
import LZString from 'lz-string';

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: {}, // { charId: [schedule] }
  }),
  
  actions: {
    initData() {
      const savedData = localStorage.getItem('aiPhoneScheduleData');
      
      if (savedData) {
        try {
          const decompressed = LZString.decompressFromUTF16(savedData);
          const data = decompressed ? JSON.parse(decompressed) : JSON.parse(savedData);
          this.schedules = data.schedules || {};
        } catch (e) {
          console.error("Failed to parse schedule data", e);
          this.schedules = {};
        }
      } else {
        this.migrateFromSingleStore();
      }
    },

    migrateFromSingleStore() {
      try {
        const oldDataRaw = localStorage.getItem('aiPhoneSingleChatData');
        if (oldDataRaw) {
          const decompressed = LZString.decompressFromUTF16(oldDataRaw);
          const oldData = decompressed ? JSON.parse(decompressed) : JSON.parse(oldDataRaw);
          
          if (oldData && oldData.schedules) {
            this.schedules = oldData.schedules;
            this.saveData();
            console.log('Successfully migrated schedules from singleStore');
          }
        }
      } catch (e) {
        console.error("Failed to migrate schedule data", e);
      }
    },
    
    saveData() {
      setTimeout(() => {
        const data = {
          schedules: this.schedules
        };
        try {
          const jsonString = JSON.stringify(data);
          const compressed = LZString.compressToUTF16(jsonString);
          localStorage.setItem('aiPhoneScheduleData', compressed);
        } catch (e) {
          console.error('Error saving schedule data', e);
        }
      }, 0);
    },
    
    addSchedule(charId, content) {
      if (!this.schedules[charId]) {
        this.schedules[charId] = [];
      }
      this.schedules[charId].unshift({
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now()
      });
      this.saveData();
    },

    updateSchedule(charId, scheduleId, content) {
      if (!this.schedules[charId]) return;
      const schedule = this.schedules[charId].find(s => s.id === scheduleId);
      if (schedule) {
        schedule.content = content;
        this.saveData();
      }
    },

    getSchedules(charId) {
      return this.schedules[charId] || [];
    },

    deleteSchedule(charId, scheduleId) {
      if (this.schedules[charId]) {
        const index = this.schedules[charId].findIndex(s => s.id === scheduleId);
        if (index !== -1) {
          this.schedules[charId].splice(index, 1);
          this.saveData();
        }
      }
    },

    clearSchedules(charId) {
        if (this.schedules[charId]) {
            delete this.schedules[charId];
            this.saveData();
        }
    }
  }
});
