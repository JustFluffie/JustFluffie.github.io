import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBackgroundStore } from '@/stores/backgroundStore';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import { useMomentsStore } from '@/stores/chat/momentsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { parseAiResponse } from '@/utils/messageParser';

export function useBackgroundService() {
  const router = useRouter();
  const backgroundStore = useBackgroundStore();
  const singleStore = useSingleStore();
  const apiStore = useApiStore();
  const momentsStore = useMomentsStore();
  const notificationStore = useNotificationStore();
  
  let timer = null;
  const lastCheckDate = ref(new Date().getDate());

  const checkProactiveMessages = async () => {
    // 1. 每日重置检查
    const today = new Date().getDate();
    if (today !== lastCheckDate.value) {
      singleStore.resetDailyProactiveCount();
      lastCheckDate.value = today;
    }

    // 2. 全局开关检查
    if (!backgroundStore.globalBackgroundActivity) return;

    const now = Date.now();

    // 3. 遍历角色
    for (const char of singleStore.characters) {
      // 3.1 检查角色开关
      const override = char.backgroundActivityOverride || 'default';
      if (override === 'off') continue;
      // 如果是 default，则遵循全局（已检查为 true）

      // 3.2 检查每日上限
      const dailyLimit = char.proactiveDailyLimit || 10;
      if ((char.todayProactiveCount || 0) >= dailyLimit) continue;

      // 3.3 检查冷却时间 (分钟 -> 毫秒)
      const cooldown = (char.proactiveCooldown || 30) * 60 * 1000;
      if (now - (char.lastProactiveTime || 0) < cooldown) continue;

      // 3.4 检查触发间隔 (分钟 -> 毫秒)
      const interval = (char.proactiveInterval || 5) * 60 * 1000;
      if (now - (char.lastProactiveTime || 0) < interval) continue;

      // 3.5 检查触发模式
      const mode = char.triggerMode || 'always';
      if (mode === 'idle') {
        const idleTime = (char.proactiveIdleTime || 15) * 60 * 1000;
        // 使用最后一条消息的时间作为活跃时间判断
        const lastMsg = singleStore.getLastMessage(char.id);
        const lastMsgTime = lastMsg ? lastMsg.time : 0;
        
        // 如果距离最后一条消息的时间小于挂机时间，说明还不算挂机，跳过
        if (now - lastMsgTime < idleTime) continue;
      }

      // 满足所有条件，触发主动消息
      console.log(`[BackgroundService] Triggering proactive message for ${char.name}`);
      
      try {
        const rawContent = await apiStore.getProactiveMessage(char.id);
        if (rawContent) {
          // 解析消息内容
          const { type, content } = parseAiResponse(rawContent);

          // 添加消息
          if (!singleStore.messages[char.id]) singleStore.messages[char.id] = [];
          
          const isCharBlocked = char.isBlocked || false;

          singleStore.messages[char.id].push({
            id: Date.now().toString(),
            sender: 'char',
            type: type,
            content: content,
            time: Date.now(),
            blocked: isCharBlocked
          });
          
          // 更新状态
          singleStore.updateProactiveStatus(char.id);
          singleStore.updateLastActiveTime(char.id);
          singleStore.saveData();

          // 触发通知
          notificationStore.triggerNotification(
            char.nickname || char.name,
            content,
            char.avatar,
            () => {
              router.push(`/chat/room/${char.id}`);
            },
            3000,
            type
          );
        }
      } catch (e) {
        console.error(`[BackgroundService] Failed to trigger for ${char.name}`, e);
      }
    }
  };

  const checkMomentsActivity = async () => {
    if (!backgroundStore.globalBackgroundActivity) return;
    
    const now = Date.now();
    const interval = (backgroundStore.globalMomentsInterval || 60) * 60 * 1000;
    const dailyLimit = backgroundStore.globalMomentsDailyLimit || 5;

    for (const char of singleStore.characters) {
      const override = char.backgroundActivityOverride || 'default';
      if (override === 'off') continue;

      // 1. 检查是否需要发布朋友圈
      // 增加概率判断：即使满足时间间隔，也只有 1% 的概率触发，避免一到时间就发，减少频率
      if ((char.todayMomentCount || 0) < dailyLimit && (now - (char.lastMomentTime || 0) > interval)) {
          if (Math.random() < 0.01) {
              console.log(`[BackgroundService] Triggering moment for ${char.name}`);
              await momentsStore.triggerCharacterMoment(char.id);
          }
      }

      // 2. 检查互动 (点赞/评论/回复)
      // 互动不占用发布配额，但依赖于全局开关
      await momentsStore.checkAndInteractWithMoments(char.id);
    }

    // 3. NPC 互动检查
    for (const npc of singleStore.npcs) {
        // NPC 互动检查 (内部会检查开关和冷却)
        await momentsStore.checkAndInteractWithMoments(npc.id);
    }
  };

  const startService = () => {
    if (timer) return;
    console.log('[BackgroundService] Started');
    // 每分钟检查一次
    timer = setInterval(async () => {
        await checkProactiveMessages();
        await checkMomentsActivity();
    }, 60 * 1000);
  };

  const stopService = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      console.log('[BackgroundService] Stopped');
    }
  };

  onMounted(() => {
    startService();
  });

  onUnmounted(() => {
    stopService();
  });

  return {
    startService,
    stopService
  };
}
