import { describe, it, expect } from 'vitest'
import { computeStreakFromFocusCheckins, focusStreakFromFocus } from '../../src/lib/milestones'

describe('milestones', () => {
  it('连续打卡 7 天触发成就', () => {
    const checkins = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      checkins.push({ date: d.toISOString().slice(0, 10) })
    }
    expect(computeStreakFromFocusCheckins([], checkins)).toBe(7)
  })
  it('专注连续天数按会话日期计算', () => {
    const focus = []
    for (let i = 0; i < 3; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      focus.push({ startedAt: d.toISOString(), durationSec: 25 * 60 })
    }
    expect(focusStreakFromFocus(focus)).toBe(3)
  })
})
