<template>
  <div class="page">
    <div class="page-body" v-if="post">
      <header class="page-header">
        <button class="back-btn" @click="$router.back()">← 返回</button>
        <h1 class="page-title">作品详情</h1>
        <span></span>
      </header>
      <!-- 大图 -->
      <div class="detail-img-wrap">
        <img :src="post.image_url" v-if="post.image_url" />
        <div class="detail-img-placeholder" v-else>🏺</div>
      </div>

      <!-- 标题和作者 -->
      <div class="detail-header">
        <h2 class="detail-title">{{ post.title }}</h2>
        <div class="detail-meta">
          <div class="author-info">
            <div class="author-avatar">{{ post.profiles?.avatar_url || (post.profiles?.username || '匿')[0] }}</div>
            <span class="author-name">{{ post.profiles?.username || '匿名' }}</span>
            <button v-if="canMessage" class="msg-btn" @click="goChat">✉️ 私信</button>
          </div>
          <span class="detail-date">{{ formatDate(post.created_at) }}</span>
        </div>
      </div>

      <!-- 文案内容 -->
      <div class="detail-content">{{ post.content }}</div>

      <!-- AI审查信息 -->
      <div v-if="post.ai_review?.length" class="review-section">
        <div class="review-heading">审查批注</div>
        <div v-for="(item, i) in post.ai_review" :key="i" :class="['review-item', item.level === '🔴' ? 'error' : 'warn']">
          <span class="review-icon">{{ item.level }}</span>
          <div class="review-body">
            <span class="review-type">{{ item.type }}</span>
            <span class="review-msg">{{ item.message }}</span>
            <span class="review-suggestion" v-if="item.suggestion">{{ item.suggestion }}</span>
          </div>
        </div>
      </div>

      <!-- 互动区 -->
      <div class="action-bar">
        <button class="action-btn" @click="handleLike">
          {{ liked ? '❤️' : '🤍' }} {{ post.like_count || 0 }}
        </button>
        <button class="action-btn" @click="focusComment">💬 评论</button>
      </div>

      <!-- 评论区 -->
      <div class="comment-section">
        <div v-for="c in comments" :key="c.id" class="comment-item">
          <div class="comment-head">
            <strong>{{ c.profiles?.username || '匿名' }}</strong>
            <span class="comment-time">{{ formatTime(c.created_at) }}</span>
          </div>
          <p>{{ c.content }}</p>
        </div>
        <p v-if="!comments.length" class="comment-empty">暂无评论，来说点什么吧</p>
        <div v-if="showCommentInput && authStore.isLoggedIn" class="comment-input-row">
          <input ref="commentInputRef" v-model="commentText" placeholder="写评论..." @keyup.enter="addComment" />
          <button @click="addComment">发送</button>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <span class="icon">📭</span>
      <span class="text">作品加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchPostDetail, fetchComments, addComment as addCommentApi, toggleLike, removeLike, fetchUserLikes, subscribeToPostLikes, subscribeToPostComments, unsubscribe, batchFetchProfiles } from '@/services/supabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const post = ref(null)
const comments = ref([])
const commentText = ref('')
let likesChannel = null
let commentsChannel = null
const liked = ref(false)
const showCommentInput = ref(false)
const canMessage = computed(() => authStore.isLoggedIn && post.value && authStore.user?.id !== post.value.user_id)

function goChat() {
  router.push('/chat/' + post.value.user_id)
}
const commentInputRef = ref(null)

function focusComment() {
  showCommentInput.value = true
  // 等 DOM 更新后聚焦
  setTimeout(() => commentInputRef.value?.focus(), 0)
}

async function load() {
  const postId = route.params.id
  const { data } = await fetchPostDetail(postId)
  post.value = data
  const { data: cmts } = await fetchComments(postId)
  comments.value = cmts || []

  if (authStore.isLoggedIn) {
    const { data: likes } = await fetchUserLikes(authStore.user?.id)
    liked.value = (likes || []).some(l => l.post_id === post.value?.id)
  }

  likesChannel = subscribeToPostLikes(postId, (payload) => {
    if (!post.value) return
    if (payload.eventType === 'INSERT') post.value.like_count++
    else if (payload.eventType === 'DELETE') post.value.like_count = Math.max(0, post.value.like_count - 1)
  })

  commentsChannel = subscribeToPostComments(postId, async (payload) => {
    if (payload.eventType === 'INSERT') {
      const newComment = payload.new
      if (newComment.user_id) {
        const profileMap = await batchFetchProfiles([newComment.user_id])
        newComment.profiles = profileMap[newComment.user_id] || { username: '匿名', avatar_url: null }
      }
      comments.value.unshift(newComment)
    }
  })
}

async function handleLike() {
  if (!authStore.isLoggedIn) return
  if (liked.value) {
    await removeLike(authStore.user.id, post.value.id)
    liked.value = false
  } else {
    await toggleLike(authStore.user.id, post.value.id)
    liked.value = true
  }
}

async function addComment() {
  if (!commentText.value.trim()) return
  const content = commentText.value.trim()
  commentText.value = ''
  const { error } = await addCommentApi({
    user_id: authStore.user.id,
    post_id: post.value.id,
    content
  })
  if (error) {
    alert('评论失败：' + (error.message || '请重试'))
    return
  }
  const { data } = await fetchComments(route.params.id)
  comments.value = data || []
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString('zh-CN')
}

onMounted(load)
onUnmounted(() => {
  unsubscribe(likesChannel)
  unsubscribe(commentsChannel)
})
</script>

<style scoped>
/* ====== 大图 ====== */
.detail-img-wrap {
  width: 100%;
  overflow: hidden;
}
.detail-img-wrap img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}
.detail-img-placeholder {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  background: var(--gradient-card-placeholder);
}

/* ====== 标题和作者 ====== */
.detail-header { padding: var(--space-lg); }
.detail-title { font-size: 18px; font-weight: 700; line-height: 1.4; }
.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.author-info { display: flex; align-items: center; gap: 6px; }
.author-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: #EDE9E2; display: flex; align-items: center;
  justify-content: center; font-size: 11px; color: var(--ink-mid);
}
.author-name { font-size: 13px; color: var(--ink-mid); }
.msg-btn {
  font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full);
  border: 1px solid var(--celadon-dark); background: transparent;
  color: var(--celadon-dark); cursor: pointer; margin-left: 4px;
  transition: background 0.15s;
}
.msg-btn:active { background: var(--celadon-pale); }
.detail-date { font-size: 12px; color: var(--ink-light); }

/* ====== 文案内容 ====== */
.detail-content {
  padding: 0 var(--space-lg) var(--space-lg);
  font-size: 15px;
  line-height: 1.9;
  color: var(--ink-dark);
  white-space: pre-wrap;
}

/* ====== 审查批注 ====== */
.review-section { padding: 0 var(--space-lg) var(--space-xl); }
.review-heading {
  font-size: 14px; font-weight: 600; margin-bottom: var(--space-sm);
}
.review-item {
  padding: 10px 12px; border-radius: var(--radius-sm);
  display: flex; align-items: flex-start; gap: var(--space-sm); margin-bottom: var(--space-sm);
}
.review-item.warn { background: #FFF8E1; border: 1px solid #FFE082; }
.review-item.error { background: #FCEAE9; border: 1px solid #F8CDD0; }
.review-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.review-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.review-type { font-size: 12px; font-weight: 600; }
.review-msg { font-size: 12px; color: var(--ink-mid); line-height: 1.5; }
.review-suggestion { font-size: 11px; color: #9A7B3C; }

/* ====== 互动 ====== */
.action-bar {
  display: flex; gap: 20px; padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);
}
.action-btn { background: none; border: none; font-size: 15px; cursor: pointer; padding: 4px 8px; }

/* ====== 评论 ====== */
.comment-section { padding: 0 var(--space-lg) var(--space-lg); }
.comment-input-row {
  display: flex; gap: var(--space-sm); margin-top: var(--space-md);
}
.comment-input-row input {
  flex: 1; padding: 10px 16px; border: 1px solid var(--border-color);
  border-radius: var(--radius-full); font-size: 13px; outline: none; background: var(--paper);
  color: var(--ink-dark);
}
.comment-input-row input::placeholder { color: var(--ink-disabled); }
.comment-input-row input:focus { border-color: var(--celadon); }
.comment-input-row button {
  padding: 10px 18px; border: none; border-radius: var(--radius-full);
  background: var(--gradient-brand);
  color: #FFF; font-size: 13px; font-weight: 600; cursor: pointer;
}
.comment-item { padding: 10px 0; border-bottom: 1px solid #F0EDE6; }
.comment-head { display: flex; align-items: center; justify-content: space-between; }
.comment-head strong { font-size: 12px; }
.comment-time { font-size: 11px; color: var(--ink-light); }
.comment-item p { font-size: 13px; margin-top: 4px; color: var(--ink-mid); }
.comment-empty {
  text-align: center; padding: 20px; font-size: 13px; color: var(--ink-light);
}

/* ====== 空状态 ====== */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--ink-light);
}
.empty-state .icon { font-size: 40px; display: block; margin-bottom: 12px; }
.empty-state .text { font-size: 14px; }
</style>
