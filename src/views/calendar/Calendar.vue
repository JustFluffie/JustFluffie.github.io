<template>
  <AppLayout title="我的手账">
    <div class="page-container">
      
      <!-- 1. 顶部日历区域 (保持不变) -->
      <div class="calendar-section">
        <div class="cal-header">
          <div class="month-display">
            <span class="m-en">{{ currentMonthEn }}</span>
            <span class="m-cn">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
          </div>
          <div class="month-switcher" v-if="isCalendarExpanded">
            <button @click="changeMonth(-1)">←</button>
            <button @click="changeMonth(1)">→</button>
          </div>
          <button class="toggle-btn" @click="toggleCalendar">
            {{ isCalendarExpanded ? '收起' : '展开' }}
            <span class="arrow" :class="{ up: isCalendarExpanded }">▼</span>
          </button>
        </div>
        <!-- 周视图/月视图省略，逻辑同上，为了简洁不重复展示 -->
        <div class="week-view" v-if="!isCalendarExpanded">
           <!-- ...同上个版本... -->
           <div 
            v-for="day in weekDates" 
            :key="day.date" 
            class="day-item"
            :class="{ 'active': isSameDate(day.date, selectedDate), 'is-today': isSameDate(day.date, new Date()) }"
            @click="selectDate(day.date)"
          >
            <span class="week-txt">{{ day.week }}</span>
            <span class="day-num">{{ day.day }}</span>
            <div class="dot-mark" v-if="isSameDate(day.date, selectedDate)"></div>
          </div>
        </div>
        <div class="month-view" v-else>
           <!-- ...同上个版本... -->
           <div class="grid-header">
            <span v-for="w in weekDays" :key="w">{{ w }}</span>
          </div>
          <div class="grid-body">
            <div v-for="n in firstDayOfWeek" :key="'empty-'+n" class="grid-cell empty"></div>
            <div v-for="day in daysInMonth" :key="day" class="grid-cell" :class="{ 'active': isSelected(day), 'today': isToday(day) }" @click="selectDateNum(day)">
              <span>{{ day }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 功能卡片区 -->
      <div class="cards-container">
        
        <!-- 卡片：待办清单 (保持胶带呼应) -->
        <div class="sticker-card todo-card">
          <h3 class="handwritten-title">To Do List</h3>
          <div class="tape-deco"></div>
          <ul class="todo-list">
            <li><div class="checkbox"></div><span>去超市买牛奶</span></li>
            <li><div class="checkbox"></div><span>下午 3 点开会</span></li>
            <li class="done"><div class="checkbox checked"></div><span>取快递</span></li>
          </ul>
        </div>

        <!-- === 卡片：倒数日 (重构：拍立得风格) === -->
        <div class="sticker-card count-card">
          
          <!-- 拍立得组件 -->
          <div class="polaroid-wrapper">
            <!-- 胶带 -->
            <div class="tape-small"></div>
            
            <!-- 照片区域 (点击可触发上传逻辑，目前只做 UI) -->
            <div class="photo-area">
              <div class="placeholder-icon">+</div>
            </div>
            
            <!-- 可编辑的手写文字 -->
            <div class="handwriting-container">
              <input 
                type="text" 
                v-model="polaroidText" 
                class="polaroid-input" 
                placeholder="Write here..."
              />
            </div>
          </div>

          <!-- 右侧信息 -->
          <div class="content">
            <span class="label">恋爱纪念日</span>
            <div class="big-days">
              365 <span class="unit">Days</span>
            </div>
            <span class="target-date">Since 2022.05.20</span>
          </div>
        </div>

        <!-- 卡片：经期记录 -->
        <div class="sticker-card period-card">
          <div class="row">
            <span class="label">经期追踪</span>
            <span class="status">In <b style="font-size:18px">12</b> Days</span>
          </div>
          <div class="soft-progress"><div class="bar" style="width: 60%"></div></div>
          <p class="tips">Stay warm & cozy ~</p>
        </div>

      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'

// === 拍立得文字状态 ===
const polaroidText = ref('Love You') // 默认文字，可编辑

// === 基础数据 (保持之前逻辑) ===
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const weekDaysEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const monthsEnList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const now = new Date()
const isCalendarExpanded = ref(false)
const selectedDate = ref(new Date())
const viewDate = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const currentYear = computed(() => viewDate.value.getFullYear())
const currentMonth = computed(() => viewDate.value.getMonth())
const currentMonthEn = computed(() => monthsEnList[currentMonth.value])
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOfWeek = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay())

const weekDates = computed(() => {
  const curr = new Date(selectedDate.value)
  const dates = []
  const dayOfWeek = curr.getDay()
  const startDay = curr.getDate() - dayOfWeek
  for (let i = 0; i < 7; i++) {
    let d = new Date(curr)
    d.setDate(startDay + i)
    dates.push({ date: d, day: d.getDate(), week: weekDaysEn[d.getDay()] })
  }
  return dates
})

const toggleCalendar = () => { isCalendarExpanded.value = !isCalendarExpanded.value; if(isCalendarExpanded.value) viewDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1) }
const changeMonth = (step) => viewDate.value = new Date(currentYear.value, currentMonth.value + step, 1)
const isSameDate = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
const isToday = (day) => day === now.getDate() && currentMonth.value === now.getMonth() && currentYear.value === now.getFullYear()
const isSelected = (day) => day === selectedDate.value.getDate() && currentMonth.value === selectedDate.value.getMonth() && currentYear.value === selectedDate.value.getFullYear()
const selectDate = (date) => selectedDate.value = date
const selectDateNum = (day) => selectedDate.value = new Date(currentYear.value, currentMonth.value, day)
</script>

<style scoped>
/* 引入手写字体 */
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Quicksand:wght@400;600;700&display=swap');

.page-container {
  min-height: 100vh;
  background-color: #fafafa;
  padding: 20px;
  font-family: 'Quicksand', sans-serif;
  color: #333;
}

/* === 日历样式 (简化展示，保持原样) === */
.calendar-section { background: #fff; border-radius: 24px; padding: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.03); margin-bottom: 24px; }
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.month-display { display: flex; flex-direction: column; }
.m-en { font-weight: 700; font-size: 18px; } .m-cn { font-size: 12px; color: #888; }
.toggle-btn { background: #f0f0f0; border: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; color: #666; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.arrow { font-size: 8px; transition: transform 0.3s; } .arrow.up { transform: rotate(180deg); }
.month-switcher button { background: none; border: 1px solid #eee; width: 28px; height: 28px; border-radius: 50%; margin-left: 8px; cursor: pointer; }

.week-view { display: flex; justify-content: space-between; }
.day-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 0; width: 40px; border-radius: 20px; cursor: pointer; }
.day-item.active { background: #333; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.day-item.is-today .day-num { color: #ff6b81; font-weight: bold; }
.day-item.active.is-today .day-num { color: #fff; }
.week-txt { font-size: 10px; font-weight: 700; opacity: 0.6; } .day-num { font-size: 16px; font-weight: 600; }
.dot-mark { width: 4px; height: 4px; background: #fff; border-radius: 50%; margin-top: -2px;}

.grid-body { display: flex; flex-wrap: wrap; row-gap: 10px; }
.grid-header { display: flex; margin-bottom: 10px; } .grid-header span { flex: 1; text-align: center; font-size: 12px; color: #999; }
.grid-cell { width: 14.28%; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer; border-radius: 50%; font-size: 14px; }
.grid-cell.active { background: #333; color: #fff; } .grid-cell.today { color: #ff6b81; font-weight: bold; } .grid-cell.active.today { color: #fff; }

/* === 2. 卡片区域 === */
.cards-container { display: flex; flex-direction: column; gap: 24px; } /* 增加间距以容纳倾斜元素 */
.sticker-card { background: #fff; border-radius: 16px; padding: 20px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid #f2f2f2; }

/* 待办清单 */
.handwritten-title { font-family: 'Caveat', cursive; font-size: 26px; color: #333; margin: 0 0 15px 0; transform: rotate(-2deg); }
.tape-deco { position: absolute; top: -10px; right: 30px; width: 60px; height: 15px; background: rgba(220, 220, 220, 0.5); transform: rotate(3deg); backdrop-filter: blur(2px); z-index: 10; }
.todo-list li { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; color: #555; }
.checkbox { width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 6px; }
.checkbox.checked { background: #ccc; border-color: #ccc; }
.done span { text-decoration: line-through; color: #bbb; }

/* === 倒数日 (拍立得设计) === */
.count-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px; /* 给旋转留点空间 */
  overflow: visible; /* 允许拍立得旋转出卡片边界一点点 */
}

/* 拍立得容器 */
.polaroid-wrapper {
  position: relative;
  background: #fff;
  padding: 8px 8px 25px 8px; /* 底部留白大，用于写字 */
  box-shadow: 2px 4px 15px rgba(0,0,0,0.1); /* 照片的立体投影 */
  transform: rotate(-4deg); /* 整体左倾，显随意 */
  transition: transform 0.3s;
  z-index: 5;
}

.polaroid-wrapper:hover {
  transform: rotate(0deg) scale(1.02); /* 悬停扶正 */
  z-index: 10;
}

/* 照片胶带 */
.tape-small {
  position: absolute;
  top: -8px; left: 50%; transform: translateX(-50%) rotate(2deg);
  width: 30px; height: 10px;
  background: rgba(240, 230, 140, 0.4); /* 淡黄色和纸胶带 */
  backdrop-filter: blur(1px);
}

/* 照片灰底区域 */
.photo-area {
  width: 70px; height: 70px;
  background: #f4f4f4;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  /* 可以在这里加 img 标签 */
}

.placeholder-icon { font-size: 24px; color: #ddd; font-weight: 300; }

/* 手写输入框 */
.handwriting-container {
  position: absolute;
  bottom: 2px; left: 0; width: 100%;
  text-align: center;
}

.polaroid-input {
  width: 90%;
  border: none; background: transparent; outline: none;
  font-family: 'Caveat', cursive; /* 连笔手写体 */
  font-size: 16px;
  color: #555;
  text-align: center;
  padding: 0;
}
.polaroid-input::placeholder { color: #ddd; }

/* 右侧倒数信息 */
.content { flex: 1; text-align: right; z-index: 1; }
.label { font-size: 12px; color: #999; font-family: 'Caveat', cursive; font-size: 16px; margin-right: 4px; }
.big-days { font-family: 'Quicksand', sans-serif; font-size: 40px; font-weight: 700; color: #333; line-height: 1; margin: 5px 0; }
.unit { font-size: 14px; font-weight: 500; color: #666; }
.target-date { font-size: 10px; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; color: #888; letter-spacing: 0.5px; }


/* 经期卡片 */
.period-card { background: linear-gradient(135deg, #fff 0%, #fffbfb 100%); border: 1px solid #ffeef1; }
.row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #555; }
.soft-progress { height: 10px; background: #f5f5f5; border-radius: 5px; overflow: hidden; margin-bottom: 8px; }
.soft-progress .bar { height: 100%; background: #ffbdc5; border-radius: 5px; }
.tips { font-size: 12px; color: #999; margin: 0; font-family: 'Caveat', cursive; font-size: 16px; }

</style>
