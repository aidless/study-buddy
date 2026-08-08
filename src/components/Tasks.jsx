import { useState, useEffect } from 'react'
import Icon from './Icon'
import { listTasks, addTask, toggleTask, removeTask, getCheckin, toggleCheckin, getPlanChecks, setPlanCheck, buildPlan, getCountdown, getPlanAnchor, todayStr } from '../lib/db'
import { LS } from '../lib/db'

export default function Tasks({ onChanged }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [checked, setChecked] = useState(false)
  const [plan, setPlan] = useState({ todayTasks: [], reason: '' })

  const reload = async () => {
    setTasks(await listTasks())
    const ck = await getCheckin(todayStr())
    setChecked(!!ck)
    const cd = await getCountdown()
    const anchor = getPlanAnchor()
    setPlan(buildPlan(cd?.targetDate, anchor))
  }
  useEffect(() => { reload() }, [])

  const add = async () => {
    if (!title.trim()) return
    await addTask({ title: title.trim(), date: todayStr() })
    setTitle('')
    reload(); onChanged && onChanged()
  }
  const doCheck = async () => {
    await toggleCheckin('')
    reload(); onChanged && onChanged()
  }
  const doToggle = async (t) => {
    await toggleTask(t.id, !t.done)
    reload(); onChanged && onChanged()
  }
  const doDel = async (id) => { await removeTask(id); reload(); onChanged && onChanged() }
  const doPlanCheck = async (subject, topic, done) => {
    setPlanCheck(todayStr(), subject, topic, done)
    reload(); onChanged && onChanged()
  }

  return (
    <>
      <div className="card">
        <h2><span className="dot" /> 今日打卡</h2>
        <div className="tip-row" style={{ alignItems: 'center', gap: 10 }}>
          <button className={`chip ${checked ? 'on' : ''}`} onClick={doCheck}>
            <Icon name="check" size={13} /> {checked ? '已打卡' : '打卡'}
          </button>
          <span className="tiny">{checked ? '今天记下了，继续保持' : '每天打开点一下，连续天数就接上了'}</span>
        </div>
      </div>

      <div className="card">
        <h2><span className="dot" /> 开箱即用今日建议</h2>
        <div className="tiny" style={{ marginBottom: 8 }}>{plan.reason}</div>
        {plan.todayTasks.length === 0 ? (
          <div className="note">还没有自测记录——做完题记一次，计划就会自动生成。</div>
        ) : (
          plan.todayTasks.map((t, i) => {
            const checks = getPlanChecks(todayStr())
            const done = !!checks[`${t.subject}|${t.topic}`]
            return (
              <div key={i} className={`task ${done ? 'done' : ''}`}>
                <div className="t-check" onClick={() => doPlanCheck(t.subject, t.topic, !done)}><Icon name="check" size={14} /></div>
                <div className="t-title">{t.subject} · {t.topic}</div>
              </div>
            )
          })
        )}
      </div>

      <div className="card">
        <h2><span className="dot" /> 任务</h2>
        {tasks.length === 0 && <div className="note">没有额外要做的，就专注今日建议吧。</div>}
        {tasks.map((t) => (
          <div key={t.id} className={`task ${t.done ? 'done' : ''}`}>
            <div className="t-check" onClick={() => doToggle(t)}><Icon name="check" size={14} /></div>
            <div className="t-title">{t.title}</div>
            <button className="t-del" onClick={() => doDel(t.id)}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <input className="input" placeholder="加一件今天要做的事" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn" style={{ flexShrink: 0 }} onClick={add}><Icon name="plus" size={16} /></button>
        </div>
      </div>
    </>
  )
}