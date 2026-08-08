// milestones.js —— 里程碑与专注连击（纯函数）
export function focusStreakFromFocus(focus) {
  const days = new Set((focus || []).map((f) => (f.startedAt || f.started_at || '').slice(0, 10)).filter(Boolean))
  let streak = 0
  const d = new Date()
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
export function computeStreakFromFocusCheckins(focus, checkins) {
  const days = new Set([...(focus || []).map((f) => (f.startedAt || f.started_at || '').slice(0, 10)), ...(checkins || []).map((c) => (c.date || '').slice(0, 10))].filter(Boolean))
  let streak = 0
  const d = new Date()
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}