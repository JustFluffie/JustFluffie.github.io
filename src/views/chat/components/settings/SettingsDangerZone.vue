<template>
  <div class="danger-zone">
    <button class="btn btn-danger big-btn" @click="handleBlockOrUnblock">
      <div class="danger-btn-content">
        <div class="danger-btn-title">{{ formState.isBlocked ? t('chat.singleChat.settings.unblock') : t('chat.singleChat.settings.blockCharacter') }}</div>
        <div class="danger-btn-desc">{{ t('chat.singleChat.settings.blockCharacterDesc') }}</div>
      </div>
    </button>
    <button class="btn btn-danger big-btn" @click="handleClearHistory">
      <div class="danger-btn-content">
        <div class="danger-btn-title">{{ t('chat.singleChat.settings.clearHistory') }}</div>
        <div class="danger-btn-desc">{{ t('chat.singleChat.settings.clearHistoryDesc') }}</div>
      </div>
    </button>
    <button class="btn btn-danger big-btn" @click="handleDeleteCharacter">
      <div class="danger-btn-content">
        <div class="danger-btn-title">{{ t('chat.deleteCharacterTitle') }}</div>
        <div class="danger-btn-desc">{{ t('chat.deleteCharacterWarning') }}</div>
      </div>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const { t, formState, handleBlockOrUnblock, handleClearHistory, handleDeleteCharacter } = props.settings
</script>

<style scoped>
.danger-zone {
  margin-bottom: 10px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.danger-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.danger-btn-title {
  font-size: 16px;
  font-weight: 600;
}
.danger-btn-desc {
  font-size: 12px;
  opacity: 0.85;
  font-weight: normal;
}
</style>
