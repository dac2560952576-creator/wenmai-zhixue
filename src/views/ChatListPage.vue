<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">消息</h1>
      <span></span>
    </header>

    <div class="page-body">
      <div v-if="conversations.length" class="chat-list">
        <div
          v-for="c in conversations"
          :key="c.partnerId"
          class="chat-item"
          @click="$router.push('/chat/' + c.partnerId)"
        >
          <div class="chat-avatar">
            {{ c.profiles?.avatar_url || (c.profiles?.username || '匿')[0] }}
            <span v-if="unreadPartners.includes(c.partnerId)" class="avatar-dot"></span>
          </div>
          <div class="chat-body">
            <div class="chat-top">
              <span class="chat-name">{{ c.profiles?.username || '匿名' }}</span>
              <span class="chat-time">{{ formatTime(c.created_at) }}</span>
            </div>
            <p class="chat-preview">{{ c.content }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <span class="icon">💬</span>
        <span class="text">暂无消息</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchConversations, subscribeToMessages, unsubscribe } from '@/services/supabase'
import { addUnreadPartner, getUnreadPartners } from '@/services/db'

const authStore = useAuthStore()
const conversations = ref([])
const loading = ref(true)
const unreadPartners = ref([])
let msgChannel = null

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

onMounted(async () => {
  if (!authStore.isLoggedIn) return
  unreadPartners.value = getUnreadPartners()
  try {
    const { data } = await fetchConversations(authStore.user.id)
    conversations.value = data || []
  } catch { /* ignore */ }
  loading.value = false

  // 实时监听新消息，未读红点
  msgChannel = subscribeToMessages(authStore.user.id, (payload) => {
    const msg = payload.new
    addUnreadPartner(msg.from_user)
    unreadPartners.value = getUnreadPartners()
    // 刷新会话列表
    fetchConversations(authStore.user.id).then(({ data }) => {
      if (data) conversations.value = data
    })
  })
})

onUnmounted(() => {
  unsubscribe(msgChannel)
})
</script>

<style scoped>
.chat-list {
  display: flex; flex-direction: column;
}
.chat-item {
  display: flex; align-items: center; gap: var(--space-md);
  padding: 14px var(--space-lg); cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}
.chat-item:active { background: var(--paper-warm); }
.chat-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #EDE9E2; display: flex; align-items: center;
  justify-content: center; font-size: 18px; font-weight: 600;
  color: var(--ink-mid); flex-shrink: 0; position: relative;
}
.avatar-dot {
  position: absolute; top: 0; right: 0;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--vermilion);
  border: 2px solid var(--card-bg);
}
.chat-body { flex: 1; min-width: 0; }
.chat-top { display: flex; justify-content: space-between; align-items: center; }
.chat-name { font-size: 14px; font-weight: 600; color: var(--ink-dark); }
.chat-time { font-size: 11px; color: var(--ink-light); }
.chat-preview {
  font-size: 13px; color: var(--ink-light); margin-top: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.empty-state {
  text-align: center; padding: 80px 20px; color: var(--ink-light);
}
.empty-state .icon { font-size: 40px; display: block; margin-bottom: 12px; }
.empty-state .text { font-size: 14px; }
</style>
