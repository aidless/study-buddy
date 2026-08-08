// DailyWord.jsx —— 每日一句话浮现（按日期稳定抽取一句历史的话）
import { useEffect, useState } from 'react'

export default function DailyWord({ dateStr, coupleId, historyWords = [] }) {
  const [w, setW] = useState('')
  useEffect(() => {
    const pool = (historyWords || []).filter((x) => typeof x === 'string' && x.length > 2)
    if (!pool.length) { setW(''); return }
    let h = 0
    const s = dateStr + (coupleId || '')
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    setW(pool[h % pool.length])
  }, [dateStr, coupleId, historyWords])
  if (!w) return null
  return (
    <div className="card" style={{ background: 'var(--gap-bg)', borderColor: 'transparent' }}>
      <div className="tiny" style={{ marginBottom: 4 }}>记忆回响</div>
      <div style={{ fontSize: 14, lineHeight: 1.7 }}>{w.replace(/^[^:]*:/, '')}</div>
    </div>
  )
}