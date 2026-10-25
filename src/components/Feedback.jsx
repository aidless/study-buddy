import { useState, useEffect } from 'react'
import { track } from '../lib/analytics'

export default function Feedback({ onClose }) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { track('feedback_open') }, [])

  const issue = 'https://github.com/aidless/study-buddy/issues/new?title=' +
    encodeURIComponent('反馈：') + '&body=' + encodeURIComponent(text)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      track('feedback_copy', { length: text.length })
    } catch {}
  }

  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="反馈">
        <h2><span className="dot" /> 说两句</h2>
        <div className="tiny" style={{ marginBottom: 10 }}>
          哪里卡住了、哪里看不懂、想要什么功能都行。请不要贴真实的私人内容。
        </div>
        <textarea
          className="input area"
          placeholder="例如：第一次打开不知道先点哪里……"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <div className="tiny" style={{ margin: '6px 0 12px' }}>{text.length}/1000</div>
        <div className="form-row">
          <button className="btn block" onClick={copy} disabled={!text.trim()}>{copied ? '已复制' : '复制反馈'}</button>
          <a className="btn ghost" href={issue} target="_blank" rel="noreferrer" onClick={() => track('feedback_issue', { length: text.length })}>去 GitHub</a>
          <button className="btn ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
