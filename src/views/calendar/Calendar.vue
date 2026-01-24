<template>
  <AppLayout title="日历" :no-padding="true">
    <template #action>
      <button class="header-action-btn" @click="openEventModal">
        <SvgIcon name="plus" />
      </button>
    </template>
    <div class="page-container">
      
      <!-- 1. 顶部日历区域 -->
      <div class="calendar-section">
        <div class="cal-header">
          <div class="header-left">
            <div class="month-display" @click="toggleCalendar">
              <span class="m-en">{{ currentMonthEn }}</span>
              <span class="m-cn">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
            </div>
          </div>
          <div class="header-right">
            <div class="month-switcher" v-if="isCalendarExpanded">
              <button @click.stop="changeMonth(-1)"><SvgIcon name="chevron-left" /></button>
              <button @click.stop="changeMonth(1)"><SvgIcon name="chevron-right" /></button>
            </div>
            <button class="toggle-btn" @click="toggleCalendar">
              <SvgIcon :name="isCalendarExpanded ? 'chevron-up' : 'chevron-down'" className="cal-toggle-icon" />
            </button>
          </div>
        </div>
        <div class="week-view" v-if="!isCalendarExpanded">
           <div 
            v-for="day in weekDates" 
            :key="day.date" 
            class="day-item"
            :class="{ 'active': isSameDate(day.date, selectedDate), 'is-today': isSameDate(day.date, new Date()) }"
            @click="selectDate(day.date)"
          >
            <span class="week-txt">{{ day.week }}</span>
            <span class="day-num">{{ day.day }}</span>
          </div>
        </div>
        <div class="month-view" v-else>
           <div class="grid-header">
            <span v-for="w in weekDays" :key="w">{{ w }}</span>
          </div>
          <div class="grid-body">
            <div v-for="n in firstDayOfWeek" :key="'empty-'+n" class="grid-cell empty"></div>
            <div v-for="day in daysInMonth" :key="day" class="grid-cell" :class="{ 'active': isSelected(day), 'today': isToday(day) }" @click="selectDateNum(day)">
              <span>{{ day }}</span>
              <div :class="getDayMarkerClass(day)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 事件显示区域 -->
      <div class="events-display-section">
        <!-- New Period Tracker Card -->
        <div class="period-tracker-container" v-if="calendarStore.periodHistory.length > 0">
          <PeriodTrackerCard 
            :status="periodStatusForSelectedDate.status"
            :day-count="periodStatusForSelectedDate.dayCount"
            :selected-date="selectedDate"
          />
        </div>

        <!-- 动态事件卡片 -->
        <div class="cards-container">
          <!-- 倒数日和纪念日卡片 (常驻显示) -->
          <div v-for="event in allCountEvents" :key="event.id">
            <DaysCount 
              :event="event"
              :selected-date="selectedDate"
              @update:polaroidText="(val) => updateEventText(event, val)"
              @delete="handleDeleteEvent"
              @upload-photo="handleUploadPhoto"
            />
          </div>

          <!-- 新的待办事项卡片组件 -->
          <ToDoList :todos="todosForSelectedDate" />
        </div>
        
        <!-- 无事件提示 -->
        <div v-if="todosForSelectedDate.length === 0" class="no-events-placeholder">
          <p>今天没有特别的安排</p>
          <span>点击右上角按钮添加一个吧</span>
        </div>
      </div>

      <!-- 事件表单模态框 -->
      <EventFormModal 
        :visible="isModalVisible"
        :selected-date="selectedDate"
        @close="isModalVisible = false"
        @submit="handleEventSubmit"
        @submit-period="handlePeriodSubmit"
      />

      <!-- 删除确认模态框 -->
      <Modal
        :visible="isDeleteModalVisible"
        title="确认删除"
        @update:visible="isDeleteModalVisible = $event"
      >
        <p style="padding: 10px 0; color: #666;">确定要删除这个事件吗？</p>
        <template #footer>
          <button class="modal-btn cancel" @click="isDeleteModalVisible = false">取消</button>
          <button class="modal-btn danger" @click="confirmDelete">删除</button>
        </template>
      </Modal>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatISO } from 'date-fns';
import { storeToRefs } from 'pinia';
import AppLayout from '@/components/common/AppLayout.vue';
import SvgIcon from '@/components/common/SvgIcon.vue';
import Modal from '@/components/common/Modal.vue';
import EventFormModal from '@/components/common/EventFormModal.vue';
import PeriodTrackerCard from '@/views/calendar/components/PeriodTracker.vue';
import ToDoList from '@/views/calendar/components/ToDoList.vue';
import DaysCount from '@/views/calendar/components/DaysCount.vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { getPeriodStatusForDate } from '@/composables/usePeriodTracking';
import { useImageUpload } from '@/composables/useImageUpload';

// === Pinia Store ===
const calendarStore = useCalendarStore();
const { ongoingPeriod } = storeToRefs(calendarStore);

// === Modal State ===
const isModalVisible = ref(false);
const openEventModal = () => { isModalVisible.value = true; };
const handleEventSubmit = (eventData) => {
  calendarStore.addEvent(eventData);
};

const handlePeriodSubmit = (history) => {
  calendarStore.setPeriodHistory(history);
};

const updateEventText = (event, newText) => {
  const updatedEvent = { ...event, polaroidText: newText };
  calendarStore.updateEvent(updatedEvent);
};

// === Photo Upload ===
const uploadingEvent = ref(null);

const { triggerFileUpload } = useImageUpload({
  onComplete: (result) => {
    if (uploadingEvent.value) {
      const updatedEvent = { ...uploadingEvent.value, photoUrl: result.content };
      calendarStore.updateEvent(updatedEvent);
      uploadingEvent.value = null;
    }
  }
});

const handleUploadPhoto = (event) => {
  uploadingEvent.value = event;
  triggerFileUpload();
};

// === Delete Confirmation ===
const isDeleteModalVisible = ref(false);
const eventToDelete = ref(null);

const handleDeleteEvent = (event) => {
  eventToDelete.value = event;
  isDeleteModalVisible.value = true;
};

const confirmDelete = () => {
  if (eventToDelete.value) {
    calendarStore.removeEvent(eventToDelete.value.id);
    eventToDelete.value = null;
  }
  isDeleteModalVisible.value = false;
};

// === Calendar Logic (existing) ===
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const weekDaysEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const monthsEnList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();
const isCalendarExpanded = ref(false);
const selectedDate = ref(new Date());
const viewDate = ref(new Date(now.getFullYear(), now.getMonth(), 1));
const currentYear = computed(() => viewDate.value.getFullYear());
const currentMonth = computed(() => viewDate.value.getMonth());
const currentMonthEn = computed(() => monthsEnList[currentMonth.value]);
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate());
const firstDayOfWeek = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay());
const weekDates = computed(() => {
  const curr = new Date(selectedDate.value);
  const dates = [];
  const dayOfWeek = curr.getDay();
  const startDay = curr.getDate() - dayOfWeek;
  for (let i = 0; i < 7; i++) {
    let d = new Date(curr);
    d.setDate(startDay + i);
    dates.push({ date: d, day: d.getDate(), week: weekDaysEn[d.getDay()] });
  }
  return dates;
});
const toggleCalendar = () => {
  isCalendarExpanded.value = !isCalendarExpanded.value;
  // 如果日历从展开状态收起，则重置到今天的日期
  if (!isCalendarExpanded.value) {
    selectedDate.value = new Date();
  }
  viewDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1);
};
const changeMonth = (step) => viewDate.value = new Date(currentYear.value, currentMonth.value + step, 1);
const isSameDate = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
const isToday = (day) => day === now.getDate() && currentMonth.value === now.getMonth() && currentYear.value === now.getFullYear();
const isSelected = (day) => day === selectedDate.value.getDate() && currentMonth.value === selectedDate.value.getMonth() && currentYear.value === selectedDate.value.getFullYear();
const selectDate = (date) => selectedDate.value = date;
const selectDateNum = (day) => selectedDate.value = new Date(currentYear.value, currentMonth.value, day);
const eventsForSelectedDate = computed(() => calendarStore.getEventsByDate(selectedDate.value));

// 按类型筛选事件
const todosForSelectedDate = computed(() => 
  eventsForSelectedDate.value.filter(e => e.type === 'todo')
);

// 获取所有倒数日和纪念日事件 (全局显示)
const allCountEvents = computed(() => 
  calendarStore.events.filter(e => e.type === 'countdown' || e.type === 'anniversary')
);

const hasEventsOnDate = (date) => calendarStore.getEventsByDate(date).length > 0;

// === New Period Tracking Logic ===
const periodStatusForSelectedDate = computed(() => {
  const dateString = formatISO(selectedDate.value, { representation: 'date' });
  return getPeriodStatusForDate(dateString, calendarStore.periodHistory, ongoingPeriod.value);
});


const eventMarkers = computed(() => {
  const markers = {};
  for (const event of calendarStore.events) {
    if (!event.date) continue;
    
    let dateKey;
    try {
      const dateObj = new Date(event.date);
      if (isNaN(dateObj.getTime())) continue; // 跳过无效日期
      dateKey = formatISO(dateObj, { representation: 'date' });
    } catch (e) {
      console.warn('Skipping event with invalid date:', event);
      continue;
    }
    
    if (event.type === 'period_day') {
      // 经期追踪最优先
      markers[dateKey] = 'event-dot actual-dot';
    } else if (event.type === 'predicted_period_day') {
      // 预测经期次优先，不覆盖实际经期
      if (markers[dateKey] !== 'event-dot actual-dot') {
        markers[dateKey] = 'event-dot predicted-dot';
      }
    } else {
      // 普通事件，优先级最低，不覆盖经期相关标记
      if (!markers[dateKey]) {
        markers[dateKey] = 'event-dot normal-dot';
      }
    }
  }
  return markers;
});

const getMarkerClassForDate = (date) => {
  const dateKey = formatISO(date, { representation: 'date' });
  return eventMarkers.value[dateKey] || '';
};

const getDayMarkerClass = (day) => {
  const date = new Date(currentYear.value, currentMonth.value, day);
  return getMarkerClassForDate(date);
};

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Quicksand:wght@400;600;700&display=swap');
.page-container { 
  min-height: 100%; 
  background-color: #fafafa; 
  padding: 20px; 
  font-family: 'Quicksand', sans-serif; 
  color: #333; 
}
.calendar-section { background: #fff; border-radius: 24px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.03); margin-bottom: 16px; }
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.header-right { display: flex; align-items: center; }
.month-display { display: flex; flex-direction: column; cursor: pointer; }
.m-en { font-weight: 700; font-size: 18px; } .m-cn { font-size: 12px; color: #888; }
.header-action-btn { background: none; border: none; color: var(--text-primary); cursor: pointer; }
.header-action-btn .svg-icon { width: 22px; height: 22px; }
.toggle-btn { display: none; }
.toggle-btn .svg-icon { width: 13px; height: 13px; }
.cal-toggle-icon { position: relative; top: 1px; }
.month-switcher button { background: transparent; border: none; width: 20px; height: 20px; border-radius: 50%; margin-left: 8px; cursor: pointer; display: inline-flex; justify-content: center; align-items: center; color: #666; }
.month-switcher button .svg-icon { width: 13px; height: 13px; stroke: #666; }
.week-view { display: flex; justify-content: space-between; }
.day-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 0; width: 40px; border-radius: 20px; cursor: pointer; }
.day-item.active { background: #333; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.day-item.is-today .day-num { color: var(--C-red); font-weight: bold; }
.day-item.active.is-today .day-num { color: #fff; }
.week-txt { font-size: 10px; font-weight: 700; opacity: 0.6; } .day-num { font-size: 16px; font-weight: 600; }
.dot-mark { width: 4px; height: 4px; background: #fff; border-radius: 50%; margin-top: -2px;}
.day-item .event-dot, .grid-cell .event-dot { width: 5px; height: 5px; background-color: var(--C-blue); border-radius: 50%; position: absolute; bottom: 5px; }
.day-item.active .event-dot { background-color: #fff; }
.event-dot.actual-dot { background-color: var(--C-red); }
.event-dot.predicted-dot { background-color: var(--C-pink); }
.event-dot.normal-dot { background-color: var(--C-blue); }
.grid-body { display: flex; flex-wrap: wrap; row-gap: 10px; }
.grid-header { display: flex; margin-bottom: 10px; } .grid-header span { flex: 1; text-align: center; font-size: 12px; color: #999; }
.grid-cell { width: 14.28%; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer; border-radius: 50%; font-size: 14px; position: relative; }
.grid-cell.active { background: #333; color: #fff; } .grid-cell.today { color: var(--C-red); font-weight: bold; } .grid-cell.active.today { color: #fff; }
.events-display-section { display: flex; flex-direction: column; gap: 16px; }
.cards-container { display: flex; flex-direction: column; gap: 5px; }
.sticker-card { background: #fff; border-radius: 16px; padding: 20px; padding-bottom: 10px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid #f2f2f2; }
.no-events-placeholder { text-align: center; padding: 40px 20px; background: #f9f9f9; border-radius: 16px; color: #aaa; }
.no-events-placeholder p { font-size: 16px; margin: 0 0 8px 0; color: #888; }
.no-events-placeholder span { font-size: 12px; }
</style>
