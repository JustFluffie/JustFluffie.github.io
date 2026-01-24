import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCharThemeStore = defineStore('charTheme', () => {
  // 存储每个角色的主题设置
  const charThemes = ref({})

  // 获取角色的主题设置
  const getCharTheme = (charId) => {
    if (!charThemes.value[charId]) {
      charThemes.value[charId] = {
        wallpaper: '', // 壁纸URL
        appIcons: {} // app图标映射 { appLabel: imageUrl }
      }
    }
    return charThemes.value[charId]
  }

  // 设置壁纸
  const setWallpaper = (charId, imageUrl) => {
    if (!charThemes.value[charId]) {
      getCharTheme(charId)
    }
    charThemes.value[charId].wallpaper = imageUrl
    saveThemes()
  }

  // 设置app图标
  const setAppIcon = (charId, appLabel, imageUrl) => {
    if (!charThemes.value[charId]) {
      getCharTheme(charId)
    }
    if (!charThemes.value[charId].appIcons) {
      charThemes.value[charId].appIcons = {}
    }
    charThemes.value[charId].appIcons[appLabel] = imageUrl
    saveThemes()
  }

  // 删除app图标
  const deleteAppIcon = (charId, appLabel) => {
    if (charThemes.value[charId]?.appIcons?.[appLabel]) {
      delete charThemes.value[charId].appIcons[appLabel]
      saveThemes()
    }
  }

  // 获取壁纸样式
  const getWallpaperStyle = (charId) => {
    const theme = getCharTheme(charId)
    if (theme.wallpaper) {
      return {
        backgroundImage: `url(${theme.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    }
    return {}
  }

  // 获取app图标
  const getAppIcon = (charId, appLabel) => {
    const theme = getCharTheme(charId)
    return theme.appIcons?.[appLabel] || null
  }

  // 保存到 localStorage
  const saveThemes = () => {
    localStorage.setItem('charphone_themes', JSON.stringify(charThemes.value))
  }

  // 从 localStorage 加载
  const loadThemes = () => {
    const saved = localStorage.getItem('charphone_themes')
    if (saved) {
      try {
        charThemes.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load charphone themes:', e)
      }
    }
  }

  // 初始化时加载
  loadThemes()

  return {
    charThemes,
    getCharTheme,
    setWallpaper,
    setAppIcon,
    deleteAppIcon,
    getWallpaperStyle,
    getAppIcon,
    saveThemes,
    loadThemes
  }
})
