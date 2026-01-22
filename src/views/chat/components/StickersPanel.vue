<template>
  <div>
    <!-- 表情包面板主容器 -->
    <div class="chat-panel" v-if="visible" id="stickerPanel">
      <!-- 面板头部：分组切换 -->
      <div class="sticker-panel-header">
        <div class="sticker-groups">
          <div class="sticker-group-tab"
               v-for="group in stickerGroups"
               :key="group"
               :class="{ active: currentStickerGroup === group }"
               @click="currentStickerGroup = group">
            {{ group }}
          </div>
        </div>
      </div>
      <!-- 面板内容：表情包列表 -->
      <div class="sticker-panel-content">
        <div class="sticker-item"
             v-for="sticker in currentStickers"
             :key="sticker.id"
             :class="{ selected: selectedStickerIds.has(sticker.id), 'manage-mode': isStickerManageMode }"
             @click="handleStickerClick(sticker)">
          <img :src="sticker.url" :alt="sticker.name">
          <span>{{ sticker.name }}</span>
        </div>
      </div>
      <!-- 面板底部：操作按钮 -->
      <div class="sticker-panel-footer">
        <div class="sticker-add-btn" @click="showStickerImport" v-show="!isStickerManageMode">＋</div>
        <div class="sticker-manage-btn"
             :style="{ color: isStickerManageMode ? 'var(--danger-color)' : '#576B95' }"
             @click="toggleStickerManage">
          {{ isStickerManageMode ? '完成' : '管理' }}
        </div>
      </div>

      <!-- 管理模式操作栏 -->
      <div class="manage-bar" :class="{ active: isStickerManageMode }">
        <button class="btn btn-secondary" @click="showStickerImport">导入</button>
        <button class="btn btn-secondary" @click="selectAllStickers">全选</button>
        <button class="btn btn-secondary" @click="openMoveGroup">移动</button>
        <button class="btn btn-secondary" @click="exportSelectedStickers">导出</button>
        <button class="btn btn-danger" @click="deleteSelectedStickers">删除</button>
      </div>
    </div>

    <!-- 弹窗：表情包导入 -->
    <ImageUploadModal
      v-model:visible="showStickerImportModal"
      type="sticker-import"
      @import-sticker="handleImportSticker"
    />

    <!-- 弹窗：移动分组 -->
    <Modal v-model:visible="showMoveGroup" title="移动到分组">
      <input type="text" class="base-input" v-model="targetGroupInput" placeholder="输入目标分组名称">
      <template #footer>
        <button class="modal-btn cancel" @click="showMoveGroup = false">取消</button>
        <button class="modal-btn confirm" @click="confirmMoveGroup">确定</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, computed } from 'vue'
// Pinia
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
// 组件
import Modal from '@/components/common/Modal.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

// ================================================================================================
// 属性、事件
// ================================================================================================
const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['send-sticker', 'update:visible'])

// ================================================================================================
// 组合式函数
// ================================================================================================
const singleStore = useSingleStore()
const themeStore = useThemeStore()

// ================================================================================================
// 响应式状态
// ================================================================================================
const currentStickerGroup = ref('默认')
const isStickerManageMode = ref(false)
const selectedStickerIds = ref(new Set())
// 弹窗状态
const showStickerImportModal = ref(false)
const showMoveGroup = ref(false)
const targetGroupInput = ref('')

// ================================================================================================
// 计算属性
// ================================================================================================
const stickerGroups = computed(() => {
  const groups = ['默认', ...new Set(singleStore.stickers.map(e => e.group).filter(Boolean).filter(g => g !== '默认'))]
  return groups
})

const currentStickers = computed(() => {
  return singleStore.stickers.filter(e => e.group === currentStickerGroup.value)
})

// ================================================================================================
// 方法 - 事件处理
// ================================================================================================
/**
 * @description 处理表情包点击事件。管理模式下为选择，否则为发送。
 * @param {object} sticker - 被点击的表情包对象
 */
const handleStickerClick = (sticker) => {
  if (isStickerManageMode.value) {
    if (selectedStickerIds.value.has(sticker.id)) {
      selectedStickerIds.value.delete(sticker.id)
    } else {
      selectedStickerIds.value.add(sticker.id)
    }
  } else {
    emit('send-sticker', sticker)
  }
}

/**
 * @description 处理从 ImageUploadModal 导出的表情包数据
 * @param {object} payload - { group: string, stickers: array }
 */
const handleImportSticker = ({ group, stickers }) => {
  const newStickers = stickers.map(e => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    url: e.url,
    name: e.name,
    group: group
  }))

  singleStore.stickers.push(...newStickers)
  singleStore.saveData()
  themeStore.showToast(`成功导入 ${newStickers.length} 个表情包`, 'success')
}

// ================================================================================================
// 方法 - UI
// ================================================================================================
const showStickerImport = () => { showStickerImportModal.value = true }
const openMoveGroup = () => { if (selectedStickerIds.value.size > 0) showMoveGroup.value = true }

/**
 * @description 切换表情包管理模式
 */
const toggleStickerManage = () => {
  isStickerManageMode.value = !isStickerManageMode.value
  selectedStickerIds.value.clear()
}

// ================================================================================================
// 方法 - 管理操作
// ================================================================================================
/**
 * @description 全选或取消全选当前分组下的所有表情包
 */
const selectAllStickers = () => {
  const stickers = currentStickers.value
  const allSelected = stickers.every(e => selectedStickerIds.value.has(e.id))

  if (allSelected) {
    stickers.forEach(e => selectedStickerIds.value.delete(e.id))
  } else {
    stickers.forEach(e => selectedStickerIds.value.add(e.id))
  }
}

/**
 * @description 删除选中的表情包
 */
const deleteSelectedStickers = () => {
  if (selectedStickerIds.value.size === 0) return
  themeStore.showConfirm('删除表情包', '确定删除选中的表情包吗？', () => {
      singleStore.stickers = singleStore.stickers.filter(e => !selectedStickerIds.value.has(e.id))
      singleStore.saveData()
      selectedStickerIds.value.clear()
    }
  )
}

/**
 * @description 确认移动选中的表情包到新分组
 */
const confirmMoveGroup = () => {
  const target = targetGroupInput.value.trim()
  if (!target) return themeStore.showToast('请输入目标分组', 'info')

  singleStore.stickers.forEach(e => {
    if (selectedStickerIds.value.has(e.id)) e.group = target
  })
  singleStore.saveData()
  
  showMoveGroup.value = false
  targetGroupInput.value = ''
  selectedStickerIds.value.clear()
  isStickerManageMode.value = false
  currentStickerGroup.value = target
}

/**
 * @description 导出选中的表情包为 txt 文件
 */
const exportSelectedStickers = () => {
  if (selectedStickerIds.value.size === 0) return

  const exportData = singleStore.stickers
    .filter(e => selectedStickerIds.value.has(e.id))
    .map(e => `${e.name} ${e.url}`)
    .join('\n')

  const blob = new Blob([exportData], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `stickers_export_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  selectedStickerIds.value.clear()
  isStickerManageMode.value = false
}
</script>

<style scoped>
/* --- 根容器 --- */
.chat-panel {
    height: 250px;
    background: #F7F7F7;
    border-top: 1px solid #E5E5E5;
    display: flex;
    flex-direction: column;
}

/* --- 头部 --- */
.sticker-panel-header {
    height: 40px; 
    display: flex; 
    align-items: center; 
    padding: 0 10px; 
    border-bottom: 1px solid #E5E5E5;
}
.sticker-groups { 
    flex: 1; 
    display: flex; 
    flex-wrap: wrap;
    overflow-x: hidden; 
    height: 100%; 
    align-items: center; 
    scrollbar-width: none; 
}
.sticker-group-tab {
    padding: 5px 12px; 
    font-size: 13px; 
    color: #666; 
    cursor: pointer; 
    border-radius: 12px; 
    margin-right: 5px; 
    white-space: nowrap;
}
.sticker-group-tab.active { 
    background: white; 
    color: #333; 
    font-weight: 500; 
}

/* --- 内容 --- */
.sticker-panel-content {
    flex: 1; 
    overflow-y: auto; 
    padding: 10px; 
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 8px; 
    align-content: start;
    scrollbar-width: none;
}
.sticker-item {
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    cursor: pointer; 
    padding: 4px; 
    border-radius: 8px;
    position: relative;
}
.sticker-item img { 
    width: 100%; 
    height: auto; 
    aspect-ratio: 1/1; 
    object-fit: contain; 
    max-width: 60px; 
}
.sticker-item span { 
    font-size: 10px; 
    color: #888; 
    margin-top: 2px; 
    text-align: center; 
    display: block; 
    width: 100%; 
    word-break: break-all;
}

/* --- 底部 --- */
.sticker-panel-footer {
    height: 45px; 
    background: white; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 15px; 
    border-top: 1px solid #E5E5E5;
}
.sticker-add-btn { 
    font-size: 24px; 
    color: #666; 
    cursor: pointer; 
    padding: 5px; 
}
.sticker-manage-btn { 
    font-size: 14px; 
    color: #576B95; 
    cursor: pointer; 
    padding: 5px 10px; 
}

/* --- 管理模式 --- */
.manage-bar {
    height: 40px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid #E5E5E5;
    display: none;
    align-items: center;
    justify-content: space-around;
    padding: 0 5px;
    position: absolute;
    bottom: 45px; /* 位于底部栏上方 */
    left: 0;
    width: 100%;
    z-index: 90;
}
.manage-bar.active { 
    display: flex; 
    animation: slideUp 0.2s ease; 
}
.manage-bar .btn {
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #333;
}
.manage-bar .btn.btn-danger { color: var(--danger-color); }

.sticker-item.selected { background: rgba(0,0,0,0.1); }
.sticker-item.manage-mode.selected::after {
    content: '✓';
    position: absolute;
    top: 0; right: 0;
    background: var(--accent-green);
    color: white;
    border-radius: 50%;
    width: 20px; height: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    border: 2px solid white;
}

/* --- 动画与滚动条 --- */
@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.sticker-groups::-webkit-scrollbar,
.sticker-panel-content::-webkit-scrollbar {
    display: none;
}
</style>
