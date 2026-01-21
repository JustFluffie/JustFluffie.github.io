import { ref } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useThemeStore } from '@/stores/themeStore';

export function useImageUpload(callbacks, options = {}) {
  const { onPreview, onComplete } = callbacks || {};
  const apiStore = useApiStore();
  const themeStore = useThemeStore();

  // --- 图床上传逻辑 ---

  // 1. 上传到 Catbox.moe
  const uploadToCatbox = async (file) => {
    const userhash = apiStore.catboxUserHash || '';
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);
    if (userhash) {
      formData.append('userhash', userhash);
    }

    try {
      themeStore.showToast('正在上传到 Catbox...', 'info');
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const imageUrl = await response.text();
        if (imageUrl.startsWith('http')) {
          themeStore.showToast('Catbox 上传成功！', 'success');
          return imageUrl;
        } else {
          throw new Error(imageUrl); // Catbox 以纯文本形式返回错误
        }
      } else {
        throw new Error(`服务器响应状态: ${response.status}`);
      }
    } catch (error) {
      console.error('Catbox 上传失败:', error);
      themeStore.showToast(`Catbox 上传失败: ${error.message}`, 'error');
      return null;
    }
  };

  // 2. 上传到 ImgBB
  const uploadToImgbb = async (file) => {
    const apiKey = apiStore.imgbbApiKey;
    if (!apiKey) {
      themeStore.showToast('请先在 API 设置中配置 ImgBB 的 API Key', 'error');
      return null;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      themeStore.showToast('正在上传到 ImgBB...', 'info');
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        themeStore.showToast('ImgBB 上传成功！', 'success');
        return result.data.url;
      } else {
        throw new Error(result.error?.message || '未知错误');
      }
    } catch (error) {
      console.error('ImgBB 上传失败:', error);
      themeStore.showToast(`ImgBB 上传失败: ${error.message}`, 'error');
      return null;
    }
  };

  // --- 核心功能 ---

  // 根据文本描述创建图片占位符
  const createImageFromText = (desc, options = {}) => {
    if (!desc) return null;
    const aspectRatio = options.aspectRatio || 'rectangle';
    return {
      url: null,
      description: desc,
      isTextGenerated: true,
      aspectRatio: aspectRatio
    };
  };

  // 触发隐藏的文件输入框
  const triggerFileUpload = (runtimeOptions = {}) => {
    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.accept = 'image/*';
    inputEl.style.display = 'none';

    const handleFileAndCleanup = (event) => {
      handleFileChange(event, runtimeOptions);
      if (inputEl.parentNode) {
        document.body.removeChild(inputEl);
      }
      window.removeEventListener('focus', cleanup);
    };

    const cleanup = () => {
      if (inputEl.parentNode) {
        document.body.removeChild(inputEl);
      }
      window.removeEventListener('focus', cleanup);
    };

    window.addEventListener('focus', cleanup, { once: true });
    inputEl.addEventListener('change', handleFileAndCleanup);
    document.body.appendChild(inputEl);
    inputEl.click();
  };

  // 处理文件选择、上传或转换
  const handleFileChange = (event, runtimeOptions = {}) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // 1. 生成并发送预览图
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');
        const previewOptions = { maxWidth: 256, maxHeight: 256 };
        
        let { naturalWidth: pWidth, naturalHeight: pHeight } = img;
        if (pWidth > pHeight) {
          if (pWidth > previewOptions.maxWidth) {
            pHeight = Math.round(pHeight * (previewOptions.maxWidth / pWidth));
            pWidth = previewOptions.maxWidth;
          }
        } else {
          if (pHeight > previewOptions.maxHeight) {
            pWidth = Math.round(pWidth * (previewOptions.maxHeight / pHeight));
            pHeight = previewOptions.maxHeight;
          }
        }
        previewCanvas.width = pWidth;
        previewCanvas.height = pHeight;
        previewCtx.drawImage(img, 0, 0, pWidth, pHeight);
        const previewBase64 = previewCanvas.toDataURL('image/jpeg', 0.7);
        
        if (onPreview) {
          onPreview({ type: 'base64', content: previewBase64 });
        }

        // 2. 异步处理全尺寸图片
        const provider = apiStore.imageHostProvider;
        let imageUrl = null;

        if (provider && provider !== 'none') {
            if (provider === 'catbox') {
              imageUrl = await uploadToCatbox(file);
            } else if (provider === 'imgbb') {
              imageUrl = await uploadToImgbb(file);
            }
        }

        if (imageUrl) {
          if (onComplete) {
            onComplete({ type: 'url', content: imageUrl });
          }
          return;
        }

        // 3. 如果图床失败，回退到 Base64 压缩
        console.log('图床上传失败或未配置，回退到 Base64 编码。');
        
        // 根据不同情况显示不同的提示信息
        if (provider && provider !== 'none') {
          // 用户配置了图床但上传失败
          themeStore.showToast('图床上传失败，已回退至本地存储', 'warning');
        } else {
          // 用户未配置图床
          themeStore.showToast('未配置图床，图片将以本地数据存储', 'info');
        }
        
        // 优先使用运行时传入的选项，其次是初始化选项，最后是默认值
        const defaultCompressOptions = { maxWidth: 2048, maxHeight: 2048, quality: 0.85 };
        const initCompressOptions = options.compress || {};
        const runtimeCompressOptions = runtimeOptions.compress || {};
        
        const compressOptions = { 
          ...defaultCompressOptions, 
          ...initCompressOptions,
          ...runtimeCompressOptions
        };

        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d');
        let { naturalWidth: fWidth, naturalHeight: fHeight } = img;

        if (fWidth > fHeight) {
          if (fWidth > compressOptions.maxWidth) {
            fHeight = Math.round(fHeight * (compressOptions.maxWidth / fWidth));
            fWidth = compressOptions.maxWidth;
          }
        } else {
          if (fHeight > compressOptions.maxHeight) {
            fWidth = Math.round(fWidth * (compressOptions.maxHeight / fHeight));
            fHeight = compressOptions.maxHeight;
          }
        }

        fullCanvas.width = fWidth;
        fullCanvas.height = fHeight;
        fullCtx.drawImage(img, 0, 0, fWidth, fHeight);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/jpeg' ? compressOptions.quality : 1.0;
        const compressedBase64 = fullCanvas.toDataURL(mimeType, quality);

        if (onComplete) {
          onComplete({
            type: 'base64',
            content: compressedBase64,
            width: fWidth,
            height: fHeight,
          });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return {
    createImageFromText,
    triggerFileUpload,
    // 也可单独导出，用于可能的直接调用
    uploadToCatbox,
    uploadToImgbb,
  };
}
