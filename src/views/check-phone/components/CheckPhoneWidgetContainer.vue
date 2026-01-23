<script setup>
import { computed } from 'vue'
import CheckPhoneHeader from './CheckPhoneHeader.vue'
import CheckPhoneMiddleWidget from './CheckPhoneMiddleWidget.vue'
import CheckPhoneBottomWidget from './CheckPhoneBottomWidget.vue'

// 定义 props
const props = defineProps({
  headerData: {
    type: Object,
    required: true
  },
  middleData: {
    type: Object,
    required: true
  },
  bottomData: {
    type: Object,
    required: true
  }
})

// 定义 emits
const emit = defineEmits(['update:headerData', 'update:middleData', 'update:bottomData'])

// 事件处理
const handleUpdateHeaderData = (newData) => {
  emit('update:headerData', newData)
}

const handleUpdateMiddleData = (newData) => {
  emit('update:middleData', newData)
}

const handleUpdateBottomData = (newData) => {
  emit('update:bottomData', newData)
}
</script>

<template>
  <div class="check-phone-widget-container">
    <!-- 上部区域 - Header Widget -->
    <div class="widget-item top-widget">
      <CheckPhoneHeader 
        :widget-data="headerData"
        @update:widget-data="handleUpdateHeaderData"
      />
    </div>

    <!-- 中部区域 - 左照片右App -->
    <div class="widget-item middle-widget">
      <CheckPhoneMiddleWidget 
        :widget-data="middleData"
        @update:widget-data="handleUpdateMiddleData"
      />
    </div>

    <!-- 下部区域 - 左App右照片 -->
    <div class="widget-item bottom-widget">
      <CheckPhoneBottomWidget 
        :widget-data="bottomData"
        @update:widget-data="handleUpdateBottomData"
      />
    </div>
  </div>
</template>

<style scoped>
/* ==========================================
   Widget 容器
   说明：使用百分比统一管理所有widget的尺寸和位置
   ========================================== */
.check-phone-widget-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* ==========================================
   Widget 项目基础样式
   ========================================== */
.widget-item {
  position: absolute;
  box-sizing: border-box;
}

/* ==========================================
   上部区域 - Header Widget
   调整方法：
   - top: 控制距离顶部的距离（百分比）
   - left: 控制距离左侧的距离（百分比）
   - width: 控制widget宽度（百分比）
   - height: 控制widget高度（百分比）
   ========================================== */
.top-widget {
  top: 2%;           /* 距离顶部的位置 */
  left: 0%;          /* 距离左侧的位置 */
  width: 100%;       /* widget宽度 */
  height: 25%;       /* widget高度，调整此值来改变CheckPhoneHeader的高度 */
  z-index: 10;
}

/* ==========================================
   中部区域 - Middle Widget（左照片右App）
   ========================================== */
.middle-widget {
  top: 31%;          /* 距离顶部的位置 */
  left: 0%;          /* 距离左侧的位置 */
  width: 100%;       /* widget宽度 */
  height: 25%;       /* widget高度 */
  z-index: 5;
  
  /* 照片区域容器（.photo-section）宽度控制 */
  --middle-left-width: 50%;      /* 左侧照片区域容器宽度占比 */
  
  /* 照片容器（.photo-container）位置微调 */
  --middle-left-offset: 0.5em;   /* 照片水平偏移 */
  --middle-vertical-offset: -1em; /* 照片垂直偏移 */
  
  /* App网格区域容器（.app-section）宽度控制 */
  --middle-right-width: 50%;     /* 右侧App区域容器宽度占比 */
  
  /* App网格（.app-grid）位置微调 */
  --middle-right-offset: -0.2em;    /* App网格水平偏移 */
  --middle-right-vertical-offset: 0.3em; /* App网格垂直偏移 */
}

/* ==========================================
   下部区域 - Bottom Widget（左App右照片）
   ========================================== */
.bottom-widget {
  top: 61%;          /* 距离顶部的位置 */
  left: 0%;          /* 距离左侧的位置 */
  width: 100%;       /* widget宽度 */
  height: 25%;       /* widget高度 */
  z-index: 5;
  
  /* App网格区域容器（.app-section）宽度控制 */
  --bottom-left-width: 50%;      /* 左侧App区域容器宽度占比 */
  
  /* App网格（.app-grid）位置微调 */
  --bottom-left-offset: 0.2em;     /* App网格水平偏移 */
  --bottom-left-vertical-offset: 0em; /* App网格垂直偏移 */
  
  /* 照片区域容器（.photo-section）宽度控制 */
  --bottom-right-width: 50%;     /* 右侧照片区域容器宽度占比 */
  
  /* 照片容器（.photo-container）位置微调 */
  --bottom-right-offset: -0.5em; /* 照片水平偏移 */
  --bottom-right-vertical-offset: -1.3em; /* 照片垂直偏移 */
}

/* ==========================================
   调整指南：
   
   1. 调整整个容器的尺寸和位置：
      在 .check-phone-widget-container 中添加 width, height, top, left 属性
      例如：width: 90% 控制容器宽度，top: 2% 控制距离顶部位置
   
   2. 调整widget高度和位置：
      修改对应widget的 top, left, width, height 百分比
      例如：top: 5%, left: 10%, width: 80%, height: 40%
   
   3. 调整widget间距：
      增加或减少相邻widget之间的top差值
      例如：top-widget height: 35%, middle-widget top: 37% 会留出2%间隙
   
   4. 调整middle-widget左右区域：
      修改 --middle-left-width 和 --middle-right-width 控制左右宽度比例
      修改 --middle-left-offset 和 --middle-right-offset 控制左右偏移
      例如：--middle-left-width: 60% 让左侧照片占60%
   
   5. 调整bottom-widget左右区域：
      修改 --bottom-left-width 和 --bottom-right-width 控制左右宽度比例
      修改 --bottom-left-offset 和 --bottom-right-offset 控制左右偏移
      例如：--bottom-right-width: 55% 让右侧照片占55%
   
   6. 完整示例：
      容器整体缩小并居中 - 在.check-phone-widget-container添加
        width: 90%, height: 95%, top: 2.5%, left: 5%
      
      大Header - 在.top-widget修改
        top: 0%, left: 0%, width: 100%, height: 45%
      
      小Middle左侧照片更大 - 在.middle-widget修改
        top: 47%, height: 20%
        --middle-left-width: 65%
        --middle-right-width: 35%
      
      大Bottom右侧照片更大 - 在.bottom-widget修改
        top: 69%, height: 25%
        --bottom-left-width: 40%
        --bottom-right-width: 60%
   ========================================== */
</style>
