import { useState } from 'react'

export default function PomoSettings({ workMin, breakMin, mode, onModeChange, onSave, onClose }) {
  const [w, setW] = useState(workMin)
  const [b, setB] = useState(breakMin)
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 番茄钟设置</h2>
        <div className="chips" style={{ marginBottom: 12 }}>
          {[['strict', '严厉模式（退出要完成任务）'], ['easy', '轻松模式']].map(([v, l]) => (
            <button key={v} className={`chip ${mode === v ? 'on' : ''}`} onClick={() => onModeChange(v)}>{l}</button>
          ))}
        </div>
        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="tiny" style={{ flexShrink: 0 }}>专注（分）</label>
          <input className="input" type="number" min={1} max={120} value={w} onChange={(e) => setW(parseInt(e.target.value, 10) || 25)} />
          <label className="tiny" style={{ flexShrink: 0 }}>休息（分）</label>
          <input className="input" type="number" min={1} max={30} value={b} onChange={(e) => setB(parseInt(e.target.value, 10) || 5)} />
        </div>
        <div className="form-row">
          <button className="btn block" onClick={() => onSave(w, b)}>保存</button>
          <button className="btn ghost" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}