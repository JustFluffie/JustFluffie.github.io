<template>
  <div class="chat-settings active">
    <!-- ==============================================================================================
         页面头部
         ============================================================================================== -->
    <div class="app-header">
      <div class="back-btn" @click="closeSettings">
        <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </div>
      <div class="title">{{ t('chat.singleChat.settings.title') }}</div>
      <div class="action-btn">
        <button class="header-save-btn" @click="saveSettings">{{ t('save') }}</button>
      </div>
    </div>
    
    <!-- ==============================================================================================
         设置内容区域
         ============================================================================================== -->
    <div class="app-content settings-content">
      
      <!-- 1. 角色信息 (Role Info) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('roleInfo')">
          <span>{{ t('chat.singleChat.settings.roleInfo') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.roleInfo }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.roleInfo" key="roleInfo">
            <div class="card-content">
              <div class="role-header-layout">
                <div class="role-avatar-wrapper" @click="openAvatarModal">
                  <img v-if="charAvatar" :src="charAvatar" alt="头像" class="role-avatar-img">
                  <div v-else class="role-avatar-placeholder">{{ t('chat.singleChat.settings.uploadAvatar') }}</div>
                </div>
                <div class="role-inputs-wrapper">
                  <input type="text" v-model="charNameInput" class="base-input" :placeholder="t('chat.singleChat.settings.roleNamePlaceholder')">
                  <input type="text" v-model="charNicknameInput" class="base-input" :placeholder="t('chat.singleChat.settings.roleNicknamePlaceholder')">
                </div>
              </div>
              <div class="form-item-vertical">
                 <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.rolePersona') }}</div>
                 <textarea v-model="charPersonaInput" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.rolePersonaPlaceholder')"></textarea>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 2. 用户信息 (User Info) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('userInfo')">
          <span>{{ t('chat.singleChat.settings.userInfo') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.userInfo }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.userInfo" key="userInfo">
            <div class="card-content">
              <div class="settings-pure-item" style="border-bottom: none;">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.currentUserPersona') }}</div>
                <CustomSelect :options="userPersonaOptions" v-model="currentUserPersonaId" />
              </div>
              <div class="user-header-layout">
                <div class="user-avatar-wrapper" @click="openUserAvatarModal">
                  <img v-if="userPersonaAvatar" :src="userPersonaAvatar" alt="User" class="role-avatar-img">
                  <div v-else class="role-avatar-placeholder">{{ t('chat.singleChat.settings.uploadAvatar') }}</div>
                </div>
                <div class="user-inputs-wrapper">
                  <div class="user-actions-row">
                    <button class="btn btn-secondary btn-mini-grow" @click="saveUserPersona">{{ t('chat.singleChat.settings.savePersona') }}</button>
                    <button class="btn btn-danger btn-mini-grow" @click="deleteUserPersona">{{ t('chat.singleChat.settings.deletePersona') }}</button>
                  </div>
                  <input type="text" v-model="userPersonaNameInput" class="base-input" :placeholder="t('chat.singleChat.settings.userNamePlaceholder')">
                </div>
              </div>
              <div class="form-item-vertical">
                 <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.userPersona') }}</div>
                 <textarea v-model="userPersonaDescInput" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.userPersonaPlaceholder')"></textarea>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 3. 后台活动 (Background Activity) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('backgroundActivity')">
          <span>{{ t('chat.singleChat.settings.backgroundActivity') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.backgroundActivity }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <div class="card-title-remark">{{ t('chat.singleChat.settings.backgroundActivityWarning') }}</div>
        <transition name="collapse">
          <div v-if="!collapsedStates.backgroundActivity" key="backgroundActivity">
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
                  <div class="mode-option" :class="{ active: backgroundActivityOverride === 'default' }" @click="backgroundActivityOverride = 'default'">{{ t('chat.singleChat.settings.default') }}</div>
                  <div class="mode-option" :class="{ active: backgroundActivityOverride === 'on' }" @click="backgroundActivityOverride = 'on'">{{ t('chat.singleChat.settings.on') }}</div>
                  <div class="mode-option" :class="{ active: backgroundActivityOverride === 'off' }" @click="backgroundActivityOverride = 'off'">{{ t('chat.singleChat.settings.off') }}</div>
                </div>
              </div>
              <div v-if="isBackgroundActivityEffective">
                <div class="settings-item-input">
                  <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.interval') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.intervalDesc') }}</div></div>
                  <input type="number" v-model.number="proactiveInterval" class="base-input base-input-short" placeholder="5">
                </div>
                <div class="settings-item-input">
                  <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.cooldown') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.cooldownDesc') }}</div></div>
                  <input type="number" v-model.number="proactiveCooldown" class="base-input base-input-short" placeholder="30">
                </div>
                <div class="settings-item-input">
                  <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.dailyLimit') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.dailyLimitDesc') }}</div></div>
                  <input type="number" v-model.number="proactiveDailyLimit" class="base-input base-input-short" placeholder="10">
                </div>
                <div class="settings-item-input">
                  <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.triggerMode') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.triggerModeDesc') }}</div></div>
                  <div class="mode-selector">
                    <div class="mode-option" :class="{ active: triggerMode === 'idle' }" @click="triggerMode = 'idle'">{{ t('chat.singleChat.settings.idleMode') }}</div>
                    <div class="mode-option" :class="{ active: triggerMode === 'always' }" @click="triggerMode = 'always'">{{ t('chat.singleChat.settings.alwaysMode') }}</div>
                  </div>
                </div>
                <div class="settings-item-input" v-if="triggerMode === 'idle'">
                  <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.idleTime') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.idleTimeDesc') }}</div></div>
                  <input type="number" v-model.number="proactiveIdleTime" class="base-input base-input-short" placeholder="15">
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 4. 模式设置 (Mode Settings) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('modeSettings')">
          <span>{{ t('chat.singleChat.settings.mode') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.modeSettings }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.modeSettings" key="modeSettings">
            <div class="card-content">
              <div class="settings-pure-item">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.modeSelect') }}</div>
                <div class="mode-selector">
                  <div class="mode-option" :class="{ active: isOnline }" @click="setMode(true)">{{ t('chat.singleChat.settings.online') }}</div>
                  <div class="mode-option" :class="{ active: !isOnline }" @click="setMode(false)">{{ t('chat.singleChat.settings.offline') }}</div>
                </div>
              </div>
              <div class="settings-pure-item" v-if="!isOnline">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.linkPreset') }}</div>
                <MultiSelect v-model="preset" :options="sortedPresets" labelKey="title" valueKey="id" childrenKey="entries" textAlign="right" selectorWidth="auto" dropdownWidth="200px" />
              </div>
              <div class="settings-pure-item">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.linkWorldbook') }}</div>
                <MultiSelect v-model="worldbook" :options="sortedWorldBooks" label-key="title" value-key="id" children-key="entries" textAlign="right" selectorWidth="auto" dropdownWidth="200px" />
              </div>
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.replyLength') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.replyLengthDesc') }}</div></div>
                <div class="reply-length-container">
                  <input type="number" v-model="replyLengthMin" class="base-input base-input-mini" :placeholder="t('chat.singleChat.settings.min')">
                  <span>-</span>
                  <input type="number" v-model="replyLengthMax" class="base-input base-input-mini" :placeholder="t('chat.singleChat.settings.max')">
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- NEW: 实时感知 (Real-time Sense) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('realtimeSense')">
          <span>实时感知</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.realtimeSense }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.realtimeSense" key="realtimeSense">
            <div class="card-content">
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">实时时间</div></div>
                <div class="toggle-switch" :class="{ active: realtimeTimeEnabled }" @click="realtimeTimeEnabled = !realtimeTimeEnabled"></div>
              </div>
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">实时天气</div></div>
                <div class="toggle-switch" :class="{ active: realtimeWeatherEnabled }" @click="realtimeWeatherEnabled = !realtimeWeatherEnabled"></div>
              </div>
              <div class="form-item-vertical">
                <div class="label-main" style="margin-bottom:5px;">角色所在地</div>
                <div class="location-input-group">
                  <input type="text" v-model="charLocationReal" class="base-input" placeholder="真实地名">
                  <input type="text" v-model="charLocationVirtual" class="base-input" placeholder="虚拟地名 (可选)">
                  <button class="btn btn-secondary btn-sm" @click="mapLocation('char')">确定</button>
                </div>
                <div class="location-display">{{ charLocationDisplay }}</div>
              </div>
              <div class="form-item-vertical">
                <div class="label-main" style="margin-bottom:5px;">用户所在地</div>
                <div class="location-input-group">
                  <input type="text" v-model="userLocationReal" class="base-input" placeholder="真实地名">
                  <input type="text" v-model="userLocationVirtual" class="base-input" placeholder="虚拟地名 (可选)">
                  <button class="btn btn-secondary btn-sm" @click="mapLocation('user')">确定</button>
                </div>
                <div class="location-display">{{ userLocationDisplay }}</div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 5. 总结设置 (Summary Settings) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('summarySettings')">
          <span>{{ t('chat.singleChat.settings.summary') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.summarySettings }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.summarySettings" key="summarySettings">
            <div class="card-content">
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.summaryRange') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.summaryRangeDesc') }}</div></div>
                <input type="number" v-model.number="summaryRange" class="base-input base-input-short" placeholder="20">
              </div>
              <div class="form-item-vertical">
                 <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.summaryPrompt') }}</div>
                 <textarea v-model="summaryPrompt" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.summaryPromptPlaceholder')"></textarea>
              </div>
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.autoSummary') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.autoSummaryDesc') }}</div></div>
                <div class="toggle-switch" :class="{ active: autoSummary }" @click="autoSummary = !autoSummary"></div>
              </div>
              <div class="settings-btn-row flex-distribute-children" style="padding: 15px 0; border-bottom: 1px solid #f5f5f5;">
                <button class="btn btn-secondary" @click="triggerManualSummary">{{ t('chat.singleChat.settings.manualSummary') }}</button>
                <button class="btn btn-secondary" @click="openMemoryBank">{{ t('chat.singleChat.settings.viewSummary') }}</button>
              </div>
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.contextMemory') }}</div><div class="label-sub">{{ t('chat.singleChat.settings.contextMemoryDesc') }}</div></div>
                <input type="number" v-model.number="memoryCount" class="base-input base-input-short" placeholder="10">
              </div>
              <div class="settings-pure-item">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.apiConfig') }}</div>
                <CustomSelect :options="apiConfigOptions" v-model="apiConfig" />
              </div>
              <div class="settings-pure-item">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.tokenCount') }}</div><div class="settings-pure-value">{{ tokenCount }}</div>
              </div>
              <div class="settings-pure-item">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.msgCount') }}</div><div class="settings-pure-value">{{ msgCount }}</div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 6. 聊天美化 (Beautification) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('bubbleSettings')">
          <span>{{ t('chat.singleChat.settings.beautification') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.bubbleSettings }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.bubbleSettings" key="bubbleSettings">
            <div class="card-content">
              <div class="settings-section-title">{{ t('chat.singleChat.settings.bubble') }}</div>
              <div class="settings-row-group">
                  <div class="settings-pure-label" style="width: 60px;">{{ t('chat.singleChat.settings.bubblePreset') }}</div>
                  <div style="flex: 1; margin: 0 10px;">
                      <CustomSelect :options="bubblePresetOptions" v-model="currentBubblePresetId" />
                  </div>
                  <div class="btn-group-mini">
                      <button class="btn btn-secondary btn-mini" @click="saveBubblePreset">{{ t('save') }}</button>
                      <button class="btn btn-danger btn-mini" :disabled="!currentBubblePresetId" @click="deleteBubblePreset">{{ t('delete') }}</button>
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
                        <img v-if="userPersonaAvatar" :src="userPersonaAvatar" style="width:100%;height:100%;object-fit:cover;">
                        <div v-else class="default-avatar"></div>
                      </div>
                    </div>
                </div>
              </div>
              <div class="settings-item-input">
                <div class="label-col"><div class="label-main">{{ t('chat.singleChat.settings.fontSize') }}</div></div>
                <div class="slider-container gray-slider">
                    <input type="range" v-model.number="bubbleFontSize" min="10" max="30" step="1">
                    <span class="slider-value">{{ bubbleFontSize }}</span>
                </div>
              </div>
              <div class="form-item-vertical no-border">
                 <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.bubbleCss') }}</div>
                 <textarea v-model="bubbleCss" class="base-input" :placeholder="t('chat.singleChat.settings.cssPlaceholder')" style="font-family: monospace; height: 120px;"></textarea>
              </div>
              <div class="settings-divider"></div>
              <div class="settings-section-title">{{ t('chat.singleChat.settings.chatBackground') }}</div>
              <div class="settings-item-avatar" style="border-bottom: none; margin-bottom: 0;">
                <div class="avatar-layout">
                  <div class="avatar-controls" style="width: 100%;">
                    <button class="btn btn-secondary" @click="openChatBgModal">{{ t('chat.singleChat.settings.setChatBackground') }}</button>
                    <button class="btn btn-secondary" @click="applyBgToAll" style="margin-top: 5px;">{{ t('chat.singleChat.settings.applyToAll') }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 7. 视频通话 (Video Call) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('videoSettings')">
          <span>{{ t('chat.singleChat.settings.videoCall') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.videoSettings }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.videoSettings" key="videoSettings">
            <div class="card-content">
              <div class="video-settings-container">
                <div class="video-setting-col">
                   <div class="settings-item-label center">{{ t('chat.singleChat.settings.characterImage') }}</div>
                   <div class="video-preview" @click="openVideoBgModal">
                      <img v-if="videoBg" :src="videoBg" class="bg-img">
                      <div v-else class="default-avatar bg-placeholder">{{ t('chat.singleChat.settings.setImage') }}</div>
                   </div>
                </div>
                <div class="video-setting-col">
                   <div class="settings-item-label center">{{ t('chat.singleChat.settings.userImage') }}</div>
                   <div class="video-preview" @click="openUserVideoImgModal">
                      <img v-if="userVideoImg" :src="userVideoImg" class="bg-img">
                      <div v-else class="default-avatar bg-placeholder">{{ t('chat.singleChat.settings.setImage') }}</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 8. 高级设置 (Advanced) -->
      <div class="card">
        <div class="card-title" @click="toggleCollapse('advancedSettings')">
          <span>{{ t('chat.singleChat.settings.advanced') }}</span>
          <div class="collapse-arrow" :class="{ collapsed: collapsedStates.advancedSettings }">
            <svg-icon name="chevron-down" />
          </div>
        </div>
        <transition name="collapse">
          <div v-if="!collapsedStates.advancedSettings" key="advancedSettings">
            <div class="card-content">
              <div class="settings-pure-item">
                <div class="settings-pure-label">{{ t('chat.singleChat.settings.linkedNpc') }}</div>
                <div class="settings-pure-value">{{ t('chat.singleChat.settings.npcCount', { count: npcCount }) }}</div>
                <div class="settings-pure-arrow">›</div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 危险操作区域 (Danger Zone) -->
      <div class="danger-zone">
        <button class="btn btn-danger big-btn" @click="handleBlockOrUnblock">
          <div class="danger-btn-content">
            <div class="danger-btn-title">{{ isBlocked ? t('chat.singleChat.settings.unblock') : t('chat.singleChat.settings.blockCharacter') }}</div>
            <div class="danger-btn-desc">{{ t('chat.singleChat.settings.blockCharacterDesc') }}</div>
          </div>
        </button>
        <button class="btn btn-danger big-btn" @click="handleClearHistory">
          <div class="danger-btn-content">
            <div class="danger-btn-title">{{ t('chat.singleChat.settings.clearHistory') }}</div>
            <div class="danger-btn-desc">{{ t('chat.singleChat.settings.clearHistoryDesc') }}</div>
          </div>
        </button>
        <button class="btn btn-danger big-btn" @click="handleDeleteCharacter">
          <div class="danger-btn-content">
            <div class="danger-btn-title">{{ t('chat.deleteCharacterTitle') }}</div>
            <div class="danger-btn-desc">{{ t('chat.deleteCharacterWarning') }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <ImageUploadModal v-model:visible="showImageUploadModal" type="basic" biz-type="avatar" :title="uploadModalTitle" @send-image="handleImageUploadConfirm" />

    <!-- 手动总结选项弹窗 -->
    <Modal v-model:visible="showSummaryModal" :title="t('chat.singleChat.settings.manualSummary')">
      <div class="modal-options centered-text">
        <div class="modal-option" @click="handleSummarizeRecent">
          <span class="option-text">{{ t('chat.singleChat.settings.summarizeRecent') }}</span>
        </div>
        <div class="modal-option" @click="openRangeInputModal">
          <span class="option-text">{{ t('chat.singleChat.settings.summarizeRange') }}</span>
        </div>
        <div class="modal-option" @click="handleSummarizeVideo">
          <span class="option-text">{{ t('chat.singleChat.settings.summarizeVideo') }}</span>
        </div>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="showSummaryModal = false">{{ t('cancel') }}</button>
      </template>
    </Modal>

    <!-- 范围总结输入弹窗 -->
    <Modal v-model:visible="showRangeInputModal" :title="t('chat.singleChat.settings.summarizeRange')">
      <input 
        type="text" 
        class="base-input" 
        v-model="summaryRangeInput" 
        :placeholder="t('chat.singleChat.settings.rangePlaceholder', { total: msgCount })"
      >
      <template #footer>
        <button class="modal-btn cancel" @click="showRangeInputModal = false">{{ t('cancel') }}</button>
        <button class="modal-btn confirm" @click="handleSummarizeRange">{{ t('confirm') }}</button>
      </template>
    </Modal>

  </div>
</template>

<script setup>
// ================================================================================================
// 模块导入
// ================================================================================================
// Vue
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
// Pinia
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBackgroundStore } from '@/stores/backgroundStore'
import { useWorldBookStore } from '@/stores/worldBookStore'
import { usePresetStore } from '@/stores/presetStore'
import { useApiStore } from '@/stores/apiStore'
import { storeToRefs } from 'pinia'
// 组件
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import CustomSelect from '@/components/common/CustomSelect.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'
import Modal from '@/components/common/Modal.vue'

// ================================================================================================
// 属性、事件
// ================================================================================================
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// ================================================================================================
// 组合式函数
// ================================================================================================
const { t } = useI18n()
const router = useRouter()
const singleStore = useSingleStore()
const themeStore = useThemeStore()
const backgroundStore = useBackgroundStore()
const worldBookStore = useWorldBookStore()
const { sortedWorldBooks } = storeToRefs(worldBookStore)
const presetStore = usePresetStore()
const { sortedPresets } = storeToRefs(presetStore)
const apiStore = useApiStore()

// ================================================================================================
// 1. UI 状态 (UI State)
// ================================================================================================
// 折叠状态
const collapsedStates = ref({
  roleInfo: false, 
  userInfo: false, 
  backgroundActivity: false, 
  modeSettings: false,
  realtimeSense: false,
  summarySettings: false, 
  bubbleSettings: false, 
  videoSettings: false, 
  advancedSettings: false,
});
// 弹窗控制
const showImageUploadModal = ref(false)
const currentUploadTarget = ref('') // 'avatar', 'userPersonaAvatar', 'chatBg', 'videoBg', 'userVideoImg'

// ================================================================================================
// 2. 表单数据状态 (Form State) - 按卡片顺序
// ================================================================================================

// --- 2.1 角色信息 (Role Info) ---
const charNameInput = ref('')
const charNicknameInput = ref('')
const charPersonaInput = ref('')

// --- 2.2 用户信息 (User Info) ---
const currentUserPersonaId = ref('default')
const userPersonaNameInput = ref('')
const userPersonaDescInput = ref('')
const userPersonaAvatar = ref('')

// --- 2.3 后台活动 (Background Activity) ---
const backgroundActivityOverride = ref('default')
const proactiveInterval = ref(5)
const proactiveCooldown = ref(30)
const proactiveDailyLimit = ref(10)
const triggerMode = ref('always')
const proactiveIdleTime = ref(15)

// --- 2.4 模式设置 (Mode Settings) ---
const isOnline = ref(true)
const preset = ref([])
const worldbook = ref([])
const replyLengthMin = ref('')
const replyLengthMax = ref('')

// --- NEW: Real-time Sense ---
const realtimeTimeEnabled = ref(false)
const realtimeWeatherEnabled = ref(false)
const charLocationReal = ref('')
const charLocationVirtual = ref('')
const charLocationDisplay = ref('')
const userLocationReal = ref('')
const userLocationVirtual = ref('')
const userLocationDisplay = ref('')

// --- 2.5 总结设置 (Summary Settings) ---
const summaryRange = ref(20)
const summaryPrompt = ref('')
const autoSummary = ref(false)
const memoryCount = ref(10)
const showSummaryModal = ref(false)
const showRangeInputModal = ref(false)
const summaryRangeInput = ref('')

// --- 2.6 聊天美化 (Beautification) ---
const currentBubblePresetId = ref('')
const bubbleCss = ref('')
const bubbleFontSize = ref(14)
const chatBackground = ref('')

// --- 2.7 视频通话 (Video Call) ---
const videoBg = ref('')
const userVideoImg = ref('')

// --- 2.8 高级设置 & 统计 (Advanced & Stats) ---
const apiConfig = ref('default')
const npcCount = ref(0)
const isBlocked = ref(false)
const tokenCount = ref(0)
const msgCount = ref(0)

// ================================================================================================
// 3. 计算属性 (Computed)
// ================================================================================================

// --- 基础信息 ---
const character = computed(() => singleStore.getCharacter(props.id))
const charName = computed(() => character.value?.name || t('chat.unknownCharacter'))
const charAvatar = computed(() => character.value?.avatar)

// --- 选项列表 (Options) ---
const userPersonaOptions = computed(() => [
  { value: 'default', label: t('chat.singleChat.settings.defaultUserPersona') },
  ...(singleStore.userPersonas || []).map(p => ({ value: p.id, label: p.name }))
]);

const apiConfigOptions = computed(() => [
  { value: 'default', label: t('chat.singleChat.settings.default')+'配置' }, 
  { value: 'api1', label: '配置一' }, 
  { value: 'api2', label: '配置二' },
]);

const bubblePresetOptions = computed(() => [
    { value: '', label: t('chat.singleChat.settings.custom') },
    ...(singleStore.bubblePresets || []).map(p => ({ value: p.id, label: p.name }))
]);

// --- 状态判断 ---
const isBackgroundActivityEffective = computed(() => {
  if (backgroundActivityOverride.value === 'on') return true;
  if (backgroundActivityOverride.value === 'off') return false;
  return backgroundStore.globalBackgroundActivity;
});

// --- 样式预览 ---
const previewStyle = computed(() => {
    const base = { fontSize: `${bubbleFontSize.value}px` };
    if (!bubbleCss.value) return base;
    const styles = {};
    bubbleCss.value.split(';').forEach(rule => {
        const parts = rule.split(':');
        if (parts.length >= 2) {
            const prop = parts[0].trim();
            const val = parts.slice(1).join(':').trim();
            if (prop && val) styles[prop] = val;
        }
    });
    return { ...base, ...styles };
});

// --- 弹窗标题 ---
const uploadModalTitle = computed(() => ({
    avatar: t('chat.singleChat.settings.toast.setCharAvatar'), 
    userPersonaAvatar: t('chat.singleChat.settings.toast.setUserAvatar'), 
    chatBg: t('chat.singleChat.settings.toast.setChatBg'),
    videoBg: t('chat.singleChat.settings.toast.setCharImg'), 
    userVideoImg: t('chat.singleChat.settings.toast.setUserImg')
  })[currentUploadTarget.value] || t('chat.singleChat.settings.toast.upload'))

// ================================================================================================
// 4. 侦听器 (Watch)
// ================================================================================================
watch(currentUserPersonaId, (newId) => { if (newId) loadUserPersonaUI(newId) })
watch(currentBubblePresetId, (newId) => { if (newId) loadBubblePreset(newId) });

// ================================================================================================
// 5. 生命周期 (Lifecycle)
// ================================================================================================
onMounted(() => {
    if (!character.value) {
        closeSettings();
        return;
    }
    loadSettings();
})

// ================================================================================================
// 6. 方法 (Methods)
// ================================================================================================

// --- 6.1 页面交互 (UI Interaction) ---
const toggleCollapse = (cardKey) => { collapsedStates.value[cardKey] = !collapsedStates.value[cardKey]; };
const closeSettings = () => { router.back() };
const openMemoryBank = () => { router.push({ name: 'memory-bank', params: { charId: props.id } }) };
const openAvatarModal = () => { currentUploadTarget.value = 'avatar'; showImageUploadModal.value = true; };
const openUserAvatarModal = () => { currentUploadTarget.value = 'userPersonaAvatar'; showImageUploadModal.value = true; };
const openChatBgModal = () => { currentUploadTarget.value = 'chatBg'; showImageUploadModal.value = true; };
const openVideoBgModal = () => { currentUploadTarget.value = 'videoBg'; showImageUploadModal.value = true; };
const openUserVideoImgModal = () => { currentUploadTarget.value = 'userVideoImg'; showImageUploadModal.value = true; };

// --- 6.2 数据加载与保存 (Persistence) ---
const loadSettings = () => {
    const char = character.value;
    // 1. Role Info
    charNameInput.value = char.name;
    charNicknameInput.value = char.nickname || '';
    charPersonaInput.value = char.charPersona || '';
    
    // 2. User Info
    currentUserPersonaId.value = char.userPersona || 'default';
    loadUserPersonaUI(currentUserPersonaId.value);
    
    // 3. Background Activity
    backgroundActivityOverride.value = char.backgroundActivityOverride || 'default';
    proactiveInterval.value = char.proactiveInterval || 5;
    proactiveCooldown.value = char.proactiveCooldown || 30;
    proactiveDailyLimit.value = char.proactiveDailyLimit || 10;
    triggerMode.value = char.triggerMode || 'always';
    proactiveIdleTime.value = char.proactiveIdleTime || 15;
    
    // 4. Mode Settings
    isOnline.value = char.isOnline !== false;
    preset.value = Array.isArray(char.preset) ? char.preset : (char.preset ? [char.preset] : []);
    worldbook.value = char.worldbook || [];
    const [min, max] = (char.replyLength || (isOnline.value ? '10-50' : '200-500')).split('-');
    replyLengthMin.value = min || '';
    replyLengthMax.value = max || '';

    // NEW: Real-time Sense
    const rts = char.realtimeSettings || { timeEnabled: false, weatherEnabled: false, charLocation: {}, userLocation: {} };
    realtimeTimeEnabled.value = rts.timeEnabled;
    realtimeWeatherEnabled.value = rts.weatherEnabled;
    charLocationReal.value = rts.charLocation?.real || '';
    charLocationVirtual.value = rts.charLocation?.virtual || '';
    charLocationDisplay.value = rts.charLocation?.display || '';
    userLocationReal.value = rts.userLocation?.real || '';
    userLocationVirtual.value = rts.userLocation?.virtual || '';
    userLocationDisplay.value = rts.userLocation?.display || '';
    
    // 5. Summary Settings
    summaryRange.value = char.summaryRange || 20;
    summaryPrompt.value = char.summaryPrompt || '';
    autoSummary.value = char.autoSummary || false;
    memoryCount.value = char.memoryCount || 10;
    
    // 6. Beautification
    const bubbleSettings = char.bubbleSettings || {};
    bubbleCss.value = bubbleSettings.css || '';
    bubbleFontSize.value = bubbleSettings.fontSize || 14;
    chatBackground.value = char.chatBackground || '';
    
    // 7. Video Call
    videoBg.value = char.videoBg || '';
    userVideoImg.value = char.userVideoImg || '';
    
    // 8. Advanced & Stats
    apiConfig.value = char.api || 'default';
    npcCount.value = char.npc?.length || 0;
    isBlocked.value = char.isBlocked || false;
    const messages = singleStore.messages[props.id] || [];
    msgCount.value = messages.length;
    tokenCount.value = Math.ceil(messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) * 1.5);
};

const saveSettings = () => {
    const char = character.value;
    if (!char) return;

    // --- User Persona Save Logic ---
    const personaId = currentUserPersonaId.value;
    let persona = singleStore.userPersonas.find(p => p.id === personaId);

    if (personaId === 'default') {
        if (!persona) {
            persona = { id: 'default', name: t('chat.singleChat.settings.defaultUserPersona'), avatar: '', description: '', videoImg: '' };
            singleStore.userPersonas.unshift(persona);
        }
    }
    
    if (persona) {
        if (persona.id !== 'default' && userPersonaNameInput.value.trim()) {
            persona.name = userPersonaNameInput.value.trim();
        }
        persona.description = userPersonaDescInput.value;
        persona.avatar = userPersonaAvatar.value;
        persona.videoImg = userVideoImg.value;
    }

    Object.assign(char, {
        // 1. Role Info
        name: charNameInput.value.trim() || char.name,
        nickname: charNicknameInput.value.trim(),
        charPersona: charPersonaInput.value,
        // 2. User Info
        userPersona: currentUserPersonaId.value,
        // 3. Background Activity
        backgroundActivityOverride: backgroundActivityOverride.value,
        proactiveInterval: proactiveInterval.value,
        proactiveCooldown: proactiveCooldown.value,
        proactiveDailyLimit: proactiveDailyLimit.value,
        triggerMode: triggerMode.value,
        proactiveIdleTime: proactiveIdleTime.value,
        // 4. Mode Settings
        isOnline: isOnline.value,
        preset: preset.value,
        worldbook: worldbook.value,
        replyLength: `${replyLengthMin.value}-${replyLengthMax.value}`,
        // NEW: Real-time Sense
        realtimeSettings: {
            timeEnabled: realtimeTimeEnabled.value,
            weatherEnabled: realtimeWeatherEnabled.value,
            charLocation: { real: charLocationReal.value, virtual: charLocationVirtual.value, display: charLocationDisplay.value },
            userLocation: { real: userLocationReal.value, virtual: userLocationVirtual.value, display: userLocationDisplay.value }
        },
        // 5. Summary Settings
        summaryRange: summaryRange.value,
        summaryPrompt: summaryPrompt.value,
        autoSummary: autoSummary.value,
        memoryCount: memoryCount.value,
        // 6. Beautification
        bubbleSettings: { css: bubbleCss.value, fontSize: bubbleFontSize.value },
        chatBackground: chatBackground.value,
        // 7. Video Call
        videoBg: videoBg.value,
        // userVideoImg is now saved with the persona object
        // 8. Advanced
        isBlocked: isBlocked.value,
    });
    singleStore.saveData();
    themeStore.showToast(t('theme.toast.saveSuccess'));
};

// --- 6.3 用户人设逻辑 (User Persona Logic) ---
const loadUserPersonaUI = (id) => {
    const defaultName = t('chat.singleChat.settings.defaultUserPersona');
    let persona = singleStore.userPersonas.find(p => p.id === id) || { id: 'default', name: defaultName, avatar: '', description: '', videoImg: '' };
    userPersonaNameInput.value = persona.name === defaultName ? '' : persona.name;
    userPersonaDescInput.value = persona.description || '';
    userPersonaAvatar.value = persona.avatar || '';
    if (id !== 'default') userVideoImg.value = persona.videoImg || '';
};

const saveUserPersona = () => {
    const name = userPersonaNameInput.value.trim();
    if (!name) return themeStore.showToast(t('chat.singleChat.settings.toast.personaNameRequired'), 'error');
    const newPersona = {
        id: currentUserPersonaId.value === 'default' ? Date.now().toString() : currentUserPersonaId.value,
        name, description: userPersonaDescInput.value, avatar: userPersonaAvatar.value, videoImg: userVideoImg.value
    };
    if (currentUserPersonaId.value === 'default') {
        singleStore.userPersonas.push(newPersona);
        currentUserPersonaId.value = newPersona.id;
        themeStore.showToast(t('chat.singleChat.settings.toast.personaSaved'));
    } else {
        const index = singleStore.userPersonas.findIndex(p => p.id === currentUserPersonaId.value);
        if (index !== -1) {
            singleStore.userPersonas[index] = newPersona;
            themeStore.showToast(t('chat.singleChat.settings.toast.personaUpdated'));
        }
    }
    singleStore.saveData();
};

const deleteUserPersona = () => {
    if (currentUserPersonaId.value === 'default') return themeStore.showToast(t('chat.singleChat.settings.toast.defaultPersonaDelete'), 'error');
    themeStore.showConfirm(t('chat.singleChat.settings.toast.deletePersona'), t('chat.singleChat.settings.toast.confirmDeletePersona'), () => {
        singleStore.userPersonas = singleStore.userPersonas.filter(p => p.id !== currentUserPersonaId.value);
        singleStore.characters.forEach(c => { if (c.userPersona === currentUserPersonaId.value) c.userPersona = 'default'; });
        currentUserPersonaId.value = 'default';
        loadUserPersonaUI('default');
        singleStore.saveData();
    });
};

// --- 6.4 气泡预设逻辑 (Bubble Preset Logic) ---
const loadBubblePreset = (id) => {
    if (!id) return;
    const preset = singleStore.bubblePresets.find(p => p.id === id);
    if (preset) {
        bubbleCss.value = preset.css;
        bubbleFontSize.value = preset.fontSize;
    }
};

const saveBubblePreset = () => {
    const name = prompt(t('chat.singleChat.settings.toast.presetNameRequired'));
    if (!name) return;
    const newPreset = { id: Date.now().toString(), name, css: bubbleCss.value, fontSize: bubbleFontSize.value };
    singleStore.bubblePresets.push(newPreset);
    singleStore.saveData();
    currentBubblePresetId.value = newPreset.id;
    themeStore.showToast(t('chat.singleChat.settings.toast.presetSaved'));
};

const deleteBubblePreset = () => {
    if (!currentBubblePresetId.value) return;
    themeStore.showConfirm(t('chat.singleChat.settings.toast.deleteBubblePreset'), t('chat.singleChat.settings.toast.confirmDeleteBubblePreset'), () => {
        singleStore.bubblePresets = singleStore.bubblePresets.filter(p => p.id !== currentBubblePresetId.value);
        singleStore.saveData();
        currentBubblePresetId.value = '';
        themeStore.showToast(t('chat.singleChat.settings.toast.presetDeleted'));
    });
};

// --- 6.5 图片上传逻辑 (Image Upload Logic) ---
const handleImageUploadConfirm = (image) => {
    const url = typeof image === 'string' ? image : image.content;
    const target = currentUploadTarget.value;

    // Logic for things that save immediately (character avatar, backgrounds)
    if (target === 'avatar' || target === 'chatBg' || target === 'videoBg') {
        const updates = {
            avatar: { obj: character.value, key: 'avatar', toast: t('chat.singleChat.settings.toast.avatarUpdated') },
            chatBg: { obj: character.value, key: 'chatBackground', toast: t('chat.singleChat.settings.toast.backgroundUpdated'), localRef: chatBackground },
            videoBg: { obj: character.value, key: 'videoBg', toast: t('chat.singleChat.settings.toast.charImageUpdated'), localRef: videoBg },
        };
        if (updates[target]) {
            updates[target].obj[updates[target].key] = url;
            if (updates[target].localRef) updates[target].localRef.value = url;
            singleStore.saveData();
            themeStore.showToast(updates[target].toast);
        }
    }
    // Logic for things that are just previews and saved with the main save button
    else if (target === 'userPersonaAvatar' || target === 'userVideoImg') {
        if (target === 'userPersonaAvatar') {
            userPersonaAvatar.value = url;
        }
        if (target === 'userVideoImg') {
            userVideoImg.value = url;
        }
        themeStore.showToast(t('chat.singleChat.settings.toast.avatarUpdated'));
    }
    
    showImageUploadModal.value = false;
};

const applyBgToAll = () => {
    if (!chatBackground.value) return themeStore.showToast(t('chat.singleChat.settings.toast.noBgToApply'));
    themeStore.showConfirm(t('chat.singleChat.settings.toast.applyBgToAll'), t('chat.singleChat.settings.toast.confirmApplyBgToAll'), () => {
        singleStore.applyChatBackgroundToAll(chatBackground.value);
        themeStore.showToast(t('chat.singleChat.settings.toast.appliedToAll'));
    });
};

// --- 6.6 模式与总结逻辑 (Mode & Summary Logic) ---
const setMode = (online) => {
    isOnline.value = online;
    [replyLengthMin.value, replyLengthMax.value] = online ? ['10', '50'] : ['200', '500'];
};

const triggerManualSummary = () => {
  showSummaryModal.value = true;
};

const openRangeInputModal = () => {
  showSummaryModal.value = false;
  showRangeInputModal.value = true;
};

const handleSummarizeRecent = async () => {
  showSummaryModal.value = false;
  const result = await singleStore.summarizeMessages(props.id, { type: 'recent' });
  themeStore.showToast(result.message, result.success ? 'success' : 'error');
};

const handleSummarizeRange = async () => {
  const [startStr, endStr] = summaryRangeInput.value.split('-').map(s => s.trim());
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
    themeStore.showToast(t('chat.singleChat.settings.toast.invalidRange'), 'error');
    return;
  }

  const result = await singleStore.summarizeMessages(props.id, { type: 'range', start, end });
  themeStore.showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    showRangeInputModal.value = false;
    summaryRangeInput.value = '';
  }
};

const handleSummarizeVideo = async () => {
  showSummaryModal.value = false;
  const result = await singleStore.summarizeMessages(props.id, { type: 'video' });
  themeStore.showToast(result.message, result.success ? 'success' : 'error');
};

// --- NEW: Real-time Sense Logic ---
const mapLocation = async (type) => {
  const real = type === 'char' ? charLocationReal.value : userLocationReal.value;
  const virtual = type === 'char' ? charLocationVirtual.value : userLocationVirtual.value;

  if (!real) {
    themeStore.showToast('请输入真实地名', 'error');
    return;
  }

  const activePreset = apiStore.getActivePreset();
  if (!activePreset || !activePreset.apiUrl) {
    themeStore.showToast('请先在API设置中配置有效的URL', 'error');
    return;
  }
  const baseUrl = activePreset.apiUrl.replace(/\/+$/, '');

  themeStore.showLoading();
  try {
    // Step 1: Geocode location name to get lat/lon and address details
    const geoResponse = await fetch(`${baseUrl}/nominatim/search?q=${encodeURIComponent(real)}&format=json&addressdetails=1&limit=1`);
    if (!geoResponse.ok) throw new Error('Geocoding API request failed');
    const geoData = await geoResponse.json();
    if (geoData.length === 0) {
      themeStore.showToast('找不到该位置', 'error');
      return;
    }
    const { lat, lon, address } = geoData[0];
    const city = address.city || address.town || address.village || address.county || '';
    const country = address.country || '';

    // Step 2: Use lat/lon to get timezone
    const tzResponse = await fetch(`${baseUrl}/geonames/timezoneJSON?lat=${lat}&lng=${lon}&username=demo`);
    if (!tzResponse.ok) throw new Error('Timezone API request failed');
    const tzData = await tzResponse.json();
    const timezone = tzData.timezoneId || 'N/A';

    const display = `${virtual || real} (市: ${city}, 国家: ${country}, 时区: ${timezone})`;

    if (type === 'char') {
      charLocationDisplay.value = display;
    } else {
      userLocationDisplay.value = display;
    }
    themeStore.showToast('位置信息已更新', 'success');

  } catch (error) {
    console.error('Failed to map location:', error);
    themeStore.showToast('获取位置信息失败', 'error');
  } finally {
    themeStore.hideLoading();
  }
};

// --- 6.7 危险区域逻辑 (Danger Zone Logic) ---
const handleBlockBtnClick = () => {
    themeStore.showConfirm(
        t('chat.singleChat.settings.confirmBlockTitle', { name: charName.value }),
        t('chat.singleChat.settings.confirmBlockMsg', { name: charName.value }),
        () => {
            isBlocked.value = true;
            saveSettings();
            themeStore.showToast(t('chat.singleChat.settings.toast.blocked'));
        },
        { messageStyle: { color: '#FF3B30', whiteSpace: 'pre-wrap' }, confirmText: 'chat.singleChat.settings.block' }
    );
};
const handleUnblock = () => {
    isBlocked.value = false;
    saveSettings();
    themeStore.showToast(t('chat.singleChat.settings.toast.unblocked'));
};
const handleClearHistory = () => {
    themeStore.showConfirm(
        t('chat.singleChat.settings.confirmClearTitle'),
        t('chat.singleChat.settings.confirmClearMsg', { name: charName.value }),
        () => {
            singleStore.clearChatHistory(props.id);
            themeStore.showToast(t('chat.singleChat.settings.toast.historyCleared'));
            msgCount.value = 0;
            tokenCount.value = 0;
        },
        { messageStyle: { whiteSpace: 'pre-wrap', color: '#FF3B30' }, confirmText: 'chat.singleChat.settings.clear' }
    );
};

const handleBlockOrUnblock = () => {
  if (isBlocked.value) {
    handleUnblock();
  } else {
    handleBlockBtnClick();
  }
};

const handleDeleteCharacter = () => {
  themeStore.showConfirm(
    t('chat.deleteCharacterTitle'),
    t('chat.deleteCharacterConfirm', { name: charName.value }),
    () => {
      singleStore.deleteCharacter(props.id);
      themeStore.showToast(t('chat.toast.deleteSuccess'), 'success');
      closeSettings();
      router.push({ name: 'chat-list' });
    },
    { messageStyle: { whiteSpace: 'pre-wrap', color: '#FF3B30' }, confirmText: 'delete' }
  );
};
</script>

<style scoped>
/* ================================================================================================
   根容器与布局
   ================================================================================================ */
.chat-settings {
    width: 100%; height: 100%; position: absolute; top: 0; left: 0;
    background: #F5F5F5; z-index: 500; display: flex; flex-direction: column;
}
.chat-settings .app-header { background: #f5f5f5; border-bottom: none; }
.settings-content { padding: 15px; overflow-y: auto; flex: 1; }

/* ================================================================================================
   卡片与折叠
   ================================================================================================ */
.card .card-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease-out; max-height: 1000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }
.card-title-remark { font-size: 12px; color: #FF3B30; padding: 0 18px 10px; margin-top: -10px; }

/* ================================================================================================
   表单项通用
   ================================================================================================ */
.settings-item-input { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
.label-col { display: flex; flex-direction: column; }
.label-main { font-size: 14px; color: #333; }
.label-sub { font-size: 11px; color: #999; margin-top: 2px; }
.form-item-vertical { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.form-item-vertical.no-border { border-bottom: none; }
.settings-section-title { font-size: 13px; font-weight: bold; color: #666; margin: 5px 0 10px; }
.settings-divider { height: 1px; background-color: #f0f0f0; margin: 15px 0; }

/* ================================================================================================
   角色与用户信息布局
   ================================================================================================ */
.role-header-layout, .user-header-layout { display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start; }
.role-avatar-wrapper, .user-avatar-wrapper {
    width: 90px; height: 90px; border-radius: 8px; background-color: #f0f0f0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    overflow: hidden; flex-shrink: 0; position: relative;
}
.role-avatar-img, .user-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.role-avatar-placeholder { font-size: 12px; color: #999; text-align: center; padding: 5px; }
.role-inputs-wrapper, .user-inputs-wrapper {
    flex: 1; display: flex; flex-direction: column; gap: 10px;
    height: 90px; justify-content: space-between;
}
.user-actions-row { display: flex; gap: 10px; }
.btn-mini-grow { flex: 1; padding: 6px 0; font-size: 13px; }

/* ================================================================================================
   聊天美化
   ================================================================================================ */
.settings-row-group { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
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
.slider-container { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end; }
.slider-container input[type=range] { flex: 1; max-width: 150px; }
.slider-value { font-size: 14px; color: #666; min-width: 24px; text-align: right; }

/* ================================================================================================
   视频通话设置
   ================================================================================================ */
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

/* ================================================================================================
   其他组件
   ================================================================================================ */
.reply-length-container { display: flex; align-items: center; gap: 5px; }
.settings-btn-row { display: flex; gap: 10px; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.avatar-layout { display: flex; gap: 15px; }
.avatar-controls { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* ================================================================================================
   危险操作区域
   ================================================================================================ */
.danger-zone {
  margin-bottom: 10px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.danger-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.danger-btn-title {
  font-size: 16px;
  font-weight: 600;
}
.danger-btn-desc {
  font-size: 12px;
  opacity: 0.85;
  font-weight: normal;
}

/* Location Input Group */
.location-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 5px;
}
.location-display {
  font-size: 11px;
  color: #888;
  margin-top: 5px;
}
</style>
