import { useState, useEffect, lazy, Suspense } from 'react'
import { getPlan, setCountdown, addGoal, toggleGoal, removeGoal, daysUntil, getExamType } from '../lib/db'
import { EXAM_TYPES, DEFAULT_EXAM } from '../lib/examTypes'
import Icon from './Icon'
import TargetScoreCard from './TargetScoreCard'
import SubjTargetsCard from './SubjTargetsCard'
import PlanGoalsCard from './PlanGoalsCard'
import WeightedEstimate from './WeightedEstimate'
import SelfTestRecorder from './SelfTestRecorder'
import WrongBook from './WrongBook'
import WeaknessDigest from './WeaknessDigest'

const LazyFallback = () => <div className="tiny" style={{ padding: 20, opacity: 0.6, textAlign: 'center' }}>加载中…</div>

export default function Plan({ nonce }) {
  const [data, setData] = useState(null)
  const [examType, setExamTypeState] = useState(DEFAULT_EXAM)
  const [editingCd, setEditingCd] = useState(false)
  const [cdDate, setCdDate] = useState('')
  const [cdLabel, setCdLabel] = useState('')
  const [err, setErr] = useState('')
  const [loadErr, setLoadErr] = useState(false)

  const type = EXAM_TYPES[examType] || EXAM_TYPES[DEFAULT_EXAM]

  const reload = async () => {
    setLoadErr(false)
    try {
      const [plan, et] = await Promise.all([getPlan(), getExamType()])
      setData(plan)
      setExamTypeState(et)
    } catch (e) {
      console.error('Plan reload failed', e)
      setLoadErr(true)
    }
  }
  useEffect(() => { reload() }, [nonce])

  if (loadErr) return <div className="card"><div className="note">备考加载出了点问题，刷新一下就好。</div></div>
  if (!data) return <div className="card loading">加载中…</div>

  const saveCd = async () => {
    if (!cdDate) { setErr('请选择考试日期'); return }
    setErr('')
    await setCountdown({ targetDate: cdDate, label: cdLabel })
    setEditingCd(false)
    reload()
  }
  const dl = data.countdown ? daysUntil(data.countdown.targetDate) : null
  const sm = data.selfSummary

  return (
    <div>
      <div className="card">
        <div className="tiny" style={{ opacity: 0.7 }}>当前考试：{type.label}（切换在顶部）</div>
        {!type.hasPlan && <div className="tiny" style={{ opacity: 0.8, marginTop: 4 }}>本类型暂未内置开箱即用课纲，用阶段目标 + 自测兜底。</div>}
      </div>

      {/* D-day 倒计时 */}
      <div className="card">
        <h2><span className="dot" /> {type.label}倒计时</h2>
        {data.countdown && !editingCd ? (
          <div className="dd-hero">
            <div className="dd-num">{dl}</div>
            <div className="dd-meta">
              <div>距 <b>{data.countdown.label}</b> 还有 {dl} 天 · 我们一起陪你</div>
              <button className="btn ghost" style={{ fontSize: 12, padding: '5px 12px', marginTop: 10 }} onClick={() => { setCdDate(data.countdown.targetDate); setCdLabel(data.countdown.label); setEditingCd(true) }}>修改日期</button>
            </div>
          </div>
        ) : (
          <div>
            {!data.countdown && <div className="note">设一个考试日期作为锚点，每天打开都知道还剩多少天。</div>}
            <div className="form-row" style={{ marginTop: 10 }}>
              <input className="input" type="date" value={cdDate} onChange={(e) => setCdDate(e.target.value)} />
              <input className="input" placeholder="考试名，如 考研初试" value={cdLabel} onChange={(e) => setCdLabel(e.target.value)} />
            </div>
            {err && <div className="err">{err}</div>}
            <div className="form-row" style={{ marginTop: 10 }}>
              <button className="btn block" onClick={saveCd}>保存</button>
              {editingCd && <button className="btn ghost" onClick={() => setEditingCd(false)}>取消</button>}
            </div>
          </div>
        )}
      </div>

      <TargetScoreCard examType={examType} />
      <SubjTargetsCard examType={examType} />

      {/* 408 加权折算 */}
      {type.hasWeighted && <WeightedEstimate summary={sm} />}

      {/* 阶段目标 */}
      <PlanGoalsCard
        goals={data.goals}
        onAdd={async (title, dueDate) => { await addGoal({ title, dueDate }); reload() }}
        onToggle={async (id) => { await toggleGoal(id); reload() }}
        onRemove={async (id) => { await removeGoal(id); reload() }}
        recGoals={type.recGoals}
        cd={data.countdown}
      />

      {/* 自测记录 */}
      <SelfTestRecorder type={type} sm={sm} reload={reload} />

      {/* 薄弱点 + 错题本 */}
      <WeaknessDigest tests={data.selfTests} />
      <WrongBook />

      <div className="tiny" style={{ textAlign: 'center', padding: '8px 0', opacity: 0.7 }}>
        真题随机考试、真题库在底部「自测」页。每做完一套，估分和薄弱点会自动更新。
      </div>
    </div>
  )
}