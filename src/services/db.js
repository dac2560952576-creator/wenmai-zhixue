import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { savePatternRecord, fetchPatternRecords, saveArticleRecord, fetchArticleRecords } from './supabase'

// ---- 当前用户 ID（由 auth store 设置） ----
let _uid = null

export function setCurrentUserId(uid) {
  _uid = uid || null
}

function _k(name) {
  return _uid ? `wenmai_${name}_${_uid}` : `wenmai_${name}`
}

// ---- SQLite ----
function _dbKey() { return _k('zhixue_db') }

let db = null
let dbReadyPromise = null

async function getSQL() {
  return await initSqlJs({
    locateFile: () => wasmUrl
  })
}

export async function initDB() {
  if (db) return db

  if (dbReadyPromise) {
    try {
      await dbReadyPromise
      if (db) return db
    } catch {
      dbReadyPromise = null
    }
  }

  dbReadyPromise = (async () => {
    const SQL = await getSQL()
    const key = _dbKey()

    let saved = null
    try { saved = localStorage.getItem(key) } catch { /* noop */ }

    if (saved) {
      try {
        const arr = JSON.parse(saved)
        const u8 = new Uint8Array(arr)
        db = new SQL.Database(u8)
      } catch {
        console.warn('SQLite 数据损坏，使用新数据库')
        db = new SQL.Database()
      }
    } else {
      db = new SQL.Database()
    }

    // 清理旧的大表（迁移用）
    try { db.run('DROP TABLE IF EXISTS quiz_results') } catch { /* ok */ }
    try { db.run('DROP TABLE IF EXISTS pattern_history') } catch { /* ok */ }

    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_stats (
        craft_type TEXT PRIMARY KEY,
        total INTEGER NOT NULL DEFAULT 0,
        correct INTEGER NOT NULL DEFAULT 0
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS wrong_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        craft_type TEXT NOT NULL,
        question_id INTEGER NOT NULL UNIQUE,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        wrong_count INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        craft_type TEXT NOT NULL,
        chapter TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        UNIQUE(craft_type, chapter)
      )
    `)

    persistDB()
    return db
  })()

  return dbReadyPromise
}

function persistDB() {
  if (!db) return
  try {
    const arr = Array.from(db.export())
    const json = JSON.stringify(arr)
    localStorage.setItem(_dbKey(), json)
  } catch (e) {
    console.warn('SQLite 持久化失败:', e.message)
  }
}

/** 切换用户时重新加载数据库 */
export async function reloadDB() {
  if (db) { db.close(); db = null }
  dbReadyPromise = null
  if (_uid) await initDB()
}

// ---- 题库练习 ----
export async function saveQuizResult(craftType, _questionId, correct) {
  await initDB()
  db.run(
    `INSERT INTO quiz_stats (craft_type, total, correct) VALUES (?, 1, ?)
     ON CONFLICT(craft_type) DO UPDATE SET total = total + 1, correct = correct + ?`,
    [craftType, correct ? 1 : 0, correct ? 1 : 0]
  )
  persistDB()
}

export async function saveWrongQuestion(craftType, q) {
  await initDB()
  const existing = db.exec('SELECT id, wrong_count FROM wrong_questions WHERE question_id = ?', [q.id])
  if (existing.length && existing[0].values.length) {
    const row = existing[0].values[0]
    db.run('UPDATE wrong_questions SET wrong_count = wrong_count + 1 WHERE id = ?', [row[0]])
  } else {
    db.run(
      'INSERT INTO wrong_questions (craft_type, question_id, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
      [craftType, q.id, q.question, JSON.stringify(q.options), q.answer, q.explanation]
    )
  }
  persistDB()
}

export async function getWrongQuestions(craftType = null) {
  await initDB()
  let sql = 'SELECT * FROM wrong_questions ORDER BY wrong_count DESC'
  const params = []
  if (craftType) {
    sql = 'SELECT * FROM wrong_questions WHERE craft_type = ? ORDER BY wrong_count DESC'
    params.push(craftType)
  }
  const result = db.exec(sql, params)
  if (!result.length) return []
  return result[0].values.map(row => ({
    id: row[0],
    craft_type: row[1],
    question_id: row[2],
    question: row[3],
    options: JSON.parse(row[4]),
    correct_answer: row[5],
    explanation: row[6],
    wrong_count: row[7],
    created_at: row[8]
  }))
}

export async function getQuizStats(craftType = null) {
  await initDB()
  if (craftType) {
    const result = db.exec('SELECT total, correct FROM quiz_stats WHERE craft_type = ?', [craftType])
    if (!result.length || !result[0].values.length) return { total: 0, correct: 0, wrong: 0 }
    const [total, correct] = result[0].values[0]
    return { total, correct, wrong: total - correct }
  }
  const result = db.exec('SELECT SUM(total), SUM(correct) FROM quiz_stats')
  if (!result.length || !result[0].values.length) return { total: 0, correct: 0, wrong: 0 }
  const [total, correct] = result[0].values[0]
  return {
    total: total || 0,
    correct: correct || 0,
    wrong: (total || 0) - (correct || 0)
  }
}

// ---- 学习进度 ----
export function getProgress(craftType = null) {
  if (!db) return []
  let sql = 'SELECT * FROM reading_progress'
  const params = []
  if (craftType) {
    sql += ' WHERE craft_type = ?'
    params.push(craftType)
  }
  sql += ' ORDER BY updated_at DESC'
  const result = db.exec(sql, params)
  if (!result.length) return []
  return result[0].values.map(row => ({
    id: row[0],
    craft_type: row[1],
    chapter: row[2],
    completed: row[3] === 1,
    updated_at: row[4]
  }))
}

export function exportProgressForSync() {
  if (!db) return []
  const result = db.exec('SELECT craft_type, chapter, completed FROM reading_progress')
  if (!result.length) return []
  return result[0].values.map(row => ({
    craft_type: row[0],
    chapter: row[1],
    completed: row[2] === 1
  }))
}

export async function importProgressFromCloud(progressList) {
  await initDB()
  for (const p of progressList) {
    db.run(
      `INSERT INTO reading_progress (craft_type, chapter, completed, updated_at)
       VALUES (?, ?, ?, COALESCE(?, datetime('now','localtime')))
       ON CONFLICT(craft_type, chapter) DO UPDATE SET
         completed = excluded.completed,
         updated_at = COALESCE(excluded.updated_at, reading_progress.updated_at)`,
      [p.craft_type, p.chapter, p.completed ? 1 : 0, p.updated_at || null]
    )
  }
  persistDB()
}

// ---- 课程观看次数（全局计数，每人每课只计一次） ----
export function getAllCourseViews() {
  try {
    return JSON.parse(localStorage.getItem('wenmai_global_course_views') || '{}')
  } catch { return {} }
}

export function incrementCourseViews(courseId) {
  if (!_uid) return getAllCourseViews()[courseId] || 0
  // 每人每课只计一次
  const countedKey = _k('course_counted')
  let counted
  try { counted = new Set(JSON.parse(localStorage.getItem(countedKey) || '[]')) } catch { counted = new Set() }
  if (counted.has(courseId)) return getAllCourseViews()[courseId] || 0
  counted.add(courseId)
  localStorage.setItem(countedKey, JSON.stringify([...counted]))
  const data = getAllCourseViews()
  data[courseId] = (data[courseId] || 0) + 1
  localStorage.setItem('wenmai_global_course_views', JSON.stringify(data))
  return data[courseId]
}

// ---- 知识文档阅读记录（只记是否读过，不记次数） ----
export function markDocRead(docId, docName, category) {
  if (!_uid) return
  const key = _k('read_docs')
  let data
  try { data = JSON.parse(localStorage.getItem(key) || '{}') } catch { data = {} }
  if (!data[docId]) {
    data[docId] = { name: docName, category }
    localStorage.setItem(key, JSON.stringify(data))
  }
}

export function getReadDocs() {
  if (!_uid) return {}
  try { return JSON.parse(localStorage.getItem(_k('read_docs')) || '{}') } catch { return {} }
}

// ---- 视频播放位置（localStorage，按用户隔离） ----
export function saveVideoPosition(courseId, position) {
  if (!_uid) return
  try {
    const data = JSON.parse(localStorage.getItem(_k('video_positions')) || '{}')
    data[courseId] = { position, updatedAt: new Date().toISOString() }
    localStorage.setItem(_k('video_positions'), JSON.stringify(data))
  } catch { /* ignore */ }
}

export function getVideoPosition(courseId) {
  try {
    const data = JSON.parse(localStorage.getItem(_k('video_positions')) || '{}')
    return data[courseId]?.position || 0
  } catch { return 0 }
}

// ---- 学习天数（localStorage，按用户隔离） ----
export function trackActiveDay() {
  if (!_uid) return 0
  try {
    const raw = localStorage.getItem(_k('active_days')) || '[]'
    const days = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    if (!days.includes(today)) {
      days.push(today)
      localStorage.setItem(_k('active_days'), JSON.stringify(days))
    }
    return days.length
  } catch { return 0 }
}

export function getActiveDays() {
  if (!_uid) return 0
  try {
    const raw = localStorage.getItem(_k('active_days')) || '[]'
    return JSON.parse(raw).length
  } catch { return 0 }
}

// ---- 答题统计 & 错题本（localStorage，按用户隔离） ----
export function getLocalQuizStats() {
  try {
    return JSON.parse(localStorage.getItem(_k('quiz_stats')) || '{"total":0,"correct":0,"wrong":0}')
  } catch { return { total: 0, correct: 0, wrong: 0 } }
}

export function saveLocalQuizResult(correct) {
  const stats = getLocalQuizStats()
  stats.total++
  if (correct) stats.correct++
  else stats.wrong++
  localStorage.setItem(_k('quiz_stats'), JSON.stringify(stats))
  return stats
}

export function getLocalWrongQuestions() {
  try {
    return JSON.parse(localStorage.getItem(_k('wrong_questions')) || '[]')
  } catch { return [] }
}

export function saveLocalWrongQuestion(craftType, q) {
  const list = getLocalWrongQuestions()
  const exist = list.find(w => w.question_id === q.id)
  if (exist) {
    exist.wrong_count++
  } else {
    list.unshift({
      question_id: q.id,
      craft_type: craftType,
      question: q.question,
      options: q.options,
      correct_answer: q.answer,
      explanation: q.explanation,
      wrong_count: 1
    })
  }
  localStorage.setItem(_k('wrong_questions'), JSON.stringify(list))
  return list
}

export function clearLocalWrongQuestions() {
  localStorage.setItem(_k('wrong_questions'), '[]')
}

// ---- 发布草稿（localStorage，按用户隔离） ----
export function getPostDraft() {
  try {
    return JSON.parse(localStorage.getItem(_k('post_draft')) || 'null')
  } catch { return null }
}

export function savePostDraft(draft) {
  draft.saved_at = new Date().toISOString()
  localStorage.setItem(_k('post_draft'), JSON.stringify(draft))
}

export function clearPostDraft() {
  localStorage.removeItem(_k('post_draft'))
}

// ---- 纹样历史（localStorage + Supabase 双写） ----
export function getLocalPatternHistory() {
  try {
    return JSON.parse(localStorage.getItem(_k('pattern_history')) || '[]')
  } catch { return [] }
}

let _patternIdCounter = 0
export function saveLocalPatternHistory(topic, imageUrl) {
  const list = getLocalPatternHistory()
  list.unshift({
    id: Date.now() * 1000 + (_patternIdCounter++),
    topic,
    image_url: imageUrl,
    created_at: new Date().toISOString()
  })
  localStorage.setItem(_k('pattern_history'), JSON.stringify(list))
  if (_uid) savePatternRecord(_uid, topic, imageUrl)
  return list
}

export async function fetchMergedPatternHistory() {
  const local = getLocalPatternHistory()
  if (!_uid) return local
  try {
    const remote = await fetchPatternRecords(_uid)
    const seen = new Set(local.map(r => r.topic + r.image_url))
    const extra = remote.filter(r => !seen.has(r.topic + r.image_url))
    return [...extra, ...local].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch { return local }
}

export function removeLocalPatternItem(id) {
  const list = getLocalPatternHistory().filter(item => item.id !== id)
  localStorage.setItem(_k('pattern_history'), JSON.stringify(list))
  return list
}

export function clearLocalPatternHistory() {
  localStorage.setItem(_k('pattern_history'), '[]')
}

// ---- 文案历史（localStorage + Supabase 双写） ----
export function getLocalArticleHistory() {
  try {
    return JSON.parse(localStorage.getItem(_k('article_history')) || '[]')
  } catch { return [] }
}

let _articleIdCounter = 0
export function saveLocalArticleHistory(topic, content, reviews = []) {
  const list = getLocalArticleHistory()
  list.unshift({
    id: Date.now() * 1000 + (_articleIdCounter++),
    topic,
    content,
    reviews,
    created_at: new Date().toISOString()
  })
  localStorage.setItem(_k('article_history'), JSON.stringify(list))
  if (_uid) saveArticleRecord(_uid, topic, content, reviews)
  return list
}

export async function fetchMergedArticleHistory() {
  const local = getLocalArticleHistory()
  if (!_uid) return local
  try {
    const remote = await fetchArticleRecords(_uid)
    const seen = new Set(local.map(r => r.topic + r.content?.slice(0, 50)))
    const extra = remote.filter(r => !seen.has(r.topic + r.content?.slice(0, 50)))
    return [...extra, ...local].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch { return local }
}

export function removeLocalArticleItem(id) {
  const list = getLocalArticleHistory().filter(item => item.id !== id)
  localStorage.setItem(_k('article_history'), JSON.stringify(list))
  return list
}

export function clearLocalArticleHistory() {
  localStorage.setItem(_k('article_history'), '[]')
}

// ---- 聊天历史（localStorage，按用户隔离） ----
export function getChatHistory() {
  try {
    return JSON.parse(localStorage.getItem(_k('chat_history')) || '[]')
  } catch { return [] }
}

export function saveChatHistory(chat) {
  const list = getChatHistory()
  const idx = list.findIndex(c => c.id === chat.id)
  if (idx >= 0) {
    list[idx] = chat
  } else {
    list.unshift(chat)
  }
  localStorage.setItem(_k('chat_history'), JSON.stringify(list))
  return list
}

export function deleteChatHistory(chatId) {
  const list = getChatHistory().filter(c => c.id !== chatId)
  localStorage.setItem(_k('chat_history'), JSON.stringify(list))
  return list
}

export function clearChatHistory() {
  localStorage.setItem(_k('chat_history'), '[]')
}

// ---- 未读消息（localStorage，按用户隔离） ----
let _activeChatPartner = null

export function setActiveChatPartner(partnerId) {
  _activeChatPartner = partnerId
}

export function getUnreadPartners() {
  if (!_uid) return []
  try {
    return JSON.parse(localStorage.getItem(_k('unread_partners')) || '[]')
  } catch { return [] }
}

export function addUnreadPartner(partnerId) {
  if (!_uid) return
  if (partnerId === _activeChatPartner) return
  const list = getUnreadPartners()
  if (!list.includes(partnerId)) {
    list.push(partnerId)
    localStorage.setItem(_k('unread_partners'), JSON.stringify(list))
  }
}

export function clearUnreadPartner(partnerId) {
  if (!_uid) return
  const list = getUnreadPartners().filter(p => p !== partnerId)
  localStorage.setItem(_k('unread_partners'), JSON.stringify(list))
}

export function hasUnreadMessages() {
  return getUnreadPartners().length > 0
}
