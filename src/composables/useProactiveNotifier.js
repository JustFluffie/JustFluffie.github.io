import { onMounted, onUnmounted } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import { formatISO, parseISO, differenceInMinutes } from 'date-fns';
import { getPeriodNotificationStatus } from '@/composables/usePeriodTracking';

export function useProactiveNotifier() {
  const calendarStore = useCalendarStore();
  const singleStore = useSingleStore();
  const apiStore = useApiStore();
  let intervalId = null;

  // 辅助函数：生成符合人设的提醒消息
  const generateReminder = async (charId, context) => {
    const character = singleStore.getCharacter(charId);
    if (!character) return context;

    const prompt = `
你正在扮演角色“${character.name}”。
角色人设：
${character.charPersona}

任务：
请根据你的人设，给用户发送一条提醒消息。
提醒内容：${context}

要求：
1. 语气必须完全符合角色人设（例如：如果是傲娇，就别扭地提醒；如果是温柔，就体贴地提醒）。
2. 不要直接复制提醒内容，要用口语化的方式表达，自然地融入对话。
3. 简短自然，不要太长，不要有“系统提示”的感觉。
`;
    try {
      // 使用 generic completion 生成
      const response = await apiStore.getGenericCompletion([{ role: 'user', content: prompt }]);
      return response || context;
    } catch (e) {
      console.error("[useProactiveNotifier] Failed to generate AI reminder:", e);
      return context; // 失败时回退到原始内容
    }
  };

  const checkNotifications = async () => {
    const now = new Date();
    const today = formatISO(now, { representation: 'date' });
    
    const characters = singleStore.characters;
    if (characters.length === 0) return;
    const notifierCharId = characters[0].id;

    // 1. 检查待办事项提醒
    const todayTodos = calendarStore.getEventsByDate(today).filter(e => e.type === 'todo' && !e.done);
    for (const todo of todayTodos) {
      if (todo.time) {
        const todoTime = parseISO(`${today}T${todo.time}`);
        const minutesUntilDue = differenceInMinutes(todoTime, now);

        if (minutesUntilDue > 0 && minutesUntilDue <= 5) {
          const reminderKey = `reminder_sent_todo_${todo.id}`;
          if (!sessionStorage.getItem(reminderKey)) {
            // 标记为已发送，防止重复触发（即使AI生成失败）
            sessionStorage.setItem(reminderKey, 'true');
            
            const rawContext = `用户的待办事项 '${todo.title}' 还有 ${minutesUntilDue} 分钟就要开始了。`;
            const reminderMessage = await generateReminder(notifierCharId, rawContext);
            
            singleStore.addMessageFromChar(notifierCharId, reminderMessage);
            console.log(`[useProactiveNotifier] Sent todo reminder for: ${todo.title}`);
          }
        }
      }
    }

    // 1.1 检查过期未完成的待办事项 (每天只提醒一次)
    const overdueTodos = calendarStore.events.filter(e => {
        if (e.type !== 'todo' || e.done) return false;
        return e.date < today; // 日期早于今天
    });

    if (overdueTodos.length > 0) {
        // 随机选择一个过期的事项进行询问，避免一次问太多
        const randomTodo = overdueTodos[Math.floor(Math.random() * overdueTodos.length)];
        const overdueKey = `reminder_sent_overdue_${randomTodo.id}_${today}`; // 每天对每个过期事项只提醒一次

        if (!sessionStorage.getItem(overdueKey)) {
             // 降低触发频率：每次检查只有 10% 的概率触发过期询问，避免一上线就问
            if (Math.random() < 0.1) {
                sessionStorage.setItem(overdueKey, 'true');
                
                const rawContext = `用户有一个过期的待办事项 '${randomTodo.title}' (原定日期: ${randomTodo.date}) 还没有完成。请自然地询问用户是否已经完成了，或者是否需要重新安排。`;
                const reminderMessage = await generateReminder(notifierCharId, rawContext);
                
                singleStore.addMessageFromChar(notifierCharId, reminderMessage);
                console.log(`[useProactiveNotifier] Sent overdue inquiry for: ${randomTodo.title}`);
            }
        }
    }

    // 2. 检查经期预测提醒 (每天只提醒一次)
    const periodNotification = getPeriodNotificationStatus(today, calendarStore.periodHistory, calendarStore.ongoingPeriod);
    if (periodNotification) {
      const { daysUntil, startDate } = periodNotification;
      const reminderKey = `reminder_sent_period_${startDate}`;
      
      if (!sessionStorage.getItem(reminderKey)) {
        // 标记为已发送
        sessionStorage.setItem(reminderKey, 'true');

        const rawContext = daysUntil === 0
          ? `预测用户的生理期今天就要来了，提醒她注意身体。`
          : `预测用户的生理期在 ${daysUntil} 天后就要来了，提醒她提前准备。`;
        
        const reminderMessage = await generateReminder(notifierCharId, rawContext);
        
        singleStore.addMessageFromChar(notifierCharId, reminderMessage);
        console.log(`[useProactiveNotifier] Sent period prediction reminder for ${startDate}.`);
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
