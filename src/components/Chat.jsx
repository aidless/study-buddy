import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { listMessages, sendMessage } from '../lib/db'

export default function Chat({ nonce }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const boxRef = useRef(null)

  const reload = () => listMessages().then(setMsgs)
  useEffect(() => { reload() }, [nonce])
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [msgs])

  const send = async () => {
    if (!text.trim()) return
    await sendMessage(text.trim())
    setText('')
    reload()
  }

  return (
    <div className="card">
      <h2><span className="dot" /> 悄悄话</h2>
      <div className="chat-box" ref={boxRef} style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        {msgs.length === 0 && <div className="note">还没有悄悄话——互发一句，把今天的小事告诉对方。</div>}
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.mine ? 'mine' : 'them'}`}>
            <div className="tiny" style={{ opacity: 0.7, marginBottom: 2 }}>{m.mine ? '我' : m.fromName}</div>
            {m.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input className="input" placeholder="写一句悄悄话…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="btn" onClick={send}><Icon name="send" size={16} /></button>
      </div>
    </div>
  )
}