<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">纹样历史</h1>
      <button v-if="allImages.length || clearing" class="back-btn" style="color: var(--vermilion);" @click="clearAll" :disabled="clearing">{{ clearing ? '清空中...' : '清空' }}</button>
    </header>

    <div class="page-body">
      <template v-for="group in groupedImages" :key="group.label">
        <div class="date-label">{{ group.label }}</div>
        <div class="image-grid">
          <div v-for="item in group.items" :key="item.id" class="image-item" @click="previewItem = item">
            <img :src="item.image_url" :alt="item.topic" />
            <div class="image-topic">{{ item.topic }}</div>
            <button class="image-del" @click.stop="deleteItem(item.id)">✕</button>
          </div>
        </div>
      </template>

      <div v-if="!allImages.length" class="empty-state">
        <span class="icon">🏺</span>
        <span class="text">暂无纹样图片</span>
      </div>
    </div>

    <!-- 放大预览 -->
    <div class="preview-overlay" v-if="previewItem" @click="previewItem = null">
      <button class="preview-close" @click="previewItem = null">✕</button>
      <img :src="previewItem.image_url" :alt="previewItem.topic" class="preview-img" @click.stop />
      <div class="preview-info">{{ previewItem.topic }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchMergedPatternHistory, removeLocalPatternItem, clearLocalPatternHistory } from '@/services/db'

const allImages = ref([])
const previewItem = ref(null)

onMounted(async () => {
  allImages.value = await fetchMergedPatternHistory()
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

const groupedImages = computed(() => {
  const groups = {}
  for (const item of allImages.value) {
    const key = getDateGroup(item.created_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  const order = ['今天', '昨天', '本周内', '更早']
  return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }))
})

const clearing = ref(false)

async function deleteItem(id) {
  allImages.value = allImages.value.filter(item => item.id !== id)
  await removeLocalPatternItem(id)
}

async function clearAll() {
  if (clearing.value) return
  clearing.value = true
  allImages.value = []
  await clearLocalPatternHistory()
  clearing.value = false
}
</script>

<style scoped>
.date-label {
  font-size: 13px; font-weight: 600; color: var(--ink-light);
  padding: var(--space-xl) 0 var(--space-sm);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}
.image-item {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  background: var(--paper-warm);
  border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
}
.image-item img {
  width: 100%; height: 100%; object-fit: cover;
}
.image-topic {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 6px 28px 6px 8px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #FFF; font-size: 10px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.image-del {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.45); color: #FFF;
  font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}

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
.preview-img {
  max-width: 95%; max-height: 80%;
  object-fit: contain; border-radius: var(--radius-sm);
}
.preview-info {
  margin-top: 16px; color: rgba(255,255,255,0.6);
  font-size: 14px;
}

.empty-state {
  text-align: center; padding: 60px 20px; color: var(--ink-light);
}
.empty-state .icon { font-size: 40px; display: block; margin-bottom: 8px; }
.empty-state .text { font-size: 14px; }
</style>
