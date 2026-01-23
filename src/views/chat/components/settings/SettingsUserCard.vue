<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.userInfo') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="userInfo">
        <div class="card-content">
          <div class="settings-pure-item" style="border-bottom: none;">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.currentUserPersona') }}</div>
            <CustomSelect :options="userPersonaOptions" v-model="formState.currentUserPersonaId" />
          </div>
          <div class="user-header-layout">
            <div class="user-avatar-wrapper" @click="openUserAvatarModal">
              <img v-if="formState.userPersonaAvatar" :src="formState.userPersonaAvatar" alt="User" class="role-avatar-img">
              <div v-else class="role-avatar-placeholder">{{ t('chat.singleChat.settings.uploadAvatar') }}</div>
            </div>
            <div class="user-inputs-wrapper">
              <div class="user-actions-row">
                <button class="btn btn-secondary btn-mini-grow" @click="saveUserPersona">{{ t('chat.singleChat.settings.savePersona') }}</button>
                <button class="btn btn-danger btn-mini-grow" @click="deleteUserPersona">{{ t('chat.singleChat.settings.deletePersona') }}</button>
              </div>
              <input type="text" v-model="formState.userPersonaNameInput" class="base-input" :placeholder="t('chat.singleChat.settings.userNamePlaceholder')">
            </div>
          </div>
          <div class="form-item-vertical">
             <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.userPersona') }}</div>
             <textarea v-model="formState.userPersonaDescInput" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.userPersonaPlaceholder')"></textarea>
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

const { t, formState, userPersonaOptions, saveUserPersona, deleteUserPersona } = props.settings

const collapsed = props.settings.collapsedStates.userInfo
const toggleCollapse = () => {
  props.settings.collapsedStates.userInfo = !props.settings.collapsedStates.userInfo
}

const openUserAvatarModal = () => {
  props.settings.currentUploadTarget.value = 'userPersonaAvatar'
  props.settings.showImageUploadModal.value = true
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.settings-pure-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.settings-pure-label { font-size: 14px; color: #333; }

.user-header-layout { display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start; }
.user-avatar-wrapper {
    width: 90px; height: 90px; border-radius: 8px; background-color: #f0f0f0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    overflow: hidden; flex-shrink: 0; position: relative;
}
.role-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.role-avatar-placeholder { font-size: 12px; color: #999; text-align: center; padding: 5px; }
.user-inputs-wrapper {
    flex: 1; display: flex; flex-direction: column; gap: 10px;
    height: 90px; justify-content: space-between;
}
.user-actions-row { display: flex; gap: 10px; }
.btn-mini-grow { flex: 1; padding: 6px 0; font-size: 13px; }
.form-item-vertical { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.label-main { font-size: 14px; color: #333; }
</style>
