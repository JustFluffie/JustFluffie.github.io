<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.beautification') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="bubbleSettings">
        <div class="card-content">
          <div class="settings-section-title">{{ t('chat.singleChat.settings.bubble') }}</div>
          <div class="settings-row-group">
              <div class="settings-pure-label" style="width: 60px;">{{ t('chat.singleChat.settings.bubblePreset') }}</div>
              <div style="flex: 1; margin: 0 10px;">
                  <CustomSelect :options="bubblePresetOptions" v-model="formState.currentBubblePresetId" />
              </div>
              <div class="btn-group-mini">
                  <button class="btn btn-secondary btn-mini" @click="saveBubblePreset">{{ t('save') }}</button>
                  <button class="btn btn-danger btn-mini" :disabled="!formState.currentBubblePresetId" @click="deleteBubblePreset">{{ t('delete') }}</button>
              </div>
          </div>
          <div class="bubble-preview-container">
            <div class="bubble-preview-area">
                <div class="preview-msg-row left">
                  <div class="preview-avatar char">
                    <img v-if="charAvatar" :src="charAvatar" style="width:100%;height:100%;object-fit:cover;">
                    <div v-else class="default-avatar"></div>
                  </div>
                  <div class="preview-bubble char" :style="previewStyle">{{ t('chat.singleChat.settings.bubblePreview') }}</div>
                </div>
                <div class="preview-msg-row right">
                  <div class="preview-bubble user" :style="previewStyle">{{ t('chat.singleChat.settings.bubblePreview') }}</div>
                  <div class="preview-avatar user">
                    <img v-if="formState.userPersonaAvatar" :src="formState.userPersonaAvatar" style="width:100%;height:100%;object-fit:cover;">
                    <div v-else class="default-avatar"></div>
                  </div>
                </div>
            </div>
          </div>
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.fontSize') }}</div></div>
            <div class="slider-container gray-slider">
                <input type="range" v-model.number="formState.bubbleFontSize" min="10" max="30" step="1">
                <span class="slider-value">{{ formState.bubbleFontSize }}</span>
            </div>
          </div>
          <div class="form-item-vertical no-border">
             <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.bubbleCss') }}</div>
             <textarea v-model="formState.bubbleCss" class="base-input" :placeholder="t('chat.singleChat.settings.cssPlaceholder')" style="font-family: monospace; height: 120px;"></textarea>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-section-title">{{ t('chat.singleChat.settings.chatBackground') }}</div>
          <div class="settings-item-avatar" style="border-bottom: none; margin-bottom: 0;">
            <div class="avatar-layout">
              <div class="avatar-controls" style="width: 100%;">
                <button class="btn btn-secondary" @click="openChatBgModal">{{ t('chat.singleChat.settings.setChatBackground') }}</button>
                <button class="btn btn-secondary" @click="applyBgToAll" style="margin-top: 5px;">{{ t('chat.singleChat.settings.applyToAll') }}</button>
                <button class="btn btn-danger" @click="clearChatBackground" style="margin-top: 5px;">清除当前背景</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import SvgIcon from '@/components/common/SvgIcon.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const { t, formState, charAvatar, bubblePresetOptions, previewStyle, saveBubblePreset, deleteBubblePreset, applyBgToAll, clearChatBackground } = props.settings

const collapsed = props.settings.collapsedStates.bubbleSettings
const toggleCollapse = () => {
  props.settings.collapsedStates.bubbleSettings = !props.settings.collapsedStates.bubbleSettings
}

const openChatBgModal = () => {
  props.settings.currentUploadTarget.value = 'chatBg'
  props.settings.showImageUploadModal.value = true
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.settings-section-title { font-size: 13px; font-weight: bold; color: #666; margin: 5px 0 10px; }
.settings-row-group { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
.settings-pure-label { font-size: 14px; color: #333; }
.btn-group-mini { display: flex; gap: 5px; }
.btn-mini { padding: 4px 8px; font-size: 12px; }

.bubble-preview-container {
    padding: 15px; background: #f0f2f5; border-radius: 8px; margin-bottom: 15px;
    display: flex; flex-direction: column; height: 150px; overflow: hidden;
}
.bubble-preview-area { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
.preview-msg-row { display: flex; align-items: flex-end; gap: 8px; }
.preview-msg-row.left { justify-content: flex-start; }
.preview-msg-row.right { justify-content: flex-end; }
.preview-avatar { width: 36px; height: 36px; border-radius: 4px; background: #ddd; flex-shrink: 0; overflow: hidden; }
.preview-bubble { padding: 10px 14px; border-radius: 4px; max-width: 70%; position: relative; }
.preview-bubble.char { background: #fff; color: #333; }
.preview-bubble.char::before { content: ''; position: absolute; top: 12px; left: -6px; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-right: 7px solid white; }
.preview-bubble.user { background: #A9EA7A; color: #333; }
.preview-bubble.user::after { content: ''; position: absolute; top: 12px; right: -6px; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-left: 7px solid #A9EA7A; }

.settings-item-input { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
.label-col { display: flex; flex-direction: column; }
.label-main { font-size: 14px; color: #333; }

.slider-container { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end; }
.slider-container input[type=range] { flex: 1; max-width: 150px; }
.slider-value { font-size: 14px; color: #666; min-width: 24px; text-align: right; }

.form-item-vertical { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.form-item-vertical.no-border { border-bottom: none; }

.settings-divider { height: 1px; background-color: #f0f0f0; margin: 15px 0; }
.settings-item-avatar { border-bottom: none; margin-bottom: 0; }
.avatar-layout { display: flex; gap: 15px; }
.avatar-controls { flex: 1; display: flex; flex-direction: column; gap: 8px; }
</style>
