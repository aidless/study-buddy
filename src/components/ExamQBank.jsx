// ExamQBank.jsx —— 真题库浏览（按年份/科目，点开看答案与解析）
import { useState, useMemo } from 'react'
import Icon from './Icon'
import { SEED_QUESTIONS, SEED_META } from '../lib/qbankSeed.js'
import { ESSAY } from '../lib/qbankEssay.js'

const SUBJECTS = ['数据结构', '计算机组成', '操作系统', '计算机网络']

export default function ExamQBank() {
  const [year, setYear] = useState('')
  const [subject, setSubject] = useState('')
  const [openId, setOpenId] = useState(null)

  const years = useMemo(() => (SEED_META.years || []).slice().reverse(), [])
  const list = useMemo(() => {
    let l = SEED_QUESTIONS
    if (year) l = l.filter((q) => q.year === Number(year))
    if (subject) l = l.filter((q) => q.subject === subject)
    return l
  }, [year, subject])

  return (
    <div>
      <div className="card">
        <h2><span className="dot" /> 真题库 <span className="tiny">共 {SEED_META.count} 道选择题 · 2009–2026</span></h2>
        <div className="chips" style={{ marginBottom: 8 }}>
          <button className={`chip ${!year ? 'on' : ''}`} onClick={() => setYear('')}>全部年份</button>
          {years.slice(0, 8).map((y) => (
            <button key={y} className={`chip ${year === String(y) ? 'on' : ''}`} onClick={() => setYear(String(y))}>{y}</button>
          ))}
        </div>
        <div className="chips">
          <button className={`chip ${!subject ? 'on' : ''}`} onClick={() => setSubject('')}>全部科目</button>
          {SUBJECTS.map((s) => (
            <button key={s} className={`chip ${subject === s ? 'on' : ''}`} onClick={() => setSubject(s)}>{s}</button>
          ))}
        </div>
      </div>

      {list.map((q) => {
        const open = openId === q.id
        return (
          <div key={q.id} className="card" style={{ padding: 12 }}>
            <div className="tiny" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>
              {q.no}. {q.subject} · {q.year} 真题
              {(q.tags || []).length > 0 && <span style={{ color: 'var(--ink-soft)', fontWeight: 400, marginLeft: 6 }}>{q.tags.join('、')}</span>}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>{q.stem}</div>
            <div style={{ marginTop: 8, display: 'grid', gap: 5 }}>
              {q.options.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
                  <b>{String.fromCharCode(65 + i)}.</b> <span>{o}</span>
                </div>
              ))}
            </div>
            <button className="mini-toggle" style={{ marginTop: 8 }} onClick={() => setOpenId(open ? null : q.id)}>
              {open ? '收起答案' : '看答案'}
            </button>
            {open && (
              <div className="quiz-ref" style={{ marginTop: 8 }}>
                <b>答案：{q.answer}</b>
                {q.analysis && <div style={{ marginTop: 6 }}>{q.analysis}</div>}
                {!q.analysis && <div className="tiny" style={{ marginTop: 6 }}>（该题解析待补）</div>}
              </div>
            )}
          </div>
        )
      })}
      {list.length === 0 && <div className="note">该组合暂无题目。</div>}
    </div>
  )
}