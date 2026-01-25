<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.summary') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="summarySettings">
        <div class="card-content">
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.summaryRange') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.summaryRangeDesc') }}</div></div>
            <input type="number" v-model.number="formState.summaryRange" class="base-input base-input-short" placeholder="20">
          </div>
          <div class="form-item-vertical">
             <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.summaryPrompt') }}</div>
             <textarea v-model="formState.summaryPrompt" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.summaryPromptPlaceholder')"></textarea>
          </div>
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.autoSummary') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.autoSummaryDesc') }}</div></div>
            <div class="toggle-switch" :class="{ active: formState.autoSummary }" @click="formState.autoSummary = !formState.autoSummary"></div>
          </div>
          <div class="settings-btn-row flex-distribute-children" style="padding: 15px 0; border-bottom: 1px solid #f5f5f5;">
            <button class="btn btn-secondary" @click="triggerManualSummary">{{ t('chat.singleChat.settings.manualSummary') }}</button>
            <button class="btn btn-secondary" @click="openMemoryBank">{{ t('chat.singleChat.settings.viewSummary') }}</button>
          </div>
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.contextMemory') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.contextMemoryDesc') }}</div></div>
            <input type="number" v-model.number="formState.memoryCount" class="base-input base-input-short" placeholder="10">
          </div>
          <div class="settings-pure-item">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.apiConfig') }}</div>
            <CustomSelect :options="apiConfigOptions" v-model="formState.apiConfig" />
          </div>
          <div class="settings-pure-item">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.tokenCount') }}</div><div class="settings-pure-value">{{ formState.tokenCount }}</div>
          </div>
          <div class="settings-pure-item">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.msgCount') }}</div><div class="settings-pure-value">{{ formState.msgCount }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import SvgIcon from '@/components/common/SvgIcon.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  },
  charId: {
    type: String,
    required: true
  }
})

const { t, formState, apiConfigOptions, triggerManualSummary } = props.settings
const router = useRouter()

const collapsed = props.settings.collapsedStates.summarySettings
const toggleCollapse = () => {
  props.settings.collapsedStates.summarySettings = !props.settings.collapsedStates.summarySettings
}

const openMemoryBank = () => {
  router.push({ name: 'memory-bank', params: { charId: props.charId } })
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.settings-item-input { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
.label-col { display: flex; flex-direction: column; }
.label-main { font-size: 14px; color: #333; }
.label-sub { font-size: 11px; color: #999; margin-top: 2px; }

.form-item-vertical { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }

.settings-btn-row { display: flex; gap: 10px; }
.flex-distribute-children { justify-content: space-between; }
.flex-distribute-children > * { flex: 1; }

.settings-pure-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.settings-pure-label { font-size: 14px; color: #333; }
.settings-pure-value { font-size: 14px; color: #666; }
</style>
