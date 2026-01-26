<template>
  <AppLayout :title="t('api.title')">
    <template #action>
      <button class="header-save-btn" @click="saveAllSettings">{{ t('save') }}</button>
    </template>
    <!-- 1. 全局 API 配置 -->
      <div class="card">
        <div class="card-title">{{ t('api.globalConfig') }}</div>
        <div class="card-content">
            <!-- 第一行：预设选择器、保存、删除 -->
            <div class="api-item-row">
                <div style="flex: 1; min-width: 0;">
                    <CustomSelect
                      :model-value="apiStore.activePresetName"
                      :options="apiStore.presets.map(p => ({ value: p.name, label: p.name }))"
                      @update:model-value="apiStore.switchPreset($event)"
                      textAlign="left"
                      style="width: 100%;"
                    />
                </div>
                <!-- 这里的保存按钮用于另存为新预设，保留 -->
                <button class="btn btn-secondary btn-sm" @click="saveAsNewPreset">{{ t('api.saveAs') }}</button>
                <button class="btn btn-danger-light btn-sm" @click="deletePreset">{{ t('delete') }}</button>
            </div>

            <!-- 第二行：API URL -->
            <div class="api-item-col">
                <label class="form-label" for="api-url">{{ t('api.apiUrl') }}</label>
                <input type="text" id="api-url" class="base-input" v-model="currentApiUrl" :placeholder="t('api.apiUrlPlaceholder')" autocomplete="new-password" />
            </div>

            <!-- 第三行：API Key -->
            <div class="api-item-col">
                <label class="form-label" for="api-key">{{ t('api.apiKey') }}</label>
                <input type="password" id="api-key" class="base-input" v-model="currentApiKey" :placeholder="t('api.apiKeyPlaceholder')" autocomplete="new-password" />
            </div>

            <!-- 第四行：模型选择器、拉取模型按钮 -->
            <div class="api-item-row">
                 <div class="list-item-title" style="font-weight: normal; white-space: nowrap;">{{ t('api.model') }}</div>
                 <div style="flex: 1; display: flex; gap: 10px; align-items: center; min-width: 0;">
                    <div style="flex: 1; min-width: 0; position: relative;">
                        <select class="native-select" v-model="currentModel">
                            <option v-if="apiStore.models.length === 0" value="" disabled>{{ t('api.modelPlaceholder') }}</option>
                            <option v-for="model in apiStore.models" :key="model" :value="model">
                                {{ model }}
                            </option>
                        </select>
                        <div class="select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm" @click="fetchModels" style="white-space: nowrap;">{{ t('api.fetch') }}</button>
                 </div>
            </div>

            <!-- 第五行：最高指令 -->
            <div class="api-item-col">
                <label class="form-label" for="master-prompt">{{ t('api.masterPrompt') }}</label>
                <textarea id="master-prompt" class="base-input" v-model="currentMasterPrompt" :placeholder="t('api.masterPromptPlaceholder')" rows="3" style="resize: vertical;"></textarea>
            </div>
        </div>
      </div>

      <!-- 2. 后台活动 -->
      <div class="card">
        <div class="card-title">{{ t('api.backgroundActivity') }}</div>
        <div class="card-title-note" style="padding: 0 16px 10px; margin-top: -10px; color: var(--danger-color);">{{ t('api.backgroundActivityWarning') }}</div>
        <div class="card-content">
            <div class="api-item-row">
                <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.proactiveMessages') }}</div>
                  <div class="list-item-subtitle">{{ t('api.proactiveMessagesDesc') }}</div>
                </div>
                <div class="toggle-switch" :class="{ active: localGlobalBackgroundActivity }" @click="localGlobalBackgroundActivity = !localGlobalBackgroundActivity"></div>
            </div>
          
            <template v-if="localGlobalBackgroundActivity">
                <div class="api-item-row">
                  <div class="list-item-content">
                    <div class="list-item-title">{{ t('api.scope') }}</div>
                  </div>
                  <div class="scope-selector" @click="showScopeModal = true">
                      <span>{{ scopeText }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>

                <div class="api-item-row">
                  <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.interval') }}</div>
                  </div>
                  <input type="number" v-model.number="localGlobalProactiveInterval" class="base-input base-input-short" placeholder="5" autocomplete="new-password">
                </div>

                <div class="api-item-row">
                  <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.cooldown') }}</div>
                  </div>
                  <input type="number" v-model.number="localGlobalProactiveCooldown" class="base-input base-input-short" placeholder="30" autocomplete="new-password">
                </div>

                <div class="api-item-row">
                  <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.dailyLimit') }}</div>
                  </div>
                  <input type="number" v-model.number="localGlobalProactiveDailyLimit" class="base-input base-input-short" placeholder="10" autocomplete="new-password">
                </div>

                <div class="api-item-row">
                  <div class="list-item-content">
                    <div class="list-item-title">{{ t('api.triggerMode') }}</div>
                    <div class="list-item-subtitle">{{ t('api.triggerModeIdleHint') }}</div>
                  </div>
                  <div class="mode-selector">
                    <div 
                      class="mode-option" 
                      :class="{ active: localGlobalTriggerMode === 'idle' }"
                      @click="localGlobalTriggerMode = 'idle'"
                    >{{ t('api.triggerModeIdle') }}</div>
                    <div 
                      class="mode-option" 
                      :class="{ active: localGlobalTriggerMode === 'always' }"
                      @click="localGlobalTriggerMode = 'always'"
                    >{{ t('api.triggerModeAlways') }}</div>
                  </div>
                </div>

                <div class="api-item-row" v-if="localGlobalTriggerMode === 'idle'">
                  <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.idleTime') }}</div>
                    <div class="list-item-subtitle">{{ t('api.idleTimeDesc') }}</div>
                  </div>
                  <input type="number" v-model.number="localGlobalProactiveIdleTime" class="base-input base-input-short" placeholder="15" autocomplete="new-password">
                </div>
            </template>
        </div>
      </div>

      <!-- 3. 通知设置 -->
      <div class="card">
        <div class="card-title">{{ t('api.notificationSettings') }}</div>
        <div class="card-content">
            <div class="api-item-row">
                <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.desktopNotifications') }}</div>
                  <div class="list-item-subtitle">{{ notificationPermissionStatus }}</div>
                </div>
                <div class="toggle-switch" :class="{ active: notificationStore.desktopNotificationsEnabled }" @click="handleToggleNotifications"></div>
            </div>
            <div class="api-item-row">
                <div class="list-item-content">
                  <div class="list-item-title">{{ t('api.testNotification') }}</div>
                  <div class="list-item-subtitle">{{ t('api.testNotificationDesc') }}</div>
                </div>
                <button class="btn btn-secondary btn-sm" @click="sendTestNotification">{{ t('api.test') }}</button>
            </div>
        </div>
      </div>

      <!-- 4. GitHub 云备份 -->
      <div class="card">
        <div class="card-title">{{ t('api.githubBackup') }}</div>
        <div class="card-content">
            <div class="api-item-col">
                <label class="form-label" for="github-token">{{ t('api.githubToken') }}</label>
                <div class="input-hint">{{ t('api.githubTokenHint') }}</div>
                <div style="display: flex; gap: 10px;">
                    <input type="password" id="github-token" class="base-input small-placeholder" v-model="localGithubToken" :placeholder="t('api.githubTokenPlaceholder')" style="flex: 1;" autocomplete="new-password" />
                    <button class="btn btn-secondary btn-sm" @click="openTokenPage">{{ t('api.getToken') }}</button>
                </div>
            </div>
            <div class="api-item-col">
                <label class="form-label" for="github-repo">{{ t('api.repoAddress') }}</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="github-repo" class="base-input" v-model="localGithubRepo" :placeholder="t('api.repoAddressPlaceholder')" style="flex: 1; min-width: 0;" autocomplete="new-password" />
                    <button class="btn btn-secondary btn-sm" @click="handleConfirmRepo" style="white-space: nowrap;">{{ t('confirm') }}</button>
                    <button class="btn btn-secondary btn-sm" @click="handleCreateRepo" :disabled="!localGithubToken" style="white-space: nowrap;">{{ t('api.createRepo') }}</button>
                </div>
            </div>
            <div class="api-item-row">
                <button class="btn btn-secondary" style="flex: 1;" @click="handleBackupNow" :disabled="backupStore.isBackingUp || backupStore.isRestoring">
                    {{ backupStore.isBackingUp ? t('api.backingUp') : t('api.backupNow') }}
                </button>
                <button class="btn btn-secondary" style="flex: 1;" @click="backupStore.restoreFromGitHub" :disabled="backupStore.isBackingUp || backupStore.isRestoring">
                    {{ backupStore.isRestoring ? t('api.restoring') : t('api.restoreBackup') }}
                </button>
            </div>
            <p v-if="backupStore.lastBackupTime" style="font-size: 12px; color: var(--text-tertiary); margin-top: 10px;">{{ t('api.lastBackup') }} {{ new Date(backupStore.lastBackupTime).toLocaleString() }}</p>
        </div>
      </div>

      <!-- 5. 图床设置 -->
      <div class="card">
        <div class="card-title">{{ t('api.imageHost') }}</div>
        <div class="card-content">
            <!-- 默认图床选择 -->
            <div class="api-item-row">
              <div class="list-item-content" style="flex: 1; min-width: 0;">
                <div class="list-item-title">{{ t('api.defaultImageHost') }}</div>
                <div class="list-item-subtitle">{{ t('api.defaultImageHostDesc') }}</div>
              </div>
              <div style="width: 120px; flex-shrink: 0;">
                <CustomSelect
                  :model-value="localImageHostProvider"
                  :options="imageHostOptions"
                  @update:model-value="localImageHostProvider = $event"
                  textAlign="right"
                />
              </div>
            </div>

            <!-- ImgBB API Key -->
            <div class="api-item-col">
                <label class="form-label" for="imgbb-api-key">{{ t('api.imgbbApiKey') }}</label>
                <div class="input-hint">{{ t('api.imgbbApiKeyHint') }}</div>
                <div style="display: flex; gap: 10px;">
                    <input type="password" id="imgbb-api-key" class="base-input small-placeholder" v-model="localImgbbApiKey" :placeholder="t('api.imgbbApiKeyPlaceholder')" style="flex: 1;" autocomplete="new-password" />
                    <button class="btn btn-secondary btn-sm" @click="openImgbbPage">{{ t('api.getImgbbApiKey') }}</button>
                </div>
            </div>

            <!-- Catbox User Hash -->
            <div class="api-item-col">
                <label class="form-label" for="catbox-hash">{{ t('api.catboxUserHash') }}</label>
                <div class="input-hint">{{ t('api.catboxUserHashHint') }}</div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="catbox-hash" class="base-input small-placeholder" v-model="localCatboxUserHash" :placeholder="t('api.catboxUserHashPlaceholder')" style="flex: 1;" autocomplete="new-password" />
                    <button class="btn btn-secondary btn-sm" @click="openCatboxPage">{{ t('api.getCatboxUserHash') }}</button>
                </div>
            </div>
        </div>
      </div>

      <!-- 6. 导出/导入备份 -->
      <div class="card">
        <div class="card-title">{{ t('api.dataBackup') }}</div>
        <div class="card-content">
            <p style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 15px;">{{ t('api.dataBackupDesc') }}</p>
            <div class="api-item-row" style="border-bottom: none; padding-bottom: 0;">
                <button class="btn btn-secondary" style="flex: 1;" @click="showExportModal = true">{{ t('api.exportBackupFile') }}</button>
                <button class="btn btn-secondary" style="flex: 1;" @click="backupStore.importBackupFile">{{ t('api.importBackupFile') }}</button>
            </div>
        </div>
      </div>

      <!-- 危险操作区域 -->
      <div class="danger-zone">
        <button class="btn btn-danger big-btn" @click="handleResetAllData">
          <div class="danger-btn-content">
            <div class="danger-btn-title">清除所有数据</div>
            <div class="danger-btn-desc">此操作将清除所有聊天记录、设置和本地数据，且无法恢复</div>
          </div>
        </button>
      </div>

      <!-- 导出选项模态框 -->
      <Modal v-model:visible="showExportModal" title="导出选项" bodyClass="no-padding">
        <div class="scope-list">
          <div class="scope-item" @click="toggleExportOption('chat')">
            <div class="scope-checkbox" :class="{ checked: exportOptions.chat }">
              <svg v-if="exportOptions.chat" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="scope-content">
                <span class="scope-name">聊天数据</span>
                <span class="scope-desc">包含聊天记录和朋友圈</span>
            </div>
          </div>
          <div class="scope-item" @click="toggleExportOption('characters')">
            <div class="scope-checkbox" :class="{ checked: exportOptions.characters }">
              <svg v-if="exportOptions.characters" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="scope-content">
                <span class="scope-name">角色数据</span>
                <span class="scope-desc">包含角色卡片、用户人设和收藏</span>
            </div>
          </div>
          <div class="scope-item" @click="toggleExportOption('settings')">
            <div class="scope-checkbox" :class="{ checked: exportOptions.settings }">
              <svg v-if="exportOptions.settings" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="scope-content">
                <span class="scope-name">应用设置</span>
                <span class="scope-desc">包含图床、后台活动等设置</span>
            </div>
          </div>
          <div class="scope-item" @click="toggleExportOption('appearance')">
            <div class="scope-checkbox" :class="{ checked: exportOptions.appearance }">
              <svg v-if="exportOptions.appearance" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="scope-content">
                <span class="scope-name">外观主题</span>
                <span class="scope-desc">包含主题、字体、气泡样式</span>
            </div>
          </div>
          <div class="scope-item" @click="toggleExportOption('worldbook')">
            <div class="scope-checkbox" :class="{ checked: exportOptions.worldbook }">
              <svg v-if="exportOptions.worldbook" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="scope-content">
                <span class="scope-name">世界书/预设</span>
                <span class="scope-desc">包含世界书和API预设</span>
            </div>
          </div>
        </div>
        <template #footer>
          <button class="modal-btn confirm" @click="handleExport">确认导出</button>
        </template>
      </Modal>

      <!-- 应用范围选择模态框 -->
      <Modal v-model:visible="showScopeModal" :title="t('api.selectScope')" bodyClass="no-padding">
        <div class="scope-list" style="max-height: 300px; overflow-y: auto;">
          <!-- 全选选项 -->
          <div class="scope-item" @click="toggleScope('all')">
            <div class="scope-checkbox" :class="{ checked: localGlobalProactiveScope && localGlobalProactiveScope.includes('all') }">
              <svg v-if="localGlobalProactiveScope && localGlobalProactiveScope.includes('all')" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span class="scope-name">{{ t('api.scopeAll') }}</span>
          </div>
          
          <!-- 角色列表 -->
          <div 
            v-for="char in singleStore.characters" 
            :key="char.id" 
            class="scope-item"
            @click="toggleScope(char.id)"
          >
            <div class="scope-checkbox" :class="{ checked: localGlobalProactiveScope && localGlobalProactiveScope.includes(char.id) }">
               <svg v-if="localGlobalProactiveScope && localGlobalProactiveScope.includes(char.id)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span class="scope-name">{{ char.name }}</span>
          </div>
        </div>
        <template #footer>
          <button class="modal-btn confirm" @click="showScopeModal = false">{{ t('confirm') }}</button>
        </template>
      </Modal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApiStore } from '@/stores/apiStore';
import { useBackgroundStore } from '@/stores/backgroundStore';
import { useBackupStore } from '@/stores/backupStore';
import { useSingleStore } from '@/stores/chat/singleStore';
import { useThemeStore } from '@/stores/themeStore';
import { useNotificationStore } from '@/stores/notificationStore';
import localforage from 'localforage';
import CustomSelect from '@/components/common/CustomSelect.vue';
import AppLayout from '@/components/common/AppLayout.vue';
import Modal from '@/components/common/Modal.vue';

const { t } = useI18n();
const apiStore = useApiStore();
const backgroundStore = useBackgroundStore();
const backupStore = useBackupStore();
const singleStore = useSingleStore();
const themeStore = useThemeStore();
const notificationStore = useNotificationStore();

// --- 本地状态 ---

// API Config
const currentApiKey = ref('');
const currentApiUrl = ref('');
const currentModel = ref('');
const currentMasterPrompt = ref('');

// Settings
const localGlobalBackgroundActivity = ref(false);
const localGlobalProactiveScope = ref([]);
const localGlobalProactiveInterval = ref(5);
const localGlobalProactiveCooldown = ref(30);
const localGlobalProactiveDailyLimit = ref(10);
const localGlobalTriggerMode = ref('always');
const localGlobalProactiveIdleTime = ref(15);

// Backup
const localGithubToken = ref('');
const localGithubRepo = ref('');

// Image Host
const localImageHostProvider = ref('catbox');
const localImgbbApiKey = ref('');
const localCatboxUserHash = ref('');
const imageHostOptions = ref([
  { value: 'none', label: '无' },
  { value: 'catbox', label: 'Catbox' },
  { value: 'imgbb', label: 'ImgBB' },
]);

// --- 初始化 ---

onMounted(() => {
    // Settings
    localGlobalBackgroundActivity.value = backgroundStore.globalBackgroundActivity;
    localGlobalProactiveScope.value = [...(backgroundStore.globalProactiveScope || [])];
    localGlobalProactiveInterval.value = backgroundStore.globalProactiveInterval;
    localGlobalProactiveCooldown.value = backgroundStore.globalProactiveCooldown;
    localGlobalProactiveDailyLimit.value = backgroundStore.globalProactiveDailyLimit;
    localGlobalTriggerMode.value = backgroundStore.globalTriggerMode;
    localGlobalProactiveIdleTime.value = backgroundStore.globalProactiveIdleTime;

    // Backup - 从 localStorage 加载
    localGithubToken.value = localStorage.getItem('github_token') || '';
    localGithubRepo.value = localStorage.getItem('github_repo') || '';

    // Image Host
    localImageHostProvider.value = apiStore.imageHostProvider;
    localImgbbApiKey.value = apiStore.imgbbApiKey;
    localCatboxUserHash.value = apiStore.catboxUserHash;
});

// 获取当前激活的预设的计算属性
const activePreset = computed(() => {
  return apiStore.presets.find(p => p.name === apiStore.activePresetName) || null;
});

// 监视 activePreset 的变化，并在变化时更新本地表单状态
watch(activePreset, (newPreset) => {
  if (newPreset) {
    currentApiKey.value = newPreset.apiKey;
    currentApiUrl.value = newPreset.apiUrl;
    currentModel.value = newPreset.model;
    currentMasterPrompt.value = newPreset.masterPrompt || '';
  }
}, { immediate: true, deep: true });

// --- 自动保存逻辑 ---

// 监视 API 相关设置的变化并自动保存
watch([currentApiKey, currentApiUrl, currentModel, currentMasterPrompt], () => {
  if (apiStore.activePresetName) {
    const activePreset = apiStore.getActivePreset();
    apiStore.addPreset(apiStore.activePresetName, {
      ...activePreset, // 保留现有其他设置
      apiKey: currentApiKey.value,
      apiUrl: currentApiUrl.value,
      model: currentModel.value,
      masterPrompt: currentMasterPrompt.value,
    });
  }
});

// 监视后台活动设置的变化并自动保存
watch([
  localGlobalBackgroundActivity, 
  localGlobalProactiveScope, 
  localGlobalProactiveInterval, 
  localGlobalProactiveCooldown, 
  localGlobalProactiveDailyLimit, 
  localGlobalTriggerMode, 
  localGlobalProactiveIdleTime
], () => {
    backgroundStore.globalBackgroundActivity = localGlobalBackgroundActivity.value;
    backgroundStore.globalProactiveScope = localGlobalProactiveScope.value;
    backgroundStore.globalProactiveInterval = localGlobalProactiveInterval.value;
    backgroundStore.globalProactiveCooldown = localGlobalProactiveCooldown.value;
    backgroundStore.globalProactiveDailyLimit = localGlobalProactiveDailyLimit.value;
    backgroundStore.globalTriggerMode = localGlobalTriggerMode.value;
    backgroundStore.globalProactiveIdleTime = localGlobalProactiveIdleTime.value;
}, { deep: true });

// 监视备份设置的变化并自动保存
watch([localGithubToken, localGithubRepo], () => {
    backupStore.githubToken = localGithubToken.value;
    backupStore.githubRepo = localGithubRepo.value;
    // 持久化到 localStorage
    localStorage.setItem('github_token', localGithubToken.value);
    localStorage.setItem('github_repo', localGithubRepo.value);
});

// 监视图床设置的变化并自动保存
watch([localImageHostProvider, localImgbbApiKey, localCatboxUserHash], () => {
    apiStore.imageHostProvider = localImageHostProvider.value;
    apiStore.imgbbApiKey = localImgbbApiKey.value;
    apiStore.catboxUserHash = localCatboxUserHash.value;
}, { deep: true });

// --- 保存所有设置 (保留一个手动触发的方法，以防万一) ---
function saveAllSettings() {
    // 这个函数现在可以只显示一个 toast，因为数据已经自动保存了
    themeStore.showToast(t('api.toast.settingsSaved'));
}

// 另存为新预设
function saveAsNewPreset() {
  themeStore.showInput(
    t('api.prompt.saveAsPreset'),
    '',
    (name) => {
      if (name) {
        apiStore.addPreset(name, {
          apiKey: currentApiKey.value,
          apiUrl: currentApiUrl.value,
          model: currentModel.value,
          masterPrompt: currentMasterPrompt.value,
        });
        themeStore.showToast(t('api.toast.presetSaved', { name }));
      }
    },
    t('api.prompt.enterPresetName')
  );
}

// 删除预设
function deletePreset() {
  themeStore.showConfirm(
    t('api.confirm.deletePreset'),
    t('api.confirm.deletePresetMsg', { name: apiStore.activePresetName }),
    () => {
      apiStore.deletePreset(apiStore.activePresetName);
      themeStore.showToast(t('api.toast.presetDeleted'));
    }
  );
}

// 拉取模型
async function fetchModels() {
  // 直接使用当前输入框中的值进行拉取，无需先保存
  const tempPreset = {
    apiUrl: currentApiUrl.value,
    apiKey: currentApiKey.value,
  };
  await apiStore.fetchModels(tempPreset);
}

// --- 通知设置 ---
const notificationPermissionStatus = computed(() => {
  switch (notificationStore.permission) {
    case 'granted':
      return t('api.notificationsGranted');
    case 'denied':
      return t('api.notificationsDenied');
    default:
      return t('api.notificationsDefault');
  }
});

const handleToggleNotifications = () => {
  if (notificationStore.permission !== 'granted') {
    notificationStore.requestPermission();
  } else {
    // If permission is already granted, the toggle simply turns the feature on/off
    notificationStore.desktopNotificationsEnabled = !notificationStore.desktopNotificationsEnabled;
  }
};

const sendTestNotification = () => {
  // 1. Check if the feature is enabled in settings
  if (!notificationStore.desktopNotificationsEnabled) {
    themeStore.showToast('请先开启“桌面通知”开关。', 'warning');
    return;
  }
  // 2. Check if browser permission is granted
  if (notificationStore.permission !== 'granted') {
    themeStore.showToast('浏览器通知权限未授予，请点击开关重新授权。', 'warning');
    return;
  }

  // 3. If all checks pass, send the notification
  themeStore.showToast('测试通知已发送，请检查系统通知。');
  notificationStore.triggerNotification(
    '测试通知',
    '如果看到此消息，说明桌面通知功能正常。',
    '/pwa-192x192.png', // Using a public asset as icon
    () => {
      console.log('Test notification clicked!');
    }
  );
};

// --- 特殊处理：GitHub 操作 ---

const handleCreateRepo = async () => {
    // 先同步 Token 到 store，因为 createBackupRepo 使用 store 中的 token
    backupStore.githubToken = localGithubToken.value;
    await backupStore.createBackupRepo();
    // 创建成功后，同步 Repo 回本地状态
    localGithubRepo.value = backupStore.githubRepo;
};

const handleConfirmRepo = async () => {
    // 先同步设置到 store
    backupStore.githubToken = localGithubToken.value;
    backupStore.githubRepo = localGithubRepo.value;
    
    themeStore.showToast(t('api.verifying'));
    try {
        await backupStore.verifyBackupRepo();
        themeStore.showToast(t('api.verifySuccess'));
    } catch (error) {
        themeStore.showToast(error.message, 'error');
    }
};

const handleBackupNow = async () => {
    // 先同步设置到 store
    backupStore.githubToken = localGithubToken.value;
    backupStore.githubRepo = localGithubRepo.value;
    await backupStore.backupToGitHub();
};

function openTokenPage() {
  const url = 'https://github.com/settings/tokens/new?scopes=repo&description=Phone%20App%20Backup';
  window.open(url, '_blank');
}

function openImgbbPage() {
  window.open('https://api.imgbb.com/', '_blank');
}

function openCatboxPage() {
  window.open('https://catbox.moe/user/', '_blank');
}

// --- 危险操作：清除所有数据 ---
function handleResetAllData() {
  themeStore.showConfirm(
    '确认清除所有数据？',
    '此操作将永久删除所有本地存储的数据（包括聊天记录、API设置、背景图片等）。应用将重置为初始状态。请确保您已备份重要数据。',
    async () => {
      // 1. 清除所有 localStorage 数据
      localStorage.clear();

      // 2. 清除所有 localforage 数据
      try {
        await localforage.clear();
      } catch (error) {
        console.error("Error clearing localforage:", error);
      }
      
      // 3. 手动重置所有 store 到初始状态
      try {
        apiStore.$reset();
        backgroundStore.$reset();
        backupStore.$reset();
        singleStore.$reset();
        themeStore.$reset();
        notificationStore.$reset();
        // 如果有其他 store，也在这里添加
      } catch (error) {
        console.error("Error resetting stores:", error);
      }

      // 4. 刷新页面以确保所有内容都从初始状态加载
      window.location.reload();
    },
    { messageStyle: { color: '#FF3B30' }, confirmText: 'delete' }
  );
}

// --- 导出选项逻辑 ---
const showExportModal = ref(false);
const exportOptions = ref({
  chat: true,
  characters: true,
  settings: true,
  appearance: true,
  worldbook: true,
  presets: true,
});

function toggleExportOption(key) {
  if (key === 'worldbook') {
    const newState = !exportOptions.value.worldbook;
    exportOptions.value.worldbook = newState;
    exportOptions.value.presets = newState;
  } else {
    exportOptions.value[key] = !exportOptions.value[key];
  }
}

function handleExport() {
  backupStore.exportBackupFile(exportOptions.value);
  showExportModal.value = false;
}

// --- 应用范围选择逻辑 ---
const showScopeModal = ref(false);

const scopeText = computed(() => {
  const scope = localGlobalProactiveScope.value || [];
  if (scope.includes('all')) {
    return t('api.scopeAll');
  }
  if (scope.length === 0) {
    return t('api.scopeNone');
  }
  return t('api.scopeSelected', { count: scope.length });
});

function toggleScope(id) {
  const scope = localGlobalProactiveScope.value;
  
  if (id === 'all') {
    if (scope.includes('all')) {
      localGlobalProactiveScope.value = [];
    } else {
      localGlobalProactiveScope.value = ['all'];
    }
  } else {
    // 如果当前是全选，先清空再选这个
    if (scope.includes('all')) {
      localGlobalProactiveScope.value = [id];
    } else {
      const index = scope.indexOf(id);
      if (index > -1) {
        scope.splice(index, 1);
      } else {
        scope.push(id);
      }
      
      // 如果所有角色都选中了，转为全选
      if (singleStore.characters.length > 0 && scope.length === singleStore.characters.length) {
        localGlobalProactiveScope.value = ['all'];
      }
    }
  }
}
</script>

<style scoped>
/* 覆盖全局样式，使 label 颜色更深 */
.form-label {
    color: var(--text-primary);
    font-weight: 500;
}

.api-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
    gap: 10px;
}
.api-item-row:last-child {
    border-bottom: none;
}

.api-item-col {
    display: flex;
    flex-direction: column;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
}
.api-item-col:last-child {
    border-bottom: none;
}

.list-item-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.list-item-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

/* 覆盖 CustomSelect 默认宽度 */
:deep(.custom-select-wrapper) {
    width: 100% !important;
}

/* 应用范围选择器样式 */
.scope-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  transition: background 0.2s;
}

.scope-selector:active {
  background: #e0e0e0;
}

.scope-list {
  display: flex;
  flex-direction: column;
}

.scope-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
}

.scope-item:last-child {
  border-bottom: none;
}

.scope-item:active {
  background-color: var(--bg-light);
}

.scope-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--text-quaternary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
}

.scope-checkbox.checked {
  background-color: var(--accent-green);
  border-color: var(--accent-green);
}

.scope-name {
  font-size: 15px;
  color: var(--text-primary);
}

.scope-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scope-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

:deep(.no-padding) {
  padding: 0 !important;
}

/* 原生选择器样式 */
.native-select {
  width: 100%;
  padding: 8px 30px 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-white);
  color: var(--text-primary);
  font-size: 14px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-quaternary);
}

.card-title-note {
  font-size: 12px;
  font-weight: normal;
  color: var(--text-tertiary);
  margin-bottom: -8px;
}

.input-hint {
  font-size: 12px;
  color: var(--danger-color);
  margin-top: -3px;
  margin-bottom: 10px;
}

/* 危险操作区域样式 */
.danger-zone {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
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
</style>
