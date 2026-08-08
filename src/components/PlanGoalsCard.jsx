import { useState } from 'react'
import Icon from './Icon'
import { daysUntil } from '../lib/db'

export default function PlanGoalsCard({ goals, onAdd, onToggle, onRemove, recGoals, cd }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [showRec, setShowRec] = useState(false)
  return (
    <div className="card">
      <h2><span className="dot" /> 阶段目标</h2>
      {goals.length === 0 && <div className="note">设几个阶段目标，倒推排期，知道每个阶段该干什么。</div>}
      {goals.map((g) => (
        <div key={g.id} className={`goal ${g.done ? 'done' : ''}`}>
          <div className="g-check" onClick={() => onToggle(g.id)}><Icon name="check" size={14} /></div>
          <div className="g-title">{g.title}</div>
          {g.dueDate && <span className="tiny">剩 {daysUntil(g.dueDate)} 天</span>}
          <button className="t-del" onClick={() => onRemove(g.id)}><Icon name="trash" size={14} /></button>
        </div>
      ))}
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <input className="input" placeholder="阶段目标" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => { if (title.trim()) { onAdd(title.trim(), due || null); setTitle(''); setDue('') } }}>添加</button>
      {recGoals && (
        <>
          <button className="mini-toggle" style={{ marginTop: 10 }} onClick={() => setShowRec(!showRec)}>{showRec ? '收起推荐阶段' : '一键载入推荐阶段'}</button>
          {showRec && (
            <div style={{ marginTop: 8 }}>
              {recGoals.map((r, i) => (
                <div key={i} className="goal">
                  <div className="g-title" style={{ fontSize: 12.5 }}>{r.title}</div>
                  <button className="mini-toggle" onClick={() => onAdd(r.title, (() => { const base = cd && cd.targetDate ? new Date(cd.targetDate + 'T00:00:00') : new Date(); const d = new Date(base); d.setDate(d.getDate() - r.before); return d.toISOString().slice(0, 10) })())}>加入</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}