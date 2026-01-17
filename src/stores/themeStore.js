import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

// 辅助函数：从 localStorage 获取数据
const getFromStorage = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue);
      // 确保解析后的值不是 null 或 undefined
      if (parsed !== null && parsed !== undefined) {
        return parsed;
      }
    } catch (e) {
      // 如果解析失败，它可能是一个未被JSON编码的原始字符串（旧数据）。
      // 在这种情况下，直接返回该字符串。
      // 新代码将始终进行JSON编码，因此此 catch 块主要用于向后兼容。
      return storedValue;
    }
  }
  return defaultValue;
}

// 辅助函数：向 localStorage 保存数据
const saveToStorage = (key, value) => {
  // 始终使用 JSON.stringify 以确保存储和检索的一致性。
  localStorage.setItem(key, JSON.stringify(value))
}

export const useThemeStore = defineStore('theme', () => {
  // ==================== State ====================
  const themePresets = ref(getFromStorage('aiPhoneThemePresets', {
    '默认主题': {
      bg: '',
      lockbg: '',
      appIcons: {},
      showFrame: true,
      showStatusBar: true, // 新增：状态栏显示控制
      fontColor: '#1f1f1f',
      appLabelFontSize: 10,
    }
  }))

  const currentThemePreset = ref(getFromStorage('aiPhoneCurrentThemePreset', '默认主题'))

  const fontPresets = ref(getFromStorage('aiPhoneFontPresets', {
    '默认字体': ''
  }))

  const currentFontPreset = ref(getFromStorage('aiPhoneCurrentFontPreset', '默认字体'))

  const cssPresets = ref(getFromStorage('aiPhoneCssPresets', {
    '默认样式': ''
  }))

  const currentCssPreset = ref(getFromStorage('aiPhoneCurrentCssPreset', '默认样式'))

  const showFrame = computed(() => {
    const preset = themePresets.value[currentThemePreset.value];
    return preset ? preset.showFrame !== false : true;
  });

  const showStatusBar = computed(() => {
    const preset = themePresets.value[currentThemePreset.value];
    // 默认显示状态栏，除非明确设置为 false
    return preset ? preset.showStatusBar !== false : true;
  });

  const appIcons = computed(() => {
    const preset = themePresets.value[currentThemePreset.value];
    return preset ? preset.appIcons || {} : {};
  });

  const toast = ref({
    show: false,
    message: '',
    type: 'success', // success | error | info
    duration: 500,
  });

  const confirmModal = ref({
    show: false,
    title: '确认',
    message: '确定要执行此操作吗？',
    onConfirm: null,
    messageStyle: {}, // 新增：自定义消息样式
    confirmText: 'delete', // 新增：确认按钮文本key
  });

  const inputModal = ref({
    show: false,
    title: '输入',
    value: '',
    placeholder: '',
    onConfirm: null,
    showUpload: false, // 新增：是否显示上传按钮
    onUpload: null,   // 新增：上传按钮的回调
  });

  const batteryLevel = ref(getFromStorage('aiPhoneBatteryLevel', 100)); // 新增：电量状态

  // ==================== Actions ====================

  const showConfirm = (title, message, onConfirm, options = {}) => {
    confirmModal.value.title = title;
    confirmModal.value.message = message;
    confirmModal.value.onConfirm = onConfirm;
    confirmModal.value.messageStyle = options.messageStyle || {};
    confirmModal.value.confirmText = options.confirmText || 'delete';
    confirmModal.value.show = true;
  };

  const hideConfirm = () => {
    confirmModal.value.show = false;
  };

  const handleConfirm = () => {
    if (typeof confirmModal.value.onConfirm === 'function') {
      confirmModal.value.onConfirm();
    }
    hideConfirm();
  };

  const showInput = (title, defaultValue, onConfirm, { placeholder = '', showUpload = false, onUpload = null } = {}) => {
    inputModal.value.title = title;
    inputModal.value.value = defaultValue;
    inputModal.value.placeholder = placeholder;
    inputModal.value.onConfirm = onConfirm;
    inputModal.value.showUpload = showUpload;
    inputModal.value.onUpload = onUpload;
    inputModal.value.show = true;
  };

  const hideInput = () => {
    inputModal.value.show = false;
  };

  const handleInputConfirm = () => {
    if (typeof inputModal.value.onConfirm === 'function') {
      inputModal.value.onConfirm(inputModal.value.value);
    }
    hideInput();
  };

  const handleUpload = () => {
    if (typeof inputModal.value.onUpload === 'function') {
      inputModal.value.onUpload();
    }
    hideInput();
  };

  const showToast = (message = '保存成功', type = 'success', duration = 1000) => {
    toast.value.message = message;
    toast.value.type = type;
    toast.value.duration = duration;
    toast.value.show = true;
    // 计时器逻辑移交给 Modal 组件处理
  };

  // --- 通用保存 Action ---
  const saveData = () => {
    saveToStorage('aiPhoneThemePresets', themePresets.value)
    saveToStorage('aiPhoneCurrentThemePreset', currentThemePreset.value)
    saveToStorage('aiPhoneFontPresets', fontPresets.value)
    saveToStorage('aiPhoneCurrentFontPreset', currentFontPreset.value)
    saveToStorage('aiPhoneCssPresets', cssPresets.value)
    saveToStorage('aiPhoneCurrentCssPreset', currentCssPreset.value)
    saveToStorage('aiPhoneBatteryLevel', batteryLevel.value) // 新增
  }

  // --- 主题预设 Actions ---
  const switchThemePreset = (name) => {
    if (themePresets.value[name]) {
      currentThemePreset.value = name
      applyCurrentTheme()
    }
  }

  const saveThemePreset = (name, presetData) => {
    themePresets.value[name] = presetData
    currentThemePreset.value = name
  }

  const updateThemeSetting = (key, value) => {
    const presetName = currentThemePreset.value;
    if (themePresets.value[presetName]) {
      themePresets.value[presetName][key] = value;
      // 触发 theme a更新
      applyCurrentTheme();
    }
  }
  
  const deleteThemePreset = (name) => {
    if (name !== '默认主题' && themePresets.value[name]) {
      delete themePresets.value[name]
      if (currentThemePreset.value === name) {
        currentThemePreset.value = '默认主题'
      }
    }
  }

  // --- 字体预设 Actions ---
  const switchFontPreset = (name) => {
    if (fontPresets.value[name] !== undefined) {
      currentFontPreset.value = name
      applyCurrentFont()
    }
  }

  const saveFontPreset = (name, url) => {
    fontPresets.value[name] = url
    currentFontPreset.value = name
  }

  const deleteFontPreset = (name) => {
    if (name !== '默认字体' && fontPresets.value[name] !== undefined) {
      delete fontPresets.value[name]
      if (currentFontPreset.value === name) {
        currentFontPreset.value = '默认字体'
      }
    }
  }

  // --- CSS预设 Actions ---
  const switchCssPreset = (name) => {
    if (cssPresets.value[name] !== undefined) {
      currentCssPreset.value = name
      applyCurrentCss()
    }
  }

  const saveCssPreset = (name, css) => {
    cssPresets.value[name] = css
    currentCssPreset.value = name
  }

  const deleteCssPreset = (name) => {
    if (name !== '默认样式' && cssPresets.value[name] !== undefined) {
      delete cssPresets.value[name]
      if (currentCssPreset.value === name) {
        currentCssPreset.value = '默认样式'
      }
    }
  }
  
  // --- 应用样式 Actions ---
  const applyCss = (css, styleId = 'custom-css-style') => {
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    style.textContent = css || ''
  }

  const applyFontColor = (color) => {
    if (color) {
      document.documentElement.style.setProperty('--home-text-color', color);
    } else {
      document.documentElement.style.removeProperty('--home-text-color');
    }
  }

  const applyAppLabelFontSize = (size) => {
    if (size) {
      document.documentElement.style.setProperty('--app-label-font-size', `${size}px`);
    } else {
      document.documentElement.style.removeProperty('--app-label-font-size');
    }
  }

  const applyFont = (url, styleId = 'custom-font-style') => {
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    if (!url) {
      style.textContent = ''
      return
    }
    const fontName = 'CustomFont_' + Date.now()
    style.textContent = `
      @font-face {
        font-family: '${fontName}';
        src: url('${url}');
        font-display: swap;
      }
      body, input, textarea, button, select {
        font-family: '${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
    `
  }
  
  const applyCurrentFont = () => {
    if (fontPresets.value && currentFontPreset.value && fontPresets.value[currentFontPreset.value]) {
      const url = fontPresets.value[currentFontPreset.value];
      applyFont(url);
    } else {
      applyFont(null); // Fallback to default font
    }
  }

  const applyCurrentCss = () => {
    if (cssPresets.value && currentCssPreset.value && cssPresets.value[currentCssPreset.value]) {
      const css = cssPresets.value[currentCssPreset.value];
      applyCss(css);
    } else {
      applyCss(''); // Fallback to no custom CSS
    }
  }
  
  const applyCurrentTheme = () => {
    const theme = themePresets.value[currentThemePreset.value];
    if (!theme) return;

    // 应用字体颜色到全局变量
    if (theme.fontColor) {
      document.documentElement.style.setProperty('--home-text-color', theme.fontColor);
    } else {
      // 如果主题中没有颜色，则移除自定义，使其回退到 global.css 中的默认值
      document.documentElement.style.removeProperty('--home-text-color');
    }

    // 应用App名称字体大小
    applyAppLabelFontSize(theme.appLabelFontSize);

    // 应用壁纸
    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen) {
      if (theme.bg) {
        homeScreen.style.backgroundImage = `url('${theme.bg}')`;
      } else {
        homeScreen.style.backgroundImage = '';
      }
    }

    // 锁屏壁纸逻辑可以类似地在这里添加
  }


  // --- 初始化和监听 ---
  const initTheme = () => {
    applyCurrentFont()
    applyCurrentCss()
    applyCurrentTheme()
  }

  // 监听状态变化并自动保存
  watch(
    [themePresets, currentThemePreset, fontPresets, currentFontPreset, cssPresets, currentCssPreset],
    saveData,
    { deep: true }
  )

  return {
    themePresets,
    currentThemePreset,
    fontPresets,
    currentFontPreset,
    cssPresets,
    currentCssPreset,
    showFrame,
    showStatusBar, // 导出
    appIcons,
    initTheme,
    switchThemePreset,
    saveThemePreset,
    deleteThemePreset,
    updateThemeSetting,
    switchFontPreset,
    saveFontPreset,
    deleteFontPreset,
    switchCssPreset,
    saveCssPreset,
    deleteCssPreset,
    applyCss,
    applyFont,
    applyFontColor,
    applyAppLabelFontSize,
    applyCurrentFont,
    applyCurrentCss,
    applyCurrentTheme,
    toast,
    showToast,
    confirmModal,
    showConfirm,
    hideConfirm,
    handleConfirm,
    inputModal,
    showInput,
    hideInput,
    handleInputConfirm,
    handleUpload,

    // --- 电量控制 ---
    batteryLevel,
    setBatteryLevel: (level) => {
      batteryLevel.value = Math.max(0, Math.min(100, level));
    },
  }
})
