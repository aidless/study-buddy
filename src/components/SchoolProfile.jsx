// SchoolProfile.jsx —— 目标院校档案（重建版）
import { useState } from 'react'
import { getSchoolProfile, setSchoolProfile } from '../lib/db'

export default function SchoolProfile({ onClose }) {
  const [form, setForm] = useState({ school: '', major: '', targetScore: '', lineScore: '' })
  const [saved, setSaved] = useState(false)
  useState(() => { getSchoolProfile().then((p) => p && setForm({ school: p.school || '', major: p.major || '', targetScore: p.targetScore || '', lineScore: p.lineScore || '' })) })
  const save = async () => {
    await setSchoolProfile({ school: form.school, major: form.major, targetScore: form.targetScore, lineScore: form.lineScore })
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 目标院校</h2>
        <div className="form-row" style={{ marginBottom: 8 }}>
          <input className="input" placeholder="学校，如 杭电" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          <input className="input" placeholder="专业" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
        </div>
        <div className="form-row" style={{ marginBottom: 8 }}>
          <input className="input" type="number" placeholder="目标分" value={form.targetScore} onChange={(e) => setForm({ ...form, targetScore: e.target.value })} />
          <input className="input" type="number" placeholder="往年校线" value={form.lineScore} onChange={(e) => setForm({ ...form, lineScore: e.target.value })} />
        </div>
        <div className="form-row">
          <button className="btn block" onClick={save}>{saved ? '已保存' : '保存档案'}</button>
          <button className="btn ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}