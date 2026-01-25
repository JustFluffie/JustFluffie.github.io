<template>
  <div class="card">
    <div class="card-title" @click="toggleCollapse">
      <span>实时感知</span>
      <div class="collapse-arrow" :class="{ collapsed: collapsed }">
        <svg-icon name="chevron-down" />
      </div>
    </div>
    <transition name="collapse">
      <div v-if="!collapsed" key="realtimeSense">
        <div class="card-content">
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">实时时间</div></div>
            <div class="toggle-switch" :class="{ active: formState.realtimeTimeEnabled }" @click="formState.realtimeTimeEnabled = !formState.realtimeTimeEnabled"></div>
          </div>
          <div class="settings-item-input">
            <div class="label-col"><div class="label-main">实时天气</div></div>
            <div class="toggle-switch" :class="{ active: formState.realtimeWeatherEnabled }" @click="formState.realtimeWeatherEnabled = !formState.realtimeWeatherEnabled"></div>
          </div>
          <transition name="collapse">
            <div v-if="formState.realtimeWeatherEnabled">
              <div class="form-item-vertical">
                <div class="label-main" style="margin-bottom:5px;">角色所在地</div>
                <div class="location-input-group">
                  <input type="text" v-model="formState.charLocationReal" class="base-input" placeholder="真实地名">
                  <input type="text" v-model="formState.charLocationVirtual" class="base-input" placeholder="虚拟地名 (可选)">
                  <button class="btn btn-secondary btn-sm" @click="mapLocation('char')">确定</button>
                </div>
                <div class="location-display">{{ formState.charLocationDisplay }}</div>
              </div>
              <div class="form-item-vertical">
                <div class="label-main" style="margin-bottom:5px;">用户所在地</div>
                <div class="location-input-group">
                  <input type="text" v-model="formState.userLocationReal" class="base-input" placeholder="真实地名">
                  <input type="text" v-model="formState.userLocationVirtual" class="base-input" placeholder="虚拟地名 (可选)">
                  <button class="btn btn-secondary btn-sm" @click="mapLocation('user')">确定</button>
                </div>
                <div class="location-display">{{ formState.userLocationDisplay }}</div>
              </div>
            </div>
          </transition>
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

const { formState, mapLocation } = props.settings

const collapsed = props.settings.collapsedStates.realtimeSense
const toggleCollapse = () => {
  props.settings.collapsedStates.realtimeSense = !props.settings.collapsedStates.realtimeSense
}
</script>

<style scoped>
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.settings-item-input { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
.label-col { display: flex; flex-direction: column; }
.label-main { font-size: 14px; color: #333; }

.form-item-vertical { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.location-input-group { display: flex; gap: 10px; align-items: center; margin-bottom: 5px; }
.location-display { font-size: 11px; color: #888; margin-top: 5px; white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
</style>
