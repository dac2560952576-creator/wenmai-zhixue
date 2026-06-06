<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">{{ craft?.name || '加载中...' }}</h1>
      <span></span>
    </header>

    <div class="page-body" v-if="craft">
      <!-- 基础信息 -->
      <div class="craft-meta">
        <span>{{ craft.region }}</span>
        <span>·</span>
        <span>{{ craft.era }}</span>
        <span class="tag tag-celadon">{{ craft.category }}</span>
      </div>
      <div class="tag-row">
        <span v-for="tag in craft.tags" :key="tag" class="tag tag-gold">{{ tag }}</span>
      </div>

      <!-- 完整文档 -->
      <div v-if="fullDocContent" class="doc-content" v-html="renderedDoc"></div>

      <!-- 无完整文档 -->
      <div v-if="!fullDocContent" class="detail-brief">
        <p>{{ craft.brief }}</p>
        <div class="detail-note">💡 进阶知识文档正在扩充中</div>
      </div>

    </div>

    <DocsAIAssistant v-if="craft" :craft-name="craft.name" :doc-content="fullDocContent" />

    <!-- 未找到 -->
    <div v-if="!craft" class="empty-state">
      <span class="icon">📖</span>
      <span class="text">工艺未找到</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getCachedKnowledgeDocs } from '@/services/ai'
import gsap from 'gsap'
import { markDocRead } from '@/services/db'
import craftsData from '@/data/工艺知识库.json'
import DocsAIAssistant from '@/components/DocsAIAssistant.vue'

const route = useRoute()

const craft = ref(null)
const fullDocContent = ref('')

// ---- 查找工艺 ----
function findCraft(id) {
  for (const cat of craftsData) {
    for (const item of cat.items) {
      if (item.id === id) return { ...item, category: cat.category }
    }
  }
  for (const cat of craftsData) {
    for (const item of cat.items) {
      if (item.name === id) return { ...item, category: cat.category }
    }
  }
  return null
}

// ---- 加载文档内容（同步） ----
function loadDocContent(id) {
  const item = findCraft(id)
  craft.value = item
  if (item && item.fullDoc) {
    const docs = getCachedKnowledgeDocs()
    fullDocContent.value = (docs && docs[item.name]) ? docs[item.name] : ''
  } else {
    fullDocContent.value = ''
  }
  if (item) markDocRead(item.id, item.name, item.category)
}

// ---- Markdown 渲染 ----
function renderMarkdown(md) {
  if (!md) return ''

  const lines = md.split('\n')
  const html = []
  let i = 0
  let inList = false
  let paraLines = []

  function closeList() {
    if (inList) { html.push('</ul>'); inList = false }
  }

  function flushPara() {
    if (paraLines.length) {
      html.push('<p>' + paraLines.map(l => inlineMarkdown(l.trim())).join('<br>') + '</p>')
      paraLines = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      flushPara()
      i++
      continue
    }

    const hMatch = trimmed.match(/^(#{1,3}) (.+)$/)
    if (hMatch) {
      closeList()
      flushPara()
      html.push(`<h${hMatch[1].length}>${inlineMarkdown(hMatch[2])}</h${hMatch[1].length}>`)
      i++
      continue
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      closeList()
      flushPara()
      html.push('<hr>')
      i++
      continue
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().includes('---')) {
      closeList()
      flushPara()
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      let table = '<table>'
      for (let r = 0; r < tableLines.length; r++) {
        const cells = tableLines[r].split('|').filter(c => c.trim())
        if (cells.length === 0) continue
        if (r === 1 && tableLines[r].includes('---')) continue
        const tag = r === 0 ? 'th' : 'td'
        const row = cells.map(c => `<${tag}>${inlineMarkdown(c.trim())}</${tag}>`).join('')
        table += `<tr>${row}</tr>`
      }
      table += '</table>'
      html.push(table)
      continue
    }

    const liMatch = trimmed.match(/^[\-*] (.+)$/)
    if (liMatch) {
      flushPara()
      if (!inList) { html.push('<ul>'); inList = true }
      html.push(`<li>${inlineMarkdown(liMatch[1])}</li>`)
      i++
      continue
    }

    closeList()
    paraLines.push(line)
    i++
  }

  closeList()
  flushPara()
  return html.join('')
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

const renderedDoc = computed(() => {
  return renderMarkdown(fullDocContent.value)
})

// ---- 初始化（setup 阶段，在初始渲染之前） ----
loadDocContent(route.params.id)

// ---- 路由切换时重新加载 ----
watch(() => route.params.id, (newId) => {
  loadDocContent(newId)
  animateDocContent()
})

// ---- 文档内容逐段浮现 ----
async function animateDocContent() {
  await nextTick()
  const els = document.querySelectorAll('.doc-content h1, .doc-content h2, .doc-content h3, .doc-content p, .doc-content ul, .doc-content table')
  if (els.length) {
    gsap.from(els, { opacity: 0, y: 16, duration: 0.45, stagger: 0.04, ease: 'power2.out' })
  }
}
onMounted(() => { animateDocContent() })
</script>

<style scoped>
.page { position: relative; }
.craft-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--ink-light); margin-bottom: var(--space-md);
}
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--space-md); }

.detail-brief { margin-top: var(--space-sm); }
.detail-brief p { font-size: 14px; line-height: 1.8; color: var(--ink-dark); }
.detail-note {
  margin-top: 20px; padding: 16px; background: var(--paper-warm);
  border-radius: var(--radius-md); font-size: 13px; color: #9A7B3C; text-align: center;
  border: 1px solid rgba(0,0,0,0.04);
}

.doc-content { margin-top: var(--space-lg); }

/* ====== 标题层级 ====== */
.doc-content h1 {
  font-size: 22px; font-weight: 700; margin: 32px 0 16px; color: var(--ink-dark);
  font-family: 'Noto Serif SC', serif; letter-spacing: 0.8px;
  text-align: center; padding-bottom: 12px;
  position: relative;
}
.doc-content h1::after {
  content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 48px; height: 2px; background: var(--celadon); border-radius: 1px;
}

.doc-content h2 {
  font-size: 17px; font-weight: 700; color: var(--celadon-dark); margin: 28px 0 12px;
  font-family: 'Noto Serif SC', serif; letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 10px;
}
.doc-content h2::before {
  content: ''; display: inline-block; width: 4px; height: 18px;
  background: var(--celadon); border-radius: 2px; flex-shrink: 0;
}

.doc-content h3 {
  font-size: 15px; font-weight: 600; margin: 22px 0 10px; color: var(--silk-gold);
  font-family: 'Noto Serif SC', serif;
}

/* ====== 正文段落 ====== */
.doc-content p {
  line-height: 1.85; font-size: 14px; margin-bottom: 14px; color: var(--ink-mid);
}
.doc-content p:first-of-type {
  font-size: 15px; color: var(--ink-dark);
}

/* ====== 列表 ====== */
.doc-content ul, .doc-content ol {
  margin: 10px 0 16px; padding: 0; list-style: none;
}
.doc-content li {
  line-height: 1.8; font-size: 14px; color: var(--ink-mid); margin-bottom: 6px;
  padding: 6px 0 6px 24px; position: relative;
}
.doc-content li::before {
  content: ''; position: absolute; left: 8px; top: 15px;
  width: 5px; height: 5px; background: var(--celadon); border-radius: 50%;
}

/* ====== 行内标记 ====== */
.doc-content strong { color: var(--celadon-dark); font-weight: 600; }
.doc-content em { color: var(--silk-gold); font-style: normal; }

/* ====== 表格 ====== */
.doc-content table {
  width: 100%; border-collapse: collapse; margin: 16px 0 20px; font-size: 13px;
  border-radius: var(--radius-sm); overflow: hidden;
  border: 1px solid var(--border-color);
}
.doc-content th {
  background: var(--celadon-dark); color: #FFF; padding: 10px 12px;
  text-align: left; font-weight: 600; font-size: 12px; letter-spacing: 0.5px;
}
.doc-content td {
  padding: 10px 12px; line-height: 1.7; vertical-align: top;
  background: var(--card-bg); border-top: 1px solid var(--border-color);
}
.doc-content tr:nth-child(even) td { background: #FAFAF7; }

/* ====== 分隔线 ====== */
.doc-content hr {
  border: none; height: 1px; margin: 28px 0;
  background: linear-gradient(90deg, transparent, var(--border-color) 20%, var(--border-color) 80%, transparent);
}

.empty-state {
  text-align: center; padding: 80px 20px; color: var(--ink-light);
}
.empty-state .icon { font-size: 48px; display: block; margin-bottom: 12px; }
.empty-state .text { font-size: 14px; }
</style>
