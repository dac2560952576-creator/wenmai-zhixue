<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">我的</h1>
      <span></span>
    </header>

    <div class="page-body">
      <!-- 头像卡片（含统计） -->
      <div
        class="profile-card"
        :class="{ clickable: true }"
        @click="goToProfileAction"
      >
        <div class="profile-top">
          <div class="avatar">{{ authStore.isLoggedIn ? (authStore.user?.user_metadata?.avatar || authStore.user?.email?.[0]?.toUpperCase() || '?') : '?' }}</div>
          <div class="profile-info">
            <h3>{{ authStore.isLoggedIn ? (authStore.user?.user_metadata?.username || authStore.user?.email?.split('@')[0] || '用户') : '未登录' }}</h3>
            <p>{{ authStore.isLoggedIn ? '点击编辑个人资料' : '点击登录，解锁完整功能' }}</p>
          </div>
          <span class="profile-arrow">›</span>
        </div>
        <div class="profile-stats">
          <div class="profile-stat">
            <span class="ps-num">{{ stats.likes }}</span>
            <span class="ps-label">获赞</span>
          </div>
          <div class="profile-stat-divider"></div>
          <div class="profile-stat clickable" @click.stop="$router.push('/messages')">
            <span class="ps-icon">
              💬
              <span v-if="hasUnread" class="unread-dot"></span>
            </span>
            <span class="ps-label">消息</span>
          </div>
          <div class="profile-stat-divider"></div>
          <div class="profile-stat">
            <span class="ps-num">{{ stats.activeDays }}</span>
            <span class="ps-label">学习天数</span>
          </div>
        </div>
      </div>

      <!-- Tab 切换 -->
      <div class="profile-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          :class="['profile-tab', { active: activeTab === t.key }]"
          @click="activeTab = t.key"
        >{{ t.label }}</button>
      </div>

      <!-- Tab 内容 -->
      <!-- 学习记录 -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div v-if="learningRecords.length" class="learning-list">
          <div v-for="(item, i) in learningRecords" :key="i" class="learning-item" @click="goLearning(item)">
            <span class="learning-icon">{{ item.icon }}</span>
            <div class="learning-body">
              <div class="learning-title">
                {{ item.title }}
                <span :class="['learning-tag', item.tagType]">{{ item.tag }}</span>
              </div>
              <div class="learning-sub">{{ item.sub }}</div>
            </div>
            <span class="learning-arrow">›</span>
          </div>
        </div>
        <div v-else class="tab-empty">
          <span class="tab-empty-icon">📖</span>
          <span class="tab-empty-text">暂无学习记录</span>
        </div>
      </div>

      <!-- 我的作品 -->
      <div v-if="activeTab === 'works'" class="tab-content">
        <div v-if="myPosts.length" class="post-grid">
          <div v-for="post in myPosts" :key="post.id" class="post-item" @click="$router.push(`/post/${post.id}`)">
            <div class="post-thumb">
              <img :src="post.image_url" v-if="post.image_url" />
              <div class="post-thumb-placeholder" v-else>🏺</div>
              <div class="post-thumb-actions" @click.stop>
                <button class="post-action-btn edit" @click="editPost(post.id)">✏️</button>
                <button class="post-action-btn del" @click="deleteMyPost(post)">🗑️</button>
              </div>
            </div>
            <div class="post-item-title">{{ post.title }}</div>
            <div class="post-item-likes">❤️ {{ post.like_count || 0 }}</div>
          </div>
        </div>
        <div v-else class="tab-empty">
          <span class="tab-empty-icon">🎨</span>
          <span class="tab-empty-text" v-if="authStore.isLoggedIn">还没有发布作品</span>
          <span class="tab-empty-text" v-else>登录后查看作品</span>
        </div>
      </div>

      <!-- 喜欢的作品 -->
      <div v-if="activeTab === 'likes'" class="tab-content">
        <div v-if="likedPosts.length" class="post-grid">
          <div v-for="post in likedPosts" :key="post.id" class="post-item" @click="$router.push(`/post/${post.id}`)">
            <div class="post-thumb">
              <img :src="post.image_url" v-if="post.image_url" />
              <div class="post-thumb-placeholder" v-else>🏺</div>
            </div>
            <div class="post-item-title">{{ post.title }}</div>
            <div class="post-item-likes">❤️ {{ post.like_count || 0 }}</div>
          </div>
        </div>
        <div v-else class="tab-empty">
          <span class="tab-empty-icon">🤍</span>
          <span class="tab-empty-text" v-if="authStore.isLoggedIn">还没有喜欢的作品</span>
          <span class="tab-empty-text" v-else>登录后查看喜欢</span>
        </div>
      </div>

      <!-- 设置 -->
      <div class="section-title">⚙️ 设置</div>
      <div class="menu-list">
        <div class="menu-item" @click="syncData">
          <span>☁️ 同步学习数据</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="clearLocal">
          <span>🗑️ 清除本地数据</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" v-if="authStore.isLoggedIn" @click="handleLogout">
          <span>🚪 退出登录</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="app-version">文脉智学 v1.0 · 传统手工艺AI学习</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchUserPosts, fetchLikedPosts, syncProgress, deletePost, fetchProgress } from '@/services/supabase'
import { getAllCourseViews, getProgress, getActiveDays, exportProgressForSync, hasUnreadMessages, importProgressFromCloud, getReadDocs } from '@/services/db'
import { logError } from '@/services/errorLog'

const router = useRouter()
const authStore = useAuthStore()

const stats = reactive({ likes: 0, activeDays: 0 })
const hasUnread = ref(false)
const activeTab = ref('history')
const myPosts = ref([])
const likedPosts = ref([])

const tabs = [
  { key: 'history', label: '学习记录' },
  { key: 'works', label: '我的作品' },
  { key: 'likes', label: '喜欢' }
]

// ---- 课程信息映射 ----
const courseMap = {
  1: { title: '龙泉青瓷入门：从泥到瓷', icon: '🏺' },
  2: { title: '杭绣技法：双面绣的秘密', icon: '🧵' },
  3: { title: '青瓷纹样中的吉祥寓意', icon: '🖌️' },
  4: { title: '景德镇青花瓷绘制技法', icon: '🏺' },
  5: { title: '苏绣双面绣针法精讲', icon: '🧵' },
  6: { title: '东阳木雕浮雕入门', icon: '🪚' },
  7: { title: '景泰蓝掐丝工艺', icon: '🔔' },
  8: { title: '宜兴紫砂壶全手工制作', icon: '🫖' },
  9: { title: '传统剪纸技法入门', icon: '✂️' }
}

const craftMap = {
  '龙泉青瓷': ['🏺', 'celadon'], '杭州丝绸': ['🧵', 'silk'],
  '景德镇瓷器': ['🏺', 'celadon'], '苏绣': ['🧵', 'silk'],
  '东阳木雕': ['🪚', 'carve'], '景泰蓝': ['🔔', 'metal']
}


// ---- 学习记录 ----
const learningRecords = computed(() => {
  if (!authStore.isLoggedIn) return []
  const records = []

  const views = getAllCourseViews()
  for (const [id, count] of Object.entries(views)) {
    const course = courseMap[id]
    if (course && count > 0) {
      records.push({
        icon: course.icon,
        title: course.title,
        sub: `已观看 ${count} 次`,
        type: 'course',
        id: Number(id),
        tag: '课程',
        tagType: 'tag-course'
      })
    }
  }

  const progress = getProgress()
  for (const p of progress) {
    const craft = (craftMap[p.craft_type] || ['📖'])[0]
    records.push({
      icon: craft,
      title: p.craft_type,
      sub: `第 ${p.chapter || 1} 章`,
      type: 'craft',
      id: p.craft_type,
      tag: '练习',
      tagType: 'tag-practice'
    })
  }

  const categoryIcons = {
    '陶瓷': '🏺', '织绣': '🧵', '雕刻': '🪚',
    '金属工艺': '🔔', '漆器': '🎭', '民间美术': '✂️',
    '民间表演': '🎪', '其他': '📖'
  }
  const readDocs = getReadDocs()
  for (const [docId, info] of Object.entries(readDocs)) {
    records.push({
      icon: categoryIcons[info.category] || '📖',
      title: info.name,
      sub: '已阅读',
      type: 'doc',
      id: docId,
      tag: '文档',
      tagType: 'tag-doc'
    })
  }

  return records
})

function goLearning(item) {
  if (item.type === 'course') {
    router.push('/courses?open=' + item.id)
  } else {
    router.push('/craft/' + item.id)
  }
}

function editPost(postId) {
  router.push('/create-post?edit=' + postId)
}

async function deleteMyPost(post) {
  if (!confirm('确定删除《' + post.title + '》？点赞和评论数据将一并清除，此操作不可恢复。')) return
  const { error } = await deletePost(post.id)
  if (!error) {
    myPosts.value = myPosts.value.filter(p => p.id !== post.id)
    stats.likes = myPosts.value.reduce((sum, p) => sum + (p.like_count || 0), 0)
    saveCachedStats()
  } else {
    alert('删除失败：' + (error.message || '请重试'))
  }
}

// ---- 跳转登录 ----
function goToProfileAction() {
  if (authStore.isLoggedIn) {
    router.push('/edit-profile')
  } else {
    router.push('/auth')
  }
}

// ---- 统计缓存 ----
function cacheStatsKey() {
  return _statsKey || 'wenmai_stats_cache'
}
let _statsKey = ''

function loadCachedStats() {
  try {
    const raw = localStorage.getItem(cacheStatsKey())
    if (raw) {
      const cached = JSON.parse(raw)
      stats.likes = cached.likes || 0
      stats.likes = cached.likes || 0
    }
  } catch { /* ignore */ }
}

function saveCachedStats() {
  try {
    localStorage.setItem(cacheStatsKey(), JSON.stringify({ likes: stats.likes }))
  } catch { /* ignore */ }
}

// ---- 加载作品数据 ----
async function loadPosts() {
  if (!authStore.isLoggedIn) return
  const userId = authStore.user?.id
  if (!userId) return
  _statsKey = 'wenmai_stats_' + userId
  loadCachedStats()

  try {
    const { data: posts } = await fetchUserPosts(userId)
    myPosts.value = posts || []
    stats.likes = (posts || []).reduce((sum, p) => sum + (p.like_count || 0), 0)

    hasUnread.value = hasUnreadMessages()

    saveCachedStats()

    const { data: liked } = await fetchLikedPosts(userId)
    likedPosts.value = liked || []
  } catch (e) {
    logError('profile:loadPosts', e)
  }
}

// ---- 同步 / 清除 ----
async function syncData() {
  if (!authStore.isLoggedIn) return
  const userId = authStore.user.id

  // 1. 上传本地进度到云端
  const localProgress = exportProgressForSync()
  if (localProgress.length) {
    const { error } = await syncProgress(userId, localProgress)
    if (error) {
      alert('上传失败：' + error.message)
      return
    }
  }

  // 2. 下载云端进度并合并到本地
  const { data: remoteList, error: fetchErr } = await fetchProgress(userId)
  if (fetchErr) {
    alert('下载失败：' + fetchErr.message)
    return
  }
  if (remoteList && remoteList.length) {
    await importProgressFromCloud(remoteList)
  }

  alert('学习数据双向同步完成')
}

function clearLocal() {
  if (confirm('确定清除所有本地学习数据？此操作不可恢复。')) {
    localStorage.clear()
    stats.activeDays = 0
    alert('本地数据已清除')
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/learn')
}

function resetState() {
  stats.likes = 0
  stats.activeDays = 0
  hasUnread.value = false
  myPosts.value = []
  likedPosts.value = []
}

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (!loggedIn) {
    resetState()
  } else {
    stats.activeDays = getActiveDays()
    hasUnread.value = hasUnreadMessages()
    loadPosts()
  }
})

onMounted(() => {
  stats.activeDays = getActiveDays()
  hasUnread.value = hasUnreadMessages()
  loadPosts()
})
</script>

<style scoped>
/* ====== 个人卡片 ====== */
.profile-card {
  background: linear-gradient(160deg, #899E8A 0%, #6B8A7A 25%, #5A7A6A 55%, #3D5D4A 100%);
  border-radius: var(--radius-lg);
  color: #FFF;
  margin-bottom: var(--space-lg);
  overflow: hidden;
  position: relative;
  transition: transform 0.15s, opacity 0.15s;
}
.profile-card::before {
  content: '';
  position: absolute; top: -30px; right: -20px;
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
}
.profile-card.clickable { cursor: pointer; }
.profile-card.clickable:active { transform: scale(0.98); opacity: 0.9; }
.profile-top {
  display: flex; align-items: center; gap: var(--space-lg);
  padding: var(--space-xl);
}
.avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; flex-shrink: 0;
  backdrop-filter: blur(4px);
}
.profile-info { flex: 1; }
.profile-info h3 {
  font-size: 18px; font-weight: 700;
  font-family: 'Noto Serif SC', serif; letter-spacing: 1px;
}
.profile-info p { font-size: 12px; opacity: 0.75; margin-top: 4px; }
.profile-arrow { font-size: 24px; opacity: 0.5; flex-shrink: 0; }

.profile-stats {
  display: flex; align-items: center;
  padding: 14px var(--space-xl);
  background: rgba(0,0,0,0.1);
  border-top: 1px solid rgba(255,255,255,0.1);
}
.profile-stat {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.profile-stat.clickable { cursor: pointer; transition: opacity 0.15s; }
.profile-stat.clickable:active { opacity: 0.7; }
.profile-stat-divider {
  width: 1px; height: 28px; background: rgba(255,255,255,0.15); flex-shrink: 0;
}
.ps-num { font-size: 17px; font-weight: 700; font-family: 'Noto Serif SC', serif; }
.ps-icon { font-size: 18px; position: relative; }
.ps-label { font-size: 11px; opacity: 0.65; letter-spacing: 1px; }
.unread-dot {
  position: absolute; top: -2px; right: -6px;
  width: 10px; height: 10px; border-radius: 50%;
  background: #FF5252; border: 2px solid rgba(255,255,255,0.3);
}

/* ====== Tab 切换 ====== */
.profile-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-lg);
}
.profile-tab {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-light);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.profile-tab.active {
  color: var(--ink-dark);
  font-weight: 600;
  border-bottom-color: var(--celadon-dark);
}

/* ====== Tab 内容 ====== */
.tab-content {
  min-height: 120px;
}

/* 学习记录 */
.learning-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 260px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-disabled) transparent;
}
.learning-list::-webkit-scrollbar { width: 4px; }
.learning-list::-webkit-scrollbar-track { background: transparent; }
.learning-list::-webkit-scrollbar-thumb {
  background: var(--ink-disabled);
  border-radius: 2px;
}
.learning-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 14px;
  background: var(--card-bg);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
  transition: background 0.15s;
}
.learning-item:active { background: var(--paper-warm); }
.learning-icon { font-size: 28px; flex-shrink: 0; }
.learning-body { flex: 1; min-width: 0; }
.learning-title { font-size: 14px; font-weight: 600; color: var(--ink-dark); display: flex; align-items: center; gap: 6px; }
.learning-sub { font-size: 12px; color: var(--ink-light); margin-top: 3px; }
.learning-tag {
  font-size: 10px; font-weight: 500; padding: 1px 6px; border-radius: 4px;
  flex-shrink: 0; line-height: 1.5;
}
.learning-tag.tag-course { background: #E8F3ED; color: #4A8B7A; }
.learning-tag.tag-doc { background: #FDF3E0; color: #B8860B; }
.learning-tag.tag-practice { background: #EDE9E2; color: #8C8C8C; }
.learning-arrow { font-size: 18px; color: var(--ink-light); flex-shrink: 0; }

/* 作品网格 */
.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}
.post-item {
  cursor: pointer;
  transition: transform 0.15s;
}
.post-item:active { transform: scale(0.97); }
.post-thumb {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--paper-warm);
  position: relative;
}
.post-thumb-actions {
  position: absolute; top: 4px; right: 4px;
  display: flex; flex-direction: column; gap: 4px;
}
.post-action-btn {
  width: 26px; height: 26px; border-radius: 50%; border: none;
  font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.post-action-btn.edit { color: var(--celadon-dark); }
.post-action-btn.del { color: var(--vermilion); }
.post-thumb img {
  width: 100%; height: 100%; object-fit: cover;
}
.post-thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  background: var(--gradient-card-placeholder);
}
.post-item-title {
  font-size: 12px; font-weight: 500; color: var(--ink-dark);
  margin-top: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.post-item-likes {
  font-size: 11px; color: var(--ink-light); margin-top: 2px;
}

/* 空状态 */
.tab-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: var(--ink-light);
}
.tab-empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.5; }
.tab-empty-text { font-size: 13px; }

/* ====== 设置 ====== */
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl) 0 var(--space-md);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-dark);
}
.menu-list {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04);
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 16px;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: var(--paper-warm); }
.menu-arrow { font-size: 18px; color: var(--ink-light); }

.app-version {
  text-align: center;
  padding: 24px 0;
  font-size: 12px;
  color: var(--ink-light);
}
</style>
