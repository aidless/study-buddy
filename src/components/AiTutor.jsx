// AiTutor.jsx —— AI 名师对话卡（考研专用）
import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'
import { askAiTutor } from '../lib/aiTutor'

const MODES = [
  { key: 'ask', label: '答疑' },
  { key: 'explain', label: '讲题' },
  { key: 'essay', label: '作文批改' },
  { key: 'plan', label: '学习规划' }
]

export default function AiTutor() {
  const [mode, setMode] = useState('ask')
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const boxRef = useRef(null)

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [msgs])

  const send = async () => {
    const q = input.trim()
    if (!q || busy) return
    setErr('')
    setMsgs((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setBusy(true)
    setMsgs((m) => [...m, { role: 'ai', text: '', pending: true }])
    try {
      const reply = await askAiTutor({ mode, question: q })
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { role: 'ai', text: reply } : x)))
    } catch (e) {
      setErr(e.message || 'AI 服务暂不可用')
      setMsgs((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ background: 'var(--gap-bg)', borderColor: 'transparent' }}>
      <h2><Icon name="bulb" size={18} /> AI 名师
        <span className="tiny" style={{ marginLeft: 6, color: 'var(--ink-soft)' }}>考研专用 · 结合你的错题与自测</span>
      </h2>
      <div className="chips" style={{ marginBottom: 10 }}>
        {MODES.map((m) => (
          <button key={m.key} className={`chip ${mode === m.key ? 'on' : ''}`} onClick={() => setMode(m.key)}>{m.label}</button>
        ))}
      </div>
      <div className="chat-box" ref={boxRef} style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 10 }}>
        {msgs.length === 0 && (
          <div className="note">
            {mode === 'ask' && '问一道题、一个知识点，老师给你讲清楚。'}
            {mode === 'explain' && '把题目或知识点贴进来（如：讲讲 LRU 页面置换），老师分步讲。'}
            {mode === 'essay' && '把作文原文贴进来，老师按内容/结构/语言/格式批改并给修改建议。'}
            {mode === 'plan' && '老师会根据你的错题和自测数据，给出本周可执行的学习安排。'}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'mine' : 'them'}`} style={{ whiteSpace: 'pre-wrap' }}>
            {m.pending ? '老师正在思考…' : m.text}
          </div>
        ))}
      </div>
      {err && <div className="err">{err}</div>}
      <div className="chat-input">
        <input className="input" placeholder={mode === 'essay' ? '粘贴作文内容…' : '向老师提问…'} value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="btn" onClick={send} disabled={busy}><Icon name="send" size={16} /></button>
      </div>
      <div className="tiny" style={{ marginTop: 6, opacity: 0.65 }}>
        老师会参考你最近的真题自测、错题与薄弱点；AI 回答仅供参考，关键判断以教材和真题解析为准。
      </div>
    </div>
  )
}