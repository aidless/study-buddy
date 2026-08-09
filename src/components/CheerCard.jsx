// CheerCard.jsx —— 他送你的鼓励（督学端"送她一句"落地展示）
import { useEffect, useState } from 'react'
import { listCheers } from '../lib/db'

export default function CheerCard({ nonce }) {
  const [cheers, setCheers] = useState([])

  useEffect(() => {
    let alive = true
    listCheers().then((list) => { if (alive) setCheers(list || []) }).catch(() => {})
    return () => { alive = false }
  }, [nonce])

  const mine = cheers.filter((c) => !c.mine)
  if (mine.length === 0) return null
  const latest = mine[0]
  const more = mine.length - 1

  return (
    <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent' }}>
      <div className="row between" style={{ alignItems: 'center' }}>
        <div>
          <div className="tiny" style={{ marginBottom: 4, color: 'var(--primary)' }}>{latest.fromName || '他'} 送你的鼓励 💛</div>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>{latest.text}</div>
        </div>
        <IconHeart />
      </div>
      {more > 0 && <div className="tiny" style={{ marginTop: 6, color: 'var(--ink-soft)' }}>还有 {more} 条鼓励，去悄悄话慢慢看</div>}
    </div>
  )
}

function IconHeart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--primary)', flexShrink: 0, marginLeft: 10 }} aria-hidden="true">
      <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.2 4.5 5.7 4.2c2-.2 3.6.8 4.3 2.1.7-1.3 2.3-2.3 4.3-2.1 3.5.3 5.2 3.8 3.7 7.5C19.5 16.3 12 21 12 21z" />
    </svg>
  )
}
