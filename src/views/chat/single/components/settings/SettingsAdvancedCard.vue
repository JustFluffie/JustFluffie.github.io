<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.advanced') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="advancedSettings">
        <div class="card-content">
          <div class="settings-pure-item" @click="showNpcScopeModal.value = true">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.linkedNpc') }}</div>
            <div class="settings-pure-value">{{ t('chat.singleChat.settings.npcCount', { count: formState.npcCount }) }}</div>
            <div class="settings-pure-arrow">›</div>
          </div>
          <div class="settings-pure-item" @click="showCharScopeModal.value = true">
            <div class="settings-pure-label">关联角色</div>
            <div class="settings-pure-value">{{ formState.linkedCharCount }}个</div>
            <div class="settings-pure-arrow">›</div>
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

const { t, formState, showNpcScopeModal, showCharScopeModal } = props.settings

const collapsed = props.settings.collapsedStates.advancedSettings
const toggleCollapse = () => {
  props.settings.collapsedStates.advancedSettings = !props.settings.collapsedStates.advancedSettings
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.settings-pure-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; cursor: pointer; }
.settings-pure-label { font-size: 14px; color: #333; }
.settings-pure-value { font-size: 14px; color: #666; }
.settings-pure-arrow { font-size: 18px; color: #ccc; margin-left: 10px; }
</style>
