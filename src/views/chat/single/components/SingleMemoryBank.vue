<template>
  <div class="memory-bank-wrapper">
    <!-- 主弹窗 -->
    <Modal 
      :visible="visible" 
      @update:visible="close" 
      containerClass="memory-bank-modal-container"
      teleportTo="#phone-screen-container"
    >
      <!-- 头部 -->
      <template #header>
        <div class="modal-header-content">
          <h3>长期记忆</h3>
          <div class="header-actions">
            <button class="btn summary-btn" @click="showSummaryModal">总结</button>
          </div>
        </div>
      </template>
      
      <!-- 记忆列表 -->
      <div class="memory-scroll-container">
        <div v-if="!displayMemories || displayMemories.length === 0" class="empty-state">
          <div class="empty-text">{{ showFavoritesOnly ? '暂无收藏记忆' : '暂无长期记忆' }}</div>
        </div>
        <div v-else class="memory-list">
          <div v-for="mem in displayMemories" :key="mem.id || index" class="card memory-card">
            <div class="card-header-row">
              <div class="header-left">
                <div class="sort-buttons">
                  <button class="icon-btn sort-btn" @click="moveMemory(getOriginalIndex(mem), -1)" :disabled="getOriginalIndex(mem) === 0 || showFavoritesOnly" title="上移">
                    <SvgIcon name="arrow-up" />
                  </button>
                  <button class="icon-btn sort-btn" @click="moveMemory(getOriginalIndex(mem), 1)" :disabled="getOriginalIndex(mem) === memories.length - 1 || showFavoritesOnly" title="下移">
                    <SvgIcon name="arrow-down" />
                  </button>
                </div>
                <div class="char-info">
                  <span class="char-name">{{ mem.charName || charName }}</span>
                  <span class="save-time">{{ formatTime(mem.time) }}</span>
                </div>
              </div>
              <div class="header-right">
                <button class="icon-btn" @click="editMemory(getOriginalIndex(mem))" title="编辑"><SvgIcon name="pencil" /></button>
                <button class="icon-btn danger" @click="confirmDelete(getOriginalIndex(mem))" title="删除"><SvgIcon name="trash" /></button>
                <button class="icon-btn favorite-btn" @click="toggleFavorite(getOriginalIndex(mem))" :title="mem.isFavorite ? '取消收藏' : '收藏'">
                  <SvgIcon :name="mem.isFavorite ? 'heart-solid' : 'heart'" :class="{ 'is-favorite': mem.isFavorite }" />
                </button>
              </div>
            </div>
            <div class="card-content-row">
              {{ mem.content }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <template #footer>
        <button class="modal-btn primary-text" @click="addMemory">+ 新增</button>
        <button class="modal-btn cancel" @click="close">关闭</button>
      </template>
    </Modal>

    <!-- 嵌套弹窗 -->
    <Modal v-model:visible="showInputModal" :title="editingIndex >= 0 ? '编辑记忆' : '新增记忆'" class="nested">
      <textarea class="base-input modal-textarea" v-model="inputText" placeholder="输入希望AI记住的内容..." style="height: 150px;"></textarea>
      <template #footer>
        <button class="modal-btn cancel" @click="closeInputModal">取消</button>
        <button class="modal-btn confirm" @click="saveMemory">确定</button>
      </template>
    </Modal>
    <Modal v-model:visible="showDeleteModal" title="确认删除" class="nested">
      <p class="confirm-text">确定要删除这条记忆吗？</p>
      <template #footer>
        <button class="modal-btn cancel" @click="closeDeleteModal">取消</button>
        <button class="modal-btn confirm danger" @click="deleteMemory">确认删除</button>
      </template>
    </Modal>
    <Modal v-model:visible="showSummarySettingsModal" title="记忆总结" class="nested">
      <p class="summary-tip">将对现有长期记忆进行再总结。</p>
      <textarea class="base-input modal-textarea" v-model="summaryPrompt" placeholder="输入总结提示词..." style="height: 100px;"></textarea>
      <template #footer>
        <button class="modal-btn cancel" @click="closeSummaryModal">取消</button>
        <button class="modal-btn confirm" @click="doSummary">开始总结</button>
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
import { useApiStore } from '@/stores/apiStore'
// 组件
import SvgIcon from '@/components/common/SvgIcon.vue'

// ================================================================================================
// 属性、事件
// ================================================================================================
const props = defineProps({
  visible: Boolean,
  charId: String
})
const emit = defineEmits(['update:visible'])

// ================================================================================================
// 组合式函数
// ================================================================================================
const singleStore = useSingleStore()
const themeStore = useThemeStore()
const apiStore = useApiStore()

// ================================================================================================
// 响应式状态
// ================================================================================================
const showFavoritesOnly = ref(false)
// 输入/编辑弹窗
const showInputModal = ref(false)
const editingIndex = ref(-1)
const inputText = ref('')
// 删除弹窗
const showDeleteModal = ref(false)
const deletingIndex = ref(-1)
// 总结弹窗
const showSummarySettingsModal = ref(false)
const summaryPrompt = ref('')

// ================================================================================================
// 计算属性
// ================================================================================================
const character = computed(() => singleStore.getCharacter(props.charId))
const memories = computed(() => character.value?.memories || [])
const charName = computed(() => character.value?.name || '角色')
const displayMemories = computed(() => showFavoritesOnly.value ? memories.value.filter(m => m.isFavorite) : memories.value)

// ================================================================================================
// 方法 - UI
// ================================================================================================
const close = () => { emit('update:visible', false) }
const closeInputModal = () => { showInputModal.value = false; inputText.value = ''; }
const closeDeleteModal = () => { showDeleteModal.value = false; deletingIndex.value = -1; }
const closeSummaryModal = () => { showSummarySettingsModal.value = false; }

// ================================================================================================
// 方法 - 格式化与辅助
// ================================================================================================
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
const getOriginalIndex = (mem) => memories.value.indexOf(mem)

// ================================================================================================
// 方法 - CRUD
// ================================================================================================
const addMemory = () => {
  editingIndex.value = -1
  inputText.value = ''
  showInputModal.value = true
}

const editMemory = (index) => {
  editingIndex.value = index
  const mem = memories.value[index]
  inputText.value = typeof mem === 'string' ? mem : mem.content
  showInputModal.value = true
}

const saveMemory = () => {
  if (!inputText.value.trim()) return
  const char = character.value
  if (!char.memories) char.memories = []
  
  if (editingIndex.value >= 0) {
    const oldMem = char.memories[editingIndex.value]
    if (typeof oldMem === 'string') {
       char.memories[editingIndex.value] = { content: inputText.value, time: Date.now(), charName: char.name, isFavorite: false }
    } else {
      oldMem.content = inputText.value
    }
  } else {
    char.memories.unshift({ content: inputText.value, time: Date.now(), charName: char.name, isFavorite: false })
  }
  
  singleStore.saveData()
  closeInputModal()
}

const confirmDelete = (index) => {
  deletingIndex.value = index
  showDeleteModal.value = true
}

const deleteMemory = () => {
  if (deletingIndex.value >= 0) {
    character.value.memories.splice(deletingIndex.value, 1)
    singleStore.saveData()
  }
  closeDeleteModal()
}

// ================================================================================================
// 方法 - 排序、收藏、总结
// ================================================================================================
const moveMemory = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= memories.value.length) return
  
  const temp = character.value.memories[index]
  character.value.memories[index] = character.value.memories[newIndex]
  character.value.memories[newIndex] = temp
  singleStore.saveData()
}

const toggleFavorite = (index) => {
  const mem = memories.value[index]
  if (typeof mem === 'string') {
    memories.value[index] = { content: mem, time: Date.now(), charName: charName.value, isFavorite: true }
  } else {
    mem.isFavorite = !mem.isFavorite
  }
  singleStore.saveData()
}

const showSummaryModal = () => {
  summaryPrompt.value = character.value.memorySummaryPrompt || ''
  showSummarySettingsModal.value = true
}

const doSummary = async () => {
  const char = character.value;
  if (!char) return;

  char.memorySummaryPrompt = summaryPrompt.value;
  themeStore.showToast('正在总结记忆...', 'info');
  closeSummaryModal();

  const existingMemories = memories.value.map(mem => mem.content).join('\n---\n');
  const prompt = summaryPrompt.value || '请总结以下内容，提取关键信息。';
  const messages = [
    { role: 'system', content: '你是一个记忆总结助手。' },
    { role: 'user', content: `现有记忆如下：\n${existingMemories}\n\n请根据以下要求进行总结：\n${prompt}` }
  ];

  try {
    const summaryResult = await apiStore.getGenericCompletion(messages);
    if (summaryResult) {
      if (!char.memories) char.memories = [];
      char.memories.unshift({ content: `[记忆再总结] ${summaryResult}`, time: Date.now(), charName: char.name, isFavorite: false });
      singleStore.saveData();
      themeStore.showToast('记忆总结已完成', 'success');
    } else {
      themeStore.showToast('总结失败，未收到有效回复', 'error');
    }
  } catch (error) {
    console.error('记忆总结失败:', error);
  }
}
</script>

<style>
/* --- 非 Scoped 样式，用于 Teleport 的 Modal --- */
.memory-bank-modal-container {
  height: 100% !important;
  max-height: 600px !important;
  width: 100% !important;
  max-width: 1000px !important;
  display: flex;
  flex-direction: column;
}
.memory-bank-modal-container .modal-body {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
@import '@/assets/css/components/Card.css';

/* --- 头部 --- */
.modal-header-content {
  display: flex; justify-content: center; align-items: center;
  position: relative; width: calc(100% + 40px); margin: -10px -20px 0; padding: 10px 20px;
}
.modal-header-content h3 {
  font-size: 16px; font-weight: 600; margin: 0;
  position: absolute; left: 50%; transform: translateX(-50%);
}
.header-actions { margin-left: auto; display: flex; gap: 10px; }
.summary-btn {
  font-size: 13px; cursor: pointer; background: transparent;
  border-radius: 4px; color: #666; padding: 4px 55px;
}
.summary-btn:hover { background: #f5f5f5; }

/* --- 列表容器 --- */
.memory-scroll-container {
  flex: 1; overflow-y: auto; padding: 2px 10px; background: #f5f5f5;
  scrollbar-width: none; -ms-overflow-style: none;
}
.memory-scroll-container::-webkit-scrollbar { display: none; }
.empty-state { display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-size: 14px; }

/* --- 记忆卡片 --- */
.memory-card { display: flex; flex-direction: column; padding: 10px 5px; }
.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.header-left { display: flex; align-items: center; gap: 2px; }
.char-info { display: flex; flex-direction: column; justify-content: center; }
.char-name { font-weight: 700; font-size: 16px; color: #333; line-height: 1.2; }
.save-time { font-size: 10px; color: #999; margin-top: 2px; }
.header-right { display: flex; align-items: center; gap: 8px; padding-top: 5px; }
.card-content-row { font-size: 14px; line-height: 1.5; color: #555; white-space: pre-wrap; padding-left: 23px; }

/* --- 按钮 --- */
.icon-btn {
  background: transparent; border: none; cursor: pointer; padding: 4px;
  color: #888; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; transition: all 0.2s; font-size: 16px;
}
.icon-btn :deep(svg) { width: 1.2em; height: 1.2em; }
.icon-btn:hover { background: rgba(0,0,0,0.05); color: #333; }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.icon-btn.danger { color: #FF3B30; }
.icon-btn.danger:hover { color: #FF3B30; background: rgba(255, 59, 48, 0.1); }
.sort-buttons { display: flex; flex-direction: column; }
.sort-btn { height: 16px; width: 20px; display: flex; align-items: center; justify-content: center; }
.sort-btn .svg-icon { width: 14px; height: 14px; }
.favorite-btn { color: #ccc; }
.favorite-btn:active { color: #FF2D55; background: transparent; }
.is-favorite { color: #FF2D55; }

/* --- 嵌套弹窗 --- */
.nested { z-index: 1100; }
.confirm-text { text-align: center; color: #888; font-size: 14px; }
.summary-tip { font-size: 12px; color: #666; margin-bottom: 10px; }
</style>
