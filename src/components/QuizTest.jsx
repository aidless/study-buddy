// QuizTest.jsx —— 章节/专项测试（重建版：抽题 → 作答 → 判分写回）
import { useState } from 'react'
import Icon from './Icon'
import { buildQuizPool, drawQuestions, gradeQuestion } from '../lib/quizEngine'
import { addSelfTest } from '../lib/db'
import { collectWrongToBook } from '../lib/quizWrong'
import { Fig } from './qbankRichText'

const TYPE_CHIPS = [
  { key: 'choice', label: '选择题', icon: 'check' },
  { key: 'fill', label: '填空题', icon: 'edit' },
  { key: 'essay', label: '大题', icon: 'write' }
]
const COUNT_OPTS = [3, 5, 10]

export default function QuizTest({ subject, topic, onClose }) {
  const [stage, setStage] = useState('setup')
  const [types, setTypes] = useState(['choice'])
  const [count, setCount] = useState(5)
  const [includePractice, setIncludePractice] = useState(subject === '英语一' || subject === '数学一' || subject === '政治')
  const [qs, setQs] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selfMarks, setSelfMarks] = useState({})
  const [showRef, setShowRef] = useState({})
  const [grades, setGrades] = useState([])
  const [saved, setSaved] = useState(false)
  const [practiceCount, setPracticeCount] = useState(0)
  const [err, setErr] = useState('')

  const start = () => {
    let pool
    try { pool = buildQuizPool(includePractice) } catch (e) { setErr('题库加载失败'); return }
    let r
    try { r = drawQuestions(pool, { types, subject, topic, count }) } catch (e) { setErr('抽题失败'); return }
    if (r.picked === 0) { setErr('这个组合没有可抽的题，换科目、题型或题源试试'); return }
    setErr(''); setQs(r.questions); setAnswers({}); setSelfMarks({}); setShowRef({}); setIdx(0); setStage('quiz'); setPracticeCount(0)
  }

  const submit = async () => {
    const g = qs.map((q) => {
      const base = gradeQuestion(q, answers[q.id])
      if (base.auto) return { ...base, self: null }
      return { ...base, self: selfMarks[q.id] === true }
    })
    setGrades(g)
    setStage('result')
    const autoCorrect = g.filter((x) => x.auto && x.correct).length
    const selfCorrect = g.filter((x) => !x.auto && x.self).length
    const pracCount = qs.filter((q) => q.source === 'practice').length
    const pracCorrect = qs.reduce((acc, q, i) => {
      const gr = g[i]
      if (q.source === 'practice' && (gr.auto ? gr.correct : gr.self)) return acc + 1
      return acc
    }, 0)
    setPracticeCount(pracCount)
    try {
      await addSelfTest({
        subject, kind: '章节测试', name: `[${topic || subject}] 随机抽测`,
        total: qs.length, correct: autoCorrect + selfCorrect,
        sec: null, topic: topic || null, mode: 'quiz',
        practice: pracCount, practiceCorrect: pracCorrect
      })
      setSaved(true)
    } catch {}
    try { await collectWrongToBook(qs, g, subject, topic) } catch {}
  }

  const q = qs[idx]
  const answeredCount = qs.filter((x) => x.type === 'choice' || x.type === 'fill' ? answers[x.id] != null : selfMarks[x.id] != null).length

  return (
    <div className="quiz-overlay" onClick={onClose}>
      <div className="quiz-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-head">
          <div>
            <div className="quiz-title">{stage === 'setup' ? '章节测试' : stage === 'quiz' ? `第 ${idx + 1}/${qs.length} 题` : '测试结果'}</div>
            <div className="quiz-sub">{subject}{topic ? ' · ' + topic : ''}{stage === 'quiz' ? ` · 已答 ${answeredCount}/${qs.length}` : ''}</div>
          </div>
          <button className="quiz-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="quiz-body">
          {stage === 'setup' && (
            <div>
              <div className="quiz-sec-title">题型（可多选）</div>
              <div className="quiz-chips" style={{ marginBottom: 14 }}>
                {TYPE_CHIPS.map((t) => (
                  <button key={t.key} className={`chip ${types.includes(t.key) ? 'on' : ''}`} onClick={() => setTypes((p) => p.includes(t.key) ? p.filter((x) => x !== t.key) : [...p, t.key])}>
                    <Icon name={t.icon} size={13} /> {t.label}
                  </button>
                ))}
              </div>
              <div className="quiz-sec-title">抽几道</div>
              <div className="quiz-chips" style={{ marginBottom: 14 }}>
                {COUNT_OPTS.map((n) => (
                  <button key={n} className={`chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 道</button>
                ))}
              </div>
              {subject !== '英语一' && subject !== '数学一' && subject !== '政治' && (
                <>
                  <div className="quiz-sec-title">题源</div>
                  <div className="quiz-chips" style={{ marginBottom: 10 }}>
                    <button className={`chip ${!includePractice ? 'on' : ''}`} onClick={() => setIncludePractice(false)}>仅真题</button>
                    <button className={`chip ${includePractice ? 'on' : ''}`} onClick={() => setIncludePractice(true)}>真题 + 模拟练习</button>
                  </div>
                </>
              )}
              <div className="note" style={{ marginTop: 10 }}>选择题自动判分；大题做完后自己判对错。结果会记入自测，补漏计划会自动用到。模拟练习不计入估分。</div>
              {err && <div className="quiz-err">{err}</div>}
              <button className="btn block" style={{ marginTop: 16 }} onClick={start}>开始</button>
            </div>
          )}

          {stage === 'quiz' && q && (
            <div>
              <div className="quiz-q-type">
                {q.source === 'practice' ? '模拟练习 · ' + (TYPE_CHIPS.find((t) => t.key === q.type)?.label || q.type) : (TYPE_CHIPS.find((t) => t.key === q.type)?.label || q.type) + ' · ' + q.year + ' 年真题'}
              </div>
              <div className="quiz-stem">{q.stem}</div>
              {q.options && q.options[0] && q.options[0].startsWith('（图') && <Fig id={q.id} style={{ marginTop: 8 }} />}
              {q.type === 'choice' && (
                <div className="quiz-options">
                  {q.options.map((o, i) => {
                    const L = String.fromCharCode(65 + i)
                    const sel = answers[q.id] === L
                    return (
                      <button key={i} className={`quiz-opt ${sel ? 'on' : ''}`} onClick={() => setAnswers((a) => ({ ...a, [q.id]: L }))}>
                        <span className="quiz-opt-l">{L}.</span> {o}
                      </button>
                    )
                  })}
                </div>
              )}
              {q.type === 'essay' && (
                <div>
                  <textarea className="input quiz-textarea" rows={5} style={{ marginTop: 10 }} placeholder="写下你的思路（要点即可）" value={answers[q.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
                  <button className="mini-toggle" style={{ marginTop: 8 }} onClick={() => setShowRef((s) => ({ ...s, [q.id]: !s[q.id] }))}>{showRef[q.id] ? '收起参考答案' : '看参考答案'}</button>
                  {showRef[q.id] && <div className="quiz-ref">{gradeQuestion(q, '').ref || '暂无参考答案'}</div>}
                  <div className="quiz-self">
                    <div className="quiz-self-q">对照答案，这题我：</div>
                    <button className={`chip ${selfMarks[q.id] === true ? 'on' : ''}`} onClick={() => setSelfMarks((s) => ({ ...s, [q.id]: true }))}>做对了</button>
                    <button className={`chip ${selfMarks[q.id] === false ? 'on' : ''}`} onClick={() => setSelfMarks((s) => ({ ...s, [q.id]: false }))}>没做对</button>
                  </div>
                </div>
              )}
              <div className="quiz-nav">
                <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>上一题</button>
                {idx < qs.length - 1 ? <button className="btn" onClick={() => setIdx(idx + 1)}>下一题</button> : <button className="btn" onClick={submit}>交卷</button>}
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div>
              {(() => {
                const autoCorrect = grades.filter((g) => g.auto && g.correct).length
                const selfCorrect = grades.filter((g) => !g.auto && g.self).length
                const totalCorrect = autoCorrect + selfCorrect
                const pct = qs.length ? Math.round((totalCorrect / qs.length) * 100) : 0
                return (
                  <div>
                    <div className="quiz-score">
                      <div className="quiz-score-num">{totalCorrect}/{qs.length}</div>
                      <div className="quiz-score-pct">{pct}%</div>
                      <div className="quiz-score-tip">
                        自动判 {autoCorrect} 道 · 自评 {selfCorrect} 道
                        {saved && <span className="quiz-saved">已记入自测</span>}
                      </div>
                    </div>
                    {practiceCount > 0 && <div className="note" style={{ marginTop: 8, color: 'var(--amber)' }}>本次含 {practiceCount} 道模拟练习，仅作训练，不计入估分。</div>}
                    <div className="quiz-result-list">
                      {qs.map((qq, i) => {
                        const g = grades[i]
                        const ok = g.auto ? g.correct : g.self
                        return (
                          <div key={qq.id} className={`quiz-result-row ${ok ? '' : 'no'}`}>
                            <span className="quiz-result-ic"><Icon name={ok ? 'check' : 'close'} size={13} /></span>
                            <span className="quiz-result-t">{i + 1}. {qq.tags?.[0] || qq.type} · {qq.year || '练习'}</span>
                            <span className="quiz-result-type">{qq.type}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="quiz-nav">
                      <button className="btn ghost" onClick={() => setStage('setup')}>再测一次</button>
                      <button className="btn" onClick={onClose}>完成</button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}