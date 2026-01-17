import { ref } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useThemeStore } from '@/stores/themeStore';

export function useImageUpload(onImageReady) {
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
  const triggerFileUpload = () => {
    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.accept = 'image/*';
    inputEl.style.display = 'none';

    const handleFileAndCleanup = (event) => {
      handleFileChange(event);
      document.body.removeChild(inputEl);
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
  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    let imageUrl = null;
    const provider = apiStore.imageHostProvider;

    // 根据设置选择上传服务
    if (provider === 'catbox') {
      imageUrl = await uploadToCatbox(file);
    } else if (provider === 'imgbb') {
      imageUrl = await uploadToImgbb(file);
    }

    // 如果上传成功，则调用回调
    if (imageUrl) {
      if (onImageReady) {
        onImageReady({
          type: 'url',
          content: imageUrl,
        });
      }
      return;
    }
    
    // 如果没有配置图床或上传失败，则回退到 Base64
    console.log('图床上传失败或未配置，回退到 Base64 编码。');
    themeStore.showToast('图床未配置或上传失败，转为本地图片', 'warning');
    
    const compressOptions = {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let { naturalWidth: width, naturalHeight: height } = img;

        if (width > height) {
          if (width > compressOptions.maxWidth) {
            height = Math.round(height * (compressOptions.maxWidth / width));
            width = compressOptions.maxWidth;
          }
        } else {
          if (height > compressOptions.maxHeight) {
            width = Math.round(width * (compressOptions.maxHeight / height));
            height = compressOptions.maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/jpeg' ? compressOptions.quality : 1.0;
        const compressedBase64 = canvas.toDataURL(mimeType, quality);

        if (onImageReady) {
          onImageReady({
            type: 'base64',
            content: compressedBase64,
            width: width,
            height: height,
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
