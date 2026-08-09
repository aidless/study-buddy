import { useState } from 'react'

export default function StartSheet({ workMin, onStart, onClose, hasNativeLock }) {
  const [lock, setLock] = useState(true)
  const [unlimited, setUnlimited] = useState(false)
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 开始专注</h2>
        <div className="note" style={{ marginBottom: 12 }}>{workMin} 分钟专注 · 完成后进入 5 分钟休息</div>
        <div className="chips" style={{ marginBottom: 12 }}>
          <button className={`chip ${lock ? 'on' : ''}`} onClick={() => setLock(true)}>开专注锁（不能中途溜走）</button>
          <button className={`chip ${!lock ? 'on' : ''}`} onClick={() => setLock(false)}>不开锁</button>
        </div>
        {hasNativeLock && lock && <div className="tiny" style={{ marginTop: 8, marginBottom: 8, color: 'var(--primary)' }}>安卓版将用系统「屏幕固定」锁住，退不出去</div>}
        <div className="chips" style={{ marginBottom: 14 }}>
          <button className={`chip ${unlimited ? 'on' : ''}`} onClick={() => setUnlimited(true)}>不计时（任务完成才结束）</button>
          <button className={`chip ${!unlimited ? 'on' : ''}`} onClick={() => setUnlimited(false)}>按时长 {workMin} 分</button>
        </div>
        <div className="form-row">
          <button className="btn block" onClick={() => onStart(lock, false, unlimited)}>开始</button>
          <button className="btn ghost" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}