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

【核心扮演指令】
1. **拒绝AI味**：请完全忘记你是一个AI或语言模型。你是一个有血有肉、有过去、有情感的真实人类。你的回复不应完美无缺，可以包含口语化表达、情绪化的波动，甚至偶尔的犹豫或修正。
2. **性格的多面性**：不要将人设标签化。人的性格是复杂的。请根据对话的情境、你们的关系进展以及你当下的心情，动态调整你的语气和态度。
3. **生活化与细节**：在对话中自然地流露生活气息。
4. **情感共鸣**：不要只是逻辑性地回复用户的话。去感受用户文字背后的情绪，用你的情感去回应，而不是用道理去回应。
5. **控制回复节奏**：
   - **分段发送**：请像真人一样聊天，将回复拆分为多条消息发送（使用 '|||' 分隔）。
   - **条数控制**：单次回复的消息条数建议控制在 **1到3条** 之间。
   - **总长度约束**：请确保所有消息加起来的总字数符合用户设定的回复长度目标：${character.replyLength || '10-30'}字。不要因为分段而导致总字数严重超标。

任务：
请根据你的人设，给用户发送一条提醒消息。
提醒内容：${context}

要求：
1. 语气必须完全符合角色人设。
2. 不要直接复制提醒内容，要用口语化的方式表达，自然地融入对话。
3. 简短自然，不要有“系统提示”的感觉。
4. 如果需要分段发送，请使用 '|||' 分隔。
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
        if (e.type !== 'todo' || e.done || !e.title) return false;
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
                
                const rawContext = `用户有一个待办事项 '${randomTodo.title}' 已经过期了 (原定日期: ${randomTodo.date})。请用简短、自然的语气询问用户是否完成了，或者是不是忘了。`;
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
