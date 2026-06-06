<template>
  <!-- 悬浮按钮 -->
  <button class="ai-fab" @click="open" v-if="!visible" title="智学助手">
    🤖
  </button>

  <!-- 遮罩 + 面板 -->
  <div class="ai-overlay" v-if="visible" @click.self="close">
    <div class="ai-panel">
        <div class="ai-panel-header">
          <span>🤖 智学助手</span>
          <button class="ai-panel-close" @click="close">✕</button>
        </div>

        <div class="ai-panel-body">
          <div v-if="quickQuestions.length && messages.length <= 1" class="ai-quick">
            <p class="ai-quick-title">💡 关于「{{ craftName }}」你可能想问：</p>
            <span
              v-for="q in quickQuestions"
              :key="q"
              class="ai-quick-chip"
              @click="ask(q)"
            >{{ q }}</span>
          </div>

          <div class="ai-messages" ref="msgRef">
            <div v-for="(m, i) in messages" :key="i" :class="['ai-msg', m.role]">{{ m.content }}</div>
            <div v-if="loading" class="ai-msg assistant ai-typing">思考中…</div>
          </div>
        </div>

        <div class="ai-panel-input">
          <input
            v-model="input"
            placeholder="输入你的问题…"
            @keyup.enter="ask(input)"
          />
          <button @click="ask(input)" :disabled="!input.trim() || loading">发送</button>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { askQuestionStream } from '@/services/ai'
import gsap from 'gsap'

const props = defineProps({
  craftName: { type: String, default: '' },
  docContent: { type: String, default: '' }
})

const visible = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([])
const msgRef = ref(null)

// 从文档术语表中提取关键词生成快捷提问
const quickQuestions = ref([])
function extractTerms(md) {
  if (!md) return []
  const terms = []
  // 匹配术语表的表格行：| **术语** | 释义 |
  const tableSection = md.match(/## 核心术语表[\s\S]*?(?=## |$)/)
  if (!tableSection) return []
  const rows = tableSection[0].matchAll(/\|\s*\*{0,2}([^*|]+?)\*{0,2}\s*\|/g)
  for (const m of rows) {
    const term = m[1].trim()
    if (term && term !== '术语' && term !== '------' && terms.length < 4) {
      terms.push(term)
    }
  }
  return terms
}

function open() {
  visible.value = true
  if (quickQuestions.value.length === 0) {
    quickQuestions.value = extractTerms(props.docContent)
  }
  if (messages.value.length === 0) {
    let greet = `你好！我正在阅读《${props.craftName}》`
    if (props.docContent) greet += '，有不理解的地方可以随时问我。'
    else greet += '。有什么想了解的可以问我。'
    messages.value.push({ role: 'assistant', content: greet })
  }
  // GSAP 面板滑入 + 快捷提问弹性入场
  nextTick(() => {
    const panel = document.querySelector('.ai-panel')
    const overlay = document.querySelector('.ai-overlay')
    if (overlay) gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    if (panel) gsap.fromTo(panel, { x: '100%' }, { x: 0, duration: 0.35, ease: 'power3.out' })
    gsap.from('.ai-quick-chip', { opacity: 0, y: 8, duration: 0.25, stagger: 0.05, delay: 0.2, ease: 'power2.out' })
  })
}

function close() {
  const panel = document.querySelector('.ai-panel')
  const overlay = document.querySelector('.ai-overlay')
  if (panel && overlay) {
    gsap.to(panel, { x: '100%', duration: 0.25, ease: 'power3.in', onComplete: () => { visible.value = false } })
    gsap.to(overlay, { opacity: 0, duration: 0.25 })
  } else {
    visible.value = false
  }
}

async function ask(q) {
  const question = typeof q === 'string' ? q : input.value.trim()
  if (!question || loading.value) return
  input.value = ''

  messages.value.push({ role: 'user', content: question })
  messages.value.push({ role: 'assistant', content: '' })
  loading.value = true

  const lastMsg = messages.value[messages.value.length - 1]
  try {
    // 注入当前文档作为上下文
    await askQuestionStream(question, (_, full) => {
      lastMsg.content = full
      scrollBottom()
    }, props.docContent)
    if (!lastMsg.content) lastMsg.content = '抱歉，暂时无法回答。'
  } catch (e) {
    lastMsg.content = `AI服务调用失败：${e.message}`
  } finally {
    loading.value = false
  }
}

function scrollBottom() {
  nextTick(() => {
    if (msgRef.value) msgRef.value.scrollTop = msgRef.value.scrollHeight
  })
}
</script>

<style scoped>
/* ===== 悬浮按钮 ===== */
.ai-fab {
  position: absolute; right: 16px; top: 55%; z-index: 900;
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, var(--celadon), var(--celadon-dark));
  color: #FFF; border: none; font-size: 24px;
  box-shadow: 0 4px 20px rgba(74,139,122,0.35);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ai-fab:active { transform: scale(0.9); }

/* ===== 遮罩 ===== */
.ai-overlay {
  position: absolute; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.3);
  display: flex; justify-content: flex-end;
}

/* ===== 面板 ===== */
.ai-panel {
  width: 78%; max-width: 400px; height: 100%;
  background: var(--paper);
  display: flex; flex-direction: column;
  box-shadow: -4px 0 30px rgba(0,0,0,0.1);
}

.ai-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; font-size: 15px; font-weight: 700;
  background: var(--card-bg); border-bottom: 1px solid var(--border-color);
  font-family: 'Noto Serif SC', serif; flex-shrink: 0;
}
.ai-panel-close {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: var(--paper-warm); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

/* ===== 快捷提问 ===== */
.ai-panel-body { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.ai-quick { margin-bottom: 4px; }
.ai-quick-title { font-size: 12px; color: var(--ink-light); margin-bottom: 8px; }
.ai-quick-chip {
  display: inline-block; font-size: 12px; padding: 5px 10px; margin: 0 6px 6px 0;
  border-radius: var(--radius-full); cursor: pointer;
  background: var(--card-bg); border: 1px solid var(--border-color);
  color: var(--ink-mid); transition: all 0.15s;
}
.ai-quick-chip:active { background: var(--celadon-pale); border-color: var(--celadon); }

/* ===== 消息 ===== */
.ai-messages { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.ai-msg { max-width: 88%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.6; word-break: break-word; }
.ai-msg.user { align-self: flex-end; background: var(--gradient-brand); color: #FFF; border-bottom-right-radius: 4px; }
.ai-msg.assistant { align-self: flex-start; background: #F3F0EA; color: var(--ink-dark); border-bottom-left-radius: 4px; }
.ai-typing { color: var(--ink-light); font-style: italic; }

/* ===== 输入 ===== */
.ai-panel-input {
  display: flex; gap: 8px; padding: 10px 14px;
  border-top: 1px solid var(--border-color); background: var(--card-bg); flex-shrink: 0;
}
.ai-panel-input input {
  flex: 1; padding: 10px 14px; border: 1px solid var(--border-color);
  border-radius: var(--radius-full); font-size: 13px; outline: none;
  background: var(--paper); color: var(--ink-dark);
}
.ai-panel-input input:focus { border-color: var(--celadon); }
.ai-panel-input button {
  padding: 10px 16px; border: none; border-radius: var(--radius-full);
  background: var(--gradient-brand); color: #FFF;
  font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0;
}
.ai-panel-input button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
