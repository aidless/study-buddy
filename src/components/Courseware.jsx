// Courseware.jsx —— 课件（重建版：本地收藏/查看）
import { useState } from 'react'
import Icon from './Icon'
import { LS } from '../lib/db'

export default function Courseware({ onClose }) {
  const [list, setList] = useState(() => LS.get('dx_courseware', []))
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const add = () => {
    if (!title.trim()) return
    const arr = LS.get('dx_courseware', [])
    arr.push({ id: Date.now().toString(36), title: title.trim(), link: link.trim(), at: new Date().toISOString() })
    LS.set('dx_courseware', arr)
    setList(arr); setTitle(''); setLink('')
  }
  return (
    <div className="app">
      <div className="topbar">
        <div><h1>课件</h1></div>
        <button className="btn ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={onClose}>关闭</button>
      </div>
      <div className="card">
        <h2><span className="dot" /> 收藏课件</h2>
        <div className="form-row" style={{ marginBottom: 8 }}>
          <input className="input" placeholder="名称" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-row">
          <input className="input" placeholder="链接（选填）" value={link} onChange={(e) => setLink(e.target.value)} />
          <button className="btn" onClick={add}>添加</button>
        </div>
      </div>
      {list.map((c) => (
        <div key={c.id} className="card" style={{ padding: 12 }}>
          <div className="row between">
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.title}</div>
            {c.link && <a href={c.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: 12 }}>打开</a>}
          </div>
        </div>
      ))}
    </div>
  )
}