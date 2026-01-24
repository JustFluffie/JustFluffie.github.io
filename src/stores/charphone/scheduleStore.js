import { defineStore } from 'pinia';

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: {}, // { charId: [schedule] }
  }),
  
  actions: {
    addSchedule(charId, content) {
      if (!this.schedules[charId]) {
        this.schedules[charId] = [];
      }
      this.schedules[charId].unshift({
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now()
      });
    },

    updateSchedule(charId, scheduleId, content) {
      if (!this.schedules[charId]) return;
      const schedule = this.schedules[charId].find(s => s.id === scheduleId);
      if (schedule) {
        schedule.content = content;
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
        }
      }
    },

    clearSchedules(charId) {
        if (this.schedules[charId]) {
            delete this.schedules[charId];
        }
    }
  },
  persist: true,
});
