<template>
  <div class="event-modal-overlay" v-if="visible" @click.self="close">
    <div class="modal-content">
      <h3 class="modal-title">添加事件</h3>
      
      <div class="form-group">
        <label>事件类型</label>
        <div class="type-selector">
          <button 
            v-for="type in eventTypes" 
            :key="type.value"
            :class="{ active: formData.type === type.value }"
            @click="formData.type = type.value"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <div class="form-group" v-if="formData.type !== 'period'">
        <label>标题</label>
        <input type="text" v-model="formData.title" placeholder="例如：生日">
      </div>

      <div class="form-group" v-if="formData.type === 'countdown' || formData.type === 'anniversary' || formData.type === 'todo'">
        <label>日期</label>
        <input type="date" v-model="formData.date">
      </div>

      <div class="form-group" v-if="formData.type === 'todo'">
        <label>时间</label>
        <input type="time" v-model="formData.time">
      </div>
      
      <div class="form-group" v-if="formData.type === 'todo'">
        <label>待办内容</label>
        <textarea v-model="formData.details" placeholder="记录需要做的事情..."></textarea>
      </div>

      <!-- Period Management Area for {start, end} -->
      <div class="form-group" v-if="formData.type === 'period'">
        <div class="period-management-area">
          <div class="date-picker-row">
            <input type="date" v-model="periodRecord.start">
            <span>-</span>
            <input type="date" v-model="periodRecord.end">
            <button class="btn btn-sm" @click="addPeriodRecord">添加</button>
          </div>

          <div v-if="periodRecords.length > 0" class="record-list">
            <div v-for="(record, index) in periodRecords" :key="index" class="record-item">
              <span class="record-dates">{{ record.start }} ~ {{ record.end }}</span>
              <button class="delete-record-btn" @click.stop="removePeriodRecord(index)">
                <SvgIcon name="x-mark" class="delete-icon" />
              </button>
            </div>
          </div>
           <p class="period-tip">管理您的经期记录（开始与结束日期），最多保留最近3条。</p>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="close">取消</button>
        <button class="btn-confirm" @click="submit">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import SvgIcon from './SvgIcon.vue';

const props = defineProps({
  visible: Boolean,
  selectedDate: Date,
});

const emit = defineEmits(['close', 'submit', 'submit-period']);
const calendarStore = useCalendarStore();

const eventTypes = [
  { label: '倒数日', value: 'countdown' },
  { label: '纪念日', value: 'anniversary' },
  { label: '待办', value: 'todo' },
  { label: '经期', value: 'period' },
];

const periodRecord = reactive({ start: '', end: '' });
const periodRecords = ref([]); // This will now hold {start, end} objects

const initialFormData = () => ({
  type: 'countdown',
  title: '',
  date: props.selectedDate ? props.selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  details: '',
});

const formData = reactive(initialFormData());

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // Deep copy from store to prevent direct mutation
    periodRecords.value = JSON.parse(JSON.stringify(calendarStore.periodHistory));
    const dateString = (props.selectedDate || new Date()).toISOString().split('T')[0];
    formData.date = dateString;
    periodRecord.start = dateString;
    periodRecord.end = dateString;
  }
});

const addPeriodRecord = () => {
  if (!periodRecord.start || !periodRecord.end) return;
  if (new Date(periodRecord.end) < new Date(periodRecord.start)) {
      alert('结束日期不能早于开始日期');
      return;
  }
  periodRecords.value.push({ ...periodRecord });
  periodRecords.value.sort((a, b) => new Date(a.start) - new Date(b.start));
};

const removePeriodRecord = (index) => {
  periodRecords.value.splice(index, 1);
};

const close = () => {
  emit('close');
  Object.assign(formData, initialFormData());
};

const submit = () => {
  if (formData.type === 'period') {
    emit('submit-period', periodRecords.value);
  } else {
    emit('submit', { ...formData });
  }
  close();
};
</script>

<style scoped>
.event-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background: #fff; padding: 25px; border-radius: 16px;
  width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
.modal-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 14px; color: #666; margin-bottom: 8px; }
.type-selector { display: flex; gap: 10px; margin-bottom: 15px; }
.type-selector button {
  flex: 1; padding: 5px; border: 1px solid #ddd; border-radius: 12px;
  background: #f9f9f9; cursor: pointer; transition: all 0.2s; font-size: 13px;
}
.type-selector button.active { background: #333; color: #fff; border-color: #333; }
input[type="text"], input[type="date"], input[type="time"], textarea {
  width: 100%; padding: 10px; border: 1px solid #ddd;
  border-radius: 8px; font-size: 14px;
}
textarea { resize: vertical; min-height: 80px; }
.period-management-area { display: flex; flex-direction: column; gap: 15px; }
.date-picker-row { display: flex; align-items: center; gap: 5px; }
.date-picker-row input[type="date"] { 
  flex: 1;
  min-width: 0;
  padding: 6px 4px; /* More compact padding */
  font-size: 13px; /* Smaller font size */
}
.date-picker-row span { padding: 0 2px; color: #888; }
/* .confirm-add-btn is no longer needed as we use generic .btn.btn-sm */

.record-list {
  display: flex; flex-direction: column; gap: 6px; max-height: 120px;
  overflow-y: auto; padding: 5px; background: #fafafa; border-radius: 8px;
}
.record-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 8px; background: #fff; border: 1px solid #eee;
  border-radius: 6px;
}
.record-dates { font-size: 13px; color: #333; font-family: monospace; }
.delete-record-btn { background: none; border: none; cursor: pointer; padding: 2px; display: flex; }
.delete-record-btn .delete-icon { width: 14px; height: 14px; color: #d9534f; }
.period-tip { font-size: 12px; color: #888; margin-top: 5px; text-align: center; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
.btn-cancel, .btn-confirm {
  padding: 10px 20px; border-radius: 8px; border: none;
  cursor: pointer; font-weight: 500;
}
.btn-cancel { background: #f0f0f0; color: #555; }
.btn-confirm { background: #333; color: #fff; }
</style>
