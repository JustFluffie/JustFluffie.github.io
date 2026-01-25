<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.mode') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="modeSettings">
        <div class="card-content">
          <div class="settings-pure-item">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.modeSelect') }}</div>
            <div class="mode-selector">
              <div class="mode-option" :class="{ active: formState.isOnline }" @click="setMode(true)">{{ t('chat.singleChat.settings.online') }}</div>
              <div class="mode-option" :class="{ active: !formState.isOnline }" @click="setMode(false)">{{ t('chat.singleChat.settings.offline') }}</div>
            </div>
          </div>
          <div class="settings-pure-item" v-if="!formState.isOnline">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.linkPreset') }}</div>
            <MultiSelect v-model="formState.preset" :options="sortedPresets" labelKey="title" valueKey="id" childrenKey="entries" textAlign="right" selectorWidth="auto" dropdownWidth="200px" />
          </div>
          <div class="settings-pure-item">
            <div class="settings-pure-label">{{ t('chat.singleChat.settings.linkWorldbook') }}</div>
            <MultiSelect v-model="formState.worldbook" :options="sortedWorldBooks" label-key="title" value-key="id" children-key="entries" textAlign="right" selectorWidth="auto" dropdownWidth="200px" />
          </div>
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.replyLength') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.replyLengthDesc') }}</div></div>
            <div class="reply-length-container">
              <input type="number" v-model="formState.replyLengthMin" class="base-input base-input-mini" :placeholder="t('chat.singleChat.settings.min')">
              <span>-</span>
              <input type="number" v-model="formState.replyLengthMax" class="base-input base-input-mini" :placeholder="t('chat.singleChat.settings.max')">
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '@/components/common/SvgIcon.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const { t, formState, sortedPresets, sortedWorldBooks, setMode } = props.settings

const collapsed = computed(() => props.settings.collapsedStates.modeSettings)
const toggleCollapse = () => {
  props.settings.collapsedStates.modeSettings = !props.settings.collapsedStates.modeSettings
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.settings-pure-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.settings-pure-label { font-size: 14px; color: #333; }

.mode-selector { display: flex; background: #f0f0f0; border-radius: 6px; padding: 2px; }
.mode-option { padding: 4px 12px; font-size: 12px; border-radius: 4px; cursor: pointer; color: #666; transition: all 0.2s; }
.mode-option.active { background: #fff; color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 500; }

.settings-item-input { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
.label-col { display: flex; flex-direction: column; }
.label-main { font-size: 14px; color: #333; }
.label-sub { font-size: 11px; color: #999; margin-top: 2px; }

.reply-length-container { display: flex; align-items: center; gap: 5px; }
.base-input-mini { width: 60px; text-align: center; }
</style>
