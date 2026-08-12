function pad(n) { return n < 10 ? '0' + n : '' + n }
function todayStr(d) {
  const x = d ? new Date(d) : new Date()
  return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate())
}
function daysUntil(dateStr) {
  const t = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((t - now) / 86400000)
}
function uid() {
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
function fmtDur(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  if (h > 0) return h + '小时' + m + '分'
  if (m > 0) return m + '分'
  return s + '秒'
}
module.exports = { pad, todayStr, daysUntil, uid, fmtDur }
