// ExamSwitcher.jsx —— 顶部考试切换（2026-08-08 按用户要求：全局只有一个切换入口，放在页面最上方）
// 单按钮显示当前考试，点开弹出 4 个预置类型；切换会清空目标总分/单科目标（倒计时、阶段目标、自测保留）。
import { useState } from 'react'
import { EXAM_TYPES, EXAM_ORDER } from '../lib/examTypes'
import Icon from './Icon'

export default function ExamSwitcher({ current, onPick, busy }) {
  const [open, setOpen] = useState(false)

  const pick = async (k) => {
    setOpen(false)
    if (k === current) return
    await onPick(k)
  }

  return (
    <div className="exam-switch-wrap">
      <button className="exam-switch" onClick={() => setOpen((o) => !o)} disabled={busy}>
        <Icon name="plan" size={15} />
        <span>当前考试：{EXAM_TYPES[current]?.label || '考研'}</span>
        <span className="tiny" style={{ marginLeft: 'auto', opacity: 0.65 }}>{open ? '收起' : '切换'}</span>
      </button>
      {open && (
        <div className="exam-switch-pop">
          <div className="chips" style={{ marginBottom: 6 }}>
            {EXAM_ORDER.map((k) => (
              <button key={k} className={`chip ${current === k ? 'on' : ''}`} onClick={() => pick(k)}>
                {EXAM_TYPES[k].label}
              </button>
            ))}
          </div>
          <div className="tiny" style={{ opacity: 0.75 }}>
            切换会清空目标总分和单科目标（倒计时、阶段目标、自测保留）。
          </div>
        </div>
      )}
    </div>
  )
}
