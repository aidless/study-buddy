// VoiceTask.jsx —— 语音任务（重建版：按住大声读，计次数）
import { useRef, useState } from 'react'
import Icon from './Icon'

export default function VoiceTask({ label, target, onDone }) {
  const [count, setCount] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const timer = useRef(null)
  const start = () => {
    setSpeaking(true)
    timer.current = setTimeout(() => {
      const next = count + 1
      setCount(next)
      setSpeaking(false)
      if (next >= target) onDone()
    }, 1200)
  }
  const stop = () => { clearTimeout(timer.current); setSpeaking(false) }
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <button
        className="btn ghost block"
        style={{ fontSize: 18, padding: '18px 0' }}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
      >
        <Icon name="mic" size={18} /> {speaking ? '大声读……' : `按住大声读（${count}/${target}）`}
      </button>
    </div>
  )
}