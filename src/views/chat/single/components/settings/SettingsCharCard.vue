<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.roleInfo') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="roleInfo">
        <div class="card-content">
          <div class="role-header-layout">
            <div class="role-avatar-wrapper" @click="openAvatarModal">
              <img v-if="charAvatar" :src="charAvatar" alt="头像" class="role-avatar-img">
              <div v-else class="role-avatar-placeholder">{{ t('chat.singleChat.settings.uploadAvatar') }}</div>
            </div>
            <div class="role-inputs-wrapper">
              <input type="text" v-model="formState.charNameInput" class="base-input" :placeholder="t('chat.singleChat.settings.roleNamePlaceholder')">
              <input type="text" v-model="formState.charNicknameInput" class="base-input" :placeholder="t('chat.singleChat.settings.roleNicknamePlaceholder')">
            </div>
          </div>
          <div class="form-item-vertical">
             <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.rolePersona') }}</div>
             <textarea v-model="formState.charPersonaInput" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.rolePersonaPlaceholder')"></textarea>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import SvgIcon from '@/components/common/SvgIcon.vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const { t, collapsedStates, formState, charAvatar, currentUploadTarget, showImageUploadModal } = props.settings

const collapsed =  props.settings.collapsedStates.roleInfo
const toggleCollapse = () => {
  props.settings.collapsedStates.roleInfo = !props.settings.collapsedStates.roleInfo
}

const openAvatarModal = () => {
  props.settings.currentUploadTarget.value = 'avatar'
  props.settings.showImageUploadModal.value = true
}
</script>

<style scoped>
/* 复用原文件样式 */
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.role-header-layout { display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start; }
.role-avatar-wrapper {
    width: 90px; height: 90px; border-radius: 8px; background-color: #f0f0f0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    overflow: hidden; flex-shrink: 0; position: relative;
}
.role-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.role-avatar-placeholder { font-size: 12px; color: #999; text-align: center; padding: 5px; }
.role-inputs-wrapper {
    flex: 1; display: flex; flex-direction: column; gap: 10px;
    height: 90px; justify-content: space-between;
}
.form-item-vertical { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.label-main { font-size: 14px; color: #333; }
</style>
