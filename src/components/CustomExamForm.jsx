// CustomExamForm.jsx —— 自定义考试（重建版）
import { useState } from 'react'
import { addCustomExam, EXAM_TYPES } from '../lib/db'
import { CUSTOM_SUBJECT_OPTIONS } from '../lib/examTypes'

export default function CustomExamForm({ onClose, onSaved }) {
  const [label, setLabel] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [baseType, setBaseType] = useState('kaoyan')
  const [subjects, setSubjects] = useState(['专业课'])
  const [err, setErr] = useState('')
  const add = () => {
    if (!label.trim()) { setErr('请填考试名称'); return }
    addCustomExam({ label: label.trim(), targetDate: targetDate || null, baseType, subjects: subjects.filter(Boolean) })
    onSaved && onSaved()
    onClose()
  }
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 自定义考试</h2>
        <input className="input" style={{ marginBottom: 8 }} placeholder="考试名称" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className="input" type="date" style={{ marginBottom: 8 }} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        <select className="input" style={{ marginBottom: 8 }} value={baseType} onChange={(e) => setBaseType(e.target.value)}>
          {Object.values(EXAM_TYPES).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <div className="chips" style={{ marginBottom: 10 }}>
          {CUSTOM_SUBJECT_OPTIONS.map((s) => (
            <button key={s} className={`chip ${subjects.includes(s) ? 'on' : ''}`} onClick={() => setSubjects((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}>{s}</button>
          ))}
        </div>
        {err && <div className="err">{err}</div>}
        <div className="form-row">
          <button className="btn block" onClick={add}>创建</button>
          <button className="btn ghost" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}