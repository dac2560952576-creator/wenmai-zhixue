<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">练习工坊</h1>
    </header>

    <div class="page-body">
      <!-- 练习Hero -->
      <div class="practice-hero">
        <h2>每日精进</h2>
        <p>了解传统手工艺，从答题开始</p>
        <div class="streak-badge">🔥 累计已答 {{ stats.total }} 题</div>
      </div>

      <!-- 模式切换 -->
      <div class="mode-tabs">
        <button :class="['mode-tab', { active: mode === 'quiz' }]" @click="mode = 'quiz'">📝 题库练习</button>
        <button :class="['mode-tab', { active: mode === 'wrongbook' }]" @click="switchToWrongbook">📋 错题本</button>
        <button :class="['mode-tab', { active: mode === 'ai' }]" @click="mode = 'ai'">🤖 AI问答</button>
      </div>

      <!-- 题库模式 -->
      <div v-if="mode === 'quiz'">
        <!-- 统计条 -->
        <div class="stats-bar" v-if="stats.total > 0">
          <span>总 {{ stats.total }} 题</span>
          <span class="stats-correct">✅ {{ stats.correct }}</span>
          <span class="stats-wrong">❌ {{ stats.wrong }}</span>
        </div>

        <div class="quiz-card" v-if="currentQuestion">
          <div class="quiz-progress">第 {{ qIndex + 1 }} / {{ questions.length }} 题</div>
          <div class="quiz-craft-tag">{{ currentQuestion.craft }}</div>
          <p class="quiz-question">{{ currentQuestion.question }}</p>
          <button
            v-for="(opt, i) in currentQuestion.options"
            :key="i"
            :class="['quiz-option', { correct: answered && i === currentQuestion.answer, wrong: answered && selected === i && i !== currentQuestion.answer }]"
            @click="selectAnswer(i)"
            :disabled="answered"
          >
            {{ opt }}
          </button>
          <div v-if="answered" class="quiz-explanation">{{ currentQuestion.explanation }}</div>
          <button v-if="answered && qIndex < questions.length - 1" class="btn-primary" @click="nextQuestion">下一题</button>
          <button v-if="answered && qIndex === questions.length - 1" class="btn-primary" @click="restartQuiz">重新开始</button>
        </div>
        <div class="empty-state" v-else>
          <span class="icon">🎉</span>
          <span class="text">题库加载中...</span>
        </div>
      </div>

      <!-- 错题本模式 -->
      <div v-else-if="mode === 'wrongbook'">
        <div class="stats-bar" v-if="wrongQuestionsLocal.length">
          共 {{ wrongQuestionsLocal.length }} 道错题
          <button class="btn-clear" @click="clearWrong">清空</button>
        </div>
        <div v-if="wrongQuestionsLocal.length">
          <div v-for="q in wrongQuestionsLocal" :key="q.question_id" class="wrong-card">
            <span class="wrong-craft">{{ q.craft_type }}</span>
            <span class="wrong-count">错 {{ q.wrong_count }} 次</span>
            <p class="wrong-question">{{ q.question }}</p>
            <p class="wrong-answer">✅ 正确答案：{{ q.options[q.correct_answer] }}</p>
            <p class="wrong-explain">{{ q.explanation }}</p>
          </div>
        </div>
        <div class="empty-state" v-else>
          <span class="icon">📋</span>
          <span class="text">错题本为空，继续加油！</span>
        </div>
      </div>

      <!-- AI问答模式 -->
      <div v-else class="ai-section">
        <!-- 聊天顶栏 -->
        <div class="chat-topbar">
          <button class="chat-topbar-btn" @click="showHistory = true" title="历史对话">📋</button>
          <span class="chat-topbar-title">{{ activeChatTitle }}</span>
          <button class="chat-topbar-btn" @click="newChat" title="新建对话">＋</button>
        </div>

        <!-- 历史对话面板 -->
        <div class="history-overlay" v-if="showHistory" @click.self="showHistory = false">
          <div class="history-panel">
            <div class="history-header">
              <span>历史对话</span>
              <button v-if="chatHistory.length" class="btn-clear" @click="clearAllHistory">清空全部</button>
            </div>
            <div class="history-list">
              <template v-for="group in groupedHistory" :key="group.label">
                <div class="history-group-label">{{ group.label }}</div>
                <div
                  v-for="chat in group.items"
                  :key="chat.id"
                  class="history-item"
                  :class="{ active: activeChatId === chat.id }"
                  @click="loadChat(chat)"
                >
                  <div class="history-item-body">
                    <div class="history-item-title">{{ chat.title }}</div>
                    <div class="history-item-time">{{ formatChatTime(chat.updated_at) }}</div>
                  </div>
                  <button class="history-item-del" @click.stop="deleteChat(chat.id)">🗑</button>
                </div>
              </template>
              <div v-if="!chatHistory.length" class="empty-state" style="padding:40px 20px;">
                <span class="text">暂无历史对话</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-chat-box">
          <div class="chat-messages" ref="chatRef">
            <div v-for="(msg, i) in chatMessages" :key="i" :class="['msg', msg.role]">
              {{ msg.content }}
            </div>
            <div v-if="chatLoading" class="msg assistant skeleton-text">思考中...</div>
          </div>
          <div class="chat-input-row">
            <input
              v-model="chatInput"
              placeholder="输入手工艺相关问题..."
              @keyup.enter="sendQuestion"
              class="chat-input"
            />
            <button @click="sendQuestion" :disabled="chatLoading" class="btn-primary chat-send">发送</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { askQuestionStream } from '@/services/ai'
import { getLocalQuizStats, saveLocalQuizResult, getLocalWrongQuestions, saveLocalWrongQuestion, clearLocalWrongQuestions, initDB, saveQuizResult, saveWrongQuestion, getWrongQuestions, getQuizStats, getChatHistory, saveChatHistory, deleteChatHistory, clearChatHistory, trackActiveDay } from '@/services/db'
import quizData from '@/data/题库.json'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

function requireAuth() {
  if (authStore.isLoggedIn) return true
  if (confirm('请先登录或注册')) {
    router.push('/auth')
  }
  return false
}

const mode = ref('quiz')
const questions = ref([...quizData].sort(() => Math.random() - 0.5))
const qIndex = ref(0)
const selected = ref(-1)
const answered = ref(false)
const stats = ref({ total: 0, correct: 0, wrong: 0 })

const currentQuestion = computed(() => questions.value[qIndex.value] || null)

async function selectAnswer(i) {
  if (!requireAuth()) return
  if (answered.value) return
  selected.value = i
  answered.value = true
  const correct = i === currentQuestion.value.answer

  // 1. 先写 localStorage（同步可靠，立即生效）
  stats.value = saveLocalQuizResult(correct)
  if (!correct) {
    wrongQuestionsLocal.value = saveLocalWrongQuestion(currentQuestion.value.craft, currentQuestion.value)
  }

  // 2. 同步写 SQLite（作为正式数据库）
  try {
    await initDB()
    await saveQuizResult(currentQuestion.value.craft, currentQuestion.value.id, correct)
    if (!correct) {
      await saveWrongQuestion(currentQuestion.value.craft, currentQuestion.value)
    }
  } catch (e) {
    console.warn('SQLite 写入失败:', e)
  }
}

function nextQuestion() {
  qIndex.value++
  selected.value = -1
  answered.value = false
}

function restartQuiz() {
  qIndex.value = 0
  selected.value = -1
  answered.value = false
  questions.value = [...questions.value].sort(() => Math.random() - 0.5)
}

// 错题本 — 本地内存数组 + DB 双写
const wrongQuestionsLocal = ref([])

async function switchToWrongbook() {
  mode.value = 'wrongbook'
  try {
    await initDB()
    wrongQuestionsLocal.value = await getWrongQuestions()
    if (!wrongQuestionsLocal.value.length) {
      wrongQuestionsLocal.value = getLocalWrongQuestions()
    }
  } catch {
    wrongQuestionsLocal.value = getLocalWrongQuestions()
  }
}

function clearWrong() {
  clearLocalWrongQuestions()
  wrongQuestionsLocal.value = []
}

// AI问答
const WELCOME_MSG = { role: 'assistant', content: '你好！我是中国传统手工艺学习助手，可以问我任何关于陶瓷、织绣、雕刻、金属工艺、漆器、民间美术等方面的问题。' }
const chatMessages = ref([{ ...WELCOME_MSG }])
const chatInput = ref('')
const chatLoading = ref(false)
const chatRef = ref(null)

// 历史对话
const activeChatId = ref(Date.now())
const showHistory = ref(false)
const chatHistory = ref(getChatHistory())

const activeChatTitle = computed(() => {
  const msgs = chatMessages.value
  if (msgs.length <= 1) return '新对话'
  const firstUser = msgs.find(m => m.role === 'user')
  return firstUser ? firstUser.content.slice(0, 20) + (firstUser.content.length > 20 ? '...' : '') : '新对话'
})

function newChat() {
  activeChatId.value = Date.now()
  chatMessages.value = [{ ...WELCOME_MSG }]
  showHistory.value = false
}

function saveCurrentChat() {
  const msgs = chatMessages.value
  if (msgs.length <= 1) return // 不保存空对话
  const firstUser = msgs.find(m => m.role === 'user')
  const title = firstUser ? firstUser.content.slice(0, 30) : '新对话'
  saveChatHistory({
    id: activeChatId.value,
    title,
    messages: [...msgs],
    updated_at: new Date().toISOString()
  })
  chatHistory.value = getChatHistory()
}

function loadChat(chat) {
  activeChatId.value = chat.id
  chatMessages.value = [...chat.messages]
  showHistory.value = false
}

function deleteChat(chatId) {
  chatHistory.value = deleteChatHistory(chatId)
  if (activeChatId.value === chatId) {
    newChat()
  }
}

function clearAllHistory() {
  clearChatHistory()
  chatHistory.value = []
  newChat()
}

// 按日期分组
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

const groupedHistory = computed(() => {
  const groups = {}
  for (const chat of chatHistory.value) {
    const key = getDateGroup(chat.updated_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(chat)
  }
  const order = ['今天', '昨天', '本周内', '更早']
  return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }))
})

function formatChatTime(isoStr) {
  const d = new Date(isoStr)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${m}`
}

async function sendQuestion() {
  if (!requireAuth()) return
  const q = chatInput.value.trim()
  if (!q || chatLoading.value) return

  if (!appStore.isOnline) {
    chatMessages.value.push({ role: 'assistant', content: 'AI问答需要联网使用，请检查网络连接。' })
    return
  }

  chatMessages.value.push({ role: 'user', content: q })
  chatInput.value = ''
  chatLoading.value = true
  chatMessages.value.push({ role: 'assistant', content: '' })

  const scroll = () => {
    if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight
  }
  await nextTick()
  scroll()

  try {
    const lastMsg = chatMessages.value[chatMessages.value.length - 1]
    await askQuestionStream(q, (token, full) => {
      lastMsg.content = full
      scroll()
    })
    if (!lastMsg.content) {
      lastMsg.content = '抱歉，暂时无法回答这个问题。'
    }
    // 回答完成，保存到历史
    saveCurrentChat()
  } catch (e) {
    chatMessages.value.pop()
    chatMessages.value.push({ role: 'assistant', content: `AI服务调用失败：${e.message}` })
  } finally {
    chatLoading.value = false
  }
}

onMounted(async () => {
  if (authStore.isLoggedIn) trackActiveDay()
  try {
    await initDB()
    const s = await getQuizStats()
    if (s.total > 0) {
      stats.value = s
    } else {
      stats.value = getLocalQuizStats()
    }
  } catch {
    stats.value = getLocalQuizStats()
  }
})
</script>

<style scoped>
/* Hero */
.practice-hero {
  border-radius: var(--radius-lg);
  padding: 20px;
  background: linear-gradient(135deg, #FDF8F0 0%, #F5EDE0 100%);
  margin-bottom: var(--space-lg);
  border: 1px solid rgba(0,0,0,0.03);
}
.practice-hero h2 { font-size: 18px; font-weight: 700; color: var(--ink-dark); }
.practice-hero p { font-size: 13px; color: var(--ink-mid); margin-top: 4px; }
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.8);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: #E65100;
}

.mode-tabs { display: flex; gap: 6px; margin-bottom: var(--space-lg); }
.mode-tab {
  flex: 1; padding: 10px 6px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg); font-size: 13px; cursor: pointer; text-align: center;
  font-weight: 500; color: var(--ink-mid); transition: all 0.2s;
}
.mode-tab.active {
  border-color: var(--celadon-dark);
  background: var(--gradient-brand);
  color: #FFF;
}

.stats-bar {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  background: var(--card-bg); border-radius: var(--radius-md); margin-bottom: var(--space-md);
  font-size: 13px; color: var(--ink-light); border: 1px solid rgba(0,0,0,0.04);
}
.stats-correct { color: var(--color-success); font-weight: 600; }
.stats-wrong { color: var(--vermilion); font-weight: 600; }
.btn-clear {
  margin-left: auto; background: none; border: 1px solid var(--border-color);
  border-radius: var(--radius-full); padding: 4px 12px; font-size: 12px; cursor: pointer;
  color: var(--ink-light);
}

.quiz-card {
  background: var(--card-bg); border-radius: var(--radius-md); padding: var(--space-xl);
  border: 1px solid rgba(0,0,0,0.04);
}
.quiz-progress { font-size: 12px; color: var(--ink-light); margin-bottom: 10px; }
.quiz-craft-tag {
  display: inline-block; font-size: 11px; padding: 4px 12px;
  background: var(--celadon-pale); border-radius: var(--radius-full); margin-bottom: 14px;
  color: var(--celadon-dark); font-weight: 500;
}
.quiz-question { font-size: 16px; font-weight: 600; margin-bottom: 18px; line-height: 1.7; color: var(--ink-dark); }
.quiz-option {
  display: block; width: 100%; padding: 13px 16px; margin-bottom: 10px;
  text-align: left; border: 1.5px solid var(--border-color); border-radius: var(--radius-sm);
  background: var(--paper); font-size: 14px; cursor: pointer; transition: all 0.15s;
  color: var(--ink-dark);
}
.quiz-option:active:not(:disabled) { border-color: var(--celadon); background: #F8FCFA; }
.quiz-option.correct { background: var(--celadon-pale); border-color: var(--celadon-dark); color: var(--celadon-dark); font-weight: 500; }
.quiz-option.wrong { background: #FCEAE9; border-color: var(--vermilion); color: var(--vermilion); }
.quiz-explanation {
  margin-top: 14px; padding: 14px;
  background: #FDF8F0; border-radius: var(--radius-sm);
  font-size: 13px; line-height: 1.7; color: #9A7B3C;
  border-left: 3px solid var(--silk-gold);
}
.btn-primary { margin-top: 18px; }

.wrong-card {
  background: var(--card-bg); border-radius: var(--radius-md); padding: 16px; margin-bottom: var(--space-sm);
  border: 1px solid rgba(0,0,0,0.04);
}
.wrong-craft {
  font-size: 11px; padding: 3px 10px;
  background: var(--celadon-pale); border-radius: var(--radius-full); color: var(--celadon-dark);
}
.wrong-count { font-size: 12px; color: var(--vermilion); margin-left: 8px; font-weight: 600; }
.wrong-question { font-size: 14px; font-weight: 600; margin-top: 10px; line-height: 1.6; color: var(--ink-dark); }
.wrong-answer { font-size: 13px; color: var(--color-success); margin-top: 8px; }
.wrong-explain { font-size: 12px; color: var(--ink-light); margin-top: 6px; line-height: 1.6; }

/* AI聊天 */
.ai-section {
  display: flex; flex-direction: column; height: calc(100vh - 260px);
  position: relative;
}
.chat-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: var(--card-bg);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border: 1px solid rgba(0,0,0,0.04); border-bottom: none;
  flex-shrink: 0;
}
.chat-topbar-btn {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: var(--paper-warm); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.chat-topbar-title {
  font-size: 13px; font-weight: 600; color: var(--ink-mid);
  max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 历史面板 */
.history-overlay {
  position: absolute; inset: 0; z-index: 10;
  background: rgba(0,0,0,0.4);
  display: flex;
}
.history-panel {
  width: 85%; max-width: 320px; background: var(--card-bg);
  height: 100%;
  display: flex; flex-direction: column;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.history-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid var(--border-color);
  font-size: 15px; font-weight: 600; flex-shrink: 0;
}
.history-header .btn-clear {
  font-size: 11px; padding: 4px 12px;
  border: 1px solid var(--border-color); border-radius: var(--radius-full);
  background: none; color: var(--ink-light); cursor: pointer;
}
.history-list { flex: 1; overflow-y: auto; padding: 4px 0; }
.history-group-label {
  padding: 12px 16px 4px; font-size: 11px; color: var(--ink-light);
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}
.history-item {
  display: flex; align-items: center; padding: 12px 16px;
  cursor: pointer; transition: background 0.15s;
}
.history-item:active { background: var(--paper-warm); }
.history-item.active { background: var(--celadon-pale); }
.history-item-body { flex: 1; min-width: 0; }
.history-item-title {
  font-size: 14px; font-weight: 500; color: var(--ink-dark);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.history-item-time {
  font-size: 11px; color: var(--ink-light); margin-top: 2px;
}
.history-item-del {
  width: 28px; height: 28px; border: none; background: none;
  font-size: 14px; cursor: pointer; flex-shrink: 0;
  opacity: 0.4; display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
}
.history-item-del:active { opacity: 1; }

.ai-chat-box {
  flex: 1; background: var(--card-bg); overflow: hidden;
  display: flex; flex-direction: column;
  border: 1px solid rgba(0,0,0,0.04); border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}
.chat-messages { flex: 1; overflow-y: auto; padding: var(--space-lg); }
.msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.6; margin-bottom: 10px; word-break: break-word; }
.msg.user { background: var(--gradient-brand); color: #FFF; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 4px; }
.msg.assistant { background: #F3F0EA; align-self: flex-start; border-bottom-left-radius: 4px; color: var(--ink-dark); }
.skeleton-text { color: var(--ink-light); font-style: italic; }
.chat-input-row { display: flex; padding: var(--space-md); gap: 8px; border-top: 1px solid var(--border-color); }
.chat-input {
  flex: 1; padding: 10px 16px; border: 1px solid var(--border-color);
  border-radius: var(--radius-full); font-size: 14px; outline: none;
  background: var(--paper); color: var(--ink-dark);
  transition: border-color 0.2s;
}
.chat-input::placeholder { color: var(--ink-disabled); }
.chat-input:focus { border-color: var(--celadon); }
.chat-send {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: var(--gradient-brand);
  border: none; color: #FFF; font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s;
}
.chat-send:active { opacity: 0.8; }
.chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
