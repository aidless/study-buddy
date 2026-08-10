import { describe, it, expect } from 'vitest'
import { computeStatsCore, radarData } from '../../src/lib/planStats'

describe('computeStatsCore', () => {
  it('无数据时 streak 为 0', () => {
    const r = computeStatsCore({})
    expect(r.streak).toBe(0)
  })
  it('复活卡能补齐断卡日', () => {
    const checkins = [{ date: '2026-08-08', userId: 'u' }, { date: '2026-08-06', userId: 'u' }]
    const revives = ['2026-08-07']
    const r = computeStatsCore({ checkins, revives, focus: [], tasks: [] })
    expect(r.streak).toBeGreaterThanOrEqual(3)
  })
})

describe('radarData', () => {
  it('按科目聚合自测正确率', () => {
    const tests = [
      { subject: '数据结构', kind: '套卷', total: 10, correct: 8 },
      { subject: '数据结构', kind: '套卷', total: 10, correct: 6 },
      { subject: '操作系统', kind: '套卷', total: 5, correct: 5 }
    ]
    const items = radarData(tests, 'kaoyan')
    const cs = items.find((i) => i.key === 'cs408')
    expect(cs).toBeTruthy()
    // 数据结构 14/20 + 操作系统 5/5 → 19/25 = 0.76
    expect(cs.acc).toBeCloseTo(0.76, 2)
  })
})
