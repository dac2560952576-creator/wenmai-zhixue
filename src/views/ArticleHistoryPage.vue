<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">AI文案历史</h1>
      <button v-if="allArticles.length" class="back-btn" style="color: var(--vermilion);" @click="clearAll">清空</button>
    </header>

    <div class="page-body">
      <template v-for="group in groupedArticles" :key="group.label">
        <div class="date-label">{{ group.label }}</div>
        <div class="article-list">
          <div v-for="item in group.items" :key="item.id" class="article-item" @click="previewItem = item">
            <div class="article-topic">{{ item.topic }}</div>
            <div class="article-excerpt">{{ item.content.slice(0, 120) }}{{ item.content.length > 120 ? '...' : '' }}</div>
            <button class="article-del" @click.stop="deleteItem(item.id)">✕</button>
          </div>
        </div>
      </template>

      <div v-if="!allArticles.length" class="empty-state">
        <span class="icon">✍️</span>
        <span class="text">暂无文案记录</span>
      </div>
    </div>

    <!-- 全文预览 -->
    <div class="preview-overlay" v-if="previewItem" @click="previewItem = null">
      <button class="preview-close" @click="previewItem = null">✕</button>
      <div class="preview-scroll" @click.stop>
        <div class="preview-topic">{{ previewItem.topic }}</div>
        <div class="preview-content">{{ previewItem.content }}</div>
        <div v-if="previewItem.reviews && previewItem.reviews.length" class="preview-reviews">
          <h4>审查批注</h4>
          <div v-for="(r, i) in previewItem.reviews" :key="i" :class="['preview-review-item', r.level === '🔴' ? 'error' : 'warn']">
            <span class="review-level">{{ r.level }} {{ r.type }}</span>
            <p>{{ r.message }}</p>
            <p class="review-suggestion" v-if="r.suggestion">{{ r.suggestion }}</p>
          </div>
        </div>
        <div class="preview-date">{{ formatDate(previewItem.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchMergedArticleHistory, removeLocalArticleItem, clearLocalArticleHistory } from '@/services/db'

const allArticles = ref([])
const previewItem = ref(null)

onMounted(async () => {
  allArticles.value = await fetchMergedArticleHistory()
})

function getDateGroup(isoStr) {
  const d = new Date(isoStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  if (d >= today) return '今天'
  if (d >= yesterday) return '昨天'
  if (d >= weekAgo) return '本周内'
  return '更早'
}

const groupedArticles = computed(() => {
  const groups = {}
  for (const item of allArticles.value) {
    const key = getDateGroup(item.created_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  const order = ['今天', '昨天', '本周内', '更早']
  return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }))
})

function formatDate(isoStr) {
  const d = new Date(isoStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function deleteItem(id) {
  allArticles.value = allArticles.value.filter(item => item.id !== id)
  removeLocalArticleItem(id)
}

function clearAll() {
  clearLocalArticleHistory()
  allArticles.value = []
}
</script>

<style scoped>
.date-label {
  font-size: 13px; font-weight: 600; color: var(--ink-light);
  padding: var(--space-xl) 0 var(--space-sm);
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.article-item {
  padding: 14px 32px 14px 14px;
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
  position: relative;
  border-left: 3px solid var(--silk-gold);
  transition: background 0.15s;
}
.article-item:active { background: var(--paper-warm); }
.article-topic {
  font-size: 13px; font-weight: 600; color: var(--ink-dark);
  margin-bottom: 4px;
}
.article-excerpt {
  font-size: 12px; color: var(--ink-light); line-height: 1.5;
}
.article-del {
  position: absolute; top: 8px; right: 8px;
  width: 22px; height: 22px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.1); color: var(--ink-mid);
  font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.article-del:active { background: rgba(0,0,0,0.2); }

/* 预览 */
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
.preview-scroll {
  max-width: 90%; max-height: 70vh;
  overflow-y: auto;
  color: rgba(255,255,255,0.9);
  padding: 16px;
}
.preview-topic {
  font-size: 16px; font-weight: 700; margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}
.preview-content {
  font-size: 14px; line-height: 1.9; white-space: pre-wrap;
}
.preview-reviews {
  margin-top: 16px; padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.2);
}
.preview-reviews h4 { font-size: 14px; margin-bottom: 8px; }
.preview-review-item {
  padding: 8px 10px; border-radius: var(--radius-sm); margin-bottom: 6px;
  font-size: 12px;
}
.preview-review-item.warn { background: rgba(255,200,50,0.2); }
.preview-review-item.error { background: rgba(255,80,80,0.25); }
.review-level { font-weight: 600; }
.review-suggestion { color: rgba(255,255,255,0.6); margin-top: 2px; }
.preview-date {
  margin-top: 16px; font-size: 11px; color: rgba(255,255,255,0.4); text-align: center;
}

.empty-state {
  text-align: center; padding: 60px 20px; color: var(--ink-light);
}
.empty-state .icon { font-size: 40px; display: block; margin-bottom: 8px; }
.empty-state .text { font-size: 14px; }
</style>
