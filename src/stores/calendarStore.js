import { defineStore } from 'pinia';
import { ref, computed, watch, nextTick } from 'vue';
import { formatISO, addDays, isWithinInterval, parseISO } from 'date-fns';
// Import the new functions from the composable
import { 
  predictNextPeriod, 
  calculateCycleStats, 
  calculateDurationStats 
} from '@/composables/usePeriodTracking';

export const useCalendarStore = defineStore('calendar', () => {
  // --- Core Event Management ---
  const events = ref([]);
  const savedEvents = localStorage.getItem('calendarEvents');
  if (savedEvents) {
    events.value = JSON.parse(savedEvents);
  }

  const saveEventsToLocalStorage = () => {
    localStorage.setItem('calendarEvents', JSON.stringify(events.value));
  };

  const addEvent = (eventData) => {
    const newEvent = { id: Date.now(), ...eventData };
    events.value.push(newEvent);
    saveEventsToLocalStorage();
  };

  const removeEvent = (eventId) => {
    events.value = events.value.filter(event => event.id !== eventId);
    saveEventsToLocalStorage();
  };

  const updateEvent = (updatedEvent) => {
    const index = events.value.findIndex(event => event.id === updatedEvent.id);
    if (index !== -1) {
      events.value[index] = updatedEvent;
      saveEventsToLocalStorage();
    }
  };

  const getEventsByDate = computed(() => {
    return (date) => {
      const targetDate = new Date(date).setHours(0, 0, 0, 0);
      return events.value
        .filter(event => {
          if (!event.date) return false;
          const eventDate = new Date(event.date).setHours(0, 0, 0, 0);
          return eventDate === targetDate;
        })
        .sort((a, b) => {
          const aIsTodo = a.type === 'todo';
          const bIsTodo = b.type === 'todo';
          if (aIsTodo && bIsTodo) return (a.time || '00:00').localeCompare(b.time || '00:00');
          if (aIsTodo) return 1;
          if (bIsTodo) return -1;
          return a.id - b.id;
        });
    };
  });

  // --- New Period Tracking Logic ---
  const periodHistory = ref(JSON.parse(localStorage.getItem('periodHistory') || '[]'));

  watch(periodHistory, (newHistory) => {
    localStorage.setItem('periodHistory', JSON.stringify(newHistory));
  }, { deep: true });

  // --- Computed properties for stats and prediction ---
  const cycleStats = computed(() => calculateCycleStats(periodHistory.value));
  const durationStats = computed(() => calculateDurationStats(periodHistory.value));
  const predictedPeriod = computed(() => {
    if (periodHistory.value.length < 1) return null;

    const { average: avgCycle } = calculateCycleStats(periodHistory.value);
    const { average: avgDuration } = calculateDurationStats(periodHistory.value);
    const lastRecord = periodHistory.value[periodHistory.value.length - 1];

    const startDate = addDays(new Date(lastRecord.start), avgCycle);
    const endDate = addDays(startDate, avgDuration - 1);

    return {
      startDate: formatISO(startDate, { representation: 'date' }),
      endDate: formatISO(endDate, { representation: 'date' }),
    };
  });

  const recordPeriod = (startDate) => {
    const isAlreadyRecorded = periodHistory.value.some(rec => 
        isWithinInterval(parseISO(startDate), { start: parseISO(rec.start), end: parseISO(rec.end) })
    );
    if (isAlreadyRecorded) return;

    // Create a new record with the same start and end date, signifying an ongoing period.
    const newRecord = {
      start: startDate,
      end: startDate 
    };
    
    const updatedHistory = [...periodHistory.value, newRecord];
    setPeriodHistory(updatedHistory);
  };

  const endPeriod = (endDate) => {
    if (periodHistory.value.length === 0) return;

    const updatedHistory = [...periodHistory.value];
    const lastRecord = updatedHistory[updatedHistory.length - 1];

    // Ensure the end date is not before the start date
    if (parseISO(endDate) < parseISO(lastRecord.start)) {
      alert('结束日期不能早于开始日期。');
      return;
    }

    lastRecord.end = endDate;
    setPeriodHistory(updatedHistory);
  };

  const setPeriodHistory = (history) => {
    // Step 1: Update the source of truth. This will trigger computed properties to update.
    periodHistory.value = [...history]
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(-12);

    // Step 2: Wait for the next DOM update cycle. By this time, all computed properties
    // (like `predictedPeriod`) will have been re-calculated with the new history data.
    nextTick(() => {
      // Step 3: Clear all old markers.
      events.value = events.value.filter(e => e.type !== 'period_day' && e.type !== 'predicted_period_day');

      // Step 4: Add markers for actual periods from the now-updated history.
      periodHistory.value.forEach(record => {
        let currentDate = new Date(record.start);
        const endDate = new Date(record.end);
        while (currentDate <= endDate) {
          addEvent({
            type: 'period_day',
            title: '经期',
            date: formatISO(currentDate, { representation: 'date' }),
            icon: 'i-tabler-droplet-filled',
            color: 'red'
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      // Step 5: Add markers for the prediction using the now-fresh `predictedPeriod` computed property.
      if (predictedPeriod.value) {
        let predCurrentDate = new Date(predictedPeriod.value.startDate);
        const predEndDate = new Date(predictedPeriod.value.endDate);
        while (predCurrentDate <= predEndDate) {
          const dateStr = formatISO(predCurrentDate, { representation: 'date' });
          if (!events.value.some(e => e.date === dateStr && e.type === 'period_day')) {
            addEvent({
              type: 'predicted_period_day',
              title: '预测经期',
              date: dateStr,
              icon: 'i-tabler-droplet',
              color: 'pink'
            });
          }
          predCurrentDate.setDate(predCurrentDate.getDate() + 1);
        }
      }
    });
  };

  const toggleTodoStatus = (eventId) => {
    const event = events.value.find(e => e.id === eventId);
    if (event && event.type === 'todo') {
      event.done = !event.done;
      saveEventsToLocalStorage();
    }
  };

  return {
    events,
    addEvent,
    removeEvent,
    updateEvent,
    getEventsByDate,
    toggleTodoStatus,
    periodHistory,
    recordPeriod,
    endPeriod, // Expose the new action
    setPeriodHistory,
    // Expose the new computed properties
    cycleStats,
    durationStats,
    predictedPeriod,
  };
});
