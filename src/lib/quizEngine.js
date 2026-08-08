// quizEngine.js —— 抽题与判分引擎（重建版，题目结构兼容真题采集数据）
import { SEED_QUESTIONS } from './qbankSeed.js'
import { ESSAY } from './qbankEssay.js'
import { PRACTICE } from './qbankPractice.js'
import { ENGLISH, ENGLISH_WRITING } from './qbankEnglish.js'
import { MATH, MATH_PROBLEMS } from './qbankMath.js'
import { CODE_ENRICH } from './qbankCodeEnrich.js'

const CODE_SUBJECT_MAP = { ds: '数据结构', co: '计算机组成', os: '操作系统', net: '计算机网络' }

export function buildQuizPool(includePractice = true) {
  let pool = []
  for (const q of SEED_QUESTIONS) pool.push({ ...q, source: 'real' })
  for (const q of ESSAY) pool.push({ ...q, type: 'essay', source: 'real' })
  for (const q of CODE_ENRICH) pool.push({ ...q, type: 'code', source: 'real' })
  if (includePractice) {
    for (const q of PRACTICE) pool.push({ ...q, source: 'practice' })
    for (const q of ENGLISH) pool.push({ ...q, source: 'practice' })
    for (const q of ENGLISH_WRITING) pool.push({ ...q, source: 'practice' })
    for (const q of MATH) pool.push({ ...q, source: 'practice' })
    for (const q of MATH_PROBLEMS) pool.push({ ...q, source: 'practice' })
  }
  return pool
}

export function drawQuestions(pool, { types = [], subject, topic, count = 5 }) {
  const typeSet = new Set(types.length ? types : ['choice', 'fill', 'essay', 'code'])
  let candidates = pool.filter((q) => typeSet.has(q.type))
  if (subject) {
    candidates = candidates.filter((q) => q.subject === subject || (topic && (q.tags || []).some((t) => t.includes(topic))))
  }
  if (topic) {
    const exact = candidates.filter((q) => (q.tags || []).some((t) => t.includes(topic)))
    if (exact.length) candidates = exact
  }
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return { picked: shuffled.slice(0, count), questions: shuffled.slice(0, count) }
}

export function gradeQuestion(q, userAnswer) {
  if (q.type === 'choice' || q.type === 'fill') {
    const correct = !!userAnswer && String(userAnswer).trim().toUpperCase() === String(q.answer || '').trim().toUpperCase()
    return { auto: true, correct, ref: q.analysis || '' }
  }
  return { auto: false, correct: false, ref: (q.parts && q.parts[0] ? q.parts[0].answer : q.analysis) || '' }
}