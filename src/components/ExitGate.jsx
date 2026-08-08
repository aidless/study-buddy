// ExitGate.jsx —— 退出关卡：想提前结束专注，先完成一个小任务（重建版）
import { useState, useRef } from 'react'
import PoseTask from './PoseTask'
import VoiceTask from './VoiceTask'
import Icon from './Icon'

const STRICT_TASKS = [
  { type: 'pose', label: '做 10 个深蹲', target: 10 },
  { type: 'pose', label: '原地高抬腿 30 次', target: 30 },
  { type: 'voice', label: '大声说 5 遍「我能考上」', target: 5 },
  { type: 'simple', label: '把这轮的计划写下来', target: 1 }
]
const EASY_TASKS = [
  { type: 'simple', label: '喝口水，伸个懒腰', target: 1 },
  { type: 'simple', label: '做 5 个深呼吸', target: 1 }
]

export default function ExitGate({ onDone, onForce, strict = true }) {
  const pool = strict ? STRICT_TASKS : EASY_TASKS
  const [t, setT] = useState(() => pool[Math.floor(Math.random() * pool.length)])
  const [rerolls, setRerolls] = useState(0)
  const [armed, setArmed] = useState(false)
  const holdRef = useRef(null)
  const holdMs = strict ? 5000 : 2000

  const reroll = () => {
    if (rerolls >= (strict ? 1 : 2)) return
    setT(pool[Math.floor(Math.random() * pool.length)])
    setRerolls((r) => r + 1)
  }
  const startHold = () => {
    setArmed(true)
    holdRef.current = setTimeout(() => { holdRef.current = null; setArmed(false); onForce && onForce() }, holdMs)
  }
  const cancelHold = () => { if (holdRef.current) clearTimeout(holdRef.current); holdRef.current = null; setArmed(false) }

  return (
    <div className="code-mask">
      <div className="code-modal">
        <h2><span className="dot" /> {strict ? '想溜？先完成这个' : '确定要提前结束吗'}</h2>
        <div style={{ fontSize: 17, textAlign: 'center', margin: '14px 0', fontWeight: 600, color: 'var(--primary)' }}>{t.label}</div>
        {t.type === 'pose' ? (
          <PoseTask label={t.label} target={t.target} onDone={onDone} />
        ) : t.type === 'voice' ? (
          <VoiceTask label={t.label} target={t.target} onDone={onDone} />
        ) : (
          <>
            <div className="tiny" style={{ textAlign: 'center', opacity: 0.8 }}>
              {strict ? '这类任务验不了真假——反正你是给自己学。' : '完成这个轻量小任务就放行。'}
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <button className="btn block" onClick={onDone}>做完了，放我走</button>
              {!strict && <button className="btn ghost" onClick={onDone}>直接退出</button>}
            </div>
          </>
        )}
        <button className="btn ghost" style={{ marginTop: 10, width: '100%', fontSize: 12, opacity: rerolls >= (strict ? 1 : 2) ? 0.4 : 1 }} onClick={reroll} disabled={rerolls >= (strict ? 1 : 2)}>
          {rerolls >= (strict ? 1 : 2) ? '严厉模式只给一次换的机会，做完这个吧' : '换一个任务'}
        </button>
        {strict && (
          <button className="btn ghost" style={{ marginTop: 6, width: '100%', fontSize: 11, opacity: 0.55, userSelect: 'none' }}
            onPointerDown={startHold} onPointerUp={cancelHold} onPointerLeave={cancelHold}>
            {armed ? '别松手，继续按…' : `真不想做了（长按 ${holdMs / 1000} 秒）`}
          </button>
        )}
      </div>
    </div>
  )
}