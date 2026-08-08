// 备考进度：倒计时 / 阶段目标 / 自测 / 开箱即用计划勾选（含 Supabase 同步）
import { supabase, USE_SUPABASE, uid, LS } from './_util.js'
import { loadProfile } from './auth.js'

/* ---------------- 倒计时 ---------------- */
export async function setCountdown({ targetDate, label }) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('countdown').upsert(
      { couple_id: me.coupleId, target_date: targetDate, label: label || '考研初试', updated_at: new Date().toISOString() },
      { onConflict: 'couple_id' }
    )
    return
  }
  LS.set('dx_countdown', { coupleId: me.coupleId, targetDate, label: label || '考研初试' })
}

export async function getCountdown() {
  const me = await loadProfile()
  if (!me) return null
  if (USE_SUPABASE) {
    const { data } = await supabase.from('countdown').select('*').eq('couple_id', me.coupleId).maybeSingle()
    return data ? { targetDate: data.target_date, label: data.label } : null
  }
  const c = LS.get('dx_countdown', null)
  return c && c.coupleId === me.coupleId ? { targetDate: c.targetDate, label: c.label } : null
}

/* ---------------- 阶段目标 ---------------- */
export async function listGoals() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('phase_goals').select('*').eq('couple_id', me.coupleId).order('due_date', { ascending: true })
    return (data || []).map(g => ({ id: g.id, title: g.title, dueDate: g.due_date, done: g.done }))
  }
  return LS.get('dx_goals', []).filter(g => g.coupleId === me.coupleId)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .map(g => ({ ...g }))
}
export async function addGoal({ title, dueDate }) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data, error } = await supabase.from('phase_goals').insert({
      couple_id: me.coupleId, owner_id: me.id, title, due_date: dueDate || null, done: false
    }).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, title: data.title, dueDate: data.due_date, done: data.done }
  }
  const all = LS.get('dx_goals', [])
  const g = { id: uid(), coupleId: me.coupleId, owner_id: me.id, title, dueDate: dueDate || null, done: false }
  all.push(g)
  LS.set('dx_goals', all)
  return { ...g }
}
export async function toggleGoal(id) {
  if (USE_SUPABASE) {
    const { data: cur } = await supabase.from('phase_goals').select('done').eq('id', id).single()
    await supabase.from('phase_goals').update({ done: !cur.done }).eq('id', id)
    return
  }
  const all = LS.get('dx_goals', [])
  const g = all.find(x => x.id === id)
  if (g) g.done = !g.done
  LS.set('dx_goals', all)
}
export async function removeGoal(id) {
  if (USE_SUPABASE) {
    await supabase.from('phase_goals').delete().eq('id', id)
    return
  }
  LS.set('dx_goals', LS.get('dx_goals', []).filter(x => x.id !== id))
}

/* ---------------- 自测 ---------------- */
export async function addSelfTest({ subject, kind, name, total, correct, sec, topic, wrongReason, mode, practice = 0, practiceCorrect = 0 }) {
  const me = await loadProfile()
  const at = new Date().toISOString()
  const prac = Math.max(0, Math.min(practice || 0, total || 0))
  const pracCor = Math.max(0, Math.min(practiceCorrect || 0, prac, correct || 0))
  if (USE_SUPABASE) {
    const { data, error } = await supabase.from('self_tests').insert({
      couple_id: me.coupleId, owner_id: me.id, subject, kind, name, total, correct,
      sec: sec || null, at, topic: topic || null, wrong_reason: wrongReason || null, mode: mode || 'manual',
      practice: prac, practice_correct: pracCor
    }).select().single()
    if (error) throw new Error(error.message)
    return { id: data.id, subject: data.subject, kind: data.kind, name: data.name, total: data.total, correct: data.correct, sec: data.sec, at: data.at, topic: data.topic, wrongReason: data.wrong_reason, mode: data.mode, practice: data.practice ?? 0, practiceCorrect: data.practice_correct ?? 0 }
  }
  const all = LS.get('dx_selftests', [])
  const t = { id: uid(), coupleId: me.coupleId, owner_id: me.id, subject, kind, name, total, correct, sec: sec || null, at, topic: topic || null, wrongReason: wrongReason || null, mode: mode || 'manual', practice: prac, practiceCorrect: pracCor }
  all.push(t)
  LS.set('dx_selftests', all)
  return { ...t }
}

export async function listSelfTests() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('self_tests').select('*').eq('couple_id', me.coupleId).order('at', { ascending: false })
    return (data || []).map(t => ({ id: t.id, subject: t.subject, kind: t.kind, name: t.name, total: t.total, correct: t.correct, sec: t.sec, at: t.at, topic: t.topic, wrongReason: t.wrong_reason, mode: t.mode, practice: t.practice ?? 0, practiceCorrect: t.practice_correct ?? 0 }))
  }
  return LS.get('dx_selftests', []).filter(t => t.coupleId === me.coupleId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(t => ({ ...t }))
}

export async function removeSelfTest(id) {
  if (USE_SUPABASE) {
    await supabase.from('self_tests').delete().eq('id', id)
    return
  }
  LS.set('dx_selftests', LS.get('dx_selftests', []).filter(x => x.id !== id))
}

/* ---------------- 自测汇总（按题量加权） ---------------- */
export function selfTestSummary(tests) {
  const bySubject = {}
  for (const t of tests) {
    if (!bySubject[t.subject]) bySubject[t.subject] = []
    bySubject[t.subject].push(t)
  }
  const subjects = Object.keys(bySubject).map((sub) => {
    const list = bySubject[sub]
    const totQ = list.reduce((a, b) => a + (b.total || 0), 0)
    const corQ = list.reduce((a, b) => a + (b.correct || 0), 0)
    const avg = totQ ? corQ / totQ : 0
    const pracQ = list.reduce((a, b) => a + (b.practice || 0), 0)
    const pracCorQ = list.reduce((a, b) => a + (b.practiceCorrect || 0), 0)
    const realTotal = totQ - pracQ
    const realCorrect = corQ - pracCorQ
    const realAcc = realTotal > 0 ? realCorrect / realTotal : null
    return { subject: sub, count: list.length, latest: list[0], avgAcc: avg, realAcc }
  })
  const totQ = tests.reduce((a, b) => a + (b.total || 0), 0)
  const corQ = tests.reduce((a, b) => a + (b.correct || 0), 0)
  const overallAvg = totQ ? corQ / totQ : 0
  const realCount = tests.filter((t) => Math.max(0, (t.total || 0) - (t.practice || 0)) > 0).length
  const realTotQ = tests.reduce((a, b) => a + Math.max(0, (b.total || 0) - (b.practice || 0)), 0)
  const realCorQ = tests.reduce((a, b) => a + Math.max(0, (b.correct || 0) - (b.practiceCorrect || 0)), 0)
  const overallRealAcc = realTotQ > 0 ? realCorQ / realTotQ : null
  return { subjects, recent: tests.slice(0, 8), overallAvg, overallRealAcc, total: tests.length, realCount }
}

export async function getPlan() {
  const [countdown, goals, selfTests] = await Promise.all([getCountdown(), listGoals(), listSelfTests()])
  return { countdown, goals, selfTests, selfSummary: selfTestSummary(selfTests) }
}

export { wrongBookStats, radarData, weeklyCompare, computeSyncDays } from './planStats.js'

/* ---------------- 开箱即用计划（本地勾选） ---------------- */
export function getPlanChecks(date) {
  const m = LS.get('dx_plan_checks', {})
  return m[date] || {}
}
export function setPlanCheck(date, subject, topic, done) {
  const m = LS.get('dx_plan_checks', {})
  if (!m[date]) m[date] = {}
  if (done) m[date][`${subject}|${topic}`] = true
  else delete m[date][`${subject}|${topic}`]
  LS.set('dx_plan_checks', m)
}

export function getPlanAnchor() {
  let a = LS.get('dx_plan_anchor', null)
  if (!a) {
    const d = new Date()
    a = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    LS.set('dx_plan_anchor', a)
  }
  return a
}