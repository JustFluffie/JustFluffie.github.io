import { onMounted, onUnmounted } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { useSingleStore } from '@/stores/chat/singleStore';
import { formatISO, parseISO, differenceInMinutes, differenceInDays } from 'date-fns';

export function useProactiveNotifier() {
  const calendarStore = useCalendarStore();
  const singleStore = useSingleStore();
  let intervalId = null;

  const checkNotifications = () => {
    const now = new Date();
    const today = formatISO(now, { representation: 'date' });
    
    const characters = singleStore.characters;
    if (characters.length === 0) return;
    const notifierCharId = characters[0].id;

    // 1. 检查待办事项提醒
    const todayTodos = calendarStore.getEventsByDate(today).filter(e => e.type === 'todo' && !e.done);
    todayTodos.forEach(todo => {
      if (todo.time) {
        const todoTime = parseISO(`${today}T${todo.time}`);
        const minutesUntilDue = differenceInMinutes(todoTime, now);

        if (minutesUntilDue > 0 && minutesUntilDue <= 5) {
          const reminderKey = `reminder_sent_todo_${todo.id}`;
          if (!sessionStorage.getItem(reminderKey)) {
            const reminderMessage = `主人，提醒一下，'${todo.title}' 马上就要到时间了哦！`;
            singleStore.addMessageFromChar(notifierCharId, reminderMessage);
            sessionStorage.setItem(reminderKey, 'true');
            console.log(`[useProactiveNotifier] Sent todo reminder for: ${todo.title}`);
          }
        }
      }
    });

    // 2. 检查经期预测提醒 (每天只提醒一次)
    if (calendarStore.predictedPeriod?.startDate) {
      const daysUntilPrediction = differenceInDays(parseISO(calendarStore.predictedPeriod.startDate), now);
      if (daysUntilPrediction >= 0 && daysUntilPrediction <= 3) {
        const reminderKey = `reminder_sent_period_${calendarStore.predictedPeriod.startDate}`;
        if (!sessionStorage.getItem(reminderKey)) {
          const reminderMessage = `主人，预测你的生理期在 ${daysUntilPrediction} 天后就要来啦，要提前准备一下哦。`;
          singleStore.addMessageFromChar(notifierCharId, reminderMessage);
          sessionStorage.setItem(reminderKey, 'true');
          console.log(`[useProactiveNotifier] Sent period prediction reminder.`);
        }
      }
    }
  };

  onMounted(() => {
    // 每分钟检查一次
    intervalId = setInterval(checkNotifications, 60 * 1000);
    console.log('[useProactiveNotifier] Proactive notifier service started.');
  });

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('[useProactiveNotifier] Proactive notifier service stopped.');
    }
  });
}
