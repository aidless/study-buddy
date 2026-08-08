// MemoryEcho.jsx —— 共同记忆回响：纪念日 / 她说过的暖心话
import { useEffect, useState } from 'react'

export default function MemoryEcho({ focus, checkins, words, today }) {
  const [echo, setEcho] = useState('')
  useEffect(() => {
    const msgs = []
    const days = new Set([...(focus || []).map((f) => (f.startedAt || f.started_at || '').slice(0, 10)), ...(checkins || []).map((c) => (c.date || '').slice(0, 10))])
    if (days.has(today)) {
      // 每周纪念日提醒
      const d = new Date()
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      const anniv = { '1/1': '元旦快乐，今年一起上岸', '2/14': '情人节快乐', '12/24': '平安夜，早点休息' }
      if (anniv[key]) msgs.push(anniv[key])
    }
    const w = (words || {})[today] || {}
    if (w.she) msgs.push('她今天写过一句话：' + w.she.replace(/^[^:]*:/, ''))
    setEcho(msgs[0] || '')
  }, [focus, checkins, words, today])
  if (!echo) return null
  return (
    <div className="card" style={{ background: 'var(--gap-bg)', borderColor: 'transparent' }}>
      <div className="tiny" style={{ marginBottom: 4 }}>共同记忆回响</div>
      <div style={{ fontSize: 13.5 }}>{echo}</div>
    </div>
  )
}