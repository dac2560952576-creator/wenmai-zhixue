<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">工艺文档库</h1>
      <span></span>
    </header>

    <div class="page-body">
      <div v-for="cat in categories" :key="cat.category" class="cat-group">
        <div class="cat-header" @click="toggleCat(cat)">
          <span class="cat-arrow">{{ cat.expanded ? '▼' : '▶' }}</span>
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.category }}</span>
          <span class="cat-count">{{ cat.items.length }}</span>
        </div>

        <div v-show="cat.expanded" class="cat-cards">
          <div
            v-for="item in cat.items" :key="item.id"
            class="doc-card" @click="$router.push('/craft/' + item.id)"
          >
            <div class="doc-icon" :class="getIconClass(item)">{{ getIcon(item) }}</div>
            <div class="doc-body">
              <h4>{{ item.name }}<span class="doc-badge">完整知识文档</span></h4>
              <p>{{ getSummary(item) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import craftsData from '@/data/工艺知识库.json'

const categories = ref(
  craftsData.map(cat => ({ ...cat, expanded: false }))
)

function toggleCat(cat) {
  const wasExpanded = cat.expanded
  for (const c of categories.value) { c.expanded = false }
  cat.expanded = !wasExpanded
}

// ---- 图标映射 ----
const iconMap = {
  '龙泉青瓷': ['celadon', '🏺'], '景德镇瓷器': ['celadon', '🏺'],
  '宜兴紫砂': ['celadon', '🫖'], '德化白瓷': ['celadon', '🏺'],
  '杭州丝绸': ['silk', '🧵'], '苏绣': ['silk', '🧵'],
  '蜀绣': ['silk', '🧵'], '湘绣': ['silk', '🧵'],
  '东阳木雕': ['carve', '🪚'], '寿山石雕': ['carve', '🪨'],
  '徽州砖雕': ['carve', '🧱'],
  '景泰蓝': ['metal', '🔔'], '芜湖铁画': ['metal', '🔨'],
  '福州脱胎漆器': ['lacquer', '🏮'],
  '潍坊风筝': ['folk', '🪁'], '木版年画': ['folk', '🖼️'],
  '皮影戏': ['show', '🎭'], '面人艺术': ['show', '👤'],
  '中国剪纸': ['other', '✂️'], '传统灯笼': ['other', '🏮']
}

function getIcon(item) { return (iconMap[item.name] || ['celadon', '📖'])[1] }
function getIconClass(item) { return (iconMap[item.name] || ['celadon', '📖'])[0] }

function getSummary(item) {
  return item.brief ? item.brief.slice(0, 50) + '…' : ''
}
</script>

<style scoped>
/* ====== 分类组 ====== */
.cat-group { margin-bottom: var(--space-sm); }
.cat-header {
  display: flex; align-items: center; gap: 8px; padding: 14px;
  background: var(--card-bg); border-radius: var(--radius-md); cursor: pointer;
  font-size: 14px; user-select: none; border: 1px solid rgba(0,0,0,0.04);
  transition: background 0.15s;
  position: sticky; top: 0; z-index: 2;
}
.cat-header:active { background: var(--paper-warm); }
.cat-arrow { font-size: 10px; color: var(--ink-light); }
.cat-icon { font-size: 18px; }
.cat-name { font-weight: 600; flex: 1; }
.cat-count {
  font-size: 12px; color: var(--celadon-dark);
  padding: 2px 10px; background: var(--celadon-pale); border-radius: var(--radius-full); font-weight: 600;
}

/* ====== 文档卡片 ====== */
.cat-cards { display: flex; flex-direction: column; gap: var(--space-sm); padding: var(--space-sm) 0 var(--space-md) 4px; }
.doc-card {
  display: flex; gap: var(--space-md); padding: 14px;
  background: var(--card-bg); border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.04); cursor: pointer;
  transition: background 0.15s;
}
.doc-card:active { background: var(--paper-warm); }
.doc-icon {
  width: 48px; height: 48px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0;
}
.doc-icon.celadon { background: linear-gradient(135deg, #E8F3ED, #C8E6D4); }
.doc-icon.silk { background: linear-gradient(135deg, #FDF3E0, #E8D5A3); }
.doc-icon.carve { background: linear-gradient(135deg, #EDE5D8, #D4C4A8); }
.doc-icon.metal { background: linear-gradient(135deg, #F0E6D3, #E2C896); }
.doc-icon.lacquer { background: linear-gradient(135deg, #FCEAE9, #F8CDD0); }
.doc-icon.folk { background: linear-gradient(135deg, #FFF3E0, #FFE0B2); }
.doc-icon.show { background: linear-gradient(135deg, #E8F0FE, #C8DCF8); }
.doc-icon.other { background: linear-gradient(135deg, #F0EDE6, #E0D8C8); }

.doc-body { flex: 1; min-width: 0; }
.doc-body h4 { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.doc-badge {
  font-size: 10px; font-weight: 500; color: var(--celadon-dark);
  background: var(--celadon-pale); padding: 2px 8px; border-radius: var(--radius-full);
  white-space: nowrap;
}
.doc-body p {
  font-size: 12px; color: var(--ink-light); margin-top: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>
