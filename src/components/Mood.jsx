import { useState } from 'react'
import { LS, todayStr } from '../lib/db'
import Icon from './Icon'

export default function Mood({ onClose }) {
  const [text, setText] = useState(() => {
    const m = LS.get('dx_treehole', {})
    return (m[todayStr()] || {}).text || ''
  })
  const [level, setLevel] = useState(() => {
    const m = LS.get('dx_treehole', {})
    return (m[todayStr()] || {}).level || ''
  })

  const save = (lv) => {
    const m = LS.get('dx_treehole', {})
    m[todayStr()] = { text, level: lv || level, at: new Date().toISOString() }
    LS.set('dx_treehole', m)
    if (lv) setLevel(lv)
    onClose && onClose()
  }

  return (
    <div>
      <h2><span className="dot" /> 树洞</h2>
      <div className="tiny" style={{ marginBottom: 8 }}>只有你能看到，写完就关，谁也不会知道。</div>
      <textarea className="input area treehole-area" placeholder="想碎碎念什么都行……" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="chips" style={{ margin: '10px 0' }}>
        {[['low', '今天有点累'], ['mid', '还行'], ['high', '今天不错']].map(([v, l]) => (
          <button key={v} className={`chip ${level === v ? 'on' : ''}`} onClick={() => setLevel(v)}>{l}</button>
        ))}
      </div>
      <div className="form-row">
        <button className="btn block" onClick={() => save(null)}><Icon name="check" size={15} /> 存进树洞</button>
        <button className="btn ghost" onClick={onClose}>不存了</button>
      </div>
    </div>
  )
}