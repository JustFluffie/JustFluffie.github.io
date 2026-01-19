<template>
  <div class="period-item">
    <!-- 装饰：和纸胶带 -->
    <div class="washi-tape"></div>

    <!-- 确认弹窗 -->
    <Modal
      :visible="modalState.visible"
      :title="modalState.title"
      @update:visible="modalState.visible = false"
    >
      <p>{{ modalState.message }}</p>
      <template #footer>
        <button class="modal-btn cancel" @click="modalState.visible = false">{{ $t('cancel') }}</button>
        <button class="modal-btn confirm" @click="handleConfirm">{{ $t('confirm') }}</button>
      </template>
    </Modal>
    
    <!-- 左侧：状态按钮 -->
    <div class="status-button" @click="handleRecordClick" :title="buttonTitle">
      <div class="status-indicator" :style="{ backgroundColor: iconColor }"></div>
    </div>

    <!-- 右侧：信息内容区 -->
    <div class="content-wrapper">
      <h3 class="item-title">经期追踪</h3>
      
      <!-- 主要状态显示 -->
      <p class="status-text" v-if="displayParts.number !== null">
        {{ displayParts.prefix }}
        <span class="status-day-count">{{ displayParts.number }}</span>
        {{ displayParts.suffix }}
      </p>
      <p class="status-text" v-else>{{ displayParts.prefix }}</p>

      <!-- 预测与统计信息 (仅当有历史记录时显示) -->
      <div class="prediction-details" v-if="store.periodHistory.length > 0">
        <p class="prediction-text">{{ predictionText }}</p>
        <p class="stats-text">
          平均周期 {{ cycleStats.average }} 天 · 平均经期 {{ durationStats.average }} 天
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useCalendarStore } from '@/stores/calendarStore';
import { format, parseISO, isWithinInterval, formatISO } from 'date-fns';
import Modal from '@/components/common/Modal.vue';

// --- Component Definition ---
const props = defineProps({
  status: {
    type: String,
    required: true, // 'actual', 'predicted', 'none'
  },
  dayCount: {
    type: Number,
    default: null,
  },
  selectedDate: {
    type: Date,
    required: true,
  },
});

// --- i18n ---
const { t } = useI18n();

// --- Store and State ---
const store = useCalendarStore();
const { cycleStats, durationStats, predictedPeriod } = storeToRefs(store);
const { recordPeriod, endPeriod } = store;

// --- Modal State and Logic ---
const modalState = ref({
  visible: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

const showConfirmModal = (title, message, onConfirm) => {
  modalState.value = {
    visible: true,
    title,
    message,
    onConfirm,
  };
};

const handleConfirm = () => {
  if (typeof modalState.value.onConfirm === 'function') {
    modalState.value.onConfirm();
  }
  modalState.value.visible = false;
};

// --- Computed Properties for Display ---
const iconColor = computed(() => {
  switch (props.status) {
    case 'actual':
      return 'var(--period-color)';
    case 'predicted':
      // 仅当在预测期内才显示粉色
      if (predictedPeriod.value && isWithinInterval(props.selectedDate, {
        start: parseISO(predictedPeriod.value.startDate),
        end: parseISO(predictedPeriod.value.endDate)
      })) {
        return 'var(--color-pink)';
      }
      // 预测期前（倒计时）显示默认色
      return 'var(---text-tertiary)';
    default:
      return 'var(---text-tertiary)';
  }
});

const buttonTitle = computed(() => {
  return props.status === 'actual' ? '点击记录经期结束' : '点击记录经期开始';
});

const predictionText = computed(() => {
  if (!predictedPeriod.value) return '暂无预测';
  const start = format(parseISO(predictedPeriod.value.startDate), 'M月d日');
  const end = format(parseISO(predictedPeriod.value.endDate), 'M月d日');
  return `预测期: ${start} - ${end}`;
});

const displayParts = computed(() => {
  const { status, dayCount, selectedDate } = props;

  if (status === 'actual') {
    return { prefix: '经期第', number: dayCount, suffix: '天' };
  }
  if (status === 'predicted') {
    // Check if the selected date is within the predicted interval
    if (predictedPeriod.value && isWithinInterval(selectedDate, {
      start: parseISO(predictedPeriod.value.startDate),
      end: parseISO(predictedPeriod.value.endDate)
    })) {
      return { prefix: '预测期内', number: null, suffix: '' };
    }
    // If before the prediction, show countdown
    return { prefix: '预计', number: dayCount, suffix: '天后' };
  }
  // Default message
  return { prefix: '添加历史记录以开始预测', number: null, suffix: '' };
});

// --- Event Handlers ---
const handleRecordClick = () => {
  const selectedDateISO = formatISO(props.selectedDate, { representation: 'date' });

  if (props.status === 'actual') {
    // Currently in a period, ask to end it.
    showConfirmModal(
      t('calendar.periodTracker.confirmEndTitle'),
      t('calendar.periodTracker.confirmEndMsg'),
      () => endPeriod(selectedDateISO)
    );
  } else {
    // Not in a period, ask to start it.
    showConfirmModal(
      t('calendar.periodTracker.confirmStartTitle'),
      t('calendar.periodTracker.confirmStartMsg'),
      () => recordPeriod(selectedDateISO)
    );
  }
};
</script>

<style scoped>
/* --- 主容器：手账便签风格 --- */
.period-item {
  --period-color: #e66262;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: 'Georgia', 'Times New Roman', serif;

  position: relative;
  display: flex;
  align-items: flex-start; /* 保持顶部对齐 */
  gap: 16px;
  background-color: white;
  border: 1.5px dashed var(--text-tertiary);
  border-radius: 12px;
  padding: 16px;
  overflow: visible;
  transition: box-shadow 0.3s ease;
}

.period-item:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

/* --- 装饰：和纸胶带 --- */
.washi-tape {
  position: absolute;
  top: -10px;
  left: 15px;
  width: 40px;
  height: 20px;
  background-color: rgba(220, 220, 220, 0.5);
  transform: rotate(-4deg);
  border-left: 1px dashed rgba(255, 255, 255, 0.7);
  border-right: 1px dashed rgba(255, 255, 255, 0.7);
  pointer-events: none;
}

/* --- 左侧：状态按钮 --- */
.status-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--text-quaternary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-top: 18px; /* 调整垂直对齐 */
}

/* .status-button.disabled is no longer needed */

.status-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

/* --- 右侧：信息内容区 --- */
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px; /* 调整元素间距 */
}

.item-title {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-tertiary);
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.status-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-darkest);
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.status-day-count {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: normal;
  color: var(---text-darkest);
  margin: 0 6px;
  line-height: 1;
}

/* --- 预测详情区域 --- */
.prediction-details {
  /* 移除顶部边框和额外边距，使其与主要内容更融合 */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prediction-text {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.stats-text {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  margin: 0;
}
</style>
