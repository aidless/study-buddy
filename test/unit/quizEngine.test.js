import { describe, it, expect } from 'vitest'
import { buildQuizPool, drawQuestions, gradeQuestion } from '../../src/lib/quizEngine'

describe('quizEngine', () => {
  it('题库池含真题与练习', () => {
    const pool = buildQuizPool(true)
    expect(pool.length).toBeGreaterThan(500)
  })
  it('抽题满足科目与数量', () => {
    const pool = buildQuizPool(true)
    const r = drawQuestions(pool, { types: ['choice'], subject: '数学一', topic: null, count: 3 })
    expect(r.questions.length).toBe(3)
    expect(r.questions.every((q) => q.type === 'choice')).toBe(true)
  })
  it('选择题自动判分', () => {
    const pool = buildQuizPool(true)
    const q = pool.find((x) => x.type === 'choice')
    expect(q).toBeTruthy()
    expect(gradeQuestion(q, q.answer).correct).toBe(true)
    const wrong = q.answer === 'A' ? 'B' : 'A'
    expect(gradeQuestion(q, wrong).correct).toBe(false)
  })
})
