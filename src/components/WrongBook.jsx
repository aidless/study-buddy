// WrongBook.jsx —— 错题本（云端 + 本地）
import { useState, useEffect } from 'react'
import { listWrongItems, removeWrongItem, setWrongMastered, redoWrongItem } from '../lib/db'
import Icon from './Icon'

export default function WrongBook() {
  const [items, setItems] = useState(null)
  const [openId, setOpenId] = useState(null)
  const reload = () => listWrongItems().then(setItems)
  useEffect(() => { reload() }, [])
  if (items == null) return <div className="card"><div className="tiny" style={{ opacity: 0.6 }}>错题本加载中…</div></div>
  return (
    <div className="card">
      <h2><span className="dot" /> 错题本</h2>
      {items.length === 0 && <div className="note">还没有错题——做真题答错的题会自动收进来，云端同步。</div>}
      {items.map((t) => (
        <div key={t.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 10, marginBottom: 8 }}>
          <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="tiny" style={{ fontWeight: 700, marginBottom: 4 }}>{t.subject}{t.topic ? ' · ' + t.topic : ''}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{t.stemText || t.note || '(文本错题)'}</div>
            </div>
            <div className="row" style={{ gap: 4, flexShrink: 0 }}>
              <button className="mini-toggle" onClick={async () => { await setWrongMastered(t.id, !t.mastered); reload() }}>{t.mastered ? '已掌握' : '标记掌握'}</button>
              <button className="mini-toggle" onClick={async () => { await redoWrongItem(t.id); reload() }}>重做+1</button>
              <button className="mini-toggle" onClick={async () => { await removeWrongItem(t.id); reload() }}>删</button>
            </div>
          </div>
          <button className="tiny" style={{ marginTop: 6, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOpenId(openId === t.id ? null : t.id)}>
            {openId === t.id ? '收起解析' : '看答案与解析'}
          </button>
          {openId === t.id && (
            <div className="quiz-ref" style={{ marginTop: 6 }}>
              <div style={{ marginBottom: 4 }}><b>正确答案：{t.answer}</b></div>
              {t.options && t.options.map((o, i) => <div key={i} style={{ fontSize: 12 }}>{String.fromCharCode(65 + i)}. {o}</div>)}
              {t.analysis && <div style={{ marginTop: 6 }}>{t.analysis}</div>}
              {!t.analysis && t.options && <div className="tiny" style={{ marginTop: 6 }}>（题目带配图，解析见原题）</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}