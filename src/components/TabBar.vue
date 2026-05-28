<template>
  <nav class="tab-bar">
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="tab-item"
      active-class="tab-item--active"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span class="tab-text">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
const tabs = [
  { path: '/learn', icon: '📖', label: '文脉' },
  { path: '/practice', icon: '✏️', label: '研习' },
  { path: '/create', icon: '🎨', label: '工坊' },
  { path: '/community', icon: '🏛️', label: '雅集' },
  { path: '/profile', icon: '👤', label: '我的' }
]
</script>

<style scoped>
.tab-bar {
  height: var(--tab-height);
  background: linear-gradient(180deg, #FFFEFC 0%, #FAF7F2 100%);
  border-top: 1px solid rgba(139,119,90,0.12);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  padding-bottom: var(--safe-bottom);
  flex-shrink: 0;
  position: relative;
}
.tab-bar::before {
  content: '';
  position: absolute; top: 0; left: 20%; right: 20%; height: 0.5px;
  background: linear-gradient(90deg, transparent, rgba(139,119,90,0.2), transparent);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.tab-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.tab-text {
  font-size: 10px;
  color: var(--ink-light);
  font-weight: 500;
  transition: color 0.2s ease;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.5px;
}

.tab-item--active .tab-text {
  color: var(--celadon-dark);
  font-weight: 600;
}

.tab-item--active .tab-icon {
  transform: translateY(-1px);
}
</style>
