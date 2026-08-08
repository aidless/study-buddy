// milestonesPresenter.js —— 里程碑弹窗决策（纯函数）
export function todayMilestone({ streak, focusStreak }) {
  const milestones = [
    { at: 7, title: '连续 7 天啦', text: '第一周撑下来了，了不起。', icon: 'medal' },
    { at: 21, title: '21 天习惯养成', text: '你已经开始习惯这件事了。', icon: 'medal' },
    { at: 30, title: '满月里程碑', text: '整整一个月，你已经比大多数人走得远。', icon: 'trophy' }
  ]
  const m = milestones.find((x) => x.at === streak || x.at === focusStreak)
  if (!m) return { toShow: null }
  return { toShow: { id: 'ms-' + m.at, ...m } }
}
export function markMilestoneSeen(m) {
  try {
    const seen = JSON.parse(localStorage.getItem('dx_ms_seen') || '[]')
    if (!seen.includes(m.id)) seen.push(m.id)
    localStorage.setItem('dx_ms_seen', JSON.stringify(seen))
  } catch {}
}
export function milestoneSeen(id) {
  try {
    return (JSON.parse(localStorage.getItem('dx_ms_seen') || '[]')).includes(id)
  } catch { return false }
}