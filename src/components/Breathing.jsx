import { useState, useEffect } from 'react'

export default function Breathing() {
  const [open, setOpen] = useState(true)
  const [breathing, setBreathing] = useState(false)
  const [phase, setPhase] = useState('')

  useEffect(() => {
    if (!breathing) { setPhase(''); return }
    let n = 0
    setPhase('吸气')
    const id = setInterval(() => { n++; setPhase(n % 2 === 0 ? '吸气' : '呼气') }, 4000)
    const stop = setTimeout(() => { setBreathing(false); setPhase('') }, 60000)
    return () => { clearInterval(id); clearTimeout(stop) }
  }, [breathing])

  if (!open) {
    return (
      <div className="card" style={{ padding: '12px 14px' }}>
        <button className="row between" style={{ width: '100%', background: 'none', border: 'none', padding: 0, color: 'var(--ink-soft)', cursor: 'pointer' }} onClick={() => setOpen(true)}>
          <span style={{ fontSize: 13 }}>休息一下？深呼吸 60 秒</span>
          <span style={{ opacity: 0.6 }}>›</span>
        </button>
      </div>
    )
  }
  return (
    <div className="card breath-card">
      <div className="row between" style={{ alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}><span className="dot" /> 深呼吸</h2>
        <button className="btn ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { setOpen(false); setBreathing(false) }}>收起</button>
      </div>
      <div className="breath-wrap">
        <div className={`breath-circle ${breathing ? 'on' : ''}`} style={{ transform: phase === '吸气' ? 'scale(1)' : 'scale(0.62)' }}>
          <span>{breathing ? phase : '60秒'}</span>
        </div>
      </div>
      {breathing ? (
        <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setBreathing(false)}>停下来</button>
      ) : (
        <button className="btn block" style={{ marginTop: 10 }} onClick={() => setBreathing(true)}>开始 60 秒呼吸</button>
      )}
      <div className="tiny" style={{ marginTop: 8, textAlign: 'center' }}>跟着圆圈变大吸气、变小呼气，放松一下。</div>
    </div>
  )
}