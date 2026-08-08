// 统计：连续天数 / 专注热力图 / 7 天柱图 + 聚合 + 实时订阅
import { supabase, USE_SUPABASE, LS } from './_util.js'
import { loadProfile } from './auth.js'
import { computeStatsCore } from './planStats.js'
import { getReviveDates } from './revive.js'

export async function getStats() {
  const me = await loadProfile()
  if (!me) return null
  if (USE_SUPABASE) {
    const [{ data: tasks }, { data: focus }, { data: checkins }, revives] = await Promise.all([
      supabase.from('tasks').select('*').eq('couple_id', me.coupleId),
      supabase.from('focus_sessions').select('*').eq('couple_id', me.coupleId),
      supabase.from('checkins').select('*').eq('couple_id', me.coupleId),
      getReviveDates()
    ])
    return computeStatsCore({ tasks: tasks || [], focus: focus || [], checkins: checkins || [], revives: revives || [] })
  }
  const allTasks = LS.get('dx_tasks', []).filter((t) => t.coupleId === me.coupleId)
  const allFocus = LS.get('dx_focus', []).filter((f) => f.coupleId === me.coupleId)
  const allCheck = LS.get('dx_checkins', []).filter((c) => c.coupleId === me.coupleId)
  return computeStatsCore({ tasks: allTasks, focus: allFocus, checkins: allCheck, revives: await getReviveDates() })
}

export async function listFocusSession() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('focus_sessions').select('*').eq('couple_id', me.coupleId).order('started_at', { ascending: false }).limit(200)
    return (data || []).map((f) => ({ id: f.id, userId: f.user_id, owner_id: f.user_id, coupleId: me.coupleId, durationSec: f.duration_sec, taskId: f.task_id, startedAt: f.started_at, status: f.status || 'done', note: f.note }))
  }
  return LS.get('dx_focus', []).filter((f) => f.coupleId === me.coupleId).map((f) => ({ ...f }))
}
export async function listCheckin() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('checkins').select('*').eq('couple_id', me.coupleId)
    return (data || []).map((c) => ({ id: c.id, coupleId: me.coupleId, userId: c.user_id, date: c.date, note: c.note || '' }))
  }
  return LS.get('dx_checkins', []).filter((c) => c.coupleId === me.coupleId).map((c) => ({ ...c }))
}

/* ---------------- 实时订阅 ---------------- */
export function subscribe(coupleId, cb, tag = '') {
  if (!USE_SUPABASE || !coupleId || !supabase) return () => {}
  const ch = supabase
    .channel('couple-' + coupleId + (tag ? '-' + tag : ''))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'focus_sessions', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'encouragements', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'countdown', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'phase_goals', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'self_tests', filter: `couple_id=eq.${coupleId}` }, cb)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` }, cb)
    .subscribe()
  return () => supabase.removeChannel(ch)
}