import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSession, onAuthChange, signIn, signUp, signOut, saveLastLogout, fetchUnreadSenders } from '@/services/supabase'
import { setCurrentUserId, reloadDB, getUnreadPartners, addUnreadPartner } from '@/services/db'
import { logError } from '@/services/errorLog'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  async function _syncOfflineUnread(uid) {
    try {
      const senders = await fetchUnreadSenders(uid)
      for (const s of senders) addUnreadPartner(s)
      // 更新检查时间，避免下次重复标记
      saveLastLogout(uid)
    } catch (e) { logError('auth:syncOfflineUnread', e) }
  }

  async function init() {
    const { data } = await getSession()
    session.value = data.session
    user.value = data.session?.user || null
    const uid = data.session?.user?.id || null
    setCurrentUserId(uid)
    if (uid) { reloadDB(); await _syncOfflineUnread(uid) }
  }

  function listen() {
    onAuthChange(async (event, newSession) => {
      session.value = newSession
      user.value = newSession?.user || null
      const uid = newSession?.user?.id || null
      setCurrentUserId(uid)
      if (uid) { await reloadDB(); await _syncOfflineUnread(uid) }
    })
  }

  async function login(email, password) {
    const { data, error } = await signIn(email, password)
    if (error) throw error
    if (data.session) {
      setCurrentUserId(data.session.user.id)
      await reloadDB()
      await _syncOfflineUnread(data.session.user.id)
    }
    return data
  }

  async function register(email, password, username) {
    const { data, error } = await signUp(email, password, username)
    if (error) throw error

    // 注册成功后有 session 则直接登录
    if (data.session) {
      session.value = data.session
      user.value = data.session.user
      setCurrentUserId(data.session.user.id)
      await reloadDB()
      await _syncOfflineUnread(data.session.user.id)
      return data
    }

    // 无 session → 需要邮箱确认
    throw new Error('注册成功！请前往邮箱查收验证邮件，点击确认链接后返回登录。')
  }

  async function logout() {
    if (user.value) saveLastLogout(user.value.id)
    await signOut()
    user.value = null
    session.value = null
    setCurrentUserId(null)
  }

  return { user, session, isLoggedIn, init, listen, login, register, logout }
})
