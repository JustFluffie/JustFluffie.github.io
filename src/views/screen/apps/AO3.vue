<template>
  <AppLayout :title="'Archive of Our Own'" no-padding class="ao3-layout">
    <template #back-btn>
      <div class="ao3-logo-btn">
        <img src="https://i.ibb.co/Kj4DKhHd/ao3-Photo-Grid-1-1-1.png" alt="AO3" />
      </div>
    </template>

    <template #action>
      <SvgIcon name="refresh" @click="showGenerateModal = true" class="icon-refresh"/>
    </template>

    <div class="ao3-page">
      <!-- 角色和用户选择栏（透明，可滚动） -->
      <div class="selection-bar">
        <div class="selection-group">
          <select v-model="selectedCharId" @change="onSelectionChange">
            <option value="" disabled>角色</option>
            <option v-for="char in characters" :key="char.id" :value="char.id">
              {{ char.name }}
            </option>
          </select>
        </div>
        <div class="selection-group">
          <select v-model="selectedUserId" @change="onSelectionChange">
            <option value="" disabled>用户</option>
            <option v-for="user in userPersonas" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 元数据卡片 -->
      <div class="work-meta-card" v-if="generatedWork">
        <div class="work-meta">
          <div class="preface-group">
            <span class="meta-label">评级：</span>
            <a href="#" class="tag">{{ generatedWork.rating }}</a>
          </div>

          <div class="preface-group">
            <span class="meta-label">关系：</span>
            <a href="#" class="tag">{{ generatedWork.relationship }}</a>
          </div>

          <div class="preface-group">
            <span class="meta-label">人物：</span>
            <a href="#" class="tag" v-for="(character, idx) in generatedWork.characters" :key="idx">
              {{ character }}
            </a>
          </div>

          <div class="preface-group">
            <span class="meta-label">其他标签：</span>
            <a href="#" class="tag" v-for="(tag, idx) in generatedWork.tags" :key="idx">
              {{ tag }}
            </a>
          </div>

          <!-- 统计数据 -->
          <div class="preface-group">
            <span class="meta-label">统计数据：</span>
            <div class="stats-row">
              <span class="stat-item">发布: <strong>{{ generatedWork.publishDate }}</strong></span>
              <span class="stat-item">字数: <strong>{{ generatedWork.wordCount }}</strong></span>
              <span class="stat-item">章节: <strong>{{ generatedWork.chapters }}</strong></span>
              <span class="stat-item">Kudos: <strong>{{ generatedWork.kudos }}</strong></span>
              <span class="stat-item">书签: <strong>{{ generatedWork.bookmarks }}</strong></span>
              <span class="stat-item">点击: <strong>{{ generatedWork.hits }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 作品标题 -->
      <div class="work-title" v-if="generatedWork">
        <h2>{{ generatedWork.title }}</h2>
        <div class="byline">{{ generatedWork.author }}</div>
      </div>

      <!-- 摘要 -->
      <div class="summary" v-if="generatedWork">
        <h3>Summary：</h3>
        <div class="summary-text">
          <p>{{ generatedWork.summary }}</p>
        </div>
      </div>

      <!-- 正文 -->
      <div class="userstuff" v-if="generatedWork">
        <p v-for="(paragraph, idx) in generatedWork.content" :key="idx" class="content-paragraph">
          {{ paragraph }}
        </p>
      </div>

      <!-- 占位提示 -->
      <div class="placeholder" v-if="!generatedWork && !isGenerating">
        <p>请选择角色和用户，然后点击右上角刷新按钮等待同人文创作</p>
      </div>

      <!-- 加载中提示 -->
      <div class="loading-state" v-if="isGenerating">
        <div class="loading-spinner"></div>
        <p>正在创作同人文，请稍候...</p>
        <p class="sub-hint">这可能需要一分钟左右的时间</p>
      </div>

      <!-- 底部导航 -->
      <div class="chapter-navigation" v-if="generatedWork">
        <a href="#" @click.prevent="scrollToTop">返回顶部 ↑</a>
      </div>

      <!-- 页脚 -->
      <div class="footer">
        <p>Archive of Our Own, a project of the <a href="#">Organization for Transformative Works</a></p>
      </div>
    </div>

    <!-- 生成参数弹窗 -->
    <Modal v-model:visible="showGenerateModal">
      <div class="generate-modal">
        <h3>创作同人文</h3>
        
        <div class="form-group">
          <label>关键词/标签（可选）：</label>
          <input 
            v-model="generateParams.keywords" 
            type="text" 
            placeholder="例如：甜文、校园、现代AU等，用逗号分隔"
            class="input-field"
          />
          <p class="hint">这些关键词将作为创作提示，不会显示在标签栏中</p>
        </div>

        <div class="form-group">
          <label>字数区间：</label>
          <div class="word-count-range">
            <input 
              v-model.number="generateParams.minWords" 
              type="number" 
              placeholder="最小字数"
              class="input-field"
              min="100"
            />
            <span class="separator">-</span>
            <input 
              v-model.number="generateParams.maxWords" 
              type="number" 
              placeholder="最大字数"
              class="input-field"
              min="100"
            />
          </div>
          <p class="hint">建议范围：500-3000字</p>
        </div>

        <div class="modal-actions">
          <button @click="showGenerateModal = false" class="btn-cancel">取消</button>
          <button @click="generateFanfic" class="btn-confirm" :disabled="isGenerating">
            {{ isGenerating ? '创作中...' : '创作' }}
          </button>
        </div>
      </div>
    </Modal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import SvgIcon from '@/components/common/SvgIcon.vue'
import Modal from '@/components/common/Modal.vue'
import { useChatStore } from '@/stores/chatStore'
import { useApiStore } from '@/stores/apiStore'
import { useThemeStore } from '@/stores/themeStore'

const chatStore = useChatStore()
const apiStore = useApiStore()
const themeStore = useThemeStore()

// 角色和用户选择
const selectedCharId = ref('')
const selectedUserId = ref('')

// 生成参数
const showGenerateModal = ref(false)
const generateParams = ref({
  keywords: '',
  minWords: 500,
  maxWords: 600
})

const isGenerating = ref(false)

// 生成的作品数据
const generatedWork = ref(null)

// 本地存储相关常量
const STORAGE_KEY = 'ao3_generated_work'
const EXPIRATION_TIME = 72 * 60 * 60 * 1000 // 72小时

// 保存数据到本地存储
const saveWorkToStorage = (work) => {
  const data = {
    work,
    charId: selectedCharId.value,
    userId: selectedUserId.value,
    timestamp: Date.now()
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 从本地存储加载数据
const loadWorkFromStorage = () => {
  const json = localStorage.getItem(STORAGE_KEY)
  if (!json) return null

  try {
    const data = JSON.parse(json)
    const now = Date.now()
    
    // 检查是否过期
    if (now - data.timestamp > EXPIRATION_TIME) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    return data
  } catch (e) {
    console.error('Failed to load AO3 work from storage', e)
    return null
  }
}

// 获取角色和用户列表
const characters = computed(() => chatStore.characters)
const userPersonas = computed(() => chatStore.userPersonas)

const selectedChar = computed(() => {
  return characters.value.find(c => c.id === selectedCharId.value)
})

const selectedUser = computed(() => {
  return userPersonas.value.find(u => u.id === selectedUserId.value)
})

// 选择变化时的处理
const onSelectionChange = () => {
  // 可以在这里添加一些逻辑
}

// 生成同人文
const generateFanfic = async () => {
  if (!selectedCharId.value || !selectedUserId.value) {
    themeStore.showToast('请先选择角色和用户', 'error')
    return
  }

  if (!generateParams.value.minWords || !generateParams.value.maxWords) {
    themeStore.showToast('请输入字数区间', 'error')
    return
  }

  if (generateParams.value.minWords > generateParams.value.maxWords) {
    themeStore.showToast('最小字数不能大于最大字数', 'error')
    return
  }

  isGenerating.value = true
  showGenerateModal.value = false

  try {
    const char = selectedChar.value
    const user = selectedUser.value

    // 构建生成提示
    const prompt = buildGenerationPrompt(char, user, generateParams.value)
    
    // 调用API生成
    // 采用自动降级策略：优先尝试不限制 token (拉满)，如果失败则尝试设置较大的安全值，最后尝试保底值
    let response = null
    let lastError = null

    const strategies = [
      { name: 'unlimited', maxTokens: undefined },
      { name: 'large', maxTokens: 4000 },
      { name: 'safe', maxTokens: 2000 }
    ]

    for (const strategy of strategies) {
      try {
        console.log(`尝试生成策略: ${strategy.name}`)
        const options = { silent: true } // 静默模式，由 AO3.vue 处理错误
        if (strategy.maxTokens) {
          options.max_tokens = strategy.maxTokens
        }
        
        const res = await apiStore.getGenericCompletion([
          { role: 'user', content: prompt }
        ], options)
        
        if (res && res.content) {
          response = res
          break // 成功，跳出循环
        } else if (res.error) {
           throw res.error
        } else {
           throw new Error('API returned empty response')
        }
      } catch (error) {
        console.warn(`策略 ${strategy.name} 失败:`, error)
        lastError = error
        // 继续尝试下一个策略
      }
    }

    if (response && response.content) {
      // 解析生成的内容
      const success = parseGeneratedContent(response.content, char, user)
      if (success) {
        themeStore.showToast('同人文创作成功！', 'success')
      }
    } else {
      throw lastError || new Error('创作失败，请重试')
    }
  } catch (error) {
    console.error('同人文失败:', error)
    let errorMsg = error.message
    if (errorMsg.includes('405')) {
      errorMsg = 'API 请求被拒绝 (405)。请检查 API URL 设置是否正确，或尝试更换模型。'
    } else if (errorMsg.includes('400')) {
      errorMsg = 'API 请求参数错误 (400)。可能是上下文过长或参数不支持。'
    }
    themeStore.showToast('创作失败：' + errorMsg, 'error')
  } finally {
    isGenerating.value = false
  }
}

// 构建生成提示
const buildGenerationPrompt = (char, user, params) => {
  const keywordsText = params.keywords ? `\n用户想看的类型/关键词：${params.keywords}` : ''
  
  return `你是一位专业的同人文作者，请为以下角色和用户创作一篇AO3风格的同人文。

# 角色信息
- 角色名：${char.name}
- 角色设定：${char.card || '无特殊设定'}

# 用户信息
- 用户名：${user.name}
- 用户设定：${user.card || '无特殊设定'}
${keywordsText}

# 创作要求
1. **字数严格控制**：正文必须在${params.minWords}-${params.maxWords}字之间。
2. **元数据要求**：
   - 评级：从以下选择一个：General Audiences（全年龄）、Explicit（限制级）。
   - 关系：格式必须为"${char.name}×${user.name}"。
   - 人物：列出主要人物（包括${char.name}和${user.name}）。
   - 其他标签：必须基于生成的文章内容提取3-6个标签（例如具体的play、情感基调、核心梗等）。**严禁直接复制用户输入的关键词**，除非该关键词在文中得到了具体体现。标签应反映文章的实际内容。
   - 统计数据：随机生成合理的数据。
3. **摘要**：必须用一句话概括全文，风格不限。
4. **正文**：
   - 必须分段，每段之间用换行符分隔。
   - **不要**在段首手动添加空格，前端会自动处理缩进。
   - 内容要符合角色设定和用户提供的关键词。

# 输出格式（严格按照以下JSON格式输出）
\`\`\`json
{
  "title": "作品标题",
  "author": "作者笔名",
  "rating": "评级",
  "relationship": "${char.name}×${user.name}",
  "characters": ["${char.name}", "${user.name}"],
  "tags": ["标签1", "标签2", "标签3"],
  "summary": "一句话摘要",
  "content": ["第一段正文", "第二段正文", "第三段正文"],
  "wordCount": 实际字数,
  "publishDate": "2026-01-27",
  "chapters": "1/1",
  "kudos": 随机数字,
  "bookmarks": 随机数字,
  "hits": 随机数字
}
\`\`\`

请直接输出JSON，不要有任何其他文字。`
}

// 解析生成的内容
const parseGeneratedContent = (content, char, user) => {
  try {
    // 提取JSON内容
    let jsonStr = content.trim()
    
    // 尝试去除 markdown 代码块标记，更健壮的正则
    // 移除开头的 ```json 或 ```
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '')
    // 移除结尾的 ```
    jsonStr = jsonStr.replace(/\s*```$/, '')
    
    const data = JSON.parse(jsonStr)
    
    // 验证字数
    const totalWords = data.content.join('').length
    if (totalWords < generateParams.value.minWords || totalWords > generateParams.value.maxWords) {
      console.warn(`生成的字数(${totalWords})不在指定范围内，但仍然使用`)
    }
    
    // 确保关系格式正确
    data.relationship = `${char.name}×${user.name}`
    
    // 确保人物列表包含角色和用户
    if (!data.characters.includes(char.name)) {
      data.characters.unshift(char.name)
    }
    if (!data.characters.includes(user.name) && user.name !== char.name) {
      data.characters.push(user.name)
    }
    
    // 格式化字数显示
    data.wordCount = totalWords.toLocaleString()
    
    generatedWork.value = data
    
    // 保存到本地存储
    saveWorkToStorage(data)
    
    return true
  } catch (error) {
    console.error('解析生成内容失败:', error)
    console.log('原始内容:', content)
    
    let errorMsg = '解析生成内容失败：内容可能被截断或格式错误'
    // 如果内容看起来像是被截断的（以非闭合结构结尾）
    if (content.trim().slice(-1) !== '}') {
      errorMsg += '。这通常是因为模型上下文窗口不足，请尝试减少角色设定长度或更换支持更长上下文的模型。'
    }
    
    themeStore.showToast(errorMsg, 'error')
    return false
  }
}

// 滚动到顶部
const scrollToTop = () => {
  const pageElement = document.querySelector('.ao3-page')
  if (pageElement) {
    pageElement.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  chatStore.initData()
  
  // 加载保存的数据
  const savedData = loadWorkFromStorage()
  if (savedData) {
    generatedWork.value = savedData.work
    // 恢复选择状态（如果存在）
    if (savedData.charId) selectedCharId.value = savedData.charId
    if (savedData.userId) selectedUserId.value = savedData.userId
  }
})
</script>

<style>
/* 自定义顶部栏样式 */
.ao3-layout .app-header {
  background-color: #990000;
  border-bottom: none;
  padding-left: 2px;
}

.ao3-layout .app-header .back-btn,
.ao3-layout .app-header .action-btn {
  color: white;
}

.ao3-layout .app-header .title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 20px;
  font-weight: normal;
  letter-spacing: 1px;
  color: white;
  text-align: left;
  left: 59px;
  transform: none;
  width: auto;
}

/* 覆盖 AppLayout 默认样式，允许返回按钮变宽以适应长方形Logo */
.ao3-layout .app-header .back-btn {
  width: auto !important;
  margin-right: 8px;
}

.ao3-logo-btn {
  height: 44px;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: none;
}

.ao3-logo-btn img {
  height: 100%;
  width: auto;
  object-fit: contain;
}
</style>

<style scoped>
/* --- 页面主容器 --- */
.ao3-page {
  background-color: #ffffff;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #2a2a2a;
}

.icon-refresh {
  cursor: pointer;
  font-size: 20px;
  color: white;
}

/* 角色和用户选择栏 */
.selection-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 15px 0px;
  background-color: transparent;
  /* 移除 sticky 定位，使其随页面滑动 */
  position: relative;
  z-index: 1;
}

.selection-group {
  display: flex;
  align-items: center;
}

.selection-group select {
  background-color: transparent;
  border: none;
  font-size: 14px;
  font-weight: bold;
  color: #990000;
  text-align: right;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 0;
  cursor: pointer;
  outline: none;
}

/* 元数据卡片容器 */
.work-meta-card {
  margin: 15px 15px 20px;
  background-color: #fbfbfb;
  border-radius: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* 元数据框 */
.work-meta {
  padding: 10px 15px;
}

.preface-group {
  margin-bottom: 5px;
  padding-bottom: 5px;
}

.preface-group:last-of-type {
  padding-bottom: 0;
}

.meta-label {
  font-weight: bold;
  color: #555;
  font-size: 12px;
  display: inline-block;
  margin-bottom: 5px;
  margin-right: 0px;
}

.tag {
  display: inline-block;
  background-color: transparent;
  border-bottom: 1px dotted var(--text-tertiary);
  padding: 2px 0;
  margin: 0 8px 0 0;
  font-size: 12px;
  color: #333;
  text-decoration: none;
}

/* 统计信息 */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 20px;
  line-height: 1.6;
}

.stat-item {
  font-size: 12px;
  color: #666;
}

/* 作品标题 */
.work-title {
  padding: 15px 15px 10px;
  text-align: center;
}

.work-title h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 24px;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.3;
  font-weight: normal;
}

.byline {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13px;
  color: #990000;
  text-decoration: none;
}

/* 摘要 */
.summary {
  padding: 0px 70px;
  background-color: transparent;
}

.summary h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 14px;
  font-weight: bold;
  color: #555;
  margin-bottom: 10px;
  margin-left: 0.5em;
  border-bottom: 1px solid #000000;
}

.summary-text {
  margin: 0 auto;
  padding: 0 15px;
  background-color: transparent;
  font-size: 13px;
  line-height: 1.7;
  color: #333;
  text-align: left;
  max-width: 100%;
}

/* 正文内容 */
.userstuff {
  padding: 25px 15px;
  font-size: 14px;
  line-height: 1.8;
  color: #2a2a2a;
}

.content-paragraph {
  margin-bottom: 15px;
  text-indent: 2em; /* 每段开头空两个中文字符 */
}

/* 占位提示 */
.placeholder {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

/* 加载状态 */
.loading-state {
  padding: 60px 20px;
  text-align: center;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #990000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.sub-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 底部导航 */
.chapter-navigation {
  padding: 15px;
  text-align: center;
  background-color: #ffffff00;
}

.chapter-navigation a {
  color: #000000;
  text-decoration: none;
  font-size: 13px;
  font-weight: bold;
}

/* 页脚 */
.footer {
  background-color: #990000;
  color: #ccc;
  padding: 20px 15px;
  text-align: center;
  font-size: 11px;
}

.footer a {
  color: #fff;
  text-decoration: none;
}

/* 生成参数弹窗 */
.generate-modal {
  width: 100%;
}

.generate-modal h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11.5px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #990000;
}

.word-count-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.word-count-range .input-field {
  flex: 1;
}

.separator {
  color: #999;
  font-weight: bold;
}

.hint {
  margin-top: 6px;
  font-size: 11px;
  color: #999;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.modal-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

.btn-confirm {
  background-color: #990000;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background-color: #7a0000;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
