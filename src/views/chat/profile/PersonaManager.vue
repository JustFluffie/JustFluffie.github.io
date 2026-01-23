<template>
  <div class="persona-manager">
    <div class="persona-list">
      <!-- 空状态 -->
      <div v-if="userPersonas.length === 0" class="empty-state">
        <div class="empty-text">暂无用户人设</div>
        <div class="empty-subtext">点击右上角添加</div>
      </div>

      <div v-for="(persona, index) in userPersonas" :key="persona.id" class="persona-item">
        <!-- 列表项标题：预览头像和名字 -->
        <div class="item-header" @click="toggleExpand(persona.id)">
          <div class="preview-info">
            <div class="preview-avatar">
              <img v-if="persona.avatar" :src="persona.avatar" alt="Avatar">
              <div v-else class="avatar-placeholder">
                <span class="default-avatar-text">{{ (persona.name || '?')[0] }}</span>
              </div>
            </div>
            <div class="name-wrapper">
              <span class="preview-name">{{ persona.name || '未命名' }}</span>
              <span v-if="persona.isDefault" class="default-badge">默认</span>
            </div>
          </div>
          
          <div class="header-controls">
            <!-- 默认人设开关 -->
            <div class="default-switch-wrapper" @click.stop>
              <div 
                class="toggle-switch small" 
                :class="{ active: persona.isDefault }" 
                @click="setDefaultPersona(persona.id)"
              ></div>
            </div>
            
            <!-- 折叠箭头 -->
            <div class="collapse-arrow" :class="{ collapsed: expandedId !== persona.id }">
              <svg-icon name="chevron-down" />
            </div>
          </div>
        </div>

        <!-- 展开内容：编辑区域 -->
        <transition name="collapse">
          <div v-if="expandedId === persona.id" class="item-content-wrapper">
            <div class="item-content">
              <div class="user-header-layout">
                <div class="user-avatar-wrapper" @click="openAvatarModal(persona)">
                  <img v-if="persona.avatar" :src="persona.avatar" alt="User" class="role-avatar-img">
                  <div v-else class="role-avatar-placeholder">{{ t('chat.singleChat.settings.uploadAvatar') }}</div>
                </div>
                <div class="user-inputs-wrapper">
                  <div class="user-actions-row">
                    <div class="id-display">ID: {{ persona.id }}</div>
                    <button class="btn btn-danger btn-mini" @click.stop="deletePersona(persona.id)">{{ t('delete') }}</button>
                  </div>
                  <input type="text" v-model="persona.name" class="base-input" :placeholder="t('chat.singleChat.settings.userNamePlaceholder')" @input="debouncedSave">
                </div>
              </div>
              <div class="form-item-vertical">
                 <div class="label-main" style="margin-bottom:5px;">{{ t('chat.singleChat.settings.userPersona') }}</div>
                 <textarea v-model="persona.description" class="base-input" style="height: 80px; min-height: 40px;" :placeholder="t('chat.singleChat.settings.userPersonaPlaceholder')" @input="debouncedSave"></textarea>
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
      biz-type="userPersonaAvatar" 
      :title="t('chat.singleChat.settings.toast.setUserAvatar')" 
      @preview-ready="handleImagePreview"
      @upload-complete="handleImageUploadConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useThemeStore } from '@/stores/themeStore'
import SvgIcon from '@/components/common/SvgIcon.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'

const { t } = useI18n()
const singleStore = useSingleStore()
const themeStore = useThemeStore()

const expandedId = ref(null)
const showImageUploadModal = ref(false)
const currentEditingPersonaId = ref(null)

// 获取人设列表
const userPersonas = computed(() => singleStore.userPersonas || [])

const toggleExpand = (id) => {
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
  }
}

// 设置默认人设
const setDefaultPersona = (id) => {
  singleStore.userPersonas.forEach(p => {
    p.isDefault = (p.id === id)
  })
  singleStore.saveData()
}

// 自动保存防抖
let saveTimeout = null
const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    singleStore.saveData()
  }, 1000)
}

const createNewPersona = () => {
  const newId = Date.now().toString()
  const newPersona = {
    id: newId,
    name: '新人设',
    description: '',
    avatar: '',
    videoImg: '',
    isDefault: singleStore.userPersonas.length === 0 // 如果是第一个，设为默认
  }
  singleStore.userPersonas.push(newPersona)
  singleStore.saveData()
  expandedId.value = newId // 自动展开新创建的
  // 滚动到底部
  setTimeout(() => {
    const list = document.querySelector('.persona-manager')
    if (list) list.scrollTop = list.scrollHeight
  }, 100)
}

// 暴露给父组件调用
defineExpose({
  openAddModal: createNewPersona
})

const deletePersona = (id) => {
  themeStore.showConfirm(
    t('chat.singleChat.settings.toast.deletePersona'), 
    t('chat.singleChat.settings.toast.confirmDeletePersona'), 
    () => {
      const index = singleStore.userPersonas.findIndex(p => p.id === id)
      if (index !== -1) {
        const wasDefault = singleStore.userPersonas[index].isDefault
        singleStore.userPersonas.splice(index, 1)
        
        // 如果删除了默认人设，且还有其他人设，是否自动设第一个为默认？
        // 用户需求：当用户创建第一个用户人设时，此人设即为默认人设。
        // 并没有说删除时要自动转移。所以这里不自动转移，让用户自己选。
        
        // 检查是否有角色正在使用此人设，如果有，重置为空（即无）
        singleStore.characters.forEach(c => { 
          if (c.userPersona === id) c.userPersona = '' 
        })
        
        singleStore.saveData()
        themeStore.showToast(t('chat.singleChat.settings.toast.personaDeleted') || '已删除')
        if (expandedId.value === id) expandedId.value = null
      }
    }
  )
}

// 图片上传相关
const openAvatarModal = (persona) => {
  currentEditingPersonaId.value = persona.id
  showImageUploadModal.value = true
}

const handleImagePreview = (image) => {
  // 预览逻辑
}

const handleImageUploadConfirm = (image) => {
  const url = image.content
  const persona = singleStore.userPersonas.find(p => p.id === currentEditingPersonaId.value)
  if (persona) {
    persona.avatar = url
    singleStore.saveData()
    themeStore.showToast(t('chat.singleChat.settings.toast.avatarUpdated'))
  }
  showImageUploadModal.value = false
  currentEditingPersonaId.value = null
}

onMounted(() => {
  // 移除自动创建默认人设的逻辑
  // 如果需要清理旧的 ID='default' 数据，可以在这里做，但为了安全起见，暂时不做破坏性操作
})
</script>

<style scoped>
.persona-manager {
  height: 100%;
  overflow-y: auto;
  background: white;
}

.persona-list {
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

.persona-item {
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

.default-badge {
  font-size: 10px;
  background: #f0f0f0;
  color: #999;
  padding: 2px 6px;
  border-radius: 4px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.default-switch-wrapper {
  display: flex;
  align-items: center;
}

/* 小号开关样式 - 修复定位问题 */
.toggle-switch.small {
  width: 36px;
  height: 20px;
  /* 确保不被全局样式覆盖 */
  border-radius: 10px;
}

.toggle-switch.small::after {
  width: 16px;
  height: 16px;
  top: 2px;
  left: 2px;
  /* 重置全局样式的 transform */
  transform: none !important; 
  transition: left 0.3s ease;
}

.toggle-switch.small.active::after {
  left: 18px;
  transform: none !important;
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

/* 复用 Settings 样式 */
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
</style>
