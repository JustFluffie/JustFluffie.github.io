<template>
  <Modal 
    :visible="visible" 
    :title="modalTitle" 
    @update:visible="updateVisible"
    :container-class="containerClass"
  >
    <div class="upload-content">
      <!-- 特殊模式1 (Special)：Tab 切换 -->
      <div v-if="type === 'special'" class="tab-group">
        <button 
          class="tab-btn" 
          :class="{ active: mode === 'text' }" 
          @click="mode = 'text'"
        >
          文字
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: mode === 'url' }" 
          @click="mode = 'url'"
        >
          URL
        </button>
        <button class="tab-btn" @click="handleLocalUpload">本地</button>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <!-- 特殊模式1 - 文字模式 -->
        <textarea 
          v-if="type === 'special' && mode === 'text'" 
          v-model="inputValue" 
          class="base-input text-area" 
          placeholder="输入文字生成图片..."
        ></textarea>
        
        <!-- 特殊模式1 - URL 模式 -->
        <input 
          v-if="type === 'special' && mode === 'url'" 
          v-model="inputValue" 
          type="text"
          class="base-input" 
          placeholder="输入图片链接"
        >

        <!-- Basic 模式：URL输入 + 本地按钮 -->
        <div v-if="type === 'basic'" class="basic-input-group">
          <input 
            v-model="inputValue" 
            type="text"
            class="base-input" 
            placeholder="输入图片链接"
          >
          <button class="btn sm" @click="handleLocalUpload">本地</button>
        </div>

        <!-- 特殊模式2 (Sticker Import) -->
        <div v-if="type === 'sticker-import'" class="sticker-import-layout">
          <input type="text" class="base-input" v-model="importGroupInput" placeholder="分组名称 (默认: 默认)">
          
          <div class="import-methods">
            <button class="btn" @click="$refs.stickerBatchInput.click()">本地</button>
            <input type="file" ref="stickerBatchInput" class="hidden-input" accept="image/*" multiple @change="handleBatchStickerSelect">
            
            <button class="btn" @click="toggleUrlInput">URL</button>
            
            <button class="btn" @click="$refs.txtImportInput.click()">TXT</button>
            <input type="file" ref="txtImportInput" class="hidden-input" accept=".txt" @change="handleTxtFileSelect">
          </div>

          <!-- URL 输入区域 -->
          <div v-if="showUrlInput" class="url-textarea-container">
            <textarea class="base-input url-batch-textarea-modifier" v-model="urlBatchInput" placeholder="每行一个，格式：名字 链接&#10;例如：&#10;开心 https://example.com/1.jpg&#10;难过 https://example.com/2.jpg"></textarea>
          </div>

          <!-- 本地上传预览 -->
          <div v-if="pendingUploads.length > 0" class="upload-preview-wrapper">
            <div class="upload-preview-container">
              <!-- 添加图片按钮 -->
              <div class="upload-add-btn" @click="$refs.stickerBatchInput.click()">
                <div class="upload-add-btn-box">
                  <span class="plus-icon">+</span>
                </div>
                <div class="name-input-placeholder"></div>
              </div>
              <div class="upload-preview-item" v-for="(item, index) in pendingUploads" :key="index">
                <img :src="item.url" class="preview-image">
                <input type="text" v-model="item.name" class="base-input name-input compact-input">
                <button class="btn-icon remove-btn" @click="removeUpload(index)">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="modal-btn cancel" @click="close">取消</button>
      <button 
        class="modal-btn confirm" 
        :disabled="isConfirmDisabled" 
        @click="handleConfirm"
      >
        {{ confirmText }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Modal from './Modal.vue';
import { useImageUpload } from '@/composables/useImageUpload.js';
import { useThemeStore } from '@/stores/themeStore';

const themeStore = useThemeStore();

const props = defineProps({
  visible: Boolean,
  // 模式：基础/特殊/表情包导入
  type: {
    type: String,
    default: 'special',
    validator: (val) => ['basic', 'special', 'sticker-import'].includes(val)
  },
  // 业务类型：聊天/朋友圈/头像
  bizType: {
    type: String,
    default: 'chat'
  },
  // 自定义标题
  title: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'send-image', 'import-sticker', 'preview-ready', 'upload-complete']);

// 内部状态
const mode = ref('text'); // text | url
const inputValue = ref('');

// 表情包导入相关状态
const pendingUploads = ref([]);
const showUrlInput = ref(false);
const urlBatchInput = ref('');
const importGroupInput = ref('');

// 初始化 useImageUpload
const onPreviewReady = (image) => {
  emit('preview-ready', image);
};

const onUploadComplete = (image) => {
  // 兼容旧的 send-image 事件，用于不需要预览的场景
  emit('send-image', image);
  // 发送新的完成事件
  emit('upload-complete', image);
  // 弹窗已在 handleLocalUpload 中提前关闭，此处不再需要
};

const uploadOptions = computed(() => {
  const highQualityTypes = ['theme', 'chatBg', 'videoBg', 'userVideoImg'];
  if (highQualityTypes.includes(props.bizType)) {
    return {
      compress: {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      }
    };
  }
  // For 'avatar' and other types, use the new default (512px) by returning an empty object.
  return {};
});

const { createImageFromText, triggerFileUpload } = useImageUpload(
  { onPreview: onPreviewReady, onComplete: onUploadComplete },
  uploadOptions.value
);

// 监听 visible 变化以重置状态
watch(() => props.visible, (val) => {
  if (val) {
    inputValue.value = '';
    // Special 模式默认选中文字，Basic 模式默认为 URL
    if (props.type === 'special') {
      mode.value = 'text';
    } else {
      mode.value = 'url';
    }
    
    // 重置表情包导入状态
    if (props.type === 'sticker-import') {
      pendingUploads.value = [];
      urlBatchInput.value = '';
      showUrlInput.value = false;
      importGroupInput.value = '';
    }
  }
});

// 计算属性：标题
const modalTitle = computed(() => {
  if (props.title) return props.title;
  if (props.type === 'sticker-import') return '导入表情包';
  
  const titles = {
    chat: '发送图片',
    moment: '发布图片',
    avatar: '设置头像',
    bg: '设置背景',
    cdCover: '设置CD封面',
    photo1: '设置照片1',
    photo2: '设置照片2',
    theme: '设置图片'
  };
  return titles[props.bizType] || '上传图片';
});

// 计算属性：确认按钮文案
const confirmText = computed(() => {
  if (props.type === 'sticker-import') return '导入';
  
  const texts = {
    chat: '发送',
    moment: '发布',
    avatar: '确定',
    bg: '确定',
    cdCover: '确定',
    photo1: '确定',
    photo2: '确定',
    theme: '确定'
  };
  return texts[props.bizType] || '确定';
});

// 计算属性：容器类名
const containerClass = computed(() => {
  if (props.type === 'special') return 'special-modal';
  if (props.type === 'sticker-import') return 'sticker-import-modal';
  return '';
});

// 计算属性：确认按钮是否禁用
const isConfirmDisabled = computed(() => {
  if (props.type === 'sticker-import') return false; // 表情包导入有自己的校验逻辑
  
  // 如果是 Basic 模式或 Special 的 URL/Text 模式，必须有输入值
  if (props.type === 'basic' || (props.type === 'special' && (mode.value === 'url' || mode.value === 'text'))) {
    return !inputValue.value.trim();
  }
  return false;
});

// 方法
const updateVisible = (val) => {
  emit('update:visible', val);
};

const close = () => {
  updateVisible(false);
};

const handleLocalUpload = () => {
  // 传递当前的 uploadOptions 给 triggerFileUpload，确保使用最新的配置（如压缩参数）
  triggerFileUpload(uploadOptions.value);
  close();
};

// 处理图片链接，支持多种图床分享链接的转换
const processImageUrl = (url) => {
  // 1. 检测 imgbb 分享链接格式 (https://ibb.co/xxxxx)
  const imgbbSharePattern = /^https?:\/\/ibb\.co\/([a-zA-Z0-9]+)$/;
  if (imgbbSharePattern.test(url)) {
    themeStore.showToast('检测到 ImgBB 分享链接，请使用直接图片链接（格式：https://i.ibb.co/xxx/image.jpg）', 'warning');
    // 返回原链接，让用户知道需要使用正确格式
    return url;
  }
  
  // 2. 检测是否已经是 imgbb 直接图片链接
  const imgbbDirectPattern = /^https?:\/\/i\.ibb\.co\/[a-zA-Z0-9]+\/[^"'\s<>]+$/;
  if (imgbbDirectPattern.test(url)) {
    return url; // 已经是正确格式
  }
  
  // 3. 其他常见图床的处理可以在这里添加
  
  return url;
};

const handleConfirm = () => {
  if (props.type === 'sticker-import') {
    handleStickerImportConfirm();
    return;
  }

  const val = inputValue.value.trim();
  if (!val) return;

  if (props.type === 'special' && mode.value === 'text') {
    // 文字生成图片
    const image = createImageFromText(val);
    if (image) {
      emit('upload-complete', image);
      close();
    }
  } else {
    // URL 模式 (Basic 或 Special-URL)
    // 处理图片链接（检测并提示 imgbb 分享链接等）
    const processedUrl = processImageUrl(val);
    emit('upload-complete', { type: 'url', content: processedUrl });
    close();
  }
};

// --- 表情包导入逻辑 ---

const handleBatchStickerSelect = (event) => {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  const existingCount = pendingUploads.value.length;
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingUploads.value.push({
        file: file,
        url: e.target.result,
        name: (existingCount + index + 1).toString()
      });
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
};

const handleTxtFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    urlBatchInput.value = text;
    showUrlInput.value = true;
    themeStore.showToast('TXT文件已加载，点击“导入”以继续。', 'info');
  };
  reader.readAsText(file);
  event.target.value = '';
};

const toggleUrlInput = () => {
  showUrlInput.value = !showUrlInput.value;
};

const removeUpload = (index) => {
  pendingUploads.value.splice(index, 1);
};

const handleStickerImportConfirm = () => {
  const group = importGroupInput.value.trim() || '默认';
  let newStickers = [];

  // 1. 处理本地上传
  if (pendingUploads.value.length > 0) {
    newStickers.push(...pendingUploads.value.map(item => ({
      url: item.url,
      name: item.name || '未命名'
    })));
  }

  // 2. 处理URL和TXT文件内容
  if (urlBatchInput.value.trim()) {
    const lines = urlBatchInput.value.trim().split('\n');
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const url = parts.pop();
        const name = parts.join(' ');
        newStickers.push({
          url: url,
          name: name
        });
      }
    });
  }

  if (newStickers.length === 0) {
    themeStore.showToast('没有可导入的表情包', 'info');
    return;
  }

  emit('import-sticker', { group, stickers: newStickers });
  close();
};
</script>

<style scoped>
.upload-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Tab 样式 */
.tab-group {
  display: flex;
  gap: 10px;
  padding: 0 5px;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-light, #fff);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-darkest);
}

.tab-btn.active {
  background: var(--bg-light, #f0f0f0);
  border-color: var(--text-quaternary, #ccc);
  font-weight: 500;
}

/* 输入区域样式 */
.input-area {
  display: flex;
  flex-direction: column;
}

.text-area {
  min-height: 100px;
  resize: none;
  padding: 10px;
}

.basic-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.basic-input-group .base-input {
  flex: 1;
}

.basic-input-group .btn {
  white-space: nowrap;
  padding: 0 15px;
  height: 40px; /* 匹配输入框高度 */
  display: flex;
  align-items: center;
}

/* 表情包导入样式 */
.sticker-import-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.import-methods {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin: 15px 0;
}
.import-methods .btn {
    flex: 1;
    white-space: nowrap;
    padding: 8px;
    border: 1px solid #e0e0e0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
}
.url-textarea-container {
    margin-top: 15px;
}

.url-batch-textarea-modifier {
    height: 100px;
    resize: vertical;
    line-height: 1.5;
}
.hidden-input {
    display: none;
}
.upload-preview-wrapper {
    margin-top: 15px;
}
.upload-preview-container {
    max-height: 240px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 5px;
    scrollbar-width: none; -ms-overflow-style: none;
}
.upload-add-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}
.upload-add-btn-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1/1;
    border: 1px dashed var(--border-color, #ccc);
    border-radius: 4px;
    background-color: var(--bg-white, #f9f9f9);
    transition: background-color 0.2s ease;
    margin-bottom: 2px;
}
.upload-add-btn:hover .upload-add-btn-box {
    background-color: var(--bg-light, #fff);
}
.plus-icon {
    font-size: 24px;
    color: var(--text-quaternary, #aaa);
    font-weight: 300;
}
.name-input-placeholder {
    width: 100%;
    font-size: 12px;
    padding: 4px 6px;
    visibility: hidden;
    box-sizing: border-box;
    border: 1px solid transparent;
}
.upload-preview-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.preview-image {
    width: 100%;
    aspect-ratio: 1/1;
    height: auto;
    object-fit: contain;
    border-radius: 4px;
    margin-bottom: 2px;
    background: transparent;
}
.name-input {
    width: 100%;
    text-align: center;
    font-size: 12px;
}
.name-input.compact-input {
    padding: 4px 6px;
    height: auto;
}
.remove-btn {
    position: absolute;
    top: -5px;
    right: -5px;
    background: rgba(0,0,0,0.6);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 20px;
}

/* Scrollbar Hiding */
.upload-preview-container::-webkit-scrollbar {
    display: none;
}

/* 手机适配 */
@media (max-width: 600px) {
  .upload-preview-container {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .tab-group {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    min-width: 80px;
  }
  
  .basic-upload-layout {
    flex-direction: column;
    align-items: stretch;
  }
  
  .basic-upload-layout .local-btn {
    width: 100%;
  }
  
  .import-methods {
    flex-wrap: wrap;
  }
  
  .import-methods .btn {
    min-width: 60px;
  }
}
</style>
