<template>
  <div class="npc-manager">
    <div class="npc-list">
      <!-- 空状态 -->
      <div v-if="npcs.length === 0" class="empty-state">
        <div class="empty-text">暂无NPC</div>
        <div class="empty-subtext">点击右上角添加</div>
      </div>

      <div v-for="(npc, index) in npcs" :key="npc.id" class="npc-item">
        <!-- 列表项标题：预览头像和名字 -->
        <div class="item-header" @click="toggleExpand(npc.id)">
          <div class="preview-info">
            <div class="preview-avatar">
              <img v-if="npc.avatar" :src="npc.avatar" alt="Avatar">
              <div v-else class="avatar-placeholder">
                <span class="default-avatar-text">{{ (npc.name || '?')[0] }}</span>
              </div>
            </div>
            <div class="name-wrapper">
              <span class="preview-name">{{ npc.name || '未命名' }}</span>
            </div>
          </div>
          
          <div class="header-controls">
            <!-- 折叠箭头 -->
            <div class="collapse-arrow" :class="{ collapsed: expandedId !== npc.id }">
              <svg-icon name="chevron-down" />
            </div>
          </div>
        </div>

        <!-- 展开内容：编辑区域 -->
        <transition name="collapse">
          <div v-if="expandedId === npc.id" class="item-content-wrapper">
            <div class="item-content">
              <div class="user-header-layout">
                <div class="user-avatar-wrapper" @click="openAvatarModal(npc)">
                  <img v-if="npc.avatar" :src="npc.avatar" alt="User" class="role-avatar-img">
                  <div v-else class="role-avatar-placeholder">{{ t('chat.singleChat.settings.uploadAvatar') }}</div>
                </div>
                <div class="user-inputs-wrapper">
                  <div class="user-actions-row">
                    <div class="id-display">ID: {{ npc.id }}</div>
                    <button class="btn btn-danger btn-mini" @click.stop="deleteNpc(npc.id)">{{ t('delete') }}</button>
                  </div>
                  <input type="text" v-model="npc.name" class="base-input" :placeholder="t('chat.singleChat.settings.userNamePlaceholder')" @input="debouncedSave">
                </div>
              </div>
              <div class="form-item-vertical">
                 <div class="label-main" style="margin-bottom:5px;">简介</div>
                 <textarea v-model="npc.summary" class="base-input" style="height: 80px; min-height: 40px;" placeholder="输入NPC简介..." @input="debouncedSave"></textarea>
              </div>

              <div class="form-item-vertical">
                 <div class="label-main" style="margin-bottom:5px;">分组</div>
                 <input type="text" v-model="npc.group" class="base-input" placeholder="输入分组名称（相同分组可互动）" @input="debouncedSave">
              </div>

              <div class="settings-group" style="margin-top: 15px;">
                <!-- 独立后台活动 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <div class="setting-title">独立后台活动</div>
                    <div class="setting-desc">开启后NPC将自动在后台互动</div>
                    <div v-if="!backgroundStore.globalBackgroundActivity" class="setting-warning">需在API设置中开启全局后台活动</div>
                  </div>
                  <div class="toggle-switch" 
                       :class="{ active: npc.enableAutoReply && backgroundStore.globalBackgroundActivity, disabled: !backgroundStore.globalBackgroundActivity }" 
                       @click="toggleAutoReply(npc)"></div>
                </div>

                <!-- 行动冷却时间 -->
                <div class="setting-item" v-if="npc.enableAutoReply && backgroundStore.globalBackgroundActivity">
                  <div class="setting-label">
                    <div class="setting-title">行动冷却时间 (分钟)</div>
                  </div>
                  <input type="number" v-model.number="npc.replyCooldown" class="base-input small-input" min="1" @input="debouncedSave">
                </div>

                <!-- 关联用户 -->
                <div class="setting-item">
                  <div class="setting-label">
                    <div class="setting-title">关联用户</div>
                    <div class="setting-desc">允许与用户朋友圈互动</div>
                  </div>
                  <div class="toggle-switch" :class="{ active: npc.interactWithUser }" @click="toggleInteractWithUser(npc)"></div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 图片上传弹窗 -->
    <ImageUploadModal 
      v-model:visible="showImageUploadModal" 
      type="basic" 
      biz-type="npcAvatar" 
      :title="t('chat.singleChat.settings.toast.setUserAvatar')" 
      @preview-ready="handleImagePreview"
      @upload-complete="handleImageUploadConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBackgroundStore } from '@/stores/backgroundStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

const { t } = useI18n()
const singleStore = useSingleStore()
const themeStore = useThemeStore()
const backgroundStore = useBackgroundStore()

const expandedId = ref(null)
const showImageUploadModal = ref(false)
const currentEditingNpcId = ref(null)

// 获取NPC列表
const npcs = computed(() => singleStore.npcs || [])

const toggleExpand = (id) => {
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
  }
}

// 自动保存防抖
let saveTimeout = null
const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    singleStore.saveData()
  }, 1000)
}

const createNewNpc = () => {
  const newId = singleStore.addNpc('新NPC')
  expandedId.value = newId // 自动展开新创建的
  // 滚动到底部
  setTimeout(() => {
    const list = document.querySelector('.npc-manager')
    if (list) list.scrollTop = list.scrollHeight
  }, 100)
}

// 暴露给父组件调用
defineExpose({
  openAddModal: createNewNpc
})

const deleteNpc = (id) => {
  themeStore.showConfirm(
    '删除NPC', 
    '确定要删除这个NPC吗？', 
    () => {
      singleStore.deleteNpc(id)
      themeStore.showToast('已删除')
      if (expandedId.value === id) expandedId.value = null
    }
  )
}

// 图片上传相关
const openAvatarModal = (npc) => {
  currentEditingNpcId.value = npc.id
  showImageUploadModal.value = true
}

const handleImagePreview = (image) => {
  // 预览逻辑
}

const handleImageUploadConfirm = (image) => {
  const url = image.content
  const npc = singleStore.npcs.find(n => n.id === currentEditingNpcId.value)
  if (npc) {
    npc.avatar = url
    singleStore.saveData()
    themeStore.showToast(t('chat.singleChat.settings.toast.avatarUpdated'))
  }
  showImageUploadModal.value = false
  currentEditingNpcId.value = null
}

const toggleAutoReply = (npc) => {
  if (!backgroundStore.globalBackgroundActivity) {
    themeStore.showToast('请先在API设置中开启全局后台活动', 'warning')
    return
  }
  npc.enableAutoReply = !npc.enableAutoReply
  debouncedSave()
}

const toggleInteractWithUser = (npc) => {
  npc.interactWithUser = !npc.interactWithUser
  debouncedSave()
}
</script>

<style scoped>
.npc-manager {
  height: 100%;
  overflow-y: auto;
  background: white;
}

.npc-list {
  display: flex;
  flex-direction: column;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  color: #999;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 12px;
}

.npc-item {
  background: white;
  border-bottom: 1px solid #ebebeb;
  display: block;
}

.item-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: white;
}

.item-header:active {
  background: #f5f5f5;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-avatar {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  background: #F0F0F0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.collapse-arrow {
  transition: transform 0.3s ease;
  color: #999;
}

.collapse-arrow.collapsed {
  transform: rotate(-90deg);
}

.collapse-enter-active, .collapse-leave-active {
  transition: all 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
}

.collapse-enter-from, .collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.item-content-wrapper {
  background: #f9f9f9;
  border-top: 1px solid #f0f0f0;
}

.item-content {
  padding: 15px;
}

.user-header-layout {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: flex-start;
}

.user-avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.role-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.role-avatar-placeholder {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 5px;
}

.user-inputs-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 80px;
  justify-content: space-between;
}

.user-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.id-display {
  font-size: 12px;
  color: #999;
}

.btn-mini {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
}

.form-item-vertical {
  padding: 10px 0 0;
}

.label-main {
  font-size: 14px;
  color: #666;
}

.settings-group {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  flex: 1;
  margin-right: 10px;
}

.setting-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.setting-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.setting-warning {
  font-size: 12px;
  color: #ff3b30;
  margin-top: 2px;
}

.small-input {
  width: 80px;
  text-align: center;
}

.toggle-switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e5e5ea !important;
}
.toggle-switch.disabled::after {
  transform: translateX(0) !important;
}
</style>
