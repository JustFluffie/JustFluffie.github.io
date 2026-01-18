<template>
  <div class="app-screen active" id="themeSettingsApp">
    <!-- ==================== 顶部导航栏 ==================== -->
    <div class="app-header">
      <div class="back-btn" @click="goBack">
        <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </div>
      <div class="title">{{ $t('theme.title') }}</div>
      <div class="action-btn">
        <button class="header-save-btn" @click="saveCurrentThemeSettings">{{ $t('save') }}</button>
      </div>
    </div>

    <div class="app-content theme-content">
      <!-- ==================== 1. 边框设置模块 ==================== -->
      <div class="card theme-section">
        <div class="card-content">
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="item-label" style="font-weight: 600;">{{ $t('theme.showFrame') }}</div>
              <div class="item-value">{{ $t('theme.showFrameDesc') }}</div>
            </div>
            <div class="toggle-switch" :class="{ active: pendingThemeSettings.showFrame !== false }" @click="toggleSetting('showFrame')"></div>
          </div>
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="item-label" style="font-weight: 600;">{{ $t('theme.showStatusBar') }}</div>
              <div class="item-value">{{ $t('theme.showStatusBarDesc') }}</div>
            </div>
            <div class="toggle-switch" :class="{ active: pendingThemeSettings.showStatusBar !== false }" @click="toggleSetting('showStatusBar')"></div>
          </div>
        </div>
      </div>

      <!-- ==================== 2. 壁纸设置模块 ==================== -->
      <div class="card theme-section">
        <div class="card-title">{{ $t('theme.wallpaper') }}</div>
        <div class="card-content">
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="wallpaper-container">
                <div class="wallpaper-col">
                  <div class="section-title-center">{{ $t('theme.homeScreen') }}</div>
                  <div class="wallpaper-preview" :style="pendingThemeSettings.bg ? { backgroundImage: `url('${pendingThemeSettings.bg}')` } : {}" @click="openWallpaperModal('home')">
                    <span v-if="!pendingThemeSettings.bg" class="upload-hint">{{ $t('theme.uploadHint') }}</span>
                  </div>
                </div>
                <div class="wallpaper-col">
                  <div class="section-title-center">{{ $t('theme.lockScreen') }}</div>
                  <div class="wallpaper-preview" :style="pendingThemeSettings.lockbg ? { backgroundImage: `url('${pendingThemeSettings.lockbg}')` } : {}" @click="openWallpaperModal('lock')">
                    <span v-if="!pendingThemeSettings.lockbg" class="upload-hint">{{ $t('theme.uploadHint') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="item-label">{{ $t('theme.homeScreenStyle') }}</div>
            </div>
            <CustomSelect
              :options="homeScreenOptions"
              :modelValue="homeScreen"
              @update:modelValue="switchHomeScreen"
              textAlign="left"
            />
          </div>
        </div>
      </div>

      <!-- ==================== 3. App图标自定义模块 ==================== -->
      <div class="card theme-section">
        <div class="card-title">{{ $t('theme.appIcons') }}</div>
        <div class="card-content">
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="app-icons-grid-new">
                <div v-for="app in apps" :key="app.key" class="app-icon-item" @click="showAppIconOptions(app.key)">
                  <div class="app-icon-box">
                    <img v-if="pendingThemeSettings.appIcons && pendingThemeSettings.appIcons[app.key]" :src="pendingThemeSettings.appIcons[app.key]" />
                  </div>
                  <span class="app-name">{{ app.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 4. 字体设置模块 ==================== -->
      <div class="card theme-section">
        <div class="card-title">{{ $t('theme.fontSettings') }}</div>
        <div class="card-content">
          <div class="theme-item no-icon">
            <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
              <CustomSelect
                :options="fontPresetOptions"
                :modelValue="currentFontPreset"
                @update:modelValue="switchFontPreset"
                textAlign="left"
                style="flex: 1;"
              />
              <button class="btn btn-secondary btn-sm" @click="saveFontPreset">{{ $t('save') }}</button>
              <button class="btn btn-danger btn-sm" @click="deleteFontPreset">{{ $t('delete') }}</button>
            </div>
          </div>
          <div class="theme-item no-icon">
            <div style="display: flex; gap: 5px; align-items: center; flex: 1; width: 100%;">
              <input type="text" class="base-input" style="flex: 1;" v-model="fontUrlInput" :placeholder="t('theme.fontUrlPlaceholder')">
              <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" @click="applyFontUrl">{{ $t('confirm') }}</button>
            </div>
          </div>
          <div class="theme-item no-icon">
            <div style="display: flex; gap: 5px; align-items: center; flex: 1; width: 100%;">
              <input type="color" class="color-picker-input" :value="pendingThemeSettings.fontColor" @input="updateFontColorFromPicker($event.target.value)">
              <input type="text" class="base-input" style="flex: 1;" :value="pendingThemeSettings.fontColor" @input="updateFontColorFromInput($event.target.value)" :placeholder="t('theme.fontColorPlaceholder')">
              <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" @click="confirmFontColor">{{ $t('confirm') }}</button>
            </div>
          </div>
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="item-label">{{ $t('theme.appNameFontSize') }}</div>
            </div>
            <div class="number-input">
              <button @click="adjustAppLabelFontSize(-1)">-</button>
              <span>{{ pendingThemeSettings.appLabelFontSize || 10 }}px</span>
              <button @click="adjustAppLabelFontSize(1)">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 5. 主题预设模块 ==================== -->
      <div class="card theme-section">
        <div class="card-title">{{ $t('theme.themePresets') }}</div>
        <div class="card-content">
          <div class="theme-item no-icon">
            <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
              <CustomSelect
                :options="themePresetOptions"
                :modelValue="currentThemePreset"
                @update:modelValue="switchThemePreset"
                textAlign="left"
                style="flex: 1;"
              />
              <button class="btn btn-secondary btn-sm" @click="saveThemePreset">{{ $t('save') }}</button>
              <button class="btn btn-danger btn-sm" @click="deleteThemePreset">{{ $t('delete') }}</button>
            </div>
          </div>
          <div class="theme-item no-icon">
            <div style="display: flex; gap: 10px; align-items: center; flex: 1;">
              <CustomSelect
                :options="cssPresetOptions"
                :modelValue="currentCssPreset"
                @update:modelValue="switchCssPreset"
                textAlign="left"
                style="flex: 1;"
              />
              <button class="btn btn-secondary btn-sm" @click="saveCssPreset">{{ $t('save') }}</button>
              <button class="btn btn-danger btn-sm" @click="deleteCssPreset">{{ $t('delete') }}</button>
            </div>
          </div>
          <div class="theme-item no-icon">
            <div class="item-content" style="flex-direction: column; align-items: flex-start; gap: 5px; width: 100%;">
              <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div class="item-label">{{ $t('theme.globalCss') }}</div>
                <button class="btn btn-secondary btn-sm" style="white-space: nowrap;" @click="applyCssCode">{{ $t('confirm') }}</button>
              </div>
              <textarea class="base-input" v-model="cssCodeInput" :placeholder="t('theme.cssPlaceholder')" style="width: 100%; margin-top: 10px;"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 6. 导入导出模块 ==================== -->
      <div class="card theme-section">
        <div class="card-title">{{ $t('theme.importExport') }}</div>
        <div class="card-content">
          <div class="theme-item no-icon">
            <div class="import-export-container" style="flex: 1; justify-content: space-around;">
              <button class="btn btn-secondary big-btn" @click="exportThemeData">{{ $t('theme.exportPresets') }}</button>
              <button class="btn btn-secondary big-btn" @click="triggerImport">{{ $t('theme.importPresets') }}</button>
              <input type="file" ref="importInput" class="hidden-input" accept=".json" @change="handleImport">
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 7. 通知测试模块 ==================== -->
      <div class="card theme-section">
        <div class="card-title">通知测试</div>
        <div class="card-content">
          <div class="theme-item no-icon">
            <div class="item-content">
              <div class="item-label" style="font-weight: 600;">桌面通知</div>
              <div class="item-value">开启后，应用在后台时也能收到消息提醒</div>
            </div>
            <div class="toggle-switch" :class="{ active: notificationStore.desktopNotificationsEnabled }" @click="notificationStore.desktopNotificationsEnabled = !notificationStore.desktopNotificationsEnabled"></div>
          </div>
          <div class="theme-item no-icon">
            <div class="import-export-container" style="flex: 1; justify-content: space-around;">
              <button class="btn btn-secondary big-btn" @click="notificationStore.triggerNotification('测试通知', '这是一条测试通知。')">发送测试通知</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 弹窗组件区域 ==================== -->
    <ImageUploadModal
      v-model:visible="isUploadModalVisible"
      :title="uploadModalConfig.title"
      :bizType="uploadModalConfig.bizType"
      type="basic"
      @send-image="handleImageUpload"
    />

  </div>
</template>

<script setup>
// ==========================================
// 1. 导入与基础设置
// ==========================================
import { ref, onMounted, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { storeToRefs } from 'pinia'
import CustomSelect from '@/components/common/CustomSelect.vue'
import Modal from '@/components/common/Modal.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

const { t } = useI18n()
const router = useRouter()
const themeStore = useThemeStore()
const notificationStore = useNotificationStore()

const {
  themePresets,
  currentThemePreset,
  fontPresets,
  currentFontPreset,
  cssPresets,
  currentCssPreset,
  homeScreen
} = storeToRefs(themeStore)

// ==========================================
// 2. 状态定义 (State & Refs)
// ==========================================
// 暂存的主题设置，用于编辑
const pendingThemeSettings = reactive({})

// 输入框状态
const fontUrlInput = ref('')
const cssCodeInput = ref('')

// 图片上传弹窗状态
const isUploadModalVisible = ref(false)
const uploadModalConfig = reactive({
  title: '',
  bizType: 'theme', // 使用一个自定义的bizType
  onConfirm: null
})

// 当前操作上下文
const currentWallpaperType = ref('') // 'home' or 'lock'
const currentIconKey = ref(null)

  // DOM 引用
  const importInput = ref(null)

// ==========================================
// 3. 计算属性 (Computed)
// ==========================================
// 静态数据：App列表 (响应式)
const apps = computed(() => [
  { key: 'chat', name: t('homeScreen.apps.chat') },
  { key: 'worldbook', name: t('homeScreen.apps.worldbook') },
  { key: 'preset', name: t('homeScreen.apps.preset') },
  { key: 'calendar', name: t('homeScreen.apps.calendar') },
  { key: 'api', name: t('homeScreen.apps.apiSettings') },
  { key: 'theme', name: t('homeScreen.apps.theme') },
  { key: 'spy', name: t('homeScreen.apps.spy') },
  { key: 'check', name: t('homeScreen.apps.check') }
])

const wallpaperModalTitle = computed(() => {
  const type = currentWallpaperType.value === 'home' ? t('theme.homeScreen') : t('theme.lockScreen');
  return t('theme.setWallpaper', { type });
})

const fontPresetOptions = computed(() => {
  return Object.keys(fontPresets.value || {}).map(name => ({ value: name, label: name }));
});

const themePresetOptions = computed(() => {
  return Object.keys(themePresets.value || {}).map(name => ({ value: name, label: name }));
});

const cssPresetOptions = computed(() => {
  return Object.keys(cssPresets.value || {}).map(name => ({ value: name, label: name }));
});

const homeScreenOptions = computed(() => [
  { value: 1, label: '屏幕一' },
  { value: 2, label: '屏幕二' }
]);

function switchHomeScreen(value) {
  themeStore.setHomeScreen(value);
}

// ==========================================
// 4. 生命周期与初始化
// ==========================================
onMounted(() => {
  loadThemeSettings()
})

function loadThemeSettings() {
  const defaultThemeName = t('theme.defaultTheme');
  const defaultCssName = t('theme.defaultCss');

  if (!themePresets.value) {
    themePresets.value = {
      [defaultThemeName]: { bg: '', lockbg: '', appIcons: {}, showFrame: true, fontColor: '#1f1f1f', appLabelFontSize: 10 }
    };
  }
  
  const preset = themePresets.value[currentThemePreset.value]
  if (preset) {
    Object.assign(pendingThemeSettings, JSON.parse(JSON.stringify(preset)))
  } else {
    currentThemePreset.value = defaultThemeName
    const defaultPreset = themePresets.value[defaultThemeName] || {}
    Object.assign(pendingThemeSettings, JSON.parse(JSON.stringify(defaultPreset)))
  }

  if (!pendingThemeSettings.appIcons) {
    pendingThemeSettings.appIcons = {}
  }
  if (!pendingThemeSettings.appLabelFontSize) {
    pendingThemeSettings.appLabelFontSize = 10;
  }
  
  if (!cssPresets.value) {
    cssPresets.value = { [defaultCssName]: '' };
  }
  cssCodeInput.value = cssPresets.value[currentCssPreset.value] || ''
}

// ==========================================
// 5. 基础交互方法
// ==========================================
const goBack = () => {
  if (router.options.history.state.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function toggleSetting(settingKey) {
  const newValue = !(pendingThemeSettings[settingKey] !== false);
  pendingThemeSettings[settingKey] = newValue;

  // 对 showFrame 和 showStatusBar 进行即时更新
  if (settingKey === 'showFrame' || settingKey === 'showStatusBar') {
    themeStore.updateThemeSetting(settingKey, newValue);
  }
}

// ==========================================
// 6. 壁纸设置模块逻辑
// ==========================================
function openWallpaperModal(type) {
  currentWallpaperType.value = type
  const typeName = type === 'home' ? t('theme.homeScreen') : t('theme.lockScreen');
  uploadModalConfig.title = t('theme.setWallpaper', { type: typeName });
  uploadModalConfig.onConfirm = (image) => {
    const url = image.type === 'url' ? image.content : image.content;
    if (type === 'home') {
      pendingThemeSettings.bg = url
    } else if (type === 'lock') {
      pendingThemeSettings.lockbg = url
    }
  }
  isUploadModalVisible.value = true
}

function updateThemeWallpaper(type, url) {
  if (type === 'home') {
    pendingThemeSettings.bg = url
  } else if (type === 'lock') {
    pendingThemeSettings.lockbg = url
  }
}

// ==========================================
// 7. App图标设置模块逻辑
// ==========================================
function showAppIconOptions(key) {
  currentIconKey.value = key;
  const appName = apps.value.find(a => a.key === key)?.name || '';
  uploadModalConfig.title = t('theme.setAppIcon', { appName });
  uploadModalConfig.onConfirm = (image) => {
    const url = image.type === 'url' ? image.content : image.content;
    updateAppIcon(key, url)
  }
  isUploadModalVisible.value = true
}

function updateAppIcon(key, url) {
  // To ensure reactivity, create a new object and assign it back.
  const newIcons = { ...(pendingThemeSettings.appIcons || {}) };
  newIcons[key] = url;
  pendingThemeSettings.appIcons = newIcons;
}

function handleImageUpload(image) {
  if (uploadModalConfig.onConfirm) {
    uploadModalConfig.onConfirm(image);
  }
  isUploadModalVisible.value = false;
}

// ==========================================
// 8. 字体设置模块逻辑
// ==========================================
function switchFontPreset(name) {
  themeStore.switchFontPreset(name)
}

function saveFontPreset() {
  const name = prompt(t('theme.prompt.enterFontPresetName'));
  if (name) {
    const url = fontUrlInput.value.trim();
    if (url) {
      try {
        new URL(url);
        themeStore.saveFontPreset(name, url);
        themeStore.showToast(t('theme.toast.saveSuccess'));
      } catch (e) {
        themeStore.showToast(t('theme.toast.invalidUrl'), 'error');
      }
    } else {
      themeStore.showToast(t('theme.toast.enterUrl'), 'info');
    }
  }
}

function deleteFontPreset() {
  themeStore.showConfirm(
    t('theme.confirm.deleteFontPreset'),
    t('theme.confirm.deleteFontPresetMsg', { presetName: currentFontPreset.value }),
    () => {
      const presetNameToDelete = currentFontPreset.value;
      themeStore.deleteFontPreset(presetNameToDelete);
      if (currentFontPreset.value === presetNameToDelete) {
        currentFontPreset.value = t('theme.defaultTheme');
      }
      fontUrlInput.value = fontPresets.value[currentFontPreset.value] || '';
    }
  );
}

function applyFontUrl() {
  const url = fontUrlInput.value.trim();
  if (url) {
    // Basic URL validation
    try {
      new URL(url);
      themeStore.applyFont(url);
      themeStore.showToast(t('theme.toast.fontApplied'), 'info');
    } catch (e) {
      themeStore.showToast(t('theme.toast.invalidUrl'), 'error');
    }
  }
}

function updateFontColorFromPicker(color) {
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    pendingThemeSettings.fontColor = color;
    themeStore.applyFontColor(color);
  }
}

function updateFontColorFromInput(color) {
  if (/^#([0-9A-F]{3}){1,2}$/i.test(color) || /^#([0-9A-F]{4}){1,2}$/i.test(color)) {
    pendingThemeSettings.fontColor = color;
    themeStore.applyFontColor(color);
  }
}

function confirmFontColor() {
  themeStore.applyFontColor(pendingThemeSettings.fontColor);
  themeStore.showToast(t('theme.toast.colorApplied'), 'info');
}

function adjustAppLabelFontSize(amount) {
  let currentSize = pendingThemeSettings.appLabelFontSize || 10;
  currentSize += amount;
  if (currentSize < 8) currentSize = 8;
  if (currentSize > 16) currentSize = 16;
  pendingThemeSettings.appLabelFontSize = currentSize;
  themeStore.applyAppLabelFontSize(currentSize);
}

// ==========================================
// 9. 预设管理模块逻辑 (主题 & CSS)
// ==========================================
// --- 主题预设 ---
function switchThemePreset(name) {
  if (confirm(t('theme.confirm.switchTheme'))) {
    themeStore.switchThemePreset(name)
    loadThemeSettings()
  }
}

function saveThemePreset() {
  const name = prompt(t('theme.prompt.enterThemePresetName'));
  if (name) {
    const themeToSave = JSON.parse(JSON.stringify(pendingThemeSettings));
    
    // Ensure all required fields have a fallback
    themeToSave.bg = themeToSave.bg || '';
    themeToSave.lockbg = themeToSave.lockbg || '';
    themeToSave.appIcons = themeToSave.appIcons || {};
    themeToSave.fontColor = themeToSave.fontColor || '#1f1f1f';
    themeToSave.appLabelFontSize = themeToSave.appLabelFontSize || 10;

    themeStore.saveThemePreset(name, themeToSave);
    themeStore.showToast(t('theme.toast.saveSuccess'));
  }
}

function deleteThemePreset() {
  themeStore.showConfirm(
    t('theme.confirm.deleteThemePreset'),
    t('theme.confirm.deleteThemePresetMsg', { presetName: currentThemePreset.value }),
    () => {
      const presetNameToDelete = currentThemePreset.value;
      themeStore.deleteThemePreset(presetNameToDelete);
      // Ensure the current preset is updated before reloading settings
      if (currentThemePreset.value === presetNameToDelete) {
        currentThemePreset.value = t('theme.defaultTheme');
      }
      loadThemeSettings();
    }
  );
}

// --- CSS预设 ---
function switchCssPreset(name) {
  themeStore.switchCssPreset(name)
  cssCodeInput.value = cssPresets.value[name] || ''
}

function saveCssPreset() {
  const name = prompt(t('theme.prompt.enterCssPresetName'));
  if (name) {
    const css = cssCodeInput.value.trim();
    if (css) {
      // A very basic check for valid CSS. For a real app, a more robust parser would be better.
      if (css.includes('{') && css.includes('}')) {
        themeStore.saveCssPreset(name, css);
        themeStore.showToast(t('theme.toast.saveSuccess'));
      } else {
        themeStore.showToast(t('theme.toast.invalidCss'), 'error');
      }
    } else {
      themeStore.showToast(t('theme.toast.enterCss'), 'info');
    }
  }
}

function deleteCssPreset() {
  themeStore.showConfirm(
    t('theme.confirm.deleteCssPreset'),
    t('theme.confirm.deleteCssPresetMsg', { presetName: currentCssPreset.value }),
    () => {
      const presetNameToDelete = currentCssPreset.value;
      themeStore.deleteCssPreset(presetNameToDelete);
      if (currentCssPreset.value === presetNameToDelete) {
        currentCssPreset.value = t('theme.defaultCss');
      }
      cssCodeInput.value = cssPresets.value[currentCssPreset.value] || '';
    }
  );
}

function applyCssCode() {
  const css = cssCodeInput.value.trim();
  if (css) {
    // A very basic check for valid CSS. For a real app, a more robust parser would be better.
    if (css.includes('{') && css.includes('}')) {
      themeStore.applyCss(css);
      themeStore.showToast(t('theme.toast.cssApplied'), 'info');
    } else {
      themeStore.showToast(t('theme.toast.invalidCss'), 'error');
    }
  } else {
    themeStore.applyCss(''); // Clear the custom CSS if the input is empty
    themeStore.showToast(t('theme.toast.cssCleared'), 'info');
  }
}

// ==========================================
// 10. 导入导出模块逻辑
// ==========================================
function exportThemeData() {
  const data = {
    themePresets: themePresets.value,
    currentThemePreset: currentThemePreset.value,
    fontPresets: fontPresets.value,
    currentFontPreset: currentFontPreset.value,
    cssPresets: cssPresets.value,
    currentCssPreset: currentCssPreset.value,
    exportDate: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai_phone_theme_config_${new Date().toISOString().slice(0,10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  importInput.value.click()
}

function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (data.themePresets) {
        for (const key in data.themePresets) {
          themePresets.value[key] = data.themePresets[key];
        }
      }
      if (data.fontPresets) {
        for (const key in data.fontPresets) {
          fontPresets.value[key] = data.fontPresets[key];
        }
      }
      if (data.cssPresets) {
        for (const key in data.cssPresets) {
          cssPresets.value[key] = data.cssPresets[key];
        }
      }
      
      if (confirm(t('theme.confirm.importSuccess'))) {
        if (data.currentThemePreset) themeStore.switchThemePreset(data.currentThemePreset)
        if (data.currentFontPreset) themeStore.switchFontPreset(data.currentFontPreset)
        if (data.currentCssPreset) themeStore.switchCssPreset(data.currentCssPreset)
      }
      loadThemeSettings()
      themeStore.showToast(t('theme.toast.importSuccess'), 'success')
    } catch (err) {
      themeStore.showToast(t('theme.toast.importFailed'), 'error')
      console.error(err)
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// ==========================================
// 11. 全局保存逻辑
// ==========================================
function saveCurrentThemeSettings() {
  const themeToSave = {
    bg: pendingThemeSettings.bg || '',
    lockbg: pendingThemeSettings.lockbg || '',
    appIcons: pendingThemeSettings.appIcons || {},
    showFrame: pendingThemeSettings.showFrame !== false,
    showStatusBar: pendingThemeSettings.showStatusBar !== false,
    fontColor: pendingThemeSettings.fontColor || '#1f1f1f',
    appLabelFontSize: pendingThemeSettings.appLabelFontSize || 10,
  };

  themeStore.saveThemePreset(currentThemePreset.value, themeToSave);
  themeStore.saveCssPreset(currentCssPreset.value, cssCodeInput.value);
  
  // Re-apply all settings from store
  themeStore.initTheme();
  
  themeStore.showToast(t('theme.toast.saveSuccess'));
}
</script>

<style scoped>
/* ==================== 主题页面基础布局 ==================== */
.theme-content {
    flex: 1;
    overflow-y: auto;
}

.theme-section {
    margin-bottom: 15px;
}

/* ==================== 通用列表项样式 ==================== */
.theme-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.2s;
    min-height: 54px;
}

.theme-item:last-child { border-bottom: none; }

.theme-item .item-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 16px;
}

.theme-item .item-content { flex: 1; }
.theme-item .item-label { font-size: 15px; color: var(--text-primary); line-height: 1.2; }
.theme-item .item-value { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; line-height: 1.2; }
.theme-item .item-arrow { color: var(--text-quaternary); font-size: 14px; }

.theme-item.no-icon {
    padding-left: 0;
}

.theme-item.no-icon .item-icon {
    display: none;
}

/* ==================== 壁纸设置模块样式 ==================== */
.wallpaper-container {
    width: 100%;
    display: flex;
    gap: 15px;
}

.wallpaper-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.section-title-center {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-tertiary);
    margin-bottom: 8px;
}

.wallpaper-preview {
    width: 100%;
    aspect-ratio: 9/16;
    background-color: var(--bg-light);
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
    transition: transform 0.2s;
}

.wallpaper-preview:active {
    transform: scale(0.98);
}

.upload-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--text-tertiary);
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.05);
}

/* ==================== App图标设置模块样式 ==================== */
.app-icons-grid-new {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
}

.app-icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
}

.app-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.app-icon-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.app-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
}

/* ==================== 字体与预设模块样式 ==================== */
.import-export-container {
    display: flex;
    gap: 15px;
}
</style>
