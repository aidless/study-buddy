import { useState, useEffect } from 'react'
import { getSubjTargets, setSubjTargets, getTargetScore, setTargetScore } from '../lib/db'
import { EXAM_TYPES } from '../lib/examTypes'

export default function SubjTargetsCard({ examType }) {
  const type = EXAM_TYPES[examType] || EXAM_TYPES.kaoyan
  const [vals, setVals] = useState({})
  const [saved, setSaved] = useState(false)
  const reload = async () => {
    const v = await getSubjTargets()
    setVals(v || {})
  }
  useEffect(() => { reload() }, [examType])
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }))
  const save = async () => {
    await setSubjTargets(vals)
    const sum = Object.values(vals).reduce((a, b) => a + (parseInt(b, 10) || 0), 0)
    await setTargetScore(sum || null)
    await reload()
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }
  return (
    <div className="card">
      <h2><span className="dot" /> 单科目标</h2>
      {type.subjects.map((s) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label style={{ width: 90, fontSize: 12.5, flexShrink: 0 }}>{s.label}</label>
          <input className="input" type="number" placeholder={`满分 ${s.max}`} value={vals[s.key] ?? ''} onChange={(e) => set(s.key, e.target.value)} />
          <span className="tiny" style={{ width: 30 }}>/{s.max}</span>
        </div>
      ))}
      <button className="btn block" onClick={save}>{saved ? '已保存 ✓' : '保存单科目标'}</button>
      {saved && <div className="tiny" style={{ color: 'var(--primary)', marginTop: 6 }}>单科目标已保存</div>}
    </div>
  )
}