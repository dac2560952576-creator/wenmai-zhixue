<template>
  <div class="page">
    <div class="page-body">
      <!-- 社区头部tab -->
      <div class="community-header">
        <div class="community-tabs">
          <button
            v-for="f in filters"
            :key="f.key"
            :class="['tab', { active: activeFilter === f.key }]"
            @click="activeFilter = f.key; loadPosts()"
          >{{ f.label }}</button>
        </div>
      </div>

      <!-- 瀑布流 -->
      <div class="waterfall" v-if="posts.length">
        <div class="col">
          <div v-for="post in leftCol" :key="post.id" class="post-card" @click="$router.push(`/post/${post.id}`)">
            <div class="post-img-wrap">
              <img :src="post.image_url" v-if="post.image_url" />
              <div class="post-img-placeholder" v-else>🏺</div>
            </div>
            <div class="post-info">
              <h5>{{ post.title }}</h5>
              <p class="post-excerpt">{{ post.content?.slice(0, 60) }}{{ post.content?.length > 60 ? '...' : '' }}</p>
              <div class="post-author">
                <div class="author-avatar">{{ post.profiles?.avatar_url || (post.profiles?.username || '匿')[0] }}</div>
                <span>{{ post.profiles?.username || '匿名' }}</span>
                <span class="like-count">❤️ {{ post.like_count || 0 }} · 💬 {{ commentCounts[post.id] || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col">
          <div v-for="post in rightCol" :key="post.id" class="post-card" @click="$router.push(`/post/${post.id}`)">
            <div class="post-img-wrap">
              <img :src="post.image_url" v-if="post.image_url" />
              <div class="post-img-placeholder" v-else>🎨</div>
            </div>
            <div class="post-info">
              <h5>{{ post.title }}</h5>
              <p class="post-excerpt">{{ post.content?.slice(0, 60) }}{{ post.content?.length > 60 ? '...' : '' }}</p>
              <div class="post-author">
                <div class="author-avatar">{{ post.profiles?.avatar_url || (post.profiles?.username || '匿')[0] }}</div>
                <span>{{ post.profiles?.username || '匿名' }}</span>
                <span class="like-count">❤️ {{ post.like_count || 0 }} · 💬 {{ commentCounts[post.id] || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else-if="!loading">
        <span class="icon">🏛️</span>
        <span class="text">还没有作品，去创作空间发布第一个吧</span>
      </div>
      <!-- 骨架加载卡片 -->
      <div v-if="loading" class="waterfall">
        <div class="col" v-for="col in 2" :key="col">
          <div v-for="i in 3" :key="i" class="post-card skeleton-card">
            <div class="sk-thumb shimmer"></div>
            <div class="sk-info">
              <div class="sk-line sk-title shimmer"></div>
              <div class="sk-line sk-sub shimmer"></div>
              <div class="sk-author shimmer"></div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 发布作品 FAB -->
    <button class="create-fab" @click="goCreatePost">
      <span class="fab-icon">+</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchPosts, subscribeToPosts, unsubscribe, batchFetchProfiles, fetchCommentCounts } from '@/services/supabase'
import { logError } from '@/services/errorLog'

const router = useRouter()
const authStore = useAuthStore()
const posts = ref([])
const commentCounts = ref({})
const loading = ref(false)
let postsChannel = null

const filters = [
  { key: 'all', label: '推荐' },
  { key: '龙泉青瓷', label: '龙泉青瓷' },
  { key: '杭州丝绸', label: '杭州丝绸' },
  { key: '景德镇瓷器', label: '景德镇瓷器' },
  { key: '宜兴紫砂', label: '宜兴紫砂' },
  { key: '苏绣', label: '苏绣' },
  { key: '景泰蓝', label: '景泰蓝' },
  { key: '皮影戏', label: '皮影戏' },
  { key: '中国剪纸', label: '中国剪纸' },
  { key: '东阳木雕', label: '东阳木雕' },
  { key: '潍坊风筝', label: '潍坊风筝' },
  { key: '福州脱胎漆器', label: '脱胎漆器' },
  { key: '木版年画', label: '木版年画' }
]
const activeFilter = ref('all')

const leftCol = computed(() => posts.value.filter((_, i) => i % 2 === 0))
const rightCol = computed(() => posts.value.filter((_, i) => i % 2 === 1))

function goCreatePost() {
  if (!authStore.isLoggedIn) {
    if (confirm('请先登录或注册')) {
      router.push('/auth')
    }
    return
  }
  router.push('/create-post')
}

async function loadPosts() {
  loading.value = true
  posts.value = []
  try {
    const craftType = activeFilter.value === 'all' ? null : activeFilter.value
    const { data, error } = await fetchPosts(1, 20, craftType)
    if (error) console.error('加载帖子失败:', error)
    posts.value = data || []
    // 批量查评论数
    if (posts.value.length) {
      const ids = posts.value.map(p => p.id)
      commentCounts.value = await fetchCommentCounts(ids)
    }
  } catch (e) {
    logError('community:loadPosts', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPosts()
  postsChannel = subscribeToPosts(async (payload) => {
    const { eventType, new: newRow, old: oldRow } = payload
    if (eventType === 'INSERT') {
      if (newRow.user_id) {
        const profileMap = await batchFetchProfiles([newRow.user_id])
        newRow.profiles = profileMap[newRow.user_id] || { username: '匿名', avatar_url: null }
      }
      posts.value.unshift(newRow)
    } else if (eventType === 'DELETE') {
      posts.value = posts.value.filter(p => p.id !== oldRow.id)
    } else if (eventType === 'UPDATE') {
      const idx = posts.value.findIndex(p => p.id === newRow.id)
      if (idx !== -1) posts.value[idx] = { ...posts.value[idx], ...newRow }
    }
  })
})

onUnmounted(() => {
  unsubscribe(postsChannel)
})
</script>

<style scoped>
.page { position: relative; }

/* ====== 头部tab ====== */
.community-header {
  padding: var(--space-sm) var(--space-lg) 0;
}
.community-tabs {
  display: flex; gap: 6px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  padding-bottom: 12px;
}
.community-tabs::-webkit-scrollbar { display: none; }
.tab {
  padding: 6px 14px; border-radius: var(--radius-full); font-size: 13px;
  background: var(--card-bg); color: var(--ink-mid);
  white-space: nowrap; cursor: pointer; transition: all 0.2s;
  border: 1px solid var(--border-color);
}
.tab.active {
  background: var(--celadon-dark); color: #FFF;
  border-color: var(--celadon-dark);
}

/* ====== 瀑布流 ====== */
.waterfall {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg) var(--space-lg);
}
.col { flex: 1; display: flex; flex-direction: column; gap: var(--space-sm); }

.post-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(139,119,90,0.1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.post-card:active { transform: scale(0.98); }

.post-img-wrap {
  width: 100%;
  overflow: hidden;
}
.post-img-wrap img {
  width: 100%;
  display: block;
  object-fit: cover;
}
.post-img-placeholder {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: var(--gradient-card-placeholder);
}

.post-info { padding: 10px; }
.post-info h5 {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-dark);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.post-excerpt {
  font-size: 11px;
  color: var(--ink-light);
  line-height: 1.4;
  margin-top: 4px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
}
.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #EDE9E2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--ink-mid);
  flex-shrink: 0;
}
.post-author span {
  font-size: 11px;
  color: var(--ink-light);
}
.like-count { margin-left: auto; }

/* ====== 发布 FAB ====== */
.create-fab {
  position: absolute; bottom: 88px; right: 20px; z-index: 100;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--gradient-brand);
  color: #FFF; border: none;
  box-shadow: 0 4px 20px rgba(74,139,122,0.35);
  font-size: 24px; font-weight: 300;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, box-shadow 0.15s;
}
.create-fab:active {
  transform: scale(0.9);
  box-shadow: 0 2px 8px rgba(74,139,122,0.2);
}
.fab-icon { line-height: 1; }

/* ====== 空状态 ====== */
/* ====== 骨架加载卡片 ====== */
.skeleton-card { pointer-events: none; }
.sk-thumb {
  width: 100%; aspect-ratio: 1;
  background: #E8E5DF; border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.sk-info { padding: 10px; }
.sk-line {
  height: 12px; border-radius: 4px; background: #E8E5DF;
  margin-bottom: 8px;
}
.sk-title { width: 80%; }
.sk-sub { width: 55%; }
.sk-author { width: 40%; height: 16px; border-radius: 10px; }

.shimmer {
  position: relative; overflow: hidden;
  background: #E8E5DF;
}
.shimmer::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 40%, transparent 80%);
  animation: shimmer-slide 1.5s infinite;
}
@keyframes shimmer-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-light);
}
.empty-state .icon { font-size: 40px; display: block; margin-bottom: 12px; }
.empty-state .text { font-size: 14px; }
</style>
