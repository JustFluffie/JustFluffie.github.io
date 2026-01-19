<template>
  <div class="post-moment-modal" v-if="show">
    <div class="modal-content" @click.stop>
      <!-- ==================== 模块: 头部导航 ==================== -->
      <div class="app-header">
        <div class="back-btn" @click="closeModal">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
        </div>
        <div class="title">发表动态</div>
        <div class="action-btn">
          <button @click="postMoment" class="header-save-btn" :disabled="isPostButtonDisabled">发表</button>
        </div>
      </div>

      <!-- ==================== 模块: 内容主体 ==================== -->
      <div class="modal-body">
        <!-- 文本输入 -->
        <textarea v-model="text" placeholder="这一刻的想法..." class="post-moment-textarea"></textarea>
        
        <!-- 图片/描述网格 -->
        <div class="publish-images" :class="{ 'single-image': publishImages.length === 1 }">
          <template v-for="(img, index) in publishImages" :key="index">
            <!-- 单张、非文字生成的图片 -->
            <div v-if="publishImages.length === 1 && !img.isTextGenerated"
                 class="publish-single-image-adaptive"
                 @click="handleImageClick(img)">
              <img :src="getImageUrl(img)" alt="publish preview" />
              <div class="remove-img" @click.stop="removePublishImage(index)">×</div>
            </div>
            <!-- 其他情况 -->
            <div v-else
                 class="publish-image-item"
                 :style="{ backgroundImage: `url(${getImageUrl(img)})` }"
                 @click="handleImageClick(img)">
              <div v-if="img.isTextGenerated" 
                   class="description-placeholder"
                   :ref="el => textContainers[index] = el">
                {{ publishImages.length > 1 ? `第${index + 1}张图片` : '一张图片' }}
              </div>
              <div class="remove-img" @click.stop="removePublishImage(index)">×</div>
            </div>
          </template>
          <div class="add-image-btn" @click="showPublishImageOptions = true" v-if="publishImages.length < 9">
            <span>+</span>
          </div>
        </div>

        <div class="spacer"></div>

        <!-- 功能选项 -->
        <div class="option-list">
          <div class="option-row" @click="toggleLocationInput">
            <div class="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div class="option-label">所在位置</div>
            <div class="option-value">{{ location || '' }}</div>
            <div class="option-arrow">></div>
          </div>
          <div v-if="showLocationInput" class="expanded-input-container">
            <input type="text" v-model="location" placeholder="输入位置" class="base-input" />
          </div>

          <div class="option-row" @click="showRemindSelector = true">
            <div class="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
            </div>
            <div class="option-label">提醒谁看</div>
            <div class="option-value">{{ remindList.length ? `${remindList.length}个联系人` : '' }}</div>
            <div class="option-arrow">></div>
          </div>

          <div class="option-row" @click="showVisibilitySelector = true">
            <div class="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="option-label">谁可以看</div>
            <div class="option-value">{{ visibility.type === 'public' ? '公开' : `${visibility.allowed.length}个联系人` }}</div>
            <div class="option-arrow">></div>
          </div>
        </div>
      </div>

      <!-- ==================== 模块: 弹窗浮层 ==================== -->

      <!-- 弹窗: 添加图片选项 -->
      <div v-if="showPublishImageOptions" class="popup-overlay" @click="closeAllPopups">
        <div class="popup-content" @click.stop>
          <!-- 文字描述 -->
          <div class="popup-option-wrapper">
            <div class="popup-option" @click="toggleInput('description')">文字描述</div>
            <div v-if="activeInput === 'description'" class="expanded-input-container new-input-style">
              <div class="input-wrapper">
                <textarea v-model="descriptionInput" placeholder="输入描述..." class="base-input"></textarea>
                <button v-if="descriptionInput" @click="clearInput" class="clear-input-btn">×</button>
              </div>
              <button @click="confirmAddMedia" class="btn btn-secondary btn-sm">确定</button>
            </div>
          </div>

          <!-- 从相册选择 -->
          <div class="popup-option" @click="triggerFileUpload">从相册选择</div>

          <!-- 输入图片链接 -->
          <div class="popup-option-wrapper">
            <div class="popup-option" @click="toggleInput('url')">输入图片链接</div>
            <div v-if="activeInput === 'url'" class="expanded-input-container new-input-style">
              <div class="input-wrapper">
                <input type="text" v-model="imageUrl" placeholder="https://..." class="base-input" />
                <button v-if="imageUrl" @click="clearInput" class="clear-input-btn">×</button>
              </div>
              <button @click="confirmAddMedia" class="btn btn-secondary btn-sm">确定</button>
            </div>
          </div>

          <div class="popup-separator"></div>
          <div class="popup-option" @click="showPublishImageOptions = false">取消</div>
        </div>
      </div>

      <!-- 弹窗: 联系人选择器 (用于提醒/可见性) -->
      <div v-if="showRemindSelector || showVisibilitySelector" class="popup-overlay selector-popup" @click="closeAllPopups">
        <div class="selector-content" @click.stop>
          <div class="app-header">
            <div class="back-btn" @click="closeAllPopups">
              <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
            </div>
            <div class="title">
              <span v-if="showRemindSelector">选择提醒的人</span>
              <span v-if="showVisibilitySelector">选择可见范围</span>
            </div>
            <div class="action-btn">
              <button @click="confirmSelection" class="header-save-btn">完成</button>
            </div>
          </div>
          <div class="selector-body">
            <!-- 可见性选项 -->
            <div v-if="showVisibilitySelector">
              <div class="visibility-option" @click="tempVisibility.type = 'public'">
                <div class="custom-radio">
                  <svg v-if="tempVisibility.type === 'public'" class="checked-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                </div>
                <label>公开</label>
              </div>
              <div class="visibility-option" @click="tempVisibility.type = 'partial'">
                <div class="custom-radio">
                  <svg v-if="tempVisibility.type === 'partial'" class="checked-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                </div>
                <label>部分可见</label>
              </div>
            </div>
            <!-- 联系人列表 -->
            <div class="character-list" v-if="!showVisibilitySelector || tempVisibility.type === 'partial'">
              <div v-for="char in characters" :key="char.id" class="character-item" @click="toggleCharacterSelection(char.id)">
                <div class="custom-checkbox">
                  <svg v-if="isCharacterSelected(char.id)" class="checked-icon-inner" viewBox="0 0 24 24"><path fill="white" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                </div>
                <img :src="char.avatar" class="char-avatar">
                <label>{{ char.name }}</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览组件已全局化 -->
    </div>
  </div>
</template>

<script setup>
// =======================================================================
// 1. 依赖导入与基本设置 (Imports & Setup)
// =======================================================================
import { ref, computed, watch, onUpdated, nextTick } from 'vue';
import { useImageUpload } from '@/composables/useImageUpload.js';
import { usePreviewStore } from '@/stores/previewStore.js';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['close', 'post']);

// =======================================================================
// 2. 核心依赖 (Core Dependencies)
// =======================================================================
import { useSingleStore } from '@/stores/chat/singleStore';
import { useApiStore } from '@/stores/apiStore';
import { useThemeStore } from '@/stores/themeStore';

const singleStore = useSingleStore();
const apiStore = useApiStore();
const themeStore = useThemeStore();
const previewStore = usePreviewStore();
const { getImageUrl, preview: handleImageClick } = previewStore;

// =======================================================================
// 3. 状态管理 (State Management)
// =======================================================================

// --- 3.1. 主要内容状态 ---
const text = ref('');
const publishImages = ref([]);

// --- 3.2. 功能选项状态 ---
const location = ref('');
const remindList = ref([]);
const visibility = ref({ type: 'public', allowed: [] });

// --- 3.3. UI可见性状态 ---
const showPublishImageOptions = ref(false);
const activeInput = ref(null); // 'url' or 'description'
const showLocationInput = ref(false);
const showRemindSelector = ref(false);
const showVisibilitySelector = ref(false);

// --- 3.4. 输入模型 ---
const imageUrl = ref('');
const descriptionInput = ref('');

// --- 3.5. 弹窗临时状态 ---
const tempRemindList = ref([]);
const tempVisibility = ref({ type: 'public', allowed: [] });

// --- 3.6. DOM 引用 ---
const textContainers = ref([]);

// =======================================================================
// 4. 计算属性与监听器 (Computed & Watchers)
// =======================================================================
const characters = computed(() => singleStore.characters.filter(c => c.id !== 'user'));
const isPostButtonDisabled = computed(() => !text.value.trim() && publishImages.value.length === 0);

watch(showRemindSelector, (newVal) => {
  if (newVal) tempRemindList.value = [...remindList.value];
});

watch(showVisibilitySelector, (newVal) => {
  if (newVal) tempVisibility.value = JSON.parse(JSON.stringify(visibility.value));
});

watch(() => publishImages.value.length, (newLength, oldLength) => {
  if (oldLength === 1 && newLength > 1) {
    publishImages.value.forEach(img => {
      if (img.isTextGenerated) img.aspectRatio = 'square';
    });
  } else if (oldLength > 1 && newLength === 1) {
    const img = publishImages.value[0];
    if (img.isTextGenerated) img.aspectRatio = 'rectangle';
  }
  checkAllOverflows();
});

// =======================================================================
// 5. 生命周期钩子 (Lifecycle Hooks)
// =======================================================================
onUpdated(() => {
  checkAllOverflows();
});

// =======================================================================
// 6. 方法 (Methods)
// =======================================================================

// --- 6.1. 主要操作 (Main Actions) ---
const postMoment = () => {
  if (isPostButtonDisabled.value) return;
  
  emit('post', { 
    content: text.value, 
    images: publishImages.value,
    location: location.value,
    remind: remindList.value,
    visibility: visibility.value,
  });
  
  resetState();
  emit('close');
};

const closeModal = () => {
  resetState();
  emit('close');
};

const resetState = () => {
  text.value = '';
  publishImages.value = [];
  location.value = '';
  remindList.value = [];
  visibility.value = { type: 'public', allowed: [] };
  closeAllPopups();
};

// --- 6.2. 弹窗与输入处理 (Popup and Input Handling) ---
const closeAllPopups = () => {
  showPublishImageOptions.value = false;
  activeInput.value = null;
  showRemindSelector.value = false;
  showVisibilitySelector.value = false;
  imageUrl.value = '';
  descriptionInput.value = '';
};

const toggleInput = (type) => {
  activeInput.value = activeInput.value === type ? null : type;
};

const clearInput = () => {
  if (activeInput.value === 'url') imageUrl.value = '';
  if (activeInput.value === 'description') descriptionInput.value = '';
};

const toggleLocationInput = () => {
  showLocationInput.value = !showLocationInput.value;
};

// --- 6.3. 媒体与图片处理 (Media & Image Handling) ---
const { createImageFromText, triggerFileUpload } = useImageUpload(onImageReadyForUpload);

function onImageReadyForUpload(image) {
  addImage(image);
  closeAllPopups();
}

const addImage = (newImage) => {
  if (publishImages.value.length < 9) {
    publishImages.value.push(newImage);
  }
};

const removePublishImage = (index) => {
  publishImages.value.splice(index, 1);
};

const confirmAddMedia = async () => {
  if (activeInput.value === 'url' && imageUrl.value) {
    const img = new Image();
    img.onload = () => {
      addImage({
        type: 'url',
        content: imageUrl.value,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      // 处理无效的图片URL
      themeStore.showToast('无效的图片链接', 'error');
    };
    img.src = imageUrl.value;
  } else if (activeInput.value === 'description' && descriptionInput.value) {
    const options = {
      aspectRatio: publishImages.value.length > 0 ? 'square' : 'rectangle'
    };
    const newImage = await createImageFromText(descriptionInput.value, options);
    if (newImage) addImage(newImage);
  }
  closeAllPopups();
};

// --- 6.4. 选择器处理 (Selector Handling) ---
const confirmSelection = () => {
  if (showRemindSelector.value) {
    remindList.value = [...tempRemindList.value];
  }
  if (showVisibilitySelector.value) {
    if (tempVisibility.value.type === 'public') {
      tempVisibility.value.allowed = [];
    }
    visibility.value = JSON.parse(JSON.stringify(tempVisibility.value));
  }
  closeAllPopups();
};

const isCharacterSelected = (charId) => {
  if (showRemindSelector.value) {
    return tempRemindList.value.includes(charId);
  }
  if (showVisibilitySelector.value && tempVisibility.value.type === 'partial') {
    return tempVisibility.value.allowed.includes(charId);
  }
  return false;
};

const toggleCharacterSelection = (charId) => {
  if (showRemindSelector.value) {
    const index = tempRemindList.value.indexOf(charId);
    if (index > -1) {
      tempRemindList.value.splice(index, 1);
    } else {
      tempRemindList.value.push(charId);
    }
  } else if (showVisibilitySelector.value && tempVisibility.value.type === 'partial') {
    const index = tempVisibility.value.allowed.indexOf(charId);
    if (index > -1) {
      tempVisibility.value.allowed.splice(index, 1);
    } else {
      tempVisibility.value.allowed.push(charId);
    }
  }
};

// --- 6.5. UI与工具函数 (UI & Utility Helpers) ---
const checkAllOverflows = () => {
  nextTick(() => {
    textContainers.value.forEach(el => {
      if (el) {
        el.classList.toggle('is-overflowing', el.scrollHeight > el.clientHeight);
      }
    });
  });
};
</script>

<style scoped>
/* ==================== 主模态框结构 ==================== */
.post-moment-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f7f7f7;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-content {
  background: #f7f7f7;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-body {
  padding: 15px;
  flex: 1;
  overflow-y: auto;
  background: white;
}

/* ==================== 头部 ==================== */
/* 注意: .app-header 样式可能在全局定义 */
.post-btn:disabled {
  background-color: #a0e0b8;
  cursor: not-allowed;
}

/* ==================== 内容主体 ==================== */
.post-moment-textarea {
  width: 100%;
  height: 100px;
  border: none;
  resize: none;
  font-size: 16px;
  padding: 0;
  margin-bottom: 15px;
  background-color: transparent;
}
.post-moment-textarea:focus {
  outline: none;
  border: none;
  box-shadow: none;
}

/* --- 图片网格 --- */
.publish-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  align-items: start; /* 垂直方向顶部对齐 */
}

/* 新增：用于单张、非文字生成图片的自适应容器 */
.publish-single-image-adaptive {
  position: relative;
  max-width: 160px;
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--text-quaternary);
  grid-column: span 2; /* 在网格中占据更多空间 */
}
.publish-single-image-adaptive img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
}

.publish-image-item, .add-image-btn {
  width: 80px;
  height: 80px;
  border-radius: 2px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
  background-color: var(--text-quaternary);
}
.publish-images.single-image .publish-image-item {
  width: 120px;
  height: 80px;
}
.publish-image-item .description-placeholder {
  position: absolute;
  top: 2px; left: 2px; right: 2px; bottom: 2px;
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  padding: 5px;
  font-size: 10px;
  color: var(--text-primary);
  word-break: break-all;
  overflow-y: auto;
  text-align: center;
  -ms-overflow-style: none;
  scrollbar-width: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.publish-image-item .description-placeholder.is-overflowing {
  justify-content: flex-start;
}
.publish-images.single-image .description-placeholder {
  font-size: 16px;
}
.description-placeholder::-webkit-scrollbar {
  display: none;
}
.add-image-btn {
  border: 1px dashed #ccc;
  cursor: pointer;
  font-size: 30px;
  color: #ccc;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-img {
  position: absolute;
  top: -5px; right: -5px;
  width: 20px; height: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid white;
}

.spacer {
  height: 20px;
}

/* --- 功能选项行 --- */
.option-list {
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}
.option-row {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.option-row:last-child {
  border-bottom: none;
}
.option-icon {
  width: 30px;
  text-align: center;
  color: var(--text-darkest);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
}
.option-icon svg {
  width: 20px;
  height: 20px;
}
.option-label {
  flex: 1;
  font-size: 16px;
  font-weight: normal;
  color: var(--text-darkest);
}
.option-value {
  color: #888;
  font-size: 14px;
  margin-right: 5px;
}
.option-arrow {
  color: #ccc;
  font-weight: bold;
}
.expanded-input-container {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

/* ==================== 弹窗 (模态框中的模态框) ==================== */
.popup-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-content {
  background: #f7f7f7;
  width: 100%;
  border-radius: 12px 12px 0 0;
  animation: slideUpPopup 0.3s ease;
}
@keyframes slideUpPopup {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.popup-option-wrapper {
  border-bottom: 1px solid #e0e0e0;
}
.popup-option {
  padding: 15px;
  text-align: center;
  font-size: 17px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
}
.popup-option-wrapper .popup-option {
  border-bottom: none;
}
.popup-option:last-child {
  border-bottom: none;
}
.popup-separator {
  height: 8px;
  background: #ededed;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}

/* --- 新的展开输入区域样式 --- */
.expanded-input-container.new-input-style {
  padding: 10px 15px;
  background: #f7f7f7; /* 与按钮背景色一致 */
  display: flex;
  gap: 10px;
  align-items: center;
  border-top: 1px solid #e0e0e0;
}
.input-wrapper {
  flex: 1;
  position: relative;
}
.clear-input-btn {
  position: absolute;
  top: 50%; right: 8px;
  transform: translateY(-50%);
  width: 20px; height: 20px;
  background: #ccc;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
/* 确定按钮样式继承自 .btn 和 .btn-sm */
.new-input-style .btn.btn-sm {
  align-self: stretch; /* 确保按钮和输入框等高 */
}
.new-input-style .btn.btn-secondary {
  background-color: transparent;
}

/* --- 选择器弹窗 --- */
.popup-overlay.selector-popup {
  align-items: stretch;
  background: #f7f7f7;
}
.selector-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.selector-body {
  flex: 1;
  overflow-y: auto;
  background: white;
}
.visibility-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.custom-radio {
  width: 22px;
  height: 22px;
  border: 1px solid transparent;
  border-radius: 50%;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #07c160; /* Green color for the checkmark */
}
.custom-radio .checked-icon {
  width: 24px;
  height: 24px;
}

.character-list {
  padding: 0 15px;
}
.character-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.character-item:last-child {
  border-bottom: none;
}
.custom-checkbox {
  width: 22px;
  height: 22px;
  border: 1px solid #ccc;
  border-radius: 50%;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, border-color 0.2s;
}
.custom-checkbox .checked-icon-inner {
  width: 16px;
  height: 16px;
  color: white;
}
.character-item .custom-checkbox {
  background-color: transparent;
}
.character-item:has(.checked-icon-inner) .custom-checkbox {
  background-color: #07c160;
  border-color: #07c160;
}

.char-avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 10px;
}
</style>
