<template>
  <div class="page">
    <div class="page-body">
      <!-- 创作Hero -->
      <div class="create-hero">
        <div class="hero-pattern">🏺</div>
        <h2>创作空间</h2>
        <p>AI赋能，从学习到创作的跨越</p>
      </div>

      <!-- 工坊入口卡片 -->
      <div class="workshop-grid">
        <div class="workshop-card" @click="scrollTo('pattern-section')">
          <div class="card-visual pattern-bg">🏺</div>
          <div class="card-info">
            <h4>AI 纹样工坊</h4>
            <p>输入关键词生成纹样图</p>
          </div>
        </div>
        <div class="workshop-card" @click="scrollTo('writer-section')">
          <div class="card-visual writer-bg">✍️</div>
          <div class="card-info">
            <h4>AI 文案助手</h4>
            <p>生成 + 审查双步创作</p>
          </div>
        </div>
      </div>

      <!-- 纹样生成 -->
      <div class="section-header" id="pattern-section">
        <h3>纹样生成</h3>
        <span class="section-extra">AI 通义万相</span>
      </div>
      <div class="pattern-card">
        <div class="pattern-input-row">
          <input v-model="topic" placeholder="比如：青瓷莲瓣纹 粉青釉色" @keyup.enter="generatePatterns" />
          <button class="gen-btn" @click="generatePatterns" :disabled="!topic || generating">
            {{ generating ? '生成中' : '生成' }}
          </button>
        </div>
        <div v-if="patterns.length" class="pattern-results">
          <div
            v-for="(url, i) in patterns"
            :key="i"
            class="pattern-item"
            @click="previewPatternUrl = url"
          >
            <img :src="url" :alt="'纹样 ' + (i + 1)" />
          </div>
        </div>
        <div v-if="generating" class="skeleton-grid">
          <div class="skeleton" v-for="i in 4" :key="i" style="aspect-ratio:1;"></div>
        </div>
        <div v-if="patterns.length" class="pattern-footer">
          <button class="regen-btn" @click="generatePatterns" :disabled="generating">重新生成</button>
        </div>
      </div>

      <!-- 纹样历史（最近3张 + 更多） -->
      <div class="section-header">
        <h3>历史记录</h3>
        <span class="section-extra" @click="$router.push('/pattern-history')" style="cursor:pointer;">更多 ›</span>
      </div>
      <div v-if="patternHistory.length" class="history-grid">
        <div v-for="item in recentPatterns" :key="item.id" class="history-item">
          <img :src="item.image_url" :alt="item.topic" />
          <div class="history-topic">{{ item.topic }}</div>
        </div>
      </div>

      <!-- AI文案助手 -->
      <div class="section-header" id="writer-section">
        <h3>AI 文案助手</h3>
        <span class="section-extra">生成 + 审查</span>
      </div>
      <div class="writer-card">
        <div class="writer-input-row">
          <input v-model="articleTopic" placeholder="比如：龙泉青瓷的历史传承" @keyup.enter="generateArticle" />
        </div>
        <div class="writer-actions-top">
          <span class="craft-tag">AI 生成</span>
          <button class="gen-text-btn" @click="generateArticle" :disabled="!articleTopic || articleLoading">
            {{ articleLoading ? '生成中...' : '生成文案' }}
          </button>
        </div>

        <!-- 生成文案 -->
        <div v-if="articleContent" class="writer-output">
          {{ articleContent }}
        </div>
        <div v-if="articleLoading" class="skeleton" style="height: 100px;"></div>

        <!-- 禁忌词检查 -->
        <div v-if="tabooViolations.length" class="taboo-alert">
          <div v-if="tabooBlocked" class="taboo-blocked">
            ⛔ 文案触犯文化禁忌，请修改后发布
          </div>
          <div
            v-for="(item, i) in tabooViolations"
            :key="'taboo-' + i"
            :class="['review-item', item.level === '🔴' ? 'error' : 'warn']"
          >
            <span class="review-icon">{{ item.level }}</span>
            <div class="review-body">
              <span class="review-title">{{ item.type }}</span>
              <span class="review-desc">{{ item.message }}</span>
            </div>
          </div>
        </div>

        <!-- AI审查批注 -->
        <template v-if="reviews.length">
          <h4 class="review-heading">审查批注</h4>
          <div class="review-list">
            <div
              v-for="(item, i) in reviews"
              :key="i"
              :class="['review-item', item.level === '🔴' ? 'error' : 'warn']"
            >
              <span class="review-icon">{{ item.level }}</span>
              <div class="review-body">
                <span class="review-title">{{ item.type }}</span>
                <span class="review-desc">{{ item.message }}</span>
                <span class="review-suggestion" v-if="item.suggestion">{{ item.suggestion }}</span>
              </div>
            </div>
          </div>
        </template>

        <div v-if="articleContent" class="writer-footer">
          <button class="regen-text-btn" @click="generateArticle" :disabled="articleLoading">重新生成</button>
        </div>
      </div>

      <!-- 文案历史 -->
      <div class="section-header" style="margin-top: 20px;">
        <h3>历史文案</h3>
        <span class="section-extra" @click="$router.push('/article-history')" style="cursor:pointer;">更多 ›</span>
      </div>
      <div v-if="articleHistory.length" class="article-history-list">
        <div v-for="item in recentArticles" :key="item.id" class="article-history-item">
          <div class="article-history-topic">{{ item.topic }}</div>
          <div class="article-history-preview">{{ item.content.slice(0, 100) }}{{ item.content.length > 100 ? '...' : '' }}</div>
        </div>
      </div>

      <div style="height: 16px;"></div>
    </div>

    <!-- 纹样放大预览 -->
    <div class="preview-overlay" v-if="previewPatternUrl" @click="previewPatternUrl = null">
      <button class="preview-close" @click="previewPatternUrl = null">✕</button>
      <img :src="previewPatternUrl" alt="纹样预览" class="preview-img" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { generatePatternImage, generateArticleStream, reviewArticle as aiReview, checkTaboos } from '@/services/ai'
import { createPost, uploadImageFromUrl } from '@/services/supabase'
import { getLocalPatternHistory, saveLocalPatternHistory, getLocalArticleHistory, saveLocalArticleHistory, fetchMergedPatternHistory, fetchMergedArticleHistory, initDB } from '@/services/db'
import { logError } from '@/services/errorLog'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

function requireAuth() {
  if (authStore.isLoggedIn) return true
  if (confirm('请先登录或注册')) {
    router.push('/auth')
  }
  return false
}

const topic = ref('')
const articleTopic = ref('')

// 纹样生成
const patterns = ref([])
const previewPatternUrl = ref(null)
const generating = ref(false)
const patternHistory = ref([])
const articleHistory = ref([])

async function generatePatterns() {
  if (!requireAuth()) return
  if (!appStore.isOnline) {
    alert('AI功能需要联网使用')
    return
  }
  if (!topic.value.trim()) return
  generating.value = true
  patterns.value = []
  try {
    const tempUrls = await generatePatternImage(topic.value)
    patterns.value = tempUrls

    // 转存到 Supabase Storage 永久保存（临时链接会过期）
    const permanentUrls = []
    for (let i = 0; i < tempUrls.length; i++) {
      try {
        const path = `patterns/${authStore.user.id}/${Date.now()}_${i}.png`
        const permUrl = await uploadImageFromUrl(tempUrls[i], path)
        permanentUrls.push(permUrl)
        saveLocalPatternHistory(topic.value, permUrl)
      } catch {
        // 上传失败则回退保存临时链接
        saveLocalPatternHistory(topic.value, tempUrls[i])
      }
    }
    if (permanentUrls.length) patterns.value = permanentUrls
    patternHistory.value = getLocalPatternHistory()
  } catch (e) {
    logError('create:generatePatterns', e)
    alert('纹样生成失败：' + e.message)
  } finally {
    generating.value = false
  }
}

// 文案生成+审查
const articleContent = ref('')
const articleLoading = ref(false)
const reviews = ref([])
const reviewing = ref(false)
const tabooViolations = ref([])
const tabooBlocked = ref(false)

async function generateArticle() {
  if (!requireAuth()) return
  if (!appStore.isOnline) { alert('AI功能需要联网使用'); return }
  if (!articleTopic.value.trim()) return
  articleLoading.value = true
  articleContent.value = ''
  try {
    const text = await generateArticleStream(articleTopic.value, (_delta, full) => {
      articleContent.value = full
    })

    const tabooResult = await checkTaboos(text)
    tabooViolations.value = tabooResult.violations
    tabooBlocked.value = !tabooResult.passed

    await reviewArticle()

    saveLocalArticleHistory(articleTopic.value, text, reviews.value)
    articleHistory.value = getLocalArticleHistory()
  } catch (e) {
    logError('create:generateArticle', e)
    alert('文案生成失败：' + e.message)
  } finally {
    articleLoading.value = false
  }
}

async function reviewArticle() {
  if (!articleContent.value) return
  reviewing.value = true
  try {
    const result = await aiReview(articleContent.value)
    reviews.value = result || []
  } catch (e) {
    logError('create:reviewArticle', e)
  } finally {
    reviewing.value = false
  }
}

// 发布作品
async function publishWork() {
  if (!authStore.isLoggedIn) {
    router.push('/auth')
    return
  }

  const tabooResult = await checkTaboos(articleContent.value)
  tabooViolations.value = tabooResult.violations
  tabooBlocked.value = !tabooResult.passed

  if (tabooBlocked.value) {
    alert('文案包含文化禁忌内容（🔴标记项），请修改后再发布。')
    return
  }

  if (tabooViolations.value.length > 0) {
    const ok = confirm('文案存在 🟡 建议修改项（见下方批注），是否仍要发布？')
    if (!ok) return
  }

  const imageUrl = selectedPattern.value !== null
    ? patterns.value[selectedPattern.value]
    : patterns.value[0] || ''

  const post = {
    user_id: authStore.user.id,
    title: articleTopic.value,
    content: articleContent.value,
    image_url: imageUrl,
    craft_type: articleTopic.value,
    ai_review: reviews.value
  }
  const { error } = await createPost(post)
  if (!error) {
    alert('作品发布成功！')
    router.push('/community')
  } else {
    alert('发布失败，请重试')
  }
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const recentPatterns = computed(() => patternHistory.value.slice(0, 3))
const recentArticles = computed(() => articleHistory.value.slice(0, 2))

onMounted(async () => {
  try {
    patternHistory.value = await fetchMergedPatternHistory()
    articleHistory.value = await fetchMergedArticleHistory()
  } catch (e) { logError('create:loadHistory', e) }
  try {
    await initDB()
  } catch (e) { logError('create:initDB', e) }
})
</script>

<style scoped>
/* ====== Hero ====== */
.create-hero {
  margin-bottom: var(--space-lg);
  border-radius: var(--radius-lg);
  padding: 20px;
  background: linear-gradient(135deg, #FDF3E0 0%, #F5EDE0 50%, #E8D5A3 100%);
  position: relative;
  overflow: hidden;
}
.create-hero h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-dark);
}
.create-hero p {
  font-size: 13px;
  color: var(--ink-mid);
  margin-top: 4px;
}
.hero-pattern {
  position: absolute;
  top: -8px; right: -8px;
  width: 80px; height: 80px;
  opacity: 0.2;
  font-size: 64px;
  transform: rotate(15deg);
  line-height: 1;
}

/* ====== 工坊入口 ====== */
.workshop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}
.workshop-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.workshop-card:active { transform: scale(0.97); }
.card-visual {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
}
.card-visual.pattern-bg { background: linear-gradient(135deg, #E8F3ED, #C8E6D4); }
.card-visual.writer-bg { background: linear-gradient(135deg, #FDF3E0, #E8D5A3); }
.card-info { padding: 12px; }
.card-info h4 { font-size: 14px; font-weight: 600; color: var(--ink-dark); }
.card-info p { font-size: 11px; color: var(--ink-light); margin-top: 2px; }

/* ====== 分区标题 ====== */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding: 0 2px;
}
.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-dark);
}
.section-extra { font-size: 12px; color: var(--ink-light); }

/* ====== 纹样生成卡片 ====== */
.pattern-card {
  padding: var(--space-lg);
  background: var(--card-bg);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.04);
  margin-bottom: var(--space-xl);
}
.pattern-input-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.pattern-input-row input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--paper);
  outline: none;
  color: var(--ink-dark);
  transition: border-color 0.2s;
}
.pattern-input-row input:focus { border-color: var(--celadon); }
.pattern-input-row input::placeholder { color: var(--ink-disabled); }
.gen-btn {
  padding: 10px 20px;
  background: var(--gradient-brand);
  color: #FFF;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.gen-btn:active { opacity: 0.85; }
.gen-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.pattern-results {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}
.pattern-item {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  background: var(--paper-warm);
  transition: transform 0.15s;
}
.pattern-item:active { transform: scale(0.97); }
.pattern-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  margin-top: var(--space-md);
}
.pattern-footer {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}
.regen-btn {
  padding: 9px 24px;
  border: 1.5px solid var(--celadon-dark);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--celadon-dark);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.regen-btn:active { background: var(--celadon-pale); }
.regen-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ====== 纹样预览浮层 ====== */
.preview-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.92);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.preview-close {
  position: absolute; top: 16px; right: 16px; z-index: 10000;
  width: 36px; height: 36px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.15); color: #FFF; font-size: 20px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.preview-img {
  max-width: 95%; max-height: 80%;
  object-fit: contain; border-radius: var(--radius-sm);
}

/* ====== 纹样历史 ====== */
.history-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}
.history-item {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  background: var(--card-bg);
  border: 1px solid rgba(0,0,0,0.04);
}
.history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.history-topic {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 6px 8px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #FFF;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ====== 文案历史 ====== */
.article-history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}
.article-history-item {
  padding: 12px 14px;
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0,0,0,0.04);
  border-left: 3px solid var(--silk-gold);
}
.article-history-topic {
  font-size: 13px; font-weight: 600; color: var(--ink-dark);
  margin-bottom: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.article-history-preview {
  font-size: 12px; color: var(--ink-light); line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ====== 文案助手卡片 ====== */
.writer-card {
  padding: var(--space-lg);
  background: var(--card-bg);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.04);
}
.writer-input-row { margin-bottom: var(--space-md); }
.writer-input-row input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: var(--paper);
  outline: none;
  color: var(--ink-dark);
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.writer-input-row input:focus { border-color: var(--silk-gold); }
.writer-input-row input::placeholder { color: var(--ink-disabled); }
.writer-actions-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}
.craft-tag {
  display: inline-block;
  font-size: 11px;
  padding: 4px 12px;
  background: var(--celadon-pale);
  border-radius: var(--radius-full);
  color: var(--celadon-dark);
  font-weight: 500;
}
.gen-text-btn {
  padding: 9px 18px;
  background: linear-gradient(135deg, var(--silk-gold), #B8994E);
  color: #FFF;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.gen-text-btn:active { opacity: 0.85; }
.gen-text-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.writer-output {
  padding: 14px;
  background: var(--paper);
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 1.8;
  color: var(--ink-dark);
  border-left: 3px solid var(--silk-gold);
  margin-bottom: var(--space-md);
}
.writer-footer {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}
.regen-text-btn {
  padding: 9px 24px;
  border: 1.5px solid var(--silk-gold);
  border-radius: var(--radius-sm);
  background: transparent;
  color: #B8994E;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.regen-text-btn:active { background: #FDF3E0; }
.regen-text-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* 禁忌词 */
.taboo-alert { margin-bottom: var(--space-md); }
.taboo-blocked {
  padding: var(--space-md);
  background: #FCEAE9;
  border: 1px solid #F8CDD0;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--vermilion);
  text-align: center;
  margin-bottom: var(--space-sm);
}

/* 审查 */
.review-heading {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-dark);
  margin-bottom: var(--space-sm);
}
.review-list { display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-lg); }

.review-item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}
.review-item.warn { background: #FFF8E1; border: 1px solid #FFE082; }
.review-item.error { background: #FCEAE9; border: 1px solid #F8CDD0; }
.review-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.review-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.review-title { font-size: 12px; font-weight: 600; color: var(--ink-dark); }
.review-desc { font-size: 12px; color: var(--ink-mid); line-height: 1.5; }
.review-suggestion { font-size: 11px; color: #9A7B3C; }
</style>
