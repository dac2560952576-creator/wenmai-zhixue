<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">编辑资料</h1>
      <span></span>
    </header>

    <div class="page-body edit-body">
      <!-- 头像预览 -->
      <div class="avatar-preview">{{ form.avatar }}</div>

      <!-- 头像选择 -->
      <p class="section-label">选择头像</p>
      <div class="avatar-grid">
        <button
          v-for="emoji in avatarOptions"
          :key="emoji"
          :class="['avatar-option', { selected: form.avatar === emoji }]"
          @click="form.avatar = emoji"
        >{{ emoji }}</button>
      </div>

      <!-- 昵称 -->
      <p class="section-label">昵称</p>
      <input
        v-model="form.username"
        class="nickname-input"
        placeholder="请输入昵称"
        maxlength="12"
      />

      <p class="save-error" v-if="saveError">{{ saveError }}</p>

      <button class="btn-primary save-btn" @click="handleSave" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { updateUserProfile, checkUsernameTaken } from '@/services/supabase'

const router = useRouter()
const authStore = useAuthStore()

const avatarOptions = ['🏺', '🧵', '🖌️', '🪚', '🔔', '🫖', '✂️', '🪁', '🎭', '🏮', '🖼️', '👤', '🐉', '🌸', '🎋']

const currentUsername = authStore.user?.user_metadata?.username || ''
const currentAvatar = authStore.user?.user_metadata?.avatar || '🏺'

const form = reactive({
  username: currentUsername,
  avatar: currentAvatar
})

const saving = ref(false)
const saveError = ref('')

async function handleSave() {
  saveError.value = ''
  if (!form.username.trim()) { saveError.value = '请输入昵称'; return }

  const usernameChanged = form.username.trim() !== currentUsername
  const avatarChanged = form.avatar !== currentAvatar

  if (!usernameChanged && !avatarChanged) {
    saveError.value = '昵称未修改，无法操作'
    return
  }

  saving.value = true
  try {
    if (usernameChanged) {
      const taken = await checkUsernameTaken(form.username.trim(), authStore.user?.id)
      if (taken) { saveError.value = '该昵称已被注册'; saving.value = false; return }
    }

    const { error } = await updateUserProfile({ username: form.username.trim(), avatar: form.avatar })
    if (error) throw error

    authStore.user.user_metadata = {
      ...authStore.user.user_metadata,
      username: form.username.trim(),
      avatar: form.avatar
    }

    router.back()
  } catch (e) {
    saveError.value = e.message || '保存失败，请重试'
  }
  saving.value = false
}
</script>

<style scoped>
.edit-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: var(--gradient-brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
  margin-bottom: 24px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-mid);
  width: 100%;
  margin-bottom: 10px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  width: 100%;
  margin-bottom: 24px;
}

.avatar-option {
  aspect-ratio: 1;
  font-size: 28px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}

.avatar-option.selected {
  border-color: var(--celadon-dark);
  background: var(--celadon-pale);
}

.avatar-option:active { transform: scale(0.95); }

.nickname-input {
  width: 100%;
  padding: 13px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 15px;
  background: var(--card-bg);
  outline: none;
  color: var(--ink-dark);
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.nickname-input:focus { border-color: var(--celadon); }

.save-error {
  color: var(--vermilion);
  font-size: 13px;
  margin-top: 12px;
  width: 100%;
}

.save-btn {
  width: 100%;
  margin-top: 24px;
}
</style>
