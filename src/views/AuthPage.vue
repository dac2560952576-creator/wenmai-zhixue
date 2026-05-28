<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">{{ pageTitle }}</h1>
      <span></span>
    </header>

    <div class="page-body auth-body">
      <div class="auth-logo">🏺🧵</div>
      <h2 class="auth-app-name">文脉智学</h2>
      <p class="auth-desc">{{ pageDesc }}</p>

      <!-- 重置密码模式 -->
      <template v-if="isResetMode">
        <p class="reset-info" v-if="resetSent">重置邮件已发送，请前往邮箱点击链接设置新密码。</p>
        <input v-model="resetEmail" type="email" placeholder="请输入注册邮箱" class="auth-input" />
        <input v-if="showNewPassword" v-model="newPassword" type="password" placeholder="请输入新密码" class="auth-input" />
        <p class="auth-error" v-if="error">{{ error }}</p>
        <button class="btn-primary auth-btn" @click="handleReset" :disabled="authLoading">
          {{ authLoading ? '处理中...' : (showNewPassword ? '设置新密码' : '发送重置邮件') }}
        </button>
        <p class="auth-link" @click="exitReset">← 返回登录</p>
      </template>

      <!-- 登录/注册模式 -->
      <template v-else>
        <div class="auth-tabs">
          <button :class="['auth-tab', { active: mode === 'login' }]" @click="mode = 'login'">登录</button>
          <button :class="['auth-tab', { active: mode === 'register' }]" @click="mode = 'register'">注册</button>
        </div>

        <input v-model="email" type="email" placeholder="邮箱" class="auth-input" />
        <input v-model="password" type="password" placeholder="密码" class="auth-input" />
        <input v-if="mode === 'register'" v-model="username" placeholder="昵称" class="auth-input" />

        <p class="auth-error" v-if="error">{{ error }}</p>

        <button class="btn-primary auth-btn" @click="handleAuth" :disabled="authLoading">
          {{ authLoading ? '处理中...' : (mode === 'login' ? '登录' : '注册') }}
        </button>

        <p class="auth-link" @click="enterReset">忘记密码？</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resetPasswordForEmail, updateUserPassword } from '@/services/supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const mode = ref('login')
const email = ref('')
const password = ref('')
const username = ref('')
const error = ref('')
const authLoading = ref(false)

// 忘记密码状态
const isResetMode = ref(!!route.query.reset)
const showNewPassword = ref(!!route.query.reset)
const resetEmail = ref('')
const newPassword = ref('')
const resetSent = ref(false)

const pageTitle = computed(() => {
  if (showNewPassword.value) return '设置新密码'
  if (isResetMode.value) return '找回密码'
  return '登录'
})
const pageDesc = computed(() => {
  if (showNewPassword.value) return '请输入新密码'
  if (resetSent.value) return ''
  if (isResetMode.value) return '输入注册邮箱，我们将发送重置链接'
  return '登录后即可发布作品、参与社区互动'
})

function enterReset() {
  isResetMode.value = true
  error.value = ''
}
function exitReset() {
  isResetMode.value = false
  showNewPassword.value = false
  resetSent.value = false
  error.value = ''
}

async function handleReset() {
  error.value = ''
  authLoading.value = true
  try {
    if (showNewPassword.value) {
      if (!newPassword.value || newPassword.value.length < 6) {
        error.value = '密码至少 6 位'; authLoading.value = false; return
      }
      const { error: err } = await updateUserPassword(newPassword.value)
      if (err) throw err
      alert('密码已重置，请重新登录')
      exitReset()
    } else {
      if (!resetEmail.value) { error.value = '请填写邮箱'; authLoading.value = false; return }
      const { error: err } = await resetPasswordForEmail(resetEmail.value)
      if (err) throw err
      resetSent.value = true
    }
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  }
  authLoading.value = false
}

async function handleAuth() {
  error.value = ''
  if (!email.value || !password.value) { error.value = '请填写邮箱和密码'; return }
  if (mode.value === 'register' && !username.value) { error.value = '请填写昵称'; return }

  authLoading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value, username.value)
    }
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/learn')
    }
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  }
  authLoading.value = false
}
</script>

<style scoped>
.auth-body {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 24px;
}
.auth-logo { font-size: 48px; }
.auth-app-name { font-size: 24px; font-weight: 700; margin-top: 8px; color: var(--celadon-dark); }
.auth-desc { font-size: 13px; color: var(--ink-light); margin-top: 4px; margin-bottom: 32px; text-align: center; }

.auth-tabs { display: flex; width: 100%; margin-bottom: 24px; }
.auth-tab {
  flex: 1; padding: 12px; text-align: center; font-size: 15px; border: none;
  background: transparent; border-bottom: 2px solid var(--border-color); cursor: pointer;
  color: var(--ink-mid); transition: all 0.2s; font-weight: 500;
}
.auth-tab.active { border-bottom-color: var(--celadon-dark); color: var(--celadon-dark); font-weight: 600; }

.auth-input {
  width: 100%; padding: 13px 16px; margin-bottom: 12px;
  border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 14px;
  background: var(--card-bg); outline: none; transition: border-color 0.2s; color: var(--ink-dark);
  box-sizing: border-box;
}
.auth-input::placeholder { color: var(--ink-disabled); }
.auth-input:focus { border-color: var(--celadon); }
.auth-error { color: var(--vermilion); font-size: 13px; margin-bottom: 12px; width: 100%; }
.auth-btn { width: 100%; margin-top: 8px; }
.auth-link { font-size: 13px; color: var(--celadon-dark); text-align: center; margin-top: 16px; cursor: pointer; }
.reset-info { font-size: 13px; color: var(--celadon-dark); text-align: center; margin-bottom: 16px; padding: 12px; background: var(--celadon-pale); border-radius: var(--radius-sm); }
</style>
