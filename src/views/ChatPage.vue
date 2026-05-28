<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">{{ partner?.profiles?.username || '聊天' }}</h1>
      <span></span>
    </header>

    <div class="chat-page-body">
      <div class="chat-messages" ref="msgListRef">
        <div v-for="m in messages" :key="m.id" :class="['msg-bubble', m.from_user === authStore.user?.id ? 'mine' : 'yours']">
          <p>{{ m.content }}</p>
          <span class="msg-time">{{ formatTime(m.created_at) }}</span>
        </div>
        <div v-if="!messages.length" class="chat-empty">发送第一条消息吧</div>
      </div>

      <div class="chat-input-bar">
        <input
          v-model="text"
          placeholder="输入消息..."
          @keyup.enter="handleSend"
        />
        <button @click="handleSend" :disabled="!text.trim()">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchMessages, sendMessage, subscribeToMessages, unsubscribe, batchFetchProfiles } from '@/services/supabase'
import { clearUnreadPartner, setActiveChatPartner } from '@/services/db'

const route = useRoute()
const authStore = useAuthStore()
const partnerId = route.params.id
const messages = ref([])
const text = ref('')
const msgListRef = ref(null)
const partner = reactive({ profiles: null })
let msgChannel = null

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return h + ':' + m
}

function scrollToBottom() {
  nextTick(() => {
    const el = msgListRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function handleSend() {
  const content = text.value.trim()
  if (!content) return
  text.value = ''
  const { data: newMsg, error } = await sendMessage(authStore.user.id, partnerId, content)
  if (error) {
    alert('发送失败：' + (error.message || '请重试'))
    text.value = content
    return
  }
  // 立即追加到自己界面，不等刷新
  if (newMsg) {
    messages.value.push(newMsg)
    scrollToBottom()
  }
}

onMounted(async () => {
  // 进入聊天即标记已读，全局监听跳过此人
  setActiveChatPartner(partnerId)
  clearUnreadPartner(partnerId)

  // 加载对方资料
  const profileMap = await batchFetchProfiles([partnerId])
  partner.profiles = profileMap[partnerId] || { username: '匿名', avatar_url: null }

  // 加载历史消息
  const { data } = await fetchMessages(authStore.user.id, partnerId)
  messages.value = data || []
  scrollToBottom()

  // 实时接收新消息
  msgChannel = subscribeToMessages(authStore.user.id, async (payload) => {
    const msg = payload.new
    if (msg.from_user !== partnerId) return
    messages.value.push(msg)
    scrollToBottom()
  })
})

onUnmounted(() => {
  setActiveChatPartner(null)
  unsubscribe(msgChannel)
})
</script>

<style scoped>
.chat-page-body {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}
.chat-messages {
  flex: 1; overflow-y: auto; padding: var(--space-md) var(--space-lg);
  display: flex; flex-direction: column; gap: 10px;
  scroll-behavior: smooth;
}
.chat-empty { text-align: center; color: var(--ink-light); font-size: 13px; margin-top: 60px; }

.msg-bubble { max-width: 78%; padding: 10px 14px; border-radius: 16px; }
.msg-bubble p { font-size: 14px; line-height: 1.5; color: var(--ink-dark); white-space: pre-wrap; }
.msg-bubble .msg-time { font-size: 10px; color: var(--ink-light); margin-top: 4px; display: block; }

.msg-bubble.mine {
  align-self: flex-end; background: var(--celadon-pale);
  border-bottom-right-radius: 4px;
}
.msg-bubble.mine .msg-time { text-align: right; }
.msg-bubble.yours {
  align-self: flex-start; background: var(--card-bg);
  border-bottom-left-radius: 4px;
}

.chat-input-bar {
  display: flex; gap: var(--space-sm); padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-color); background: var(--card-bg); flex-shrink: 0;
}
.chat-input-bar input {
  flex: 1; padding: 10px 14px; border: 1px solid var(--border-color);
  border-radius: var(--radius-full); font-size: 13px; outline: none;
  background: var(--paper); color: var(--ink-dark);
}
.chat-input-bar input:focus { border-color: var(--celadon); }
.chat-input-bar button {
  padding: 10px 18px; border: none; border-radius: var(--radius-full);
  background: var(--gradient-brand); color: #FFF;
  font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0;
}
.chat-input-bar button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
