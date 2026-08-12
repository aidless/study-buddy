const db = require('../../utils/db')
const quiz = require('../../utils/quiz')
const q408 = require('../../data/questions_408.js')
const qPol = require('../../data/questions_politics.js')
const qEn = require('../../data/questions_english.js')
const qMath = require('../../data/questions_math.js')

const SUBJECTS = [
  { key: '408', label: '408 统考', bank: q408 },
  { key: '政治', label: '政治', bank: qPol },
  { key: '英语一', label: '英语一', bank: qEn },
  { key: '数学一', label: '数学一', bank: qMath }
]

Page({
  data: {
    subject: '408', subjects: SUBJECTS.map((s) => ({ key: s.key, label: s.label })),
    stage: 'setup', count: 10, qs: [], idx: 0, answers: {}, answered: 0, result: null, err: ''
  },
  pickSubject(e) { this.setData({ subject: e.currentTarget.dataset.key, stage: 'setup', result: null }) },
  pickCount(e) { this.setData({ count: Number(e.currentTarget.dataset.n) }) },
  start() {
    const subj = SUBJECTS.find((s) => s.key === this.data.subject)
    if (!subj || !subj.bank || !subj.bank.list) { this.setData({ err: '题库加载失败' }); return }
    const raw = quiz.draw(subj.bank, this.data.count)
    const qs = raw.map((q) => ({ ...q, opts: (q.options || []).map((t, i) => ({ v: String.fromCharCode(65 + i), t })) }))
    this.setData({ qs, idx: 0, answers: {}, answered: 0, result: null, stage: 'quiz', err: '' })
  },
  pick(e) {
    const q = this.data.qs[this.data.idx]
    const answers = this.data.answers
    answers[q.id] = e.currentTarget.dataset.v
    this.setData({ answers: Object.assign({}, answers), answered: Object.keys(answers).length })
  },
  next() {
    if (this.data.idx < this.data.qs.length - 1) this.setData({ idx: this.data.idx + 1 })
  },
  submit() {
    const qs = this.data.qs
    const answers = this.data.answers
    const rows = qs.map((q) => ({ q, correct: quiz.grade(q, answers[q.id]), user: answers[q.id] || '' }))
    const correct = rows.filter((r) => r.correct).length
    db.addSelfTest({ subject: this.data.subject, kind: '套卷', name: '随机真题卷', total: qs.length, correct, topic: null })
    this.setData({ result: { correct, total: qs.length, pct: Math.round((correct / qs.length) * 100), rows }, stage: 'result' })
  },
  again() { this.setData({ stage: 'setup', result: null }) }
})
