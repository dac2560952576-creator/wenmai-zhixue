import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 未配置，请将 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 写入 .env 文件')
}

import { logError } from './errorLog'

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// ---- 认证 ----
export function signUp(email, password, username) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { username, avatar: '🏺' } }
  })
}

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

// 忘记密码 - 发送重置邮件
export function resetPasswordForEmail(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth?reset=true'
  })
}

// 设置新密码（用户在邮件链接中回到 App 后调用）
export function updateUserPassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword })
}

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// 更新用户资料（昵称 + 头像），同步写入 auth 元数据 + profiles 表
export async function updateUserProfile({ username, avatar }) {
  const { data, error } = await supabase.auth.updateUser({
    data: { username, avatar }
  })
  if (error) return { error }

  // 同步更新 profiles 表，让社区帖子和评论能显示昵称
  if (data?.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, username, avatar_url: avatar }, { onConflict: 'id' })
    if (profileError) console.warn('profiles 同步失败:', profileError.message)
  }

  return { data, error: null }
}

// 检查昵称是否已被其他用户占用
export async function checkUsernameTaken(username, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// ---- 辅助：批量填充用户资料（profiles 表无直接 FK，需手动 JOIN） ----
export async function batchFetchProfiles(userIds) {
  if (!userIds.length) return {}
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)
  const map = {}
  for (const p of (data || [])) { map[p.id] = p }
  return map
}

// ---- 作品墙 ----
export async function fetchPosts(page = 1, pageSize = 20, craftType = null) {
  let query = supabase
    .from('posts')
    .select('id, title, content, image_url, craft_type, ai_review, like_count, created_at, user_id')
    .order('created_at', { ascending: false })
  if (craftType) query = query.eq('craft_type', craftType)
  const { data: posts, error } = await query.range((page - 1) * pageSize, page * pageSize - 1)
  if (error || !posts || !posts.length) return { data: posts, error }

  const uidSet = [...new Set(posts.map(p => p.user_id))]
  const profileMap = await batchFetchProfiles(uidSet)
  const enriched = posts.map(p => ({
    ...p,
    profiles: profileMap[p.user_id] || { username: '匿名', avatar_url: null }
  }))
  return { data: enriched, error: null }
}

export async function fetchPostDetail(postId) {
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, content, image_url, craft_type, ai_review, like_count, created_at, user_id')
    .eq('id', postId)
    .single()
  if (error || !post) return { data: post, error }

  const profileMap = await batchFetchProfiles([post.user_id])
  return {
    data: { ...post, profiles: profileMap[post.user_id] || { username: '匿名', avatar_url: null } },
    error: null
  }
}

export function createPost(post) {
  return supabase.from('posts').insert(post).select().single()
}

export function updatePost(postId, updates) {
  return supabase.from('posts').update(updates).eq('id', postId).select().single()
}

export function deletePost(postId) {
  return supabase.from('posts').delete().eq('id', postId)
}

// ---- 点赞 ----
export function toggleLike(userId, postId) {
  return supabase.from('likes').insert({ user_id: userId, post_id: postId }).select()
}

export function removeLike(userId, postId) {
  return supabase.from('likes').delete().match({ user_id: userId, post_id: postId })
}

export function fetchUserLikes(userId) {
  return supabase.from('likes').select('post_id').eq('user_id', userId)
}

// 获取用户发布的帖子
export async function fetchUserPosts(userId) {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content, image_url, craft_type, like_count, created_at, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !posts || !posts.length) return { data: posts, error }

  const uidSet = [...new Set(posts.map(p => p.user_id))]
  const profileMap = await batchFetchProfiles(uidSet)
  return {
    data: posts.map(p => ({ ...p, profiles: profileMap[p.user_id] || { username: '匿名', avatar_url: null } })),
    error: null
  }
}

// 获取用户点赞过的帖子详情
export async function fetchLikedPosts(userId) {
  const { data: likes } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!likes || !likes.length) return { data: [] }

  const postIds = likes.map(l => l.post_id)
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content, image_url, craft_type, like_count, created_at, user_id')
    .in('id', postIds)
  if (error || !posts || !posts.length) return { data: posts, error }

  const uidSet = [...new Set(posts.map(p => p.user_id))]
  const profileMap = await batchFetchProfiles(uidSet)
  return {
    data: posts.map(p => ({ ...p, profiles: profileMap[p.user_id] || { username: '匿名', avatar_url: null } })),
    error: null
  }
}

// ---- 评论 ----
export async function fetchComments(postId) {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('id, content, created_at, user_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
  if (error || !comments || !comments.length) return { data: comments, error }

  const uidSet = [...new Set(comments.map(c => c.user_id))]
  const profileMap = await batchFetchProfiles(uidSet)
  return {
    data: comments.map(c => ({ ...c, profiles: profileMap[c.user_id] || { username: '匿名', avatar_url: null } })),
    error: null
  }
}

export function addComment(comment) {
  return supabase.from('comments').insert(comment).select().single()
}

// ---- 纹样历史（Supabase） ----
export async function savePatternRecord(userId, topic, imageUrl) {
  const { error } = await supabase.from('pattern_history').insert({
    user_id: userId,
    topic,
    image_url: imageUrl
  })
  if (error) logError('supabase:savePattern', error)
}

export async function fetchPatternRecords(userId) {
  const { data, error } = await supabase
    .from('pattern_history')
    .select('id, topic, image_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) { console.warn('获取纹样历史失败:', error.message); return [] }
  return (data || []).map(r => ({
    id: r.id,
    topic: r.topic,
    image_url: r.image_url,
    created_at: r.created_at
  }))
}

// ---- 文案历史（Supabase） ----
export async function saveArticleRecord(userId, topic, content, reviews) {
  const { error } = await supabase.from('article_history').insert({
    user_id: userId,
    topic,
    content,
    reviews: reviews || []
  })
  if (error) console.warn('文案同步失败:', error.message)
}

export async function fetchArticleRecords(userId) {
  const { data, error } = await supabase
    .from('article_history')
    .select('id, topic, content, reviews, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) { console.warn('获取文案历史失败:', error.message); return [] }
  return (data || []).map(r => ({
    id: r.id,
    topic: r.topic,
    content: r.content,
    reviews: r.reviews || [],
    created_at: r.created_at
  }))
}

// ---- 学习进度 ----
export function syncProgress(userId, progressList) {
  const rows = progressList.map(p => ({ ...p, user_id: userId }))
  return supabase.from('progress').upsert(rows, {
    onConflict: 'user_id, craft_type, chapter'
  })
}

export function fetchProgress(userId) {
  return supabase.from('progress').select('*').eq('user_id', userId)
}

// ---- Realtime 订阅 ----

/**
 * 订阅 posts 表变更（新帖、删除、like_count 更新）
 * 用于社区首页实时刷新
 */
// 批量查帖子评论数
export async function fetchCommentCounts(postIds) {
  if (!postIds.length) return {}
  const { data } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)
  const counts = {}
  for (const c of (data || [])) {
    counts[c.post_id] = (counts[c.post_id] || 0) + 1
  }
  return counts
}

export function subscribeToPosts(onChange) {
  return supabase
    .channel('posts-feed')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'posts' },
      (payload) => onChange(payload)
    )
    .subscribe()
}

/**
 * 订阅单帖的点赞变化
 */
export function subscribeToPostLikes(postId, onChange) {
  return supabase
    .channel(`post-likes-${postId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` },
      (payload) => onChange(payload)
    )
    .subscribe()
}

/**
 * 订阅单帖的新评论
 */
export function subscribeToPostComments(postId, onChange) {
  return supabase
    .channel(`post-comments-${postId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
      (payload) => onChange(payload)
    )
    .subscribe()
}

/**
 * 退订频道
 */
export function unsubscribe(channel) {
  if (channel) supabase.removeChannel(channel)
}

// ---- 私信 ----

// 查上次退出后收到的未读消息的发送者列表
export async function fetchUnreadSenders(userId) {
  // 读上次退出时间，没有则取所有消息
  let lastLogout = null
  try {
    lastLogout = localStorage.getItem(`wenmai_last_logout_${userId}`)
  } catch { /* ignore */ }

  let query = supabase
    .from('messages')
    .select('from_user')
    .eq('to_user', userId)
  if (lastLogout) query = query.gt('created_at', lastLogout)

  const { data } = await query.order('created_at', { ascending: false }).limit(100)
  if (!data) return []
  return [...new Set(data.map(m => m.from_user))]
}

export function saveLastLogout(userId) {
  try {
    localStorage.setItem(`wenmai_last_logout_${userId}`, new Date().toISOString())
  } catch { /* ignore */ }
}

export function sendMessage(fromUserId, toUserId, content) {
  return supabase.from('messages').insert({
    from_user: fromUserId,
    to_user: toUserId,
    content
  }).select().single()
}

export async function fetchMessages(userId, otherUserId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, from_user, to_user, content, created_at')
    .or(`and(from_user.eq.${userId},to_user.eq.${otherUserId}),and(from_user.eq.${otherUserId},to_user.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(200)
  return { data, error }
}

export async function fetchConversations(userId) {
  // 拉最近消息，前端按对话对象分组
  const { data, error } = await supabase
    .from('messages')
    .select('id, from_user, to_user, content, created_at')
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error || !data) return { data, error }

  // 按对方用户ID分组，取每组最新一条
  const convMap = {}
  for (const m of data) {
    const partnerId = m.from_user === userId ? m.to_user : m.from_user
    if (!convMap[partnerId]) convMap[partnerId] = m
  }
  const conversations = Object.values(convMap).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )

  // 批量查 profiles
  const partnerIds = conversations.map(c => {
    return c.from_user === userId ? c.to_user : c.from_user
  })
  const profileMap = await batchFetchProfiles(partnerIds)

  return {
    data: conversations.map(c => ({
      ...c,
      partnerId: c.from_user === userId ? c.to_user : c.from_user,
      profiles: profileMap[c.from_user === userId ? c.to_user : c.from_user] || { username: '匿名', avatar_url: null }
    })),
    error: null
  }
}

export function subscribeToMessages(userId, onChange) {
  return supabase
    .channel(`messages-${userId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `to_user=eq.${userId}` },
      (payload) => onChange(payload)
    )
    .subscribe()
}
