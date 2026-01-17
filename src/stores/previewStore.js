import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePreviewStore = defineStore('preview', () => {
  // --- 状态 (State) ---
  const showPreviewer = ref(false);      // 控制预览器的可见性
  const previewContent = ref({         // 要预览的内容
    imageUrl: '',
    textContent: ''
  });

  // --- 辅助函数 (Getters-like functions) ---

  /**
   * 从图片对象或URL字符串中获取可用的URL
   * @param {object|string} img - 图片对象或URL字符串
   * @returns {string}
   */
  const getImageUrl = (img) => {
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object') {
      // 消息对象的图片内容直接在 content 字段
      if (img.type === 'image' && !img.isTextGenerated) {
        return img.content;
      }
      // 动态对象的图片内容在 content 或 url 字段
      return img.content || img.url || '';
    }
    return '';
  };

  // --- 操作 (Actions) ---

  /**
   * 触发预览
   * @param {object} item - 要预览的对象
   */
  const preview = (item) => {
    if (item.isTextGenerated) {
      // 预览文本
      previewContent.value = {
        imageUrl: '',
        textContent: item.description || item.content || '没有描述'
      };
    } else {
      // 预览图片
      const url = getImageUrl(item);
      if (url) {
        previewContent.value = {
          imageUrl: url,
          textContent: ''
        };
      }
    }
    showPreviewer.value = true;
  };

  /**
   * 关闭预览
   */
  const closePreview = () => {
    showPreviewer.value = false;
    // 可选：重置内容
    // previewContent.value = { imageUrl: '', textContent: '' };
  };

  return {
    showPreviewer,
    previewContent,
    getImageUrl,
    preview,
    closePreview,
  };
});
