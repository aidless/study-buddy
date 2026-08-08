import { useState, useEffect } from 'react'
import { getTargetScore, setTargetScore } from '../lib/db'
import { EXAM_TYPES } from '../lib/examTypes'

export default function TargetScoreCard({ examType }) {
  const [score, setScore] = useState('')
  useEffect(() => {
    getTargetScore().then((s) => setScore(s == null ? '' : String(s)))
  }, [examType])
  const type = EXAM_TYPES[examType] || EXAM_TYPES.kaoyan
  const save = async () => {
    const n = score === '' ? null : parseInt(score, 10)
    await setTargetScore(n)
  }
  return (
    <div className="card">
      <h2><span className="dot" /> 目标总分</h2>
      <div className="form-row">
        <input className="input" type="number" placeholder={`满分 ${type.totalMax}`} value={score} onChange={(e) => setScore(e.target.value)} />
        <button className="btn" onClick={save}>保存</button>
      </div>
      <div className="tiny" style={{ marginTop: 6 }}>{type.subjNote}</div>
    </div>
  )
}