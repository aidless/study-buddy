// SubjectSelfTest.jsx —— 英语一 / 数学一自测（作文/解答题专项 + 随机抽测）
import { useState, lazy, Suspense } from 'react'
import Icon from './Icon'
import { addSelfTest } from '../lib/db'
import EssayScorer from './EssayScorer'

const QuizTest = lazy(() => import('./QuizTest'))

export default function SubjectSelfTest({ subject, bank, intro }) {
  const [listOpen, setListOpen] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [marks, setMarks] = useState({})
  const [quiz, setQuiz] = useState(false)
  const [scorerQ, setScorerQ] = useState(null)
  const [savedMsg, setSavedMsg] = useState('')

  const mark = async (q, ok) => {
    setMarks((m) => ({ ...m, [q.id]: ok }))
    try {
      await addSelfTest({
        subject, kind: '专项自测', name: q.tags?.[1] || q.tags?.[0] || subject,
        total: 1, correct: ok ? 1 : 0, sec: null,
        topic: (q.tags || []).slice(-1)[0] || null, mode: 'manual'
      })
      setSavedMsg('已记入自测')
      setTimeout(() => setSavedMsg(''), 1600)
    } catch {}
  }

  return (
    <div>
      <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent' }}>
        <h2><span className="dot" /> {subject}自测</h2>
        <div className="tiny" style={{ lineHeight: 1.7 }}>{intro}</div>
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <button className="btn block" onClick={() => setQuiz(true)}><Icon name="doc" size={15} /> 随机抽测</button>
          <button className="btn ghost block" style={{ flex: 1 }} onClick={() => setListOpen(!listOpen)}>
            {listOpen ? '收起题目列表' : '浏览全部题目'}
          </button>
        </div>
        {savedMsg && <div className="tiny" style={{ color: 'var(--primary)', marginTop: 8 }}>{savedMsg}</div>}
      </div>

      {listOpen && (
        <div>
          <div className="section-h">专项题库（{bank.length} 道）</div>
          {bank.map((q) => {
            const open = openId === q.id
            return (
              <div key={q.id} className="card" style={{ padding: 12 }}>
                <div className="tiny" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>{(q.tags || []).join(' · ')}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{q.stem}</div>
                <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="mini-toggle" onClick={() => setOpenId(open ? null : q.id)}>{open ? '收起参考答案' : '看参考答案'}</button>
                  {subject === '英语一' ? (
                    <button className="btn ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => setScorerQ(q)}>开始评分</button>
                  ) : (
                    <>
                      <button className={`chip ${marks[q.id] === true ? 'on' : ''}`} style={{ borderColor: 'var(--primary)' }} onClick={() => mark(q, true)}>做得不错</button>
                      <button className={`chip ${marks[q.id] === false ? 'on' : ''}`} style={{ borderColor: 'var(--tomato)' }} onClick={() => mark(q, false)}>还需练习</button>
                    </>
                  )}
                </div>
                {open && (
                  <div className="quiz-ref" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {(q.parts && q.parts[0] && q.parts[0].answer) || q.analysis || '暂无参考答案'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {scorerQ && <EssayScorer q={scorerQ} onClose={() => setScorerQ(null)} />}

      {quiz && (
        <Suspense fallback={null}>
          <QuizTest subject={subject} topic={null} onClose={() => setQuiz(false)} />
        </Suspense>
      )}
    </div>
  )
}
