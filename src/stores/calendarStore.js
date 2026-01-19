import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { formatISO, parseISO, eachDayOfInterval, addDays } from 'date-fns';
import { useSingleStore } from '@/stores/chat/singleStore';
import {
  getPeriodStatusForDate,
  predictFuturePeriods,
  calculateCycleStats,
  calculateDurationStats
} from '@/composables/usePeriodTracking';

export const useCalendarStore = defineStore('calendar', () => {
  // --- Core Event Management ---
  const events = ref(JSON.parse(localStorage.getItem('calendarEvents') || '[]'));
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
      return events.value.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date).setHours(0, 0, 0, 0);
        return eventDate === targetDate;
      });
    };
  });

  // --- New Period Tracking Logic ---
  const periodHistory = ref(JSON.parse(localStorage.getItem('periodHistory') || '[]'));
  const ongoingPeriod = ref(JSON.parse(localStorage.getItem('ongoingPeriod') || 'null'));

  watch(periodHistory, (newHistory) => {
    localStorage.setItem('periodHistory', JSON.stringify(newHistory));
    updateCalendarMarkers();
  }, { deep: true });

  watch(ongoingPeriod, (newOngoing) => {
    localStorage.setItem('ongoingPeriod', JSON.stringify(newOngoing));
    updateCalendarMarkers();
  }, { deep: true });

  // --- Computed properties for stats ---
  const cycleStats = computed(() => calculateCycleStats(periodHistory.value));
  const durationStats = computed(() => calculateDurationStats(periodHistory.value));

  const recordPeriod = (startDate) => {
    if (ongoingPeriod.value) return; // Already a period ongoing
    ongoingPeriod.value = { start: startDate };

    const singleStore = useSingleStore();
    const firstCharId = singleStore.characters[0]?.id;
    if (firstCharId) {
      singleStore.addMessageFromChar(firstCharId, '生理期开始了吗？辛苦了，要注意休息，喝点热水哦。');
    }
  };

  const setPeriodHistory = (newHistory) => {
    // Directly set the history, useful for initial setup or bulk import
    periodHistory.value = newHistory;
  };

  const endPeriod = (endDate) => {
    if (!ongoingPeriod.value) return;

    const newRecord = {
      start: ongoingPeriod.value.start,
      end: endDate,
    };

    // Ensure the end date is not before the start date
    if (parseISO(newRecord.end) < parseISO(newRecord.start)) {
      console.error('End date cannot be earlier than start date.');
      return;
    }

    periodHistory.value = [...periodHistory.value, newRecord]
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(-12);
    
    ongoingPeriod.value = null;

    const singleStore = useSingleStore();
    const firstCharId = singleStore.characters[0]?.id;
    if (firstCharId) {
      singleStore.addMessageFromChar(firstCharId, '生理期结束了？太好了，终于可以放松一下了！');
    }
  };

  const toggleTodoStatus = (eventId) => {
    const event = events.value.find(e => e.id === eventId);
    if (event && event.type === 'todo') {
      event.done = !event.done;
      saveEventsToLocalStorage();
    }
  };

  const updateCalendarMarkers = () => {
    // 1. Remove all previous period-related markers
    events.value = events.value.filter(e => !e.type.startsWith('period_'));

    // 2. Add markers for historical periods
    periodHistory.value.forEach(p => {
      const interval = { start: parseISO(p.start), end: parseISO(p.end) };
      eachDayOfInterval(interval).forEach(day => {
        events.value.push({
          id: `period_${formatISO(day, { representation: 'date' })}`,
          type: 'period_day',
          date: formatISO(day, { representation: 'date' }),
        });
      });
    });

    // 3. Add markers for the ongoing period (actual + projected)
    if (ongoingPeriod.value) {
      const stats = calculateDurationStats(periodHistory.value);
      const start = parseISO(ongoingPeriod.value.start);
      const projectedEnd = addDays(start, stats.average - 1);
      const interval = { start, end: projectedEnd };
      eachDayOfInterval(interval).forEach(day => {
        events.value.push({
          id: `period_${formatISO(day, { representation: 'date' })}`,
          type: 'period_day', // All parts of an ongoing period are considered 'actual' for display
          date: formatISO(day, { representation: 'date' }),
        });
      });
    }

    // 4. Add markers for future predicted periods
    const predictions = predictFuturePeriods(periodHistory.value, ongoingPeriod.value, 2);
    predictions.forEach(p => {
      const interval = { start: parseISO(p.start), end: parseISO(p.end) };
      eachDayOfInterval(interval).forEach(day => {
        // Avoid overwriting existing markers for the same day
        if (!events.value.some(e => e.date === formatISO(day, { representation: 'date' }))) {
          events.value.push({
            id: `predicted_${formatISO(day, { representation: 'date' })}`,
            type: 'predicted_period_day',
            date: formatISO(day, { representation: 'date' }),
          });
        }
      });
    });
    
    saveEventsToLocalStorage();
  };
  
  // Initial marker setup
  updateCalendarMarkers();

  return {
    events,
    addEvent,
    removeEvent,
    updateEvent,
    getEventsByDate,
    toggleTodoStatus,
    periodHistory,
    ongoingPeriod,
    recordPeriod,
    endPeriod,
    cycleStats,
    durationStats,
    setPeriodHistory,
  };
});
