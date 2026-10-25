// Guest demo data for the landing page's "先看看" link. Only runs for
// ?guest=student on a browser that has no demo data yet; never touches a
// signed-in account and never overwrites existing guest edits.

const KEY = 'dx_demo_seeded'
const COUPLE = 'guest-couple'
const USER = 'guest-student'

function ymd(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function seedGuestDemo() {
  try {
    const guest = new URLSearchParams(location.search).get('guest')
    if (guest !== 'student') return
    if (localStorage.getItem(KEY)) return
    if ((localStorage.getItem('dx_tasks') || '').includes(COUPLE)) return
    // Never overwrite a real local account's data with demo records.
    const existing = JSON.parse(localStorage.getItem('dx_user') || 'null')
    if (existing && existing.coupleId !== COUPLE) return

    const now = new Date()
    const today = ymd(now)
    const tasks = [
      { id: `${COUPLE}-t1`, coupleId: COUPLE, owner_id: USER, title: '数学一 · 高数极限 20 题', date: today, time: '09:00', done: true },
      { id: `${COUPLE}-t2`, coupleId: COUPLE, owner_id: USER, title: '英语一 · 2019 阅读精读', date: today, time: '14:00', done: true },
      { id: `${COUPLE}-t3`, coupleId: COUPLE, owner_id: USER, title: '408 · 操作系统进程调度', date: today, time: '19:00', done: false },
    ]
    const focus = []
    for (let i = 0; i < 20; i++) {
      const d = new Date(now.getTime() - i * 86400000)
      const n = i < 3 ? 2 : (i % 4 === 0 ? 0 : 1)
      for (let j = 0; j < n; j++) {
        d.setHours(9 + j * 4, 10, 0, 0)
        focus.push({
          id: `${COUPLE}-f${i}-${j}`, coupleId: COUPLE, userId: USER,
          durationSec: 1500, taskId: null, startedAt: d.toISOString(), status: 'done', note: null,
        })
      }
    }
    const checkins = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getTime() - i * 86400000)
      checkins.push({
        id: `${COUPLE}-c${i}`, coupleId: COUPLE, userId: USER,
        date: ymd(d), note: '', at: d.toISOString(),
      })
    }
    localStorage.setItem('dx_tasks', JSON.stringify(tasks))
    localStorage.setItem('dx_focus', JSON.stringify(focus))
    localStorage.setItem('dx_checkins', JSON.stringify(checkins))
    localStorage.setItem('dx_countdown', JSON.stringify({ coupleId: COUPLE, targetDate: '2026-12-19', label: '考研初试' }))
    localStorage.setItem('dx_target_score', JSON.stringify({ [COUPLE]: 350 }))
    localStorage.setItem('dx_subj_target', JSON.stringify({ [COUPLE]: { pol: 70, eng: 65, math: 105, cs408: 110 } }))
    localStorage.setItem(KEY, '1')
  } catch {
    // Demo data is optional; the app still works if storage is unavailable.
  }
}
