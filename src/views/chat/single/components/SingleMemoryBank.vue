<template>
  <AppLayout title="长期记忆">
    <template #action>
      <div class="header-actions">
        <button class="icon-btn" @click="showRefineModal" title="提炼">
          <SvgIcon name="Sparkles" />
        </button>
        <button class="icon-btn" @click="addMemory" title="添加">
          <SvgIcon name="plus" />
        </button>
      </div>
    </template>

    <div class="memory-bank-content">
      <!-- 记忆列表 -->
      <div class="memory-scroll-container">
        <div v-if="!displayMemories || displayMemories.length === 0" class="empty-state">
          <div class="empty-text">{{ showFavoritesOnly ? '暂无收藏记忆' : '暂无长期记忆' }}</div>
        </div>
        <div v-else class="memory-list">
          <div v-for="(mem, index) in displayMemories" :key="mem.id || index" class="card memory-card">
            <div class="card-header-row">
              <div class="header-left">
                <div class="char-info" style="padding-left: 8px;">
                  <span class="char-name">{{ mem.charName || charName }}</span>
                  <span class="save-time">{{ formatTime(mem.time) }}</span>
                </div>
              </div>
              <div class="header-right">
                <button class="icon-btn" @click="editMemory(mem)" title="编辑"><SvgIcon name="pencil" /></button>
                <button class="icon-btn danger" @click="confirmDelete(mem)" title="删除"><SvgIcon name="trash" /></button>
                <button class="icon-btn favorite-btn" @click="toggleFavorite(mem)" :title="mem.isFavorite ? '取消收藏' : '收藏'">
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
    </div>

    <!-- 弹窗 -->
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
    <Modal v-model:visible="showRefineSettingsModal" title="记忆提炼" class="nested">
      <div class="refine-range-info">
        当前共有 {{ memories.length }} 条记忆。
      </div>
      <div class="refine-range-inputs">
        <label for="refine-start">从第</label>
        <input id="refine-start" type="number" v-model.number="refineStart" class="base-input range-input">
        <label for="refine-end">条 到 第</label>
        <input id="refine-end" type="number" v-model.number="refineEnd" class="base-input range-input">
        <label>条</label>
      </div>
      <p class="summary-tip">将对选定范围内的长期记忆进行再总结。</p>
      <textarea class="base-input modal-textarea" v-model="summaryPrompt" placeholder="输入总结提示词...（留空将使用默认提示词）" style="height: 100px;"></textarea>
      <template #footer>
        <button class="modal-btn cancel" @click="closeRefineModal">取消</button>
        <button class="modal-btn confirm" @click="doRefine">开始提炼</button>
      </template>
    </Modal>
    <Modal v-model:visible="showRefineConfirmModal" title="确认提炼结果" class="nested">
      <p class="summary-tip">请确认提炼后的记忆内容。点击确定将保存此内容并删除原有的 {{ memoriesToReplace.length }} 条记忆。</p>
      <textarea class="base-input modal-textarea" v-model="refinedContent" placeholder="提炼结果..." style="height: 150px;"></textarea>
      <template #footer>
        <button class="modal-btn cancel" @click="closeRefineConfirmModal">取消</button>
        <button class="modal-btn confirm" @click="confirmRefineResult">确定并替换</button>
      </template>
    </Modal>
  </AppLayout>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Pinia
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import { useApiStore } from '@/stores/apiStore'
// 组件
import AppLayout from '@/components/common/AppLayout.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'

// ================================================================================================
// 组合式函数
// ================================================================================================
const route = useRoute()
const router = useRouter()
const singleStore = useSingleStore()
const themeStore = useThemeStore()
const apiStore = useApiStore()

// ================================================================================================
// 响应式状态
// ================================================================================================
const charId = ref(route.params.charId)
const showFavoritesOnly = ref(false)
// 输入/编辑弹窗
const showInputModal = ref(false)
const editingIndex = ref(-1)
const inputText = ref('')
// 删除弹窗
const showDeleteModal = ref(false)
const deletingIndex = ref(-1)
// 提炼弹窗
const showRefineSettingsModal = ref(false)
const summaryPrompt = ref('')
const refineStart = ref(1)
const refineEnd = ref(0)
// 提炼确认弹窗
const showRefineConfirmModal = ref(false)
const refinedContent = ref('')
const memoriesToReplace = ref([])

// ================================================================================================
// 计算属性
// ================================================================================================
const character = computed(() => singleStore.getCharacter(charId.value))
const memories = computed(() => character.value?.memories || [])
const charName = computed(() => character.value?.name || '角色')
const displayMemories = computed(() => {
  const source = showFavoritesOnly.value 
    ? memories.value.filter(m => m.isFavorite) 
    : memories.value;
  
  // Create a shallow copy and sort by time, descending (newest first)
  return [...source].sort((a, b) => (b.time || 0) - (a.time || 0));
});

// ================================================================================================
// 方法 - UI
// ================================================================================================
const closeInputModal = () => { showInputModal.value = false; inputText.value = ''; }
const closeDeleteModal = () => { showDeleteModal.value = false; deletingIndex.value = -1; }
const closeRefineModal = () => { showRefineSettingsModal.value = false; }
const closeRefineConfirmModal = () => { showRefineConfirmModal.value = false; refinedContent.value = ''; memoriesToReplace.value = []; }

// ================================================================================================
// 方法 - 格式化与辅助
// ================================================================================================
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ================================================================================================
// 方法 - CRUD
// ================================================================================================
const addMemory = () => {
  editingIndex.value = -1
  inputText.value = ''
  showInputModal.value = true
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5)

const findMemoryIndex = (mem) => {
  let index = -1
  if (mem.id) {
    index = memories.value.findIndex(m => m.id === mem.id)
  }
  // 如果通过ID没找到（或者没有ID），尝试通过对象引用查找
  if (index === -1) {
    index = memories.value.indexOf(mem)
  }
  return index
}

const editMemory = (mem) => {
  const index = findMemoryIndex(mem)
  if (index === -1) return;
  editingIndex.value = index
  inputText.value = mem.content
  showInputModal.value = true
}

const saveMemory = () => {
  if (!inputText.value.trim()) return
  const char = character.value
  if (!char.memories) char.memories = []
  
  if (editingIndex.value >= 0) {
    const oldMem = char.memories[editingIndex.value]
    if (typeof oldMem === 'string') {
       char.memories[editingIndex.value] = { 
         id: generateId(),
         content: inputText.value, 
         time: Date.now(), 
         charName: char.name, 
         isFavorite: false 
       }
    } else {
      oldMem.content = inputText.value
      // 确保有 ID
      if (!oldMem.id) {
        oldMem.id = generateId()
      }
    }
  } else {
    char.memories.unshift({ 
      id: generateId(),
      content: inputText.value, 
      time: Date.now(), 
      charName: char.name, 
      isFavorite: false 
    })
  }
  
  singleStore.saveData()
  closeInputModal()
}

const confirmDelete = (mem) => {
  const index = findMemoryIndex(mem)
  if (index === -1) return;
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
// 方法 - 收藏、总结
// ================================================================================================
const toggleFavorite = (mem) => {
  const index = findMemoryIndex(mem)
  if (index === -1) return
  const memory = memories.value[index]

  if (typeof memory === 'string') {
    // 兼容旧数据：如果是字符串，先转换为对象
    const index = memories.value.indexOf(memory);
    const newMem = { content: memory, time: Date.now(), charName: charName.value, isFavorite: false };
    memories.value[index] = newMem;
    // 然后调用 store 方法进行收藏
    singleStore.toggleMemoryFavorite(charId.value, newMem);
  } else {
    // 调用 store 方法切换收藏状态（副本模式）
    singleStore.toggleMemoryFavorite(charId.value, memory);
  }
}

// 默认提示词常量
const DEFAULT_REFINE_PROMPT = `# 任务
你是一个记忆提炼助手,请对以下已有的长期记忆进行二次总结,生成一段更精炼的核心记忆。

这份记忆要**客观、直白**:

## 要求
- **白描风格**:使用最朴素、直白的语言记录事实，非必要不使用形容词和副词进行修饰或渲染
- **我是叙述者,不是分析师**。只用我的口吻描述发生了什么,不作总结评价
- **保留时间线索**:尊重原记忆中的时间信息,不要将不同时间的事件混淆或合并
- **抓重点**:从已有记忆中提取最关键的事件、情感和关系变化
- **保持真实**:不要添加原记忆中没有的信息,只提炼已有内容
- **说人话**:务必避免"交互"、"需求"、"成功解决"这类报告式词汇
- **字数限制**:总结控制在 200-300 字以内,只记录最核心的内容

直接输出提炼后的记忆内容,不要加任何其他东西。`;

const showRefineModal = () => {
  // 文本框默认留空，除非用户之前保存过自定义提示词
  // 如果之前保存的是旧的默认提示词，用户可能需要手动清空一次
  summaryPrompt.value = character.value.memorySummaryPrompt || '';
  refineStart.value = 1;
  refineEnd.value = memories.value.length;
  showRefineSettingsModal.value = true;
}

const doRefine = async () => {
  const char = character.value;
  if (!char) return;

  // Validate range
  const max = memories.value.length;
  const start = Math.max(1, refineStart.value);
  const end = Math.min(max, refineEnd.value);

  if (start > end) {
    themeStore.showToast('起始范围不能大于结束范围', 'error');
    return;
  }

  // 保存用户的自定义提示词（如果是空的，也保存为空，以便下次打开时也是空的）
  char.memorySummaryPrompt = summaryPrompt.value;
  themeStore.showToast('正在提炼记忆...', 'info');
  closeRefineModal();

  // Slice memories based on user's perspective: 1 is oldest, max is newest
  // Array is stored as [Newest, ..., Oldest]
  const total = memories.value.length;
  const sliceStart = Math.max(0, total - end);
  const sliceEnd = Math.min(total, total - start + 1);

  let memoriesToRefine = memories.value.slice(sliceStart, sliceEnd);
  
  // Reverse to provide chronological order (Oldest -> Newest) for AI
  memoriesToRefine.reverse();
  
  if (memoriesToRefine.length === 0) {
    themeStore.showToast('选定范围内没有记忆可供提炼', 'warn');
    return;
  }

  const existingMemories = memoriesToRefine.map((mem, idx) => {
    const timeStr = mem.time ? formatTime(mem.time) : '';
    return `[${idx + 1}] ${timeStr ? `(${timeStr}) ` : ''}${mem.content}`;
  }).join('\n\n');
  
  // 如果用户没填提示词，使用默认提示词
  const prompt = summaryPrompt.value.trim() || DEFAULT_REFINE_PROMPT;
  
  const messages = [
    { role: 'user', content: `${prompt}\n\n现有记忆如下：\n\n${existingMemories}` }
  ];

  try {
    const response = await apiStore.getGenericCompletion(messages);
    const summaryResult = response?.content;

    if (summaryResult && summaryResult.trim()) {
      // 暂存结果和待替换的记忆
      refinedContent.value = `[记忆提炼 ${start}-${end}] ${summaryResult.trim()}`;
      memoriesToReplace.value = memoriesToRefine;
      // 打开确认弹窗
      showRefineConfirmModal.value = true;
    } else {
      themeStore.showToast('提炼失败，未收到有效回复', 'error');
    }
  } catch (error) {
    console.error('记忆提炼失败:', error);
    themeStore.showToast(`提炼失败: ${error.message}`, 'error');
  }
}

const confirmRefineResult = () => {
  const char = character.value;
  if (!char) return;
  if (!char.memories) char.memories = [];

  // 1. 删除被提炼的旧记忆
  // 使用对象引用过滤，确保准确删除
  if (memoriesToReplace.value && memoriesToReplace.value.length > 0) {
    char.memories = char.memories.filter(m => !memoriesToReplace.value.includes(m));
  }

  // 2. 添加新的提炼记忆
  // 使用被替换记忆中最新的时间戳，以保持时间线相对位置，如果找不到则用当前时间
  let newTime = Date.now();
  if (memoriesToReplace.value.length > 0) {
    // 假设 memoriesToReplace 也是按时间倒序的（在 doRefine 中被 reverse 之前是 slice 出来的，slice 是从原数组切的）
    // 原数组 memories 是 [Newest, ..., Oldest]
    // doRefine 中: memoriesToRefine = memories.value.slice(sliceStart, sliceEnd)
    // 所以 memoriesToRefine[0] 应该是这批里最新的
    const newestMem = memoriesToReplace.value[0];
    if (newestMem && newestMem.time) {
      newTime = newestMem.time;
    }
  }

  char.memories.unshift({ 
    id: generateId(),
    content: refinedContent.value, 
    time: newTime, 
    charName: char.name, 
    isFavorite: false 
  });

  singleStore.saveData();
  themeStore.showToast('记忆提炼已保存并替换旧记忆', 'success');
  closeRefineConfirmModal();
}
</script>

<style scoped>
@import '@/assets/css/components/Card.css';

:deep(.action-btn) {
  width: auto; 
  justify-content: flex-end; 
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px; 
  padding-right: 4px; 
}

.memory-bank-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.memory-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* AppLayout has padding */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.memory-scroll-container::-webkit-scrollbar { display: none; }
.empty-state { display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-size: 14px; }

/* --- 记忆卡片 --- */
.memory-card { display: flex; flex-direction: column; padding: 10px 15px; }
.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.header-left { display: flex; align-items: center; gap: 5px; }
.char-info { display: flex; flex-direction: column; justify-content: center; }
.char-name { font-weight: 700; font-size: 16px; color: #333; line-height: 1.2; }
.save-time { font-size: 10px; color: #999; margin-top: 2px; }
.header-right { display: flex; align-items: center; gap: 8px; padding-top: 5px; }
.card-content-row { font-size: 14px; line-height: 1.5; color: #555; white-space: pre-wrap; padding-left: 8px; }

/* --- 按钮 --- */
.icon-btn {
  background: transparent; border: none; cursor: pointer; padding: 4px;
  color: var(--c-text-2); display: flex; align-items: center; justify-content: center;
  border-radius: 4px; transition: all 0.2s; font-size: 16px;
}
.icon-btn :deep(svg) { width: 24px; height: 24px; }
.icon-btn:hover { background: rgba(0,0,0,0.05); color: var(--c-text-1); }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.icon-btn.danger { color: #FF3B30; }
.icon-btn.danger:hover { color: #FF3B30; background: rgba(255, 59, 48, 0.1); }

/* 卡片内的按钮使用更小的尺寸 */
.memory-card .icon-btn {
  padding: 2px;
}
.memory-card .icon-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.sort-btn { height: auto; width: auto; }
.favorite-btn { color: #ccc; }
.favorite-btn:active { color: #FF2D55; background: transparent; }
.is-favorite { color: #FF2D55; }

/* --- 嵌套弹窗 --- */
.nested { z-index: 1100; }
.confirm-text { text-align: center; color: #888; font-size: 14px; }
.summary-tip { font-size: 12px; color: #666; margin-bottom: 10px; }

/* --- 提炼范围 --- */
.refine-range-info {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  text-align: center;
}
.refine-range-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}
.refine-range-inputs label {
  font-size: 13px;
  color: #333;
  flex-shrink: 0;
}
.range-input {
  width: 60px;
  text-align: center;
  padding: 4px 8px;
  font-size: 14px;
}
</style>
