// weeklyReport.js —— 陪伴周报（督学端）
import { weeklyCompare } from './planStats.js'
import { fmtDur } from './_util.js'

export function buildWeeklyReport({ focus = [], selftests = [], checkins = [] }) {
  const w = weeklyCompare({ focus, selftests, checkins })
  return {
    focusThis: w.focusThis, focusLast: w.focusLast,
    pomoThis: w.pomoThis, pomoLast: w.pomoLast,
    accThis: w.accThis, accLast: w.accLast,
    checkinThis: w.checkinThis, checkinLast: w.checkinLast,
    lines: [
      `专注 ${fmtDur(w.focusThis)}（上周 ${fmtDur(w.focusLast)}）`,
      `番茄 ${w.pomoThis} 个 · 打卡 ${w.checkinThis} 天`,
      w.accThis == null ? '本周暂无真题自测记录' : `真题正确率 ${Math.round(w.accThis * 100)}%`
    ]
  }
}
export function shouldShowWeeklyReport(lastSeen) {
  if (!lastSeen) return true
  const now = new Date()
  const seen = new Date(lastSeen + 'T00:00:00')
  const diff = Math.floor((now - seen) / 86400000)
  return diff >= 7
}