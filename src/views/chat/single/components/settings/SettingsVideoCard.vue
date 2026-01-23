<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.videoCall') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="videoSettings">
        <div class="card-content">
          <div class="video-settings-container">
            <div class="video-setting-col">
               <div class="settings-item-label center">{{ t('chat.singleChat.settings.characterImage') }}</div>
               <div class="video-preview" @click="openVideoBgModal">
                  <img v-if="formState.videoBg" :src="formState.videoBg" class="bg-img">
                  <div v-else class="default-avatar bg-placeholder">{{ t('chat.singleChat.settings.setImage') }}</div>
               </div>
            </div>
            <div class="video-setting-col">
               <div class="settings-item-label center">{{ t('chat.singleChat.settings.userImage') }}</div>
               <div class="video-preview" @click="openUserVideoImgModal">
                  <img v-if="formState.userVideoImg" :src="formState.userVideoImg" class="bg-img">
                  <div v-else class="default-avatar bg-placeholder">{{ t('chat.singleChat.settings.setImage') }}</div>
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

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const { t, formState } = props.settings

const collapsed = props.settings.collapsedStates.videoSettings
const toggleCollapse = () => {
  props.settings.collapsedStates.videoSettings = !props.settings.collapsedStates.videoSettings
}

const openVideoBgModal = () => {
  props.settings.currentUploadTarget.value = 'videoBg'
  props.settings.showImageUploadModal.value = true
}

const openUserVideoImgModal = () => {
  props.settings.currentUploadTarget.value = 'userVideoImg'
  props.settings.showImageUploadModal.value = true
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.video-settings-container { display: flex; gap: 15px; justify-content: space-between; }
.video-setting-col { flex: 1; display: flex; flex-direction: column; align-items: center; }
.settings-item-label.center { text-align: center; width: 100%; }
.video-preview {
    width: 100%; aspect-ratio: 9/16; background: #f0f0f0; border-radius: 8px;
    overflow: hidden; cursor: pointer; display: flex; align-items: center;
    justify-content: center; position: relative;
}
.video-preview .bg-img { width: 100%; height: 100%; object-fit: cover; }
.bg-placeholder { font-size: 12px; color: #999; }
</style>
