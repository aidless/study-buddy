import { describe, it, expect } from 'vitest'
import { EXAM_TYPES, EXAM_ORDER, DEFAULT_EXAM } from '../../src/lib/examTypes'

describe('examTypes', () => {
  it('默认考试为考研', () => {
    expect(DEFAULT_EXAM).toBe('kaoyan')
  })
  it('所有枚举考试都有完整定义', () => {
    for (const k of EXAM_ORDER) {
      const t = EXAM_TYPES[k]
      expect(t).toBeTruthy()
      expect(typeof t.label).toBe('string')
      expect(t.totalMax).toBeGreaterThan(0)
      expect(Array.isArray(t.subjects)).toBe(true)
      expect(t.subjects.length).toBeGreaterThan(0)
      for (const s of t.subjects) {
        expect(typeof s.key).toBe('string')
        expect(s.max).toBeGreaterThan(0)
      }
    }
  })
  it('考研四科满分合计 = 总分', () => {
    const t = EXAM_TYPES.kaoyan
    const sum = t.subjects.reduce((a, s) => a + s.max, 0)
    expect(sum).toBe(t.totalMax)
  })
})
