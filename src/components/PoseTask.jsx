// PoseTask.jsx —— 动作任务（重建版：轻量计数，不依赖摄像头模型）
import { useState } from 'react'
import Icon from './Icon'

export default function PoseTask({ label, target, onDone }) {
  const [count, setCount] = useState(0)
  const done = count >= target
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <button
        className="btn ghost block"
        style={{ fontSize: 22, padding: '18px 0' }}
        onClick={() => {
          const next = count + 1
          setCount(next)
          if (next >= target) onDone()
        }}
      >
        {done ? <><Icon name="check" size={20} /> 完成！</> : `按一下算一次（${count}/${target}）`}
      </button>
    </div>
  )
}