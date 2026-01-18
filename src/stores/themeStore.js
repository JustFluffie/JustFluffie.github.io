import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

// Helper functions for localStorage
const getFromStorage = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue);
      if (parsed !== null && parsed !== undefined) {
        return parsed;
      }
    } catch (e) {
      return storedValue;
    }
  }
  return defaultValue;
}

const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useThemeStore = defineStore('theme', () => {
  // State
  const themePresets = ref(getFromStorage('aiPhoneThemePresets', {
    '默认主题': {
      bg: '',
      lockbg: '',
      appIcons: {},
      showFrame: true,
      showStatusBar: true,
      fontColor: '#1f1f1f',
      appLabelFontSize: 10,
    }
  }))
  const currentThemePreset = ref(getFromStorage('aiPhoneCurrentThemePreset', '默认主题'))
  const fontPresets = ref(getFromStorage('aiPhoneFontPresets', { '默认字体': '' }))
  const currentFontPreset = ref(getFromStorage('aiPhoneCurrentFontPreset', '默认字体'))
  const cssPresets = ref(getFromStorage('aiPhoneCssPresets', { '默认样式': '' }))
  const currentCssPreset = ref(getFromStorage('aiPhoneCurrentCssPreset', '默认样式'))

  const showFrame = computed(() => {
    const preset = themePresets.value[currentThemePreset.value];
    return preset ? preset.showFrame !== false : true;
  });

  const showStatusBar = computed(() => {
    const preset = themePresets.value[currentThemePreset.value];
    return preset ? preset.showStatusBar !== false : true;
  });

  const appIcons = computed(() => {
    const preset = themePresets.value[currentThemePreset.value];
    return preset ? preset.appIcons || {} : {};
  });

  // Use individual refs for toast state to ensure reactivity
  const toastShow = ref(false);
  const toastMessage = ref('');
  const toastType = ref('success');
  const toastDuration = ref(1500);

  const loading = ref(false);

  const confirmModal = ref({
    show: false,
    title: '确认',
    message: '确定要执行此操作吗？',
    onConfirm: null,
    messageStyle: {},
    confirmText: 'delete',
  });

  const inputModal = ref({
    show: false,
    title: '输入',
    value: '',
    placeholder: '',
    onConfirm: null,
    showUpload: false,
    onUpload: null,
  });

  const batteryLevel = ref(getFromStorage('aiPhoneBatteryLevel', 100));
  const homeScreen = ref(getFromStorage('aiPhoneHomeScreen', 1));

  // Actions
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

  const showLoading = () => {
    loading.value = true;
  };

  const hideLoading = () => {
    loading.value = false;
  };

  const showToast = (message = '保存成功', type = 'success', duration = 1500) => {
    toastMessage.value = message;
    toastType.value = type;
    toastDuration.value = duration;
    toastShow.value = true;
  };

  const saveData = () => {
    saveToStorage('aiPhoneThemePresets', themePresets.value)
    saveToStorage('aiPhoneCurrentThemePreset', currentThemePreset.value)
    saveToStorage('aiPhoneFontPresets', fontPresets.value)
    saveToStorage('aiPhoneCurrentFontPreset', currentFontPreset.value)
    saveToStorage('aiPhoneCssPresets', cssPresets.value)
    saveToStorage('aiPhoneCurrentCssPreset', currentCssPreset.value)
    saveToStorage('aiPhoneBatteryLevel', batteryLevel.value)
    saveToStorage('aiPhoneHomeScreen', homeScreen.value)
  }

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
      applyFont(null);
    }
  }

  const applyCurrentCss = () => {
    if (cssPresets.value && currentCssPreset.value && cssPresets.value[currentCssPreset.value]) {
      const css = cssPresets.value[currentCssPreset.value];
      applyCss(css);
    } else {
      applyCss('');
    }
  }
  
  const applyCurrentTheme = () => {
    const theme = themePresets.value[currentThemePreset.value];
    if (!theme) return;

    if (theme.fontColor) {
      document.documentElement.style.setProperty('--home-text-color', theme.fontColor);
    } else {
      document.documentElement.style.removeProperty('--home-text-color');
    }

    applyAppLabelFontSize(theme.appLabelFontSize);

    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen) {
      if (theme.bg) {
        homeScreen.style.backgroundImage = `url('${theme.bg}')`;
      } else {
        homeScreen.style.backgroundImage = '';
      }
    }
  }

  const initTheme = () => {
    applyCurrentFont()
    applyCurrentCss()
    applyCurrentTheme()
  }

  const setHomeScreen = (screen) => {
    homeScreen.value = screen;
  }

  watch(
    [themePresets, currentThemePreset, fontPresets, currentFontPreset, cssPresets, currentCssPreset, homeScreen],
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
    showStatusBar,
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
    toastShow,
    toastMessage,
    toastType,
    toastDuration,
    showToast,
    loading,
    showLoading,
    hideLoading,
    confirmModal,
    showConfirm,
    hideConfirm,
    handleConfirm,
    inputModal,
    showInput,
    hideInput,
    handleInputConfirm,
    handleUpload,
    batteryLevel,
    setBatteryLevel: (level) => {
      batteryLevel.value = Math.max(0, Math.min(100, level));
    },
    homeScreen,
    setHomeScreen,
  }
})
