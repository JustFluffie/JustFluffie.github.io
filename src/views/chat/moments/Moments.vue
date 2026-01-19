<template>
  <div class="chat-moments"
       @touchstart="handleTouchStart" 
       @touchmove="handleTouchMove" 
       @touchend="handleTouchEnd">
    
    <!-- ==================== 模块: 下拉刷新指示器 ==================== -->
    <div class="pull-refresh-loading" :style="{ opacity: Math.min(pullDistance / 60, 1), transform: `rotate(${pullDistance * 5}deg)` }">
      <div class="loading-icon" :class="{ 'is-spinning': isRefreshing }">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="white"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"></path></svg>
      </div>
    </div>

    <!-- 内容容器 (用于实现下拉效果) -->
    <div class="moments-content-wrapper" :style="{ transform: `translateY(${pullDistance}px)` }">

      <!-- ==================== 模块: 朋友圈头部 ==================== -->
      <div class="moments-header">
        <div class="cover-image" :style="coverImage ? { backgroundImage: `url(${coverImage})` } : { backgroundColor: '#333' }" @click="openImageEdit('cover')">
          <!-- 用户信息区域 -->
          <div class="user-info">
            <input 
              v-model="userNameInput" 
              class="username-input" 
              @click.stop 
              @input="updateProfile('name')"
              placeholder="昵称"
            />
            <div class="avatar" :style="userAvatar ? { backgroundImage: `url(${userAvatar})` } : { backgroundColor: '#ccc' }" @click.stop="openImageEdit('avatar')"></div>
            <input 
              v-model="userSignatureInput" 
              class="signature-input" 
              @click.stop 
              @input="updateProfile('signature')"
              placeholder="个性签名"
            />
          </div>
        </div>
      </div>

      <!-- ==================== 模块: 动态列表 ==================== -->
      <div class="moments-list">
        <MomentItem 
          v-for="moment in moments" 
          :key="moment.id" 
          :moment="moment"
          :current-user-avatar="userAvatar"
          :current-user-name="userName"
          :is-menu-open="activeActionMenu === moment.id"
          @toggle-menu="toggleActionMenu"
          @like="handleLike"
          @comment="handleComment"
          @reply="handleReply"
          @long-press="handleMomentPressStart"
        />
      </div>

    </div> <!-- End of moments-content-wrapper -->

    <!-- ==================== 模块: 模态框与浮层 ==================== -->

    <!-- 评论输入框 -->
    <div v-if="showCommentInputModal" class="comment-input-overlay" @click="closeCommentInputModal">
        <div class="comment-input-box" @click.stop>
            <div class="comment-input-header" v-if="replyToUser">
                回复 {{ replyToUser.name }}:
            </div>
            <div class="comment-input-wrapper">
                <input 
                    ref="commentInputRef"
                    v-model="commentInputContent" 
                    class="base-input"
                    :placeholder="replyToUser ? `回复 ${replyToUser.name}` : '评论'" 
                    @keyup.enter="submitComment"
                />
                <button @click="submitComment" :disabled="!commentInputContent.trim()">发送</button>
            </div>
        </div>
    </div>

    <!-- 资料图片上传 (头像/封面) -->
    <ImageUploadModal
      v-model:visible="isUploadModalVisible"
      :title="uploadModalConfig.title"
      :bizType="uploadModalConfig.bizType"
      type="basic"
      @send-image="handleProfileImageUpload"
    />

    <!-- 动态操作菜单 (删除/重试) -->
    <Modal v-model:visible="showMomentOptionsModal" title="动态操作">
      <div class="modal-actions">
        <button v-if="selectedMomentForOptions" class="btn btn-secondary big-btn" @click="handleRetryMoment">重试</button>
        <button class="btn btn-secondary big-btn" @click="handleDeleteMoment">删除</button>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="closeMomentOptionsModal">取消</button>
      </template>
    </Modal>

    <!-- 评论操作菜单 (删除) -->
    <Modal v-model:visible="showCommentOptionsModal" title="评论操作">
      <div class="modal-actions">
        <button class="btn btn-secondary big-btn" @click="handleDeleteComment">删除</button>
      </div>
      <template #footer>
        <button class="modal-btn cancel" @click="closeCommentOptionsModal">取消</button>
      </template>
    </Modal>

    <!-- 发布动态 -->
    <PostMoment :show="showPostMomentModal" @close="closePostMomentModal" @post="handlePostMoment" />

    <!-- 图片/文本预览组件现已全局化 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, inject, reactive } from 'vue'
import PostMoment from './PostMoment.vue'
import MomentItem from './MomentItem.vue'
import Modal from '@/components/common/Modal.vue'
import ImageUploadModal from '@/components/common/ImageUploadModal.vue'
import { useSingleStore } from '@/stores/chat/singleStore'
import { useMomentsStore } from '@/stores/chat/momentsStore'
import { useThemeStore } from '@/stores/themeStore'
import { useApiStore } from '@/stores/apiStore'

const singleStore = useSingleStore()
const momentsStore = useMomentsStore()
const themeStore = useThemeStore()
const apiStore = useApiStore()
const setShowMomentsCamera = inject('setShowMomentsCamera')

// --- 3.1. 用户资料状态 ---
const coverImage = computed(() => momentsStore.userMomentsProfile.cover)
const userName = computed(() => momentsStore.userMomentsProfile.name)
const userAvatar = computed(() => momentsStore.userMomentsProfile.avatar)
const userSignature = computed(() => momentsStore.userMomentsProfile.signature)
const userNameInput = ref(userName.value || '我')
const userSignatureInput = ref(userSignature.value)

const moments = computed(() => {
  const currentUserId = 'user';
  return momentsStore.moments.filter(moment => {
    if (moment.userId === currentUserId) return true;
    const character = singleStore.getCharacter(moment.userId);
    if (character) {
        const momentVisibility = moment.visibility;
        if (!momentVisibility || momentVisibility.type === 'public') return true;
        if (momentVisibility.type === 'private' && momentVisibility.allowed?.includes(currentUserId)) return true;
    }
    return false;
  });
});
const activeActionMenu = ref(null)

// --- 3.3. 评论状态 ---
const showCommentInputModal = ref(false)
const commentInputContent = ref('')
const currentMomentId = ref(null)
const replyToUser = ref(null) // { id, name }
const commentInputRef = ref(null)

// --- 3.4. 资料图片编辑状态 ---
const isUploadModalVisible = ref(false)
const uploadModalConfig = reactive({ title: '', bizType: 'avatar' })
const imageEditType = ref('') // 'cover' or 'avatar'

// --- 3.5. 动态操作状态 (长按) ---
const showMomentOptionsModal = ref(false)
const selectedMomentForOptions = ref(null)

// --- 3.5.1 评论操作状态 ---
const showCommentOptionsModal = ref(false)
const selectedCommentForOptions = ref(null) // { momentId, commentId }

// --- 3.6. 下拉刷新状态 ---
const pullDistance = ref(0)
const isRefreshing = ref(false)
const startY = ref(0)

// --- 3.7. 发布动态状态 ---
const showPostMomentModal = ref(false)

watch(userName, (newVal) => { userNameInput.value = newVal })
watch(userSignature, (newVal) => { userSignatureInput.value = newVal })

onMounted(() => {
  document.addEventListener('click', closeMenuOnClickOutside)
  const momentsContainer = document.querySelector('.chat-moments');
  if (momentsContainer) momentsContainer.addEventListener('scroll', handleScroll);
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
  const momentsContainer = document.querySelector('.chat-moments');
  if (momentsContainer) momentsContainer.removeEventListener('scroll', handleScroll);
  if (setShowMomentsCamera) setShowMomentsCamera(true);
})

// --- 6.1. 数据获取与格式化 (Data & Display Helpers) ---
const getName = (userId) => {
  if (userId === 'user') return userName.value
  const char = singleStore.getCharacter(userId)
  return char ? char.name : '未知用户'
}

// --- 6.2. 用户资料相关操作 (Profile Management) ---
const updateProfile = (field) => {
  const value = field === 'name' ? userNameInput.value : userSignatureInput.value;
  momentsStore.updateUserMomentsProfile({ [field]: value })
}
const openImageEdit = (type) => {
  imageEditType.value = type;
  uploadModalConfig.title = type === 'cover' ? '修改封面' : '修改头像';
  uploadModalConfig.bizType = 'avatar';
  isUploadModalVisible.value = true;
}
const handleProfileImageUpload = (image) => {
  const url = image.type === 'url' ? image.content : image.content;
  if (url) momentsStore.updateUserMomentsProfile({ [imageEditType.value]: url });
  isUploadModalVisible.value = false;
}

// --- 6.3. 发布动态相关操作 (Moment Posting) ---
const openPostMomentModal = () => { showPostMomentModal.value = true }
const closePostMomentModal = () => { showPostMomentModal.value = false }
const handlePostMoment = (momentData) => {
  momentsStore.addMoment({
    userId: 'user',
    ...momentData,
    time: Date.now(),
    likes: [],
    comments: []
  })
  closePostMomentModal()
}

// --- 6.4. 动态条目操作 (Moment Item Actions) ---
const handleMomentPressStart = (moment) => {
    selectedMomentForOptions.value = moment
    showMomentOptionsModal.value = true
}

const closeMomentOptionsModal = () => {
    showMomentOptionsModal.value = false
    selectedMomentForOptions.value = null
}
const handleDeleteMoment = () => {
    if (selectedMomentForOptions.value) {
        momentsStore.deleteMoment(selectedMomentForOptions.value.id)
        closeMomentOptionsModal()
    }
}
const handleRetryMoment = async () => {
    if (!selectedMomentForOptions.value) return;
    
    themeStore.showToast('正在重新生成...', 'info');
    const momentId = selectedMomentForOptions.value.id;
    closeMomentOptionsModal();

    const success = await momentsStore.retryMoment(momentId);
    
    if (success) {
        themeStore.showToast('动态已更新', 'success');
    } else {
        themeStore.showToast('重试失败', 'error');
    }
}

// --- 6.5. 动态交互操作 (Moment Interactions - Like/Comment) ---
const handleLike = (moment) => {
  momentsStore.likeMoment(moment.id, 'user')
  activeActionMenu.value = null
}

const openCommentModal = (momentId, replyUser = null) => {
  currentMomentId.value = momentId
  replyToUser.value = replyUser
  commentInputContent.value = ''
  showCommentInputModal.value = true
  nextTick(() => commentInputRef.value?.focus())
}
const handleComment = (moment) => {
  openCommentModal(moment.id)
  activeActionMenu.value = null
}
const handleReply = (moment, comment) => {
    if (comment.userId === 'user') {
        // 询问是否删除
        selectedCommentForOptions.value = { momentId: moment.id, commentId: comment.id };
        showCommentOptionsModal.value = true;
    } else {
        // 回复别人的评论
        openCommentModal(moment.id, { id: comment.userId, name: getName(comment.userId) })
    }
}

const handleDeleteComment = () => {
    if (selectedCommentForOptions.value) {
        const { momentId, commentId } = selectedCommentForOptions.value;
        momentsStore.deleteComment(momentId, commentId);
        closeCommentOptionsModal();
    }
}

const closeCommentOptionsModal = () => {
    showCommentOptionsModal.value = false;
    selectedCommentForOptions.value = null;
}

const closeCommentInputModal = () => {
    showCommentInputModal.value = false
    currentMomentId.value = null
    replyToUser.value = null
    commentInputContent.value = ''
}
const submitComment = () => {
    if (!commentInputContent.value.trim() || !currentMomentId.value) return
    momentsStore.addComment(currentMomentId.value, {
        userId: 'user',
        content: commentInputContent.value,
        time: Date.now(),
        replyTo: replyToUser.value
    })
    closeCommentInputModal()
}

// --- 6.7. 下拉刷新逻辑 (Pull-to-Refresh Logic) ---
const handleTouchStart = (e) => {
  if (document.querySelector('.chat-moments').scrollTop !== 0) return;
  startY.value = e.touches[0].clientY
}
const handleTouchMove = (e) => {
  if (startY.value > 0 && !isRefreshing.value) {
    const diff = e.touches[0].clientY - startY.value;
    if (diff > 0) {
      pullDistance.value = Math.min(diff * 0.5, 100);
      if (diff > 10 && e.cancelable) e.preventDefault();
    }
  }
}
const handleTouchEnd = async () => {
  const resetPull = () => {
    const interval = setInterval(() => {
      pullDistance.value -= 5;
      if (pullDistance.value <= 0) {
        pullDistance.value = 0;
        startY.value = 0;
        clearInterval(interval);
      }
    }, 10);
  };

  if (pullDistance.value > 60 && !isRefreshing.value) {
    isRefreshing.value = true;
    pullDistance.value = 60;
    await momentsStore.triggerRandomCharacterMoment();
    setTimeout(() => {
      isRefreshing.value = false;
      resetPull();
    }, 500);
  } else if (!isRefreshing.value) {
    resetPull();
  }
}

// --- 6.8. UI辅助与事件处理 (UI Helpers & Event Handlers) ---
const toggleActionMenu = (id) => {
  activeActionMenu.value = activeActionMenu.value === id ? null : id;
}
const closeMenuOnClickOutside = (e) => {
  if (!e.target.closest('.actions')) activeActionMenu.value = null;
}
const handleScroll = (e) => {
  if (setShowMomentsCamera) {
    const coverHeight = 300; // .cover-image height
    setShowMomentsCamera(e.target.scrollTop < coverHeight / 2);
  }
}

defineExpose({
  openPostMomentModal
})
</script>

<style scoped>
/* ==================== 根组件与基础布局 ==================== */
.chat-moments {
  height: 100%;
  overflow-y: auto;
  background: #303030;
  position: relative;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.chat-moments::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* ==================== 下拉刷新 ==================== */
.pull-refresh-loading {
  position: absolute;
  top: 30px;
  left: 20px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 0;
}
.loading-icon {
  color: #ffffff;
  transition: transform 0.3s;
}
.loading-icon.is-spinning { animation: spin 1s linear infinite; }
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==================== 内容容器 ==================== */
.moments-content-wrapper {
  position: relative;
  z-index: 1;
  background: white;
  transition: transform 0.1s linear;
  min-height: 100%;
}

/* ==================== 头部模块 ==================== */
.moments-header {
  position: relative;
  margin-bottom: 40px;
}
.cover-image {
  height: 300px;
  background-size: cover;
  background-position: center;
  position: relative;
}

/* --- 用户信息 (头像, 昵称, 签名) --- */
.user-info {
  position: absolute;
  bottom: -50px;
  right: 20px;
  display: grid;
  grid-template-columns: auto 70px; 
  grid-template-rows: auto auto;
  column-gap: 8px; 
  row-gap: 10px;
  align-items: center;
  justify-content: end;
  justify-items: end;
  padding-right: 9px;
}
.username-input {
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  justify-self: end;
  transform: translate(1px, -10px);
  background: transparent;
  border: none;
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-align: right;
  width: auto;
  min-width: 50px;
  max-width: 200px;
  outline: none;
  padding: 2px 5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.username-input:focus {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.signature-input {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  transform: translate(0px, -4px);
  background: transparent;
  border: none;
  color: #666;
  font-size: 12px;
  text-align: right;
  width: 200px;
  outline: none;
  padding: 2px 0px;
}
.signature-input:focus {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
.avatar {
  grid-column: 2;
  grid-row: 1;
  margin: 0;
  width: 70px;
  height: 70px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
}

/* ==================== 动态列表模块 ==================== */
.moments-list {
  padding: 30px 29px 20px 20px;
}

/* ==================== 模态框与浮层 ==================== */
.modal-actions {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
}
.modal-actions .big-btn { font-weight: normal; }

/* --- 评论输入框 --- */
.comment-input-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.3);
    z-index: 150;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}
.comment-input-box {
    background: #f7f7f7;
    padding: 10px;
    padding-bottom: 20px; /* Safe area */
}
.comment-input-header {
    font-size: 12px;
    color: #999;
    margin-bottom: 5px;
    padding-left: 5px;
}
.comment-input-wrapper { display: flex; gap: 10px; }
.comment-input-wrapper input { flex: 1; padding: 8px 10px; }
.comment-input-wrapper button {
    padding: 0 15px;
    background: #07c160;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
}
.comment-input-wrapper button:disabled { background: #ccc; }
</style>
