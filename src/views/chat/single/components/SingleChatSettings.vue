<template>
  <div class="chat-settings active">
    <!-- ==============================================================================================
         页面头部
         ============================================================================================== -->
    <div class="app-header">
      <div class="back-btn" @click="closeSettings">
        <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </div>
      <div class="title">{{ settings.t('chat.singleChat.settings.title') }}</div>
      <div class="action-btn">
        <button class="header-save-btn" @click="settings.saveSettings">{{ settings.t('save') }}</button>
      </div>
    </div>
    
    <!-- ==============================================================================================
         设置内容区域
         ============================================================================================== -->
    <div class="app-content settings-content">
      
      <SettingsCharCard :settings="settings" />
      <SettingsUserCard :settings="settings" />
      <SettingsBackgroundCard :settings="settings" />
      <SettingsModeCard :settings="settings" />
      <SettingsRealtimeCard :settings="settings" />
      <SettingsSummaryCard :settings="settings" :charId="id" />
      <SettingsBeautifyCard :settings="settings" />
      <SettingsVideoCard :settings="settings" />
      <SettingsAdvancedCard :settings="settings" />
      <SettingsDangerZone :settings="settings" />

    </div>

    <!-- 弹窗组件 -->
    <ImageUploadModal 
      v-model:visible="settings.showImageUploadModal.value" 
      type="basic" 
      :biz-type="settings.currentUploadTarget.value" 
      :title="settings.uploadModalTitle.value" 
      @preview-ready="settings.handleImagePreview"
      @upload-complete="settings.handleImageUploadConfirm"
    />

    <!-- 手动总结选项弹窗 -->
    <Modal v-model:visible="settings.showSummaryModal.value" :title="settings.t('chat.singleChat.settings.manualSummary')">
      <div class="modal-options centered-text">
        <div class="modal-option" @click="settings.handleSummarizeRecent">
          <span class="option-text">{{ settings.t('chat.singleChat.settings.summarizeRecent') }}</span>
        </div>
        <div class="modal-option" @click="settings.openRangeInputModal">
          <span class="option-text">{{ settings.t('chat.singleChat.settings.summarizeRange') }}</span>
        </div>
        <div class="modal-option" @click="settings.handleSummarizeVideo">
          <span class="option-text">{{ settings.t('chat.singleChat.settings.summarizeVideo') }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="settings.showSummaryModal.value = false">{{ settings.t('cancel') }}</button>
      </template>
    </Modal>

    <!-- 范围总结输入弹窗 -->
    <Modal v-model:visible="settings.showRangeInputModal.value" :title="settings.t('chat.singleChat.settings.summarizeRange')">
      <input 
        type="text" 
        class="base-input" 
        v-model="settings.summaryRangeInput.value" 
        :placeholder="settings.t('chat.singleChat.settings.rangePlaceholder', { total: settings.formState.msgCount })"
      >
      <template #footer>
        <button class="modal-btn cancel" @click="settings.showRangeInputModal.value = false">{{ settings.t('cancel') }}</button>
        <button class="modal-btn confirm" @click="settings.handleSummarizeRange">{{ settings.t('confirm') }}</button>
      </template>
    </Modal>

    <!-- NPC选择弹窗 -->
    <Modal v-model:visible="settings.showNpcScopeModal.value" :title="settings.t('chat.singleChat.settings.selectNpc')" bodyClass="no-padding">
      <div class="scope-list" style="max-height: 300px; overflow-y: auto;">
        <div v-if="settings.singleStore.npcs.length === 0" class="empty-state-mini">
            暂无NPC，请先在NPC管理页面添加
        </div>
        <div 
          v-for="npc in settings.singleStore.npcs" 
          :key="npc.id" 
          class="scope-item"
          @click="settings.toggleNpcScope(npc.id)"
        >
          <div class="scope-checkbox" :class="{ checked: settings.formState.linkedNpcs.includes(npc.id) }">
             <svg v-if="settings.formState.linkedNpcs.includes(npc.id)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span class="scope-name">{{ npc.name }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn confirm" @click="settings.showNpcScopeModal.value = false">{{ settings.t('confirm') }}</button>
      </template>
    </Modal>

    <!-- 关联角色选择弹窗 -->
    <Modal v-model:visible="settings.showCharScopeModal.value" title="选择关联角色" bodyClass="no-padding">
      <div class="scope-list" style="max-height: 300px; overflow-y: auto;">
        <div v-if="settings.availableCharacters.value.length === 0" class="empty-state-mini">
            暂无其他角色可选
        </div>
        <div 
          v-for="char in settings.availableCharacters.value" 
          :key="char.id" 
          class="scope-item"
          @click="settings.toggleCharScope(char.id)"
        >
          <div class="scope-checkbox" :class="{ checked: settings.formState.linkedCharacters.includes(char.id) }">
             <svg v-if="settings.formState.linkedCharacters.includes(char.id)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span class="scope-name">{{ char.name }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn confirm" @click="settings.showCharScopeModal.value = false">{{ settings.t('confirm') }}</button>
      </template>
    </Modal>

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSingleSettings } from '@/composables/chat/useSingleSettings'

// 组件
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import Modal from '@/components/common/Modal.vue'

// 设置卡片组件
import SettingsCharCard from './settings/SettingsCharCard.vue'
import SettingsUserCard from '../../components/settings/SettingsUserCard.vue'
import SettingsBackgroundCard from '../../components/settings/SettingsBackgroundCard.vue'
import SettingsModeCard from './settings/SettingsModeCard.vue'
import SettingsRealtimeCard from '../../components/settings/SettingsRealtimeCard.vue'
import SettingsSummaryCard from '../../components/settings/SettingsSummaryCard.vue'
import SettingsBeautifyCard from '../../components/settings/SettingsBeautifyCard.vue'
import SettingsVideoCard from './settings/SettingsVideoCard.vue'
import SettingsAdvancedCard from './settings/SettingsAdvancedCard.vue'
import SettingsDangerZone from '../../components/settings/SettingsDangerZone.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const settings = useSingleSettings(props)

const closeSettings = () => { router.back() }

onMounted(() => {
    if (!settings.character.value) {
        closeSettings()
        return
    }
    settings.loadSettings()
})
</script>

<style scoped>
/* 根容器与布局 */
.chat-settings {
    width: 100%; height: 100%; position: absolute; top: 0; left: 0;
    background: #F5F5F5; z-index: 500; display: flex; flex-direction: column;
}
.chat-settings .app-header { background: #f5f5f5; border-bottom: none; }
.settings-content { padding: 15px; overflow-y: auto; flex: 1; }

/* 弹窗样式 (复用原文件) */
.modal-options { display: flex; flex-direction: column; }
.modal-option { padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; }
.modal-option:last-child { border-bottom: none; }
.modal-option:active { background-color: #f9f9f9; }
.centered-text { text-align: center; }

/* Scope List Styles */
.scope-list { display: flex; flex-direction: column; }
.scope-item { display: flex; align-items: center; padding: 12px 20px; cursor: pointer; border-bottom: 1px solid var(--border-color); gap: 12px; }
.scope-item:last-child { border-bottom: none; }
.scope-item:active { background-color: var(--bg-light); }
.scope-checkbox { width: 20px; height: 20px; border: 2px solid #999; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s; }
.scope-checkbox.checked { background-color: #07C160; border-color: #07C160; }
.scope-name { font-size: 15px; color: #333; }
.empty-state-mini { padding: 20px; text-align: center; color: #999; font-size: 14px; }

:deep(.no-padding) { padding: 0 !important; }
</style>
