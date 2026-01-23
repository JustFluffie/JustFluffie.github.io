<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>{{ t('chat.singleChat.settings.backgroundActivity') }}</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <div class="card-title-remark">{{ t('chat.singleChat.settings.backgroundActivityWarning') }}</div>
    <transition name="collapse">
      <div v-if="!collapsed" key="backgroundActivity">
        <div class="card-content">
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.globalSettings') }}</div></div>
            <div class="settings-pure-value">{{ backgroundStore.globalBackgroundActivity ? t('chat.singleChat.settings.globalOn') : t('chat.singleChat.settings.globalOff') }}</div>
          </div>
          <div class="settings-item-input">
            <div class="label-col">
              <div class="label-main">{{ t('chat.singleChat.settings.overrideGlobal') }}</div>
              <div class="label-sub">{{ t('chat.singleChat.settings.overrideGlobalDesc') }}</div>
            </div>
            <div class="mode-selector">
              <div class="mode-option" :class="{ active: formState.backgroundActivityOverride === 'default' }" @click="formState.backgroundActivityOverride = 'default'">{{ t('chat.singleChat.settings.default') }}</div>
              <div class="mode-option" :class="{ active: formState.backgroundActivityOverride === 'on' }" @click="formState.backgroundActivityOverride = 'on'">{{ t('chat.singleChat.settings.on') }}</div>
              <div class="mode-option" :class="{ active: formState.backgroundActivityOverride === 'off' }" @click="formState.backgroundActivityOverride = 'off'">{{ t('chat.singleChat.settings.off') }}</div>
            </div>
          </div>
          <div v-if="isBackgroundActivityEffective">
            <div class="settings-item-input">
              <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.interval') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.intervalDesc') }}</div></div>
              <input type="number" v-model.number="formState.proactiveInterval" class="base-input base-input-short" placeholder="5">
            </div>
            <div class="settings-item-input">
              <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.cooldown') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.cooldownDesc') }}</div></div>
              <input type="number" v-model.number="formState.proactiveCooldown" class="base-input base-input-short" placeholder="30">
            </div>
            <div class="settings-item-input">
              <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.dailyLimit') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.dailyLimitDesc') }}</div></div>
              <input type="number" v-model.number="formState.proactiveDailyLimit" class="base-input base-input-short" placeholder="10">
            </div>
            <div class="settings-item-input">
              <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.triggerMode') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.triggerModeDesc') }}</div></div>
              <div class="mode-selector">
                <div class="mode-option" :class="{ active: formState.triggerMode === 'idle' }" @click="formState.triggerMode = 'idle'">{{ t('chat.singleChat.settings.idleMode') }}</div>
                <div class="mode-option" :class="{ active: formState.triggerMode === 'always' }" @click="formState.triggerMode = 'always'">{{ t('chat.singleChat.settings.alwaysMode') }}</div>
              </div>
            </div>
            <div class="settings-item-input" v-if="formState.triggerMode === 'idle'">
              <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.idleTime') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.idleTimeDesc') }}</div></div>
              <input type="number" v-model.number="formState.proactiveIdleTime" class="base-input base-input-short" placeholder="15">
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

const { t, formState, backgroundStore, isBackgroundActivityEffective } = props.settings

const collapsed = props.settings.collapsedStates.backgroundActivity
const toggleCollapse = () => {
  props.settings.collapsedStates.backgroundActivity = !props.settings.collapsedStates.backgroundActivity
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }
.card-title-remark { font-size: 12px; color: #FF3B30; padding: 0 18px 10px; margin-top: -10px; }

.settings-item-input { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
.label-col { display: flex; flex-direction: column; }
.label-main { font-size: 14px; color: #333; }
.label-sub { font-size: 11px; color: #999; margin-top: 2px; }
.settings-pure-value { font-size: 14px; color: #666; }

.mode-selector { display: flex; background: #f0f0f0; border-radius: 6px; padding: 2px; }
.mode-option { padding: 4px 12px; font-size: 12px; border-radius: 4px; cursor: pointer; color: #666; transition: all 0.2s; }
.mode-option.active { background: #fff; color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-weight: 500; }
</style>
