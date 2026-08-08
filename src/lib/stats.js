// 缁熻锛氳繛缁ぉ鏁?/ 涓撴敞鐑姏鍥?/ 7 澶╂煴鍥撅紙computeStatsCore锛? 鑱氬悎锛坓etStats锛? 瀹炴椂璁㈤槄锛坰ubscribe锛?
// 2026-08-02锛歝omputeStats 璁＄畻鏍稿績宸叉娊鍒?planStats.js锛堢函鍑芥暟鍙崟娴嬶級锛屾澶勪粎鍋氭暟鎹幏鍙?+ 濮旀墭銆?
import { supabase, USE_SUPABASE, LS } from './_util.js'
import { loadProfile } from './auth.js'
import { computeStatsCore } from './planStats.js'
import { getReviveDates } from './revive.js'

const computeStats = (args) => computeStatsCore(args)

export async function getStats() {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const [{ data: tasks }, { data: focus }, { data: checkins }, revives] = await Promise.all([
      supabase.from('tasks').select('*').eq('couple_id', me.coupleId),
      supabase.from('focus_sessions').select('*').eq('couple_id', me.coupleId),
      supabase.from('checkins').select('*').eq('couple_id', me.coupleId),
      getReviveDates()
    ])
    return computeStats({ tasks: tasks || [], focus: focus || [], checkins: checkins || [], revives: revives || [] })
  }
  const allTasks = LS.get('dx_tasks', []).filter((t) => t.coupleId === me.coupleId)
  const allFocus = LS.get('dx_focus', []).filter((f) => f.coupleId === me.coupleId)
  const allCheck = LS.get('dx_checkins', []).filter((c) => c.coupleId === me.coupleId)
  return computeStats({ tasks: allTasks, focus: allFocus, checkins: allCheck, revives: await getReviveDates() })
}

// 鍘熷鏁版嵁瀵煎嚭锛?026-08-02 A-2锛氬涔犲懆鎶?weeklyCompare 闇€瑕?focus/checkins 鍘熸暟缁勶級
export async function listFocusSession() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('focus_sessions').select('*').eq('couple_id', me.coupleId)
    return data || []
  }
  return LS.get('dx_focus', []).filter((f) => f.coupleId === me.coupleId)
}
export async function listCheckin() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('checkins').select('*').eq('couple_id', me.coupleId)
    return data || []
  }
  return LS.get('dx_checkins', []).filter((c) => c.coupleId === me.coupleId)
}

/* ---------------- 瀹炴椂璁㈤槄锛堜粎 Supabase锛?---------------- */
// tag 鐢ㄤ簬鍖哄垎鍚屼竴 couple 涓婄殑澶氫釜璁㈤槄鏂癸紙App 鍏ㄥ眬鍒锋柊 / Chat 灞€閮ㄥ埛鏂帮級锛岄伩鍏?channel 閲嶅悕鍐茬獊
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