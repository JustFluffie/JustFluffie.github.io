import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { useWorldBookStore } from '@/stores/worldBookStore'
import { usePresetStore } from '@/stores/presetStore'
import { useApiStore } from '@/stores/apiStore'
import { storeToRefs } from 'pinia'
import { useWeather } from '@/composables/useWeather'

export function useSingleSettings(props) {
  const { t } = useI18n()
  const router = useRouter()
  const singleStore = useSingleStore()
  const themeStore = useThemeStore()
  const backgroundStore = useBackgroundStore()
  const worldBookStore = useWorldBookStore()
  const { sortedWorldBooks } = storeToRefs(worldBookStore)
  const presetStore = usePresetStore()
  const { sortedPresets } = storeToRefs(presetStore)
  const apiStore = useApiStore()
  const { fetchLocationWeather } = useWeather()

  // ================================================================================================
  // 1. UI 状态 (UI State)
  // ================================================================================================
  const collapsedStates = reactive({
    roleInfo: false, 
    userInfo: false, 
    backgroundActivity: false, 
    modeSettings: false,
    realtimeSense: false,
    summarySettings: false, 
    bubbleSettings: false, 
    videoSettings: false, 
    advancedSettings: false,
  })

  const showImageUploadModal = ref(false)
  const currentUploadTarget = ref('') // 'avatar', 'userPersonaAvatar', 'chatBg', 'videoBg', 'userVideoImg'
  
  // 模态框状态
  const showSummaryModal = ref(false)
  const showRangeInputModal = ref(false)
  const summaryRangeInput = ref('')
  const showNpcScopeModal = ref(false)
  const showCharScopeModal = ref(false)

  // ================================================================================================
  // 2. 表单数据状态 (Form State)
  // ================================================================================================
  const formState = reactive({
    // Role Info
    charNameInput: '',
    charNicknameInput: '',
    charPersonaInput: '',
    
    // User Info
    currentUserPersonaId: 'default',
    userPersonaNameInput: '',
    userPersonaDescInput: '',
    userPersonaAvatar: '',
    
    // Background Activity
    backgroundActivityOverride: 'default',
    proactiveInterval: 5,
    proactiveCooldown: 30,
    proactiveDailyLimit: 10,
    triggerMode: 'always',
    proactiveIdleTime: 15,
    
    // Mode Settings
    isOnline: true,
    preset: [],
    worldbook: [],
    replyLengthMin: '',
    replyLengthMax: '',
    
    // Real-time Sense
    realtimeTimeEnabled: false,
    realtimeWeatherEnabled: false,
    charLocationReal: '',
    charLocationVirtual: '',
    charLocationDisplay: '',
    userLocationReal: '',
    userLocationVirtual: '',
    userLocationDisplay: '',
    charLocationData: {},
    userLocationData: {},
    
    // Summary Settings
    summaryRange: 20,
    summaryPrompt: '',
    autoSummary: false,
    memoryCount: 10,
    
    // Beautification
    currentBubblePresetId: '',
    bubbleCss: '',
    bubbleFontSize: 14,
    chatBackground: '',
    
    // Video Call
    videoBg: '',
    userVideoImg: '',
    
    // Advanced & Stats
    apiConfig: 'default',
    linkedNpcs: [],
    linkedCharacters: [],
    isBlocked: false,
    
    // Stats (Read-only mostly)
    npcCount: 0,
    linkedCharCount: 0,
    tokenCount: 0,
    msgCount: 0
  })

  // ================================================================================================
  // 3. 计算属性 (Computed)
  // ================================================================================================
  const character = computed(() => singleStore.getCharacter(props.id))
  const charName = computed(() => character.value?.name || t('chat.unknownCharacter'))
  const charAvatar = computed(() => character.value?.avatar)

  const userPersonaOptions = computed(() => [
    { value: 'new', label: t('chat.singleChat.settings.newUserPersona') },
    ...(singleStore.userPersonas || []).map(p => ({ value: p.id, label: p.name }))
  ])

  const apiConfigOptions = computed(() => [
    { value: 'default', label: t('chat.singleChat.settings.default') }, 
    ...apiStore.presets.map(p => ({ value: p.name, label: p.name }))
  ])

  const bubblePresetOptions = computed(() => [
    { value: '', label: t('chat.singleChat.settings.custom') },
    ...(singleStore.bubblePresets || []).map(p => ({ value: p.id, label: p.name }))
  ])

  const availableCharacters = computed(() => {
    return singleStore.characters.filter(c => c.id !== props.id)
  })

  const isBackgroundActivityEffective = computed(() => {
    if (formState.backgroundActivityOverride === 'on') return true
    if (formState.backgroundActivityOverride === 'off') return false
    return backgroundStore.globalBackgroundActivity
  })

  const previewStyle = computed(() => {
    const base = { fontSize: `${formState.bubbleFontSize}px` }
    if (!formState.bubbleCss) return base
    const styles = {}
    formState.bubbleCss.split(';').forEach(rule => {
      const parts = rule.split(':')
      if (parts.length >= 2) {
        const prop = parts[0].trim()
        const val = parts.slice(1).join(':').trim()
        if (prop && val) styles[prop] = val
      }
    })
    return { ...base, ...styles }
  })

  const uploadModalTitle = computed(() => ({
    avatar: t('chat.singleChat.settings.toast.setCharAvatar'), 
    userPersonaAvatar: t('chat.singleChat.settings.toast.setUserAvatar'), 
    chatBg: t('chat.singleChat.settings.toast.setChatBg'),
    videoBg: t('chat.singleChat.settings.toast.setCharImg'), 
    userVideoImg: t('chat.singleChat.settings.toast.setUserImg')
  })[currentUploadTarget.value] || t('chat.singleChat.settings.toast.upload'))

  // ================================================================================================
  // 4. 逻辑方法 (Methods)
  // ================================================================================================

  // --- User Persona Logic ---
  const loadUserPersonaUI = (id) => {
    if (id === 'new') {
      formState.userPersonaNameInput = ''
      formState.userPersonaDescInput = ''
      formState.userPersonaAvatar = ''
      formState.userVideoImg = ''
      return
    }

    let persona = singleStore.userPersonas.find(p => p.id === id)
    if (!persona) {
      if (formState.currentUserPersonaId !== 'new') {
        formState.currentUserPersonaId = 'new'
      }
    } else {
      formState.userPersonaNameInput = persona.name
      formState.userPersonaDescInput = persona.description || ''
      formState.userPersonaAvatar = persona.avatar || ''
      formState.userVideoImg = persona.videoImg || ''
    }
  }

  const saveUserPersona = () => {
    const name = formState.userPersonaNameInput.trim()
    if (!name) return themeStore.showToast(t('chat.singleChat.settings.toast.personaNameRequired'), 'error')
    
    const isNew = formState.currentUserPersonaId === 'new'
    
    const newPersona = {
      id: isNew ? Date.now().toString() : formState.currentUserPersonaId,
      name, 
      description: formState.userPersonaDescInput, 
      avatar: formState.userPersonaAvatar, 
      videoImg: formState.userVideoImg,
      isDefault: singleStore.userPersonas.length === 0
    }

    if (isNew) {
      singleStore.userPersonas.push(newPersona)
      formState.currentUserPersonaId = newPersona.id
      themeStore.showToast(t('chat.singleChat.settings.toast.personaSaved'))
    } else {
      const index = singleStore.userPersonas.findIndex(p => p.id === formState.currentUserPersonaId)
      if (index !== -1) {
        newPersona.isDefault = singleStore.userPersonas[index].isDefault
        singleStore.userPersonas[index] = newPersona
        themeStore.showToast(t('chat.singleChat.settings.toast.personaUpdated'))
      }
    }
    singleStore.saveData()
  }

  const deleteUserPersona = () => {
    if (formState.currentUserPersonaId === 'new') return
    
    themeStore.showConfirm(t('chat.singleChat.settings.toast.deletePersona'), t('chat.singleChat.settings.toast.confirmDeletePersona'), () => {
      singleStore.userPersonas = singleStore.userPersonas.filter(p => p.id !== formState.currentUserPersonaId)
      singleStore.characters.forEach(c => { if (c.userPersona === formState.currentUserPersonaId) c.userPersona = '' })
      formState.currentUserPersonaId = 'new'
      loadUserPersonaUI('new')
      singleStore.saveData()
    })
  }

  // --- Bubble Preset Logic ---
  const loadBubblePreset = (id) => {
    if (!id) return
    const preset = singleStore.bubblePresets.find(p => p.id === id)
    if (preset) {
      formState.bubbleCss = preset.css
      formState.bubbleFontSize = preset.fontSize
    }
  }

  const saveBubblePreset = () => {
    const name = prompt(t('chat.singleChat.settings.toast.presetNameRequired'))
    if (!name) return
    const newPreset = { id: Date.now().toString(), name, css: formState.bubbleCss, fontSize: formState.bubbleFontSize }
    singleStore.bubblePresets.push(newPreset)
    singleStore.saveData()
    formState.currentBubblePresetId = newPreset.id
    themeStore.showToast(t('chat.singleChat.settings.toast.presetSaved'))
  }

  const deleteBubblePreset = () => {
    if (!formState.currentBubblePresetId) return
    themeStore.showConfirm(t('chat.singleChat.settings.toast.deleteBubblePreset'), t('chat.singleChat.settings.toast.confirmDeleteBubblePreset'), () => {
      singleStore.bubblePresets = singleStore.bubblePresets.filter(p => p.id !== formState.currentBubblePresetId)
      singleStore.saveData()
      formState.currentBubblePresetId = ''
      themeStore.showToast(t('chat.singleChat.settings.toast.presetDeleted'))
    })
  }

  // --- Image Upload Logic ---
  const handleImagePreview = (image) => {
    const url = image.content
    const target = currentUploadTarget.value

    switch (target) {
      case 'avatar':
        if (character.value) character.value.avatar = url
        break
      case 'userPersonaAvatar':
        formState.userPersonaAvatar = url
        break
      case 'chatBg':
        formState.chatBackground = url
        break
      case 'videoBg':
        formState.videoBg = url
        break
      case 'userVideoImg':
        formState.userVideoImg = url
        break
    }
  }

  const handleImageUploadConfirm = (image) => {
    const url = image.content
    const target = currentUploadTarget.value

    const updates = {
      avatar: { obj: character.value, key: 'avatar', toast: t('chat.singleChat.settings.toast.avatarUpdated') },
      chatBg: { obj: character.value, key: 'chatBackground', toast: t('chat.singleChat.settings.toast.backgroundUpdated'), localKey: 'chatBackground' },
      videoBg: { obj: character.value, key: 'videoBg', toast: t('chat.singleChat.settings.toast.charImageUpdated'), localKey: 'videoBg' },
      userPersonaAvatar: { obj: null, key: 'userPersonaAvatar', toast: t('chat.singleChat.settings.toast.avatarUpdated') },
      userVideoImg: { obj: null, key: 'userVideoImg', toast: t('chat.singleChat.settings.toast.userImageUpdated') },
    }

    if (updates[target]) {
      const updateInfo = updates[target]
      if (updateInfo.obj) {
        updateInfo.obj[updateInfo.key] = url
        if (updateInfo.localKey) formState[updateInfo.localKey] = url
      } else {
        if (target === 'userPersonaAvatar') formState.userPersonaAvatar = url
        if (target === 'userVideoImg') formState.userVideoImg = url
      }
      singleStore.saveData()
      themeStore.showToast(updateInfo.toast)
    }
    
    showImageUploadModal.value = false
  }

  const applyBgToAll = () => {
    if (!formState.chatBackground) return themeStore.showToast(t('chat.singleChat.settings.toast.noBgToApply'))
    themeStore.showConfirm(t('chat.singleChat.settings.toast.applyBgToAll'), t('chat.singleChat.settings.toast.confirmApplyBgToAll'), () => {
      singleStore.applyChatBackgroundToAll(formState.chatBackground)
      themeStore.showToast(t('chat.singleChat.settings.toast.appliedToAll'))
    })
  }

  const clearChatBackground = () => {
    if (!formState.chatBackground) {
      themeStore.showToast('当前没有聊天背景')
      return
    }
    themeStore.showConfirm('清除背景', '你确定要清除当前背景吗？', () => {
      formState.chatBackground = ''
      if (character.value) {
        character.value.chatBackground = ''
        singleStore.saveData()
        themeStore.showToast('背景已清除')
      }
    })
  }

  // --- Mode & Summary Logic ---
  const setMode = (online) => {
    formState.isOnline = online
    const [min, max] = online ? ['20', '80'] : ['150', '300']
    formState.replyLengthMin = min
    formState.replyLengthMax = max
    
    if (character.value) {
      character.value.isOnline = online
      singleStore.saveData()
      themeStore.showToast(`${online ? t('chat.singleChat.settings.online') : t('chat.singleChat.settings.offline')}模式已开启`, 'success')
    }
  }

  const triggerManualSummary = () => { showSummaryModal.value = true }
  const openRangeInputModal = () => { showSummaryModal.value = false; showRangeInputModal.value = true }

  const handleSummarizeRecent = async () => {
    showSummaryModal.value = false
    themeStore.showToast('正在总结中，请稍候...', 'loading', 0)
    const result = await singleStore.summarizeMessages(props.id, { type: 'recent' })
    themeStore.hideToast()
    themeStore.showToast(result.message, result.success ? 'success' : 'error')
  }

  const handleSummarizeRange = async () => {
    const [startStr, endStr] = summaryRangeInput.value.split('-').map(s => s.trim())
    const start = parseInt(startStr, 10)
    const end = parseInt(endStr, 10)

    if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
      themeStore.showToast(t('chat.singleChat.settings.toast.invalidRange'), 'error')
      return
    }

    showRangeInputModal.value = false
    themeStore.showToast('正在总结中，请稍候...', 'loading', 0)
    const result = await singleStore.summarizeMessages(props.id, { type: 'range', start, end })
    themeStore.hideToast()
    themeStore.showToast(result.message, result.success ? 'success' : 'error')
    if (result.success) {
      summaryRangeInput.value = ''
    }
  }

  const handleSummarizeVideo = async () => {
    showSummaryModal.value = false
    themeStore.showToast('正在总结中，请稍候...', 'loading', 0)
    const result = await singleStore.summarizeMessages(props.id, { type: 'video' })
    themeStore.hideToast()
    themeStore.showToast(result.message, result.success ? 'success' : 'error')
  }

  // --- Real-time Sense Logic ---
  const mapLocation = async (type) => {
    const real = type === 'char' ? formState.charLocationReal : formState.userLocationReal
    const virtual = type === 'char' ? formState.charLocationVirtual : formState.userLocationVirtual
    
    const data = await fetchLocationWeather(real, virtual)
    if (data) {
      if (type === 'char') {
        formState.charLocationData = data
        formState.charLocationDisplay = data.shortDisplay
      } else {
        formState.userLocationData = data
        formState.userLocationDisplay = data.shortDisplay
      }
      themeStore.showToast('位置和天气信息已更新', 'success')
    }
  }

  // --- Scope Logic ---
  const toggleNpcScope = (id) => {
    const index = formState.linkedNpcs.indexOf(id)
    if (index > -1) formState.linkedNpcs.splice(index, 1)
    else formState.linkedNpcs.push(id)
    formState.npcCount = formState.linkedNpcs.length
  }

  const toggleCharScope = (id) => {
    const index = formState.linkedCharacters.indexOf(id)
    if (index > -1) formState.linkedCharacters.splice(index, 1)
    else formState.linkedCharacters.push(id)
    formState.linkedCharCount = formState.linkedCharacters.length
  }

  // --- Danger Zone Logic ---
  const handleBlockOrUnblock = () => {
    if (formState.isBlocked) {
      formState.isBlocked = false
      saveSettings()
      themeStore.showToast(t('chat.singleChat.settings.toast.unblocked'))
    } else {
      themeStore.showConfirm(
        t('chat.singleChat.settings.confirmBlockTitle', { name: charName.value }),
        t('chat.singleChat.settings.confirmBlockMsg', { name: charName.value }),
        () => {
          formState.isBlocked = true
          saveSettings()
          themeStore.showToast(t('chat.singleChat.settings.toast.blocked'))
        },
        { messageStyle: { color: '#FF3B30', whiteSpace: 'pre-wrap' }, confirmText: 'chat.singleChat.settings.block' }
      )
    }
  }

  const handleClearHistory = () => {
    themeStore.showConfirm(
      t('chat.singleChat.settings.confirmClearTitle'),
      t('chat.singleChat.settings.confirmClearMsg', { name: charName.value }),
      () => {
        singleStore.clearChatHistory(props.id)
        themeStore.showToast(t('chat.singleChat.settings.toast.historyCleared'))
        formState.msgCount = 0
        formState.tokenCount = 0
      },
      { messageStyle: { whiteSpace: 'pre-wrap', color: '#FF3B30' }, confirmText: 'chat.singleChat.settings.clear' }
    )
  }

  const handleDeleteCharacter = () => {
    themeStore.showConfirm(
      t('chat.deleteCharacterTitle'),
      t('chat.deleteCharacterConfirm', { name: charName.value }),
      () => {
        singleStore.deleteCharacter(props.id)
        themeStore.showToast(t('chat.toast.deleteSuccess'), 'success')
        router.back()
        router.push({ name: 'chat-list' })
      },
      { messageStyle: { whiteSpace: 'pre-wrap', color: '#FF3B30' }, confirmText: 'delete' }
    )
  }

  // --- Load & Save ---
  const loadSettings = () => {
    const char = character.value
    if (!char) return

    // 1. Role Info
    formState.charNameInput = char.name
    formState.charNicknameInput = char.nickname || ''
    formState.charPersonaInput = char.charPersona || ''
    
    // 2. User Info
    const existingPersona = singleStore.userPersonas.find(p => p.id === char.userPersona)
    formState.currentUserPersonaId = existingPersona ? existingPersona.id : 'new'
    loadUserPersonaUI(formState.currentUserPersonaId)
    
    // 3. Background Activity
    formState.backgroundActivityOverride = char.backgroundActivityOverride || 'default'
    formState.proactiveInterval = char.proactiveInterval || 5
    formState.proactiveCooldown = char.proactiveCooldown || 30
    formState.proactiveDailyLimit = char.proactiveDailyLimit || 10
    formState.triggerMode = char.triggerMode || 'always'
    formState.proactiveIdleTime = char.proactiveIdleTime || 15
    
    // 4. Mode Settings
    formState.isOnline = char.isOnline !== false
    formState.preset = Array.isArray(char.preset) ? char.preset : (char.preset ? [char.preset] : [])
    formState.worldbook = char.worldbook || []
    const [min, max] = (char.replyLength || (formState.isOnline ? '20-80' : '150-300')).split('-')
    formState.replyLengthMin = min || ''
    formState.replyLengthMax = max || ''

    // Real-time Sense
    const rts = char.realtimeSettings || { timeEnabled: false, weatherEnabled: false, charLocation: {}, userLocation: {} }
    formState.realtimeTimeEnabled = rts.timeEnabled
    formState.realtimeWeatherEnabled = rts.weatherEnabled
    formState.charLocationData = rts.charLocation || {}
    formState.userLocationData = rts.userLocation || {}
    formState.charLocationReal = formState.charLocationData.real || ''
    formState.charLocationVirtual = formState.charLocationData.virtual || ''
    formState.charLocationDisplay = formState.charLocationData.shortDisplay || ''
    formState.userLocationReal = formState.userLocationData.real || ''
    formState.userLocationVirtual = formState.userLocationData.virtual || ''
    formState.userLocationDisplay = formState.userLocationData.shortDisplay || ''
    
    // 5. Summary Settings
    formState.summaryRange = char.summaryRange || 20
    formState.summaryPrompt = char.summaryPrompt || ''
    formState.autoSummary = char.autoSummary || false
    formState.memoryCount = char.memoryCount || 10
    
    // 6. Beautification
    const bubbleSettings = char.bubbleSettings || {}
    formState.bubbleCss = bubbleSettings.css || ''
    formState.bubbleFontSize = bubbleSettings.fontSize || 14
    formState.chatBackground = char.chatBackground || ''
    
    // 7. Video Call
    formState.videoBg = char.videoBg || ''
    formState.userVideoImg = char.userVideoImg || ''
    
    // 8. Advanced & Stats
    formState.apiConfig = char.api || 'default'
    formState.linkedNpcs = char.linkedNpcs || []
    formState.npcCount = formState.linkedNpcs.length
    formState.linkedCharacters = char.linkedCharacters || []
    formState.linkedCharCount = formState.linkedCharacters.length
    formState.isBlocked = char.isBlocked || false
    const messages = singleStore.messages[props.id] || []
    formState.msgCount = messages.length
    formState.tokenCount = Math.ceil(messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) * 1.5)
  }

  const saveSettings = () => {
    const char = character.value
    if (!char) return

    // User Persona Save Logic
    const personaId = formState.currentUserPersonaId
    let persona = singleStore.userPersonas.find(p => p.id === personaId)

    if (personaId === 'default') {
      if (!persona) {
        persona = { id: 'default', name: t('chat.singleChat.settings.defaultUserPersona'), avatar: '', description: '', videoImg: '' }
        singleStore.userPersonas.unshift(persona)
      }
    }
    
    if (persona) {
      if (persona.id !== 'default' && formState.userPersonaNameInput.trim()) {
        persona.name = formState.userPersonaNameInput.trim()
      }
      persona.description = formState.userPersonaDescInput
      persona.avatar = formState.userPersonaAvatar
      persona.videoImg = formState.userVideoImg
    }

    // Sync location input values
    formState.charLocationData.real = formState.charLocationReal
    formState.charLocationData.virtual = formState.charLocationVirtual
    formState.userLocationData.real = formState.userLocationReal
    formState.userLocationData.virtual = formState.userLocationVirtual

    Object.assign(char, {
      name: formState.charNameInput.trim() || char.name,
      nickname: formState.charNicknameInput.trim(),
      charPersona: formState.charPersonaInput,
      userPersona: formState.currentUserPersonaId,
      backgroundActivityOverride: formState.backgroundActivityOverride,
      proactiveInterval: formState.proactiveInterval,
      proactiveCooldown: formState.proactiveCooldown,
      proactiveDailyLimit: formState.proactiveDailyLimit,
      triggerMode: formState.triggerMode,
      proactiveIdleTime: formState.proactiveIdleTime,
      isOnline: formState.isOnline,
      preset: formState.preset,
      worldbook: formState.worldbook,
      replyLength: `${formState.replyLengthMin}-${formState.replyLengthMax}`,
      realtimeSettings: {
        timeEnabled: formState.realtimeTimeEnabled,
        weatherEnabled: formState.realtimeWeatherEnabled,
        charLocation: formState.charLocationData,
        userLocation: formState.userLocationData
      },
      summaryRange: formState.summaryRange,
      summaryPrompt: formState.summaryPrompt,
      autoSummary: formState.autoSummary,
      memoryCount: formState.memoryCount,
      bubbleSettings: { css: formState.bubbleCss, fontSize: formState.bubbleFontSize },
      chatBackground: formState.chatBackground,
      videoBg: formState.videoBg,
      api: formState.apiConfig,
      linkedNpcs: formState.linkedNpcs,
      linkedCharacters: formState.linkedCharacters,
      isBlocked: formState.isBlocked,
    })
    singleStore.saveData()
    themeStore.showToast(t('theme.toast.saveSuccess'))
  }

  // Watchers
  watch(() => formState.currentUserPersonaId, (newId) => { if (newId) loadUserPersonaUI(newId) })
  watch(() => formState.currentBubblePresetId, (newId) => { if (newId) loadBubblePreset(newId) })

  return {
    t,
    singleStore,
    themeStore,
    backgroundStore,
    sortedWorldBooks,
    sortedPresets,
    collapsedStates,
    showImageUploadModal,
    currentUploadTarget,
    showSummaryModal,
    showRangeInputModal,
    summaryRangeInput,
    showNpcScopeModal,
    showCharScopeModal,
    formState,
    character,
    charName,
    charAvatar,
    userPersonaOptions,
    apiConfigOptions,
    bubblePresetOptions,
    availableCharacters,
    isBackgroundActivityEffective,
    previewStyle,
    uploadModalTitle,
    loadSettings,
    saveSettings,
    saveUserPersona,
    deleteUserPersona,
    saveBubblePreset,
    deleteBubblePreset,
    handleImagePreview,
    handleImageUploadConfirm,
    applyBgToAll,
    clearChatBackground,
    setMode,
    triggerManualSummary,
    openRangeInputModal,
    handleSummarizeRecent,
    handleSummarizeRange,
    handleSummarizeVideo,
    mapLocation,
    toggleNpcScope,
    toggleCharScope,
    handleBlockOrUnblock,
    handleClearHistory,
    handleDeleteCharacter
  }
}
