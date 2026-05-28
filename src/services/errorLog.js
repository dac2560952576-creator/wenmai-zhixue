// 轻量错误日志：存 localStorage 环形缓冲，最多 50 条
const MAX = 50
const KEY = 'wenmai_error_log'

export function logError(tag, err) {
  const entry = {
    tag,
    msg: err?.message || String(err),
    time: new Date().toISOString()
  }
  console.error(`[${tag}]`, err)
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    list.push(entry)
    if (list.length > MAX) list.splice(0, list.length - MAX)
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* 写不进也没办法 */ }
}

