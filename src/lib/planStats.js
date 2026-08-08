// planStats.js —— 备考统计纯函数：错题聚合 / 雷达 / 周报 / 连续天数 / 热力图 / 7 天柱图
import { EXAM_TYPES, DEFAULT_EXAM } from './examTypes.js'

// 科目别名归一（诚实边界：旧数据里计组可能写作"计算机组成原理"）
const ALIAS = { '计算机组成原理': '计算机组成' }
const norm = (s) => ALIAS[s] || s

/* ---------------- 错题本：按科目+知识点聚合 ---------------- */
export function wrongBookStats(tests) {
  const map = {}
  for (const t of tests) {
    if (!t.topic) continue
    const sub = norm(t.subject)
    const key = `${sub}::${t.topic}`
    if (!map[key]) map[key] = { subject: sub, topic: t.topic, totalQ: 0, wrongQ: 0, wrongByReason: {} }
    const realTotal = Math.max(0, (t.total || 0) - (t.practice || 0))
    const mixedWrong = (t.total || 0) - (t.correct || 0)
    const practiceWrong = Math.max(0, (t.practice || 0) - (t.practiceCorrect || 0))
    const realWrong = Math.max(0, mixedWrong - practiceWrong)
    map[key].totalQ += realTotal
    map[key].wrongQ += realWrong
    if (t.wrongReason && realWrong > 0) {
      map[key].wrongByReason[t.wrongReason] = (map[key].wrongByReason[t.wrongReason] || 0) + realWrong
    }
  }
  return Object.values(map)
    .filter((e) => e.totalQ > 0)
    .map((e) => ({ ...e, acc: 1 - e.wrongQ / e.totalQ }))
    .sort((a, b) => b.wrongQ - a.wrongQ)
}

/* ---------------- 知识雷达 ---------------- */
export function radarData(tests, examType) {
  const type = EXAM_TYPES[examType] || EXAM_TYPES[DEFAULT_EXAM]
  const bySubject = {}
  for (const t of tests) {
    const sub = norm(t.subject)
    if (!bySubject[sub]) bySubject[sub] = []
    bySubject[sub].push(t)
  }
  return (type.subjects || []).map((s) => {
    const merged = (type.merge && type.merge[s.key]) || []
    const names = [...merged, s.label]
    const list = names.flatMap((nm) => bySubject[nm] || [])
    const totQ = list.reduce((a, b) => a + Math.max(0, (b.total || 0) - (b.practice || 0)), 0)
    const corQ = list.reduce((a, b) => a + Math.max(0, (b.correct || 0) - (b.practiceCorrect || 0)), 0)
    const n = list.filter((b) => Math.max(0, (b.total || 0) - (b.practice || 0)) > 0).length
    return { key: s.key, label: s.label, acc: totQ > 0 ? corQ / totQ : null, weight: s.weight || 1, n }
  })
}

/* ---------------- 学习周报 ---------------- */
export function weeklyCompare({ focus = [], selftests = [], checkins = [] }) {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day)
  monday.setHours(0, 0, 0, 0)
  const lastMon = new Date(monday)
  lastMon.setDate(monday.getDate() - 7)
  const inRange = (iso, from, to) => {
    if (!iso) return false
    const t = new Date(iso)
    return !isNaN(t) && t >= from && t <= to
  }
  const sumFocus = (from, to) => focus.filter((f) => inRange(f.startedAt || f.started_at, from, to)).reduce((a, b) => a + (b.durationSec || b.duration_sec || 0), 0)
  const countPomo = (from, to) => focus.filter((f) => inRange(f.startedAt || f.started_at, from, to)).length
  const accOf = (from, to) => {
    const ts = selftests.filter((t) => inRange(t.at, from, to))
    const tot = ts.reduce((a, b) => a + Math.max(0, (b.total || 0) - (b.practice || 0)), 0)
    const cor = ts.reduce((a, b) => a + Math.max(0, (b.correct || 0) - (b.practiceCorrect || 0)), 0)
    return tot ? cor / tot : null
  }
  const checkinCount = (from, to) => checkins.filter((c) => {
    const d = (c.date || '').slice(0, 10)
    if (!d) return false
    const t = new Date(d + 'T00:00:00')
    return !isNaN(t) && t >= from && t <= to
  }).length
  return {
    focusThis: sumFocus(monday, now), focusLast: sumFocus(lastMon, monday),
    pomoThis: countPomo(monday, now), pomoLast: countPomo(lastMon, monday),
    accThis: accOf(monday, now), accLast: accOf(lastMon, monday),
    checkinThis: checkinCount(monday, now), checkinLast: checkinCount(lastMon, monday)
  }
}

/* ---------------- 连续天数 / 热力图 / 7 天柱图 ---------------- */
const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayOf = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : fmtDate(d) }
const todayStr = (d) => fmtDate(d instanceof Date && !isNaN(d) ? d : new Date())

export function computeStatsCore({ tasks = [], focus = [], checkins = [], revives = [] }) {
  const now = new Date()
  const focusByDay = {}
  for (const f of focus) {
    const d = dayOf(f.startedAt || f.started_at || '')
    if (!d) continue
    focusByDay[d] = (focusByDay[d] || 0) + (f.durationSec || f.duration_sec || 0)
  }
  const checkinDays = new Set((checkins || []).map((c) => (c.date || '').slice(0, 10)).filter(Boolean))
  const reviveSet = new Set(revives || [])
  // 连续天数（硬上限 3650 天：曾因无上限导致无打卡账号无限回退卡死 WebView）
  let streak = 0
  const cursor = new Date()
  // 定位最近一个打卡/复活日（最多回退 400 天）
  let anchor = null
  for (let back = 0; back < 400; back++) {
    const d = fmtDate(cursor)
    if (checkinDays.has(d) || reviveSet.has(d)) { anchor = new Date(cursor); break }
    cursor.setDate(cursor.getDate() - 1)
  }
  if (anchor) {
    const c = anchor
    while (streak < 3650) {
      const d = fmtDate(c)
      if (checkinDays.has(d) || reviveSet.has(d)) { streak++; c.setDate(c.getDate() - 1) }
      else break
    }
  }
  // 30 天热力图
  const heat = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = fmtDate(d)
    const sec = focusByDay[ds] || 0
    heat.push({ date: ds, focus: sec, checkin: checkinDays.has(ds), level: sec >= 90 * 60 ? 4 : sec >= 60 * 60 ? 3 : sec >= 30 * 60 ? 2 : sec > 0 ? 1 : 0, today: ds === todayStr() })
  }
  // 7 天柱图
  const week = []
  const wd = (now.getDay() + 6) % 7
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - (wd + i))
    const ds = fmtDate(d)
    week.push({ date: ds, focus: focusByDay[ds] || 0, label: '日一二三四五六'[(d.getDay() + 6) % 7] })
  }
  const tasksToday = { total: 0, done: 0 }
  const today = todayStr()
  for (const t of tasks || []) {
    if ((t.date || '').slice(0, 10) === today) {
      tasksToday.total++
      if (t.done) tasksToday.done++
    }
  }
  const totalFocusSec = Object.values(focusByDay).reduce((a, b) => a + b, 0)
  const last7 = week.reduce((a, w) => a + w.focus, 0)
  return { streak, heat, week, totalFocusSec, weekFocusSec: last7, tasksToday, checkinToday: checkinDays.has(today) }
}

/* ---------------- 同步日徽章 ---------------- */
export function computeSyncDays(focus, myId) {
  const byDay = {}
  for (const f of focus || []) {
    const d = dayOf(f.startedAt || f.started_at || '')
    const who = f.userId || f.user_id || ''
    if (!d) continue
    if (!byDay[d]) byDay[d] = { mine: 0, partner: 0 }
    const sec = f.durationSec || f.duration_sec || 0
    if (sec >= 3600) {
      if (who === myId || f.owner_id === myId || f.mine) byDay[d].mine++
      else byDay[d].partner++
    }
  }
  const total = Object.values(byDay).filter((v) => v.mine > 0 && v.partner > 0).length
  const today = todayStr()
  return { total, streak: total, today: byDay[today] && byDay[today].mine > 0 && byDay[today].partner > 0 }
}