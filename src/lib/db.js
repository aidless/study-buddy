// db.js —— 统一数据层：认证 / 任务 / 专注 / 打卡 / 备考 / 聊天 / 错题 / 迁移（双模式：本地 + Supabase）
import { supabase, USE_SUPABASE, LS, uid, genCode, todayStr, daysUntil, fmtDur, dayOf } from './_util.js'
import { register, signIn, signOut, loadProfile, getPartner, sendPhoneCode, signInWithPhone } from './auth.js'
import { setCountdown, getCountdown, listGoals, addGoal, toggleGoal, removeGoal,
         addSelfTest, listSelfTests, removeSelfTest, getPlan, getPlanChecks, setPlanCheck, getPlanAnchor,
         selfTestSummary } from './plan.js'
import { getDegreeType, setDegreeType, getExamType, setExamType, getTargetScore, setTargetScore,
         getSubjTargets, setSubjTargets, getSchoolProfile, setSchoolProfile,
         getAllExams, getActiveExam, getActiveExamId, setActiveExamId, addCustomExam, removeCustomExam } from './planTargets.js'
import { getStats, listFocusSession, listCheckin, subscribe } from './stats.js'
import { wrongBookStats, radarData, weeklyCompare, computeSyncDays, computeStatsCore } from './planStats.js'
import { getWords, setWord } from './words.js'
import { buildPlan } from './curriculum.js'
import { listMessages, sendMessage, sendEncouragement, listCheers } from './chat.js'
import { sendRevive, getReviveDates } from './revive.js'
import { listWrongItems, putWrongItem, removeWrongItem, setWrongMastered, redoWrongItem } from './wrongItemsHybrid.js'
import { hasLocalData, migrateLocalToCloud, buildMigrationPlan } from './migrateLocalToCloud.js'
import { collectWrongToBook } from './quizWrong.js'

export {
  supabase, USE_SUPABASE, LS, uid, genCode, todayStr, daysUntil, fmtDur, dayOf,
  register, signIn, signOut, loadProfile, getPartner, sendPhoneCode, signInWithPhone,
  setCountdown, getCountdown, listGoals, addGoal, toggleGoal, removeGoal,
  addSelfTest, listSelfTests, removeSelfTest, getPlan, getPlanChecks, setPlanCheck, getPlanAnchor, selfTestSummary,
  getDegreeType, setDegreeType, getExamType, setExamType, getTargetScore, setTargetScore,
  getSubjTargets, setSubjTargets, getSchoolProfile, setSchoolProfile,
  getAllExams, getActiveExam, getActiveExamId, setActiveExamId, addCustomExam, removeCustomExam,
  getStats, listFocusSession, listCheckin, subscribe,
  wrongBookStats, radarData, weeklyCompare, computeSyncDays,
  getWords, setWord, listMessages, sendMessage, sendEncouragement, listCheers,
  sendRevive, getReviveDates,
  listWrongItems, putWrongItem, removeWrongItem, setWrongMastered, redoWrongItem,
  hasLocalData, migrateLocalToCloud, buildMigrationPlan,
  collectWrongToBook,
  buildPlan
}

/* ---------------- 任务 ---------------- */
export async function listTasks(date) {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('tasks').select('*').eq('couple_id', me.coupleId).order('created_at', { ascending: true })
    return (data || []).map((t) => ({ id: t.id, title: t.title, date: t.date, time: t.time, done: t.done, mine: t.owner_id === me.id }))
  }
  return LS.get('dx_tasks', []).filter((t) => t.coupleId === me.coupleId).map((t) => ({ ...t, mine: t.owner_id === me.id }))
}
export async function addTask({ title, date, time }) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data, error } = await supabase.from('tasks').insert({ couple_id: me.coupleId, owner_id: me.id, title, date: date || todayStr(), time: time || null }).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, title: data.title, date: data.date, time: data.time, done: data.done, mine: true }
  }
  const all = LS.get('dx_tasks', [])
  const t = { id: uid(), coupleId: me.coupleId, owner_id: me.id, title, date: date || todayStr(), time: time || null, done: false }
  all.push(t)
  LS.set('dx_tasks', all)
  return { ...t, mine: true }
}
export async function toggleTask(id, done) {
  if (USE_SUPABASE) {
    await supabase.from('tasks').update({ done: !!done }).eq('id', id)
    return
  }
  const all = LS.get('dx_tasks', [])
  const t = all.find((x) => x.id === id)
  if (t) t.done = !!done
  LS.set('dx_tasks', all)
}
export async function removeTask(id) {
  if (USE_SUPABASE) {
    await supabase.from('tasks').delete().eq('id', id)
    return
  }
  LS.set('dx_tasks', LS.get('dx_tasks', []).filter((x) => x.id !== id))
}

/* ---------------- 打卡 ---------------- */
export async function getCheckin(date) {
  const me = await loadProfile()
  const d = date || todayStr()
  if (!me) return null
  if (USE_SUPABASE) {
    const { data } = await supabase.from('checkins').select('*').eq('couple_id', me.coupleId).eq('user_id', me.id).eq('date', d).maybeSingle()
    return data || null
  }
  return LS.get('dx_checkins', []).find((c) => c.coupleId === me.coupleId && c.userId === me.id && c.date === d) || null
}
export async function toggleCheckin(note) {
  const me = await loadProfile()
  const d = todayStr()
  const existing = await getCheckin(d)
  if (USE_SUPABASE) {
    if (existing) {
      await supabase.from('checkins').delete().eq('id', existing.id)
      return false
    }
    await supabase.from('checkins').insert({ couple_id: me.coupleId, user_id: me.id, date: d, note: note || '' })
    return true
  }
  const all = LS.get('dx_checkins', [])
  const idx = all.findIndex((c) => c.coupleId === me.coupleId && c.userId === me.id && c.date === d)
  if (idx >= 0) { all.splice(idx, 1); LS.set('dx_checkins', all); return false }
  all.push({ id: uid(), coupleId: me.coupleId, userId: me.id, date: d, note: note || '', at: new Date().toISOString() })
  LS.set('dx_checkins', all)
  return true
}

/* ---------------- 专注会话写入 ---------------- */
export async function addFocusSession({ durationSec, taskId, status, note }) {
  const me = await loadProfile()
  if (!me) return
  if (USE_SUPABASE) {
    await supabase.from('focus_sessions').insert({
      couple_id: me.coupleId, user_id: me.id, duration_sec: Math.max(0, durationSec || 0),
      task_id: taskId || null, started_at: new Date().toISOString(), status: status || 'done', note: note || null
    })
    return
  }
  const all = LS.get('dx_focus', [])
  all.push({ id: uid(), coupleId: me.coupleId, userId: me.id, durationSec: Math.max(0, durationSec || 0), taskId: taskId || null, startedAt: new Date().toISOString(), status: status || 'done', note: note || null })
  LS.set('dx_focus', all)
}

/* ---------------- 实时状态（督学端看她在干嘛） ---------------- */
export async function getLiveStatus() {
  const me = await loadProfile()
  if (!me) return null
  if (!USE_SUPABASE) {
    const focus = LS.get('dx_focus', []).filter((f) => f.coupleId === me.coupleId)
    const running = focus.filter((f) => f.status === 'running')
    const doneToday = focus.filter((f) => (f.startedAt || '').slice(0, 10) === todayStr() && f.status === 'done').reduce((a, b) => a + (b.durationSec || 0), 0)
    const my = { running: running.slice(-1), doneTodaySec: doneToday }
    const partner = { running: [], doneTodaySec: doneToday }
    return { my, partner }
  }
  const { data } = await supabase.from('focus_sessions').select('*').eq('couple_id', me.coupleId).order('started_at', { ascending: false }).limit(20)
  const rows = data || []
  const today = todayStr()
  const running = rows.filter((r) => r.status === 'running').map((r) => ({ id: r.id, user_id: r.user_id, leftSec: 25 * 60 }))
  const myDone = rows.filter((r) => r.user_id === me.id && (r.started_at || '').slice(0, 10) === today).reduce((a, b) => a + (b.duration_sec || 0), 0)
  const pDone = rows.filter((r) => r.user_id !== me.id && (r.started_at || '').slice(0, 10) === today).reduce((a, b) => a + (b.duration_sec || 0), 0)
  return {
    my: { running: running.filter((r) => r.user_id === me.id), doneTodaySec: myDone },
    partner: { running: running.filter((r) => r.user_id !== me.id), doneTodaySec: pDone }
  }
}
export async function getPartnerLive() {
  const live = await getLiveStatus()
  if (!live) return null
  return { running: live.partner.running.length > 0 }
}

/* ---------------- 情绪（树洞级别，只给督学一个温和提示） ---------------- */
export function getMoodLevel(date) {
  const d = date || todayStr()
  try {
    const m = LS.get('dx_treehole', {})
    const day = m[d] || {}
    if (day.level === 'low') return Promise.resolve('low')
    if (day.level === 'mid') return Promise.resolve('mid')
    return Promise.resolve('')
  } catch {
    return Promise.resolve('')
  }
}
export async function sheWantsPraise(date) {
  const me = await loadProfile()
  const d = date || todayStr()
  if (USE_SUPABASE && me) {
    try {
      const { data } = await supabase.from('encouragements').select('id').eq('couple_id', me.coupleId).eq('kind', 'want_praise').eq('message', 'want_praise:' + d).limit(1)
      if ((data || []).length > 0) return true
    } catch {}
  }
  try {
    const m = LS.get('dx_want_praise', {})
    return !!m[d]
  } catch {
    return false
  }
}
export async function markWantPraise() {
  const me = await loadProfile()
  const d = todayStr()
  const m = LS.get('dx_want_praise', {})
  m[d] = true
  LS.set('dx_want_praise', m)
  if (USE_SUPABASE && me) {
    try {
      const { data: old } = await supabase.from('encouragements').select('id').eq('couple_id', me.coupleId).eq('kind', 'want_praise').eq('message', 'want_praise:' + d)
      if ((old || []).length === 0) {
        await supabase.from('encouragements').insert({
          couple_id: me.coupleId, from_id: me.id, from_name: me.name, to_id: me.id,
          message: 'want_praise:' + d, kind: 'want_praise'
        })
      }
    } catch {}
  }
}