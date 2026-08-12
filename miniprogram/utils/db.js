// 数据层：用户 / 打卡 / 自测 / 统计（本地模式；云同步见 cloudfunctions/proxy）
const store = require('./store')
const { todayStr, uid } = require('./util')

function getUser() { return store.get('dx_user', null) }
function setUser(u) { store.set('dx_user', u) }
function clearUser() { store.set('dx_user', null) }

function getCheckin(date) {
  const all = store.get('dx_checkins', [])
  const d = date || todayStr()
  return all.find((c) => c.date === d) || null
}
function toggleCheckin() {
  const d = todayStr()
  const all = store.get('dx_checkins', [])
  const idx = all.findIndex((c) => c.date === d)
  if (idx >= 0) { all.splice(idx, 1) } else { all.push({ id: uid(), date: d, at: new Date().toISOString() }) }
  store.set('dx_checkins', all)
  return idx < 0
}

function addSelfTest({ subject, kind, name, total, correct, topic }) {
  const all = store.get('dx_selftests', [])
  all.push({ id: uid(), subject, kind, name, total: total || 0, correct: correct || 0, topic: topic || null, at: new Date().toISOString() })
  store.set('dx_selftests', all)
}
function listSelfTests() {
  return store.get('dx_selftests', []).slice().sort((a, b) => (b.at || '').localeCompare(a.at || ''))
}

// 连续打卡天数（含今天）
function streak() {
  const days = new Set(store.get('dx_checkins', []).map((c) => c.date))
  let n = 0
  const cur = new Date()
  while (days.has(todayStr(cur))) { n++; cur.setDate(cur.getDate() - 1) }
  return n
}

function getStats() {
  const tests = listSelfTests()
  const totalQ = tests.reduce((a, t) => a + (t.total || 0), 0)
  const correctQ = tests.reduce((a, t) => a + (t.correct || 0), 0)
  return {
    streak: streak(),
    checkins: store.get('dx_checkins', []).length,
    selftests: tests.length,
    totalQ, correctQ,
    acc: totalQ ? Math.round((correctQ / totalQ) * 100) : null
  }
}

function setWord(text) {
  const m = store.get('dx_word', {})
  m[todayStr()] = { she: text }
  store.set('dx_word', m)
}
function getWord() {
  const m = store.get('dx_word', {})
  return m[todayStr()] || {}
}

module.exports = { getUser, setUser, clearUser, getCheckin, toggleCheckin, addSelfTest, listSelfTests, getStats, setWord, getWord }
