// migrateLocalToCloud.js —— 本地模式 → 云端账号 一键迁移（2026-08-08 重建）
import { supabase, USE_SUPABASE, uid, LS } from './_util.js'

export function hasLocalData() {
  const counts = {
    tasks: LS.get('dx_tasks', []).length,
    focus: LS.get('dx_focus', []).length,
    checkins: LS.get('dx_checkins', []).length,
    selftests: LS.get('dx_selftests', []).length,
    goals: LS.get('dx_goals', []).length,
    countdown: LS.get('dx_countdown', null) ? 1 : 0,
    words: Object.keys(LS.get('dx_word', {})).length
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return { total, ...counts }
}

export function buildMigrationPlan(local, localUser, cloudUser) {
  const plan = { tasks: [], focus: [], checkins: [], selftests: [], goals: [], countdown: null, words: [] }
  if (!localUser || !cloudUser) return plan
  const taskMap = {}
  for (const t of (local.tasks || [])) {
    if (t.coupleId !== localUser.coupleId) continue
    const id = uid()
    taskMap[t.id] = id
    plan.tasks.push({ id, title: t.title, date: t.date, time: t.time || null, done: !!t.done })
  }
  for (const f of (local.focus || [])) {
    if (f.coupleId !== localUser.coupleId) continue
    plan.focus.push({ durationSec: f.durationSec || f.duration_sec || 0, taskId: f.taskId ? (taskMap[f.taskId] || null) : null, startedAt: f.startedAt || f.started_at || new Date().toISOString(), status: f.status || 'done', note: f.note || null })
  }
  for (const c of (local.checkins || [])) {
    if (c.coupleId !== localUser.coupleId) continue
    if (plan.checkins.some((x) => x.date === c.date)) continue
    plan.checkins.push({ date: c.date, note: c.note || '' })
  }
  for (const t of (local.selftests || [])) {
    if (t.coupleId !== localUser.coupleId) continue
    plan.selftests.push({ subject: t.subject, kind: t.kind || '章节练习', name: t.name || '', total: t.total, correct: t.correct, sec: t.sec || null, at: t.at || new Date().toISOString(), topic: t.topic || null, wrongReason: t.wrongReason || null, mode: t.mode || 'manual', practice: t.practice || 0, practiceCorrect: t.practiceCorrect || 0 })
  }
  for (const g of (local.goals || [])) {
    if (g.coupleId !== localUser.coupleId) continue
    plan.goals.push({ title: g.title, dueDate: g.dueDate || null, done: !!g.done })
  }
  const cd = local.countdown
  if (cd && cd.coupleId === localUser.coupleId) plan.countdown = { targetDate: cd.targetDate, label: cd.label || '考研初试' }
  const w = local.words || {}
  for (const [d, v] of Object.entries(w)) {
    if (v && v.she) plan.words.push({ date: d, role: 'she', text: v.she })
    if (v && v.he) plan.words.push({ date: d, role: 'he', text: v.he })
  }
  return plan
}

export async function migrateLocalToCloud(user) {
  if (!USE_SUPABASE) return { ok: false, reason: '当前不是云端模式' }
  const localUser = LS.get('dx_user', null)
  const local = {
    tasks: LS.get('dx_tasks', []), focus: LS.get('dx_focus', []), checkins: LS.get('dx_checkins', []),
    selftests: LS.get('dx_selftests', []), goals: LS.get('dx_goals', []),
    countdown: LS.get('dx_countdown', null), words: LS.get('dx_word', {})
  }
  const plan = buildMigrationPlan(local, localUser, user)
  const results = {}
  try {
    if (plan.tasks.length) {
      const { error } = await supabase.from('tasks').insert(plan.tasks.map((t) => ({ couple_id: user.coupleId, owner_id: user.id, title: t.title, date: t.date, time: t.time, done: t.done })))
      if (!error) results.tasks = { inserted: plan.tasks.length }
    }
    if (plan.focus.length) {
      const { error } = await supabase.from('focus_sessions').insert(plan.focus.map((f) => ({ couple_id: user.coupleId, user_id: user.id, duration_sec: f.durationSec, task_id: f.taskId, started_at: f.startedAt, status: f.status })))
      if (!error) results.focus = { inserted: plan.focus.length }
    }
    if (plan.checkins.length) {
      const { error } = await supabase.from('checkins').insert(plan.checkins.map((c) => ({ couple_id: user.coupleId, user_id: user.id, date: c.date, note: c.note })))
      if (!error) results.checkins = { inserted: plan.checkins.length }
    }
    if (plan.selftests.length) {
      const { error } = await supabase.from('self_tests').insert(plan.selftests.map((t) => ({ couple_id: user.coupleId, owner_id: user.id, subject: t.subject, kind: t.kind, name: t.name, total: t.total, correct: t.correct, sec: t.sec, at: t.at, topic: t.topic, wrong_reason: t.wrongReason, mode: t.mode, practice: t.practice, practice_correct: t.practiceCorrect })))
      if (!error) results.selftests = { inserted: plan.selftests.length }
    }
    if (plan.goals.length) {
      const { error } = await supabase.from('phase_goals').insert(plan.goals.map((g) => ({ couple_id: user.coupleId, owner_id: user.id, title: g.title, due_date: g.dueDate, done: g.done })))
      if (!error) results.goals = { inserted: plan.goals.length }
    }
    if (plan.countdown) {
      const { error } = await supabase.from('countdown').upsert({ couple_id: user.coupleId, target_date: plan.countdown.targetDate, label: plan.countdown.label }, { onConflict: 'couple_id' })
      if (!error) results.countdown = { inserted: 1 }
    }
    if (plan.words.length) {
      const { error } = await supabase.from('encouragements').insert(plan.words.map((w) => ({ couple_id: user.coupleId, from_id: user.id, from_name: user.name, to_id: user.id, message: w.text, at: new Date(w.date + 'T00:00:00').toISOString(), kind: 'word' })))
      if (!error) results.words = { inserted: plan.words.length }
    }
    LS.set('dx_cloud_migrated_v1', true)
    return { ok: true, results }
  } catch (e) {
    return { ok: false, reason: e?.message || String(e) }
  }
}