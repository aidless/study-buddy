import { useState, useEffect, lazy, Suspense } from 'react'
import Tasks from './Tasks'
import Pomodoro from './Pomodoro'
import Progress from './Progress'
import Chat from './Chat'
import Plan from './Plan'
import DailyWord from './DailyWord'
import TodayWord from './TodayWord'
import MoreTools from './MoreTools'
import Mood from './Mood'
import MemoryEcho from './MemoryEcho'
const SelfTestModule = lazy(() => import('./SelfTestModule'))
import ExamSwitcher from './ExamSwitcher'
import Icon from './Icon'
import { getCountdown, setCountdown, getExamType, setExamType, daysUntil, todayStr, LS, listFocusSession, listCheckin, getCheckin } from '../lib/db'
import MilestoneCelebrate from './MilestoneCelebrate'
import { todayMilestone, markMilestoneSeen } from '../lib/milestonesPresenter.js'
import { computeStreakFromFocusCheckins, focusStreakFromFocus } from '../lib/milestones.js'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export default function StudentView({ user, nonce, onSignOut }) {
  const [tab, setTab] = useState('today')
  const [bump, setBump] = useState(0)
  const [cd, setCd] = useState(null)
  const [examType, setExamTypeState] = useState('kaoyan')
  const [historyWords, setHistoryWords] = useState([])
  const [echoData, setEchoData] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [examLock, setExamLock] = useState(false)
  const [activeMilestone, setActiveMilestone] = useState(null)

  const changed = () => setBump((b) => b + 1)
  const closeMilestone = () => { if (activeMilestone) markMilestoneSeen(activeMilestone); setActiveMilestone(null) }
  const n = `${nonce}:${bump}`
  const code = user?.coupleCode || ''

  useEffect(() => {
    // 倒计时：没有就预填 2027 考研初试（预计 2026-12-19，可改）
    getCountdown().then(async (c) => {
      if (!c) {
        const et = await getExamType()
        if (et === 'kaoyan') {
          try {
            await setCountdown({ targetDate: '2026-12-19', label: '考研初试' })
            c = { targetDate: '2026-12-19', label: '考研初试' }
          } catch {}
        }
      }
      setCd(c)
    })
    getExamType().then(setExamTypeState)
    const m = LS.get('dx_word', {}) || {}
    const all = []
    Object.keys(m).sort().reverse().forEach((d) => {
      const e = m[d] || {}
      if (e.she) all.push(e.she)
      if (e.he) all.push(e.he)
    })
    setHistoryWords(all)
    // 每日提醒：开了提醒且晚上还没打卡 → 弹系统通知（本地提醒，真推送需服务器）
    ;(async () => { try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && localStorage.getItem('dx_remind') === '1' && new Date().getHours() >= 20) {
        const ck = await getCheckin()
        if (!ck && localStorage.getItem('dx_remind_today') !== todayStr()) {
          localStorage.setItem('dx_remind_today', todayStr())
          new Notification('督学', { body: '今天还没打卡——花 5 秒点一下，连续天数就接上了', icon: './icon.svg' })
        }
      }
    } catch {} })()
    Promise.all([listFocusSession(), listCheckin()])
      .then(([focus, checkins]) => {
        setEchoData({ focus, checkins, words: m })
        if (!activeMilestone) {
          const combined = computeStreakFromFocusCheckins(focus, checkins)
          const fStreak = focusStreakFromFocus(focus)
          const r = todayMilestone({ streak: combined, focusStreak: fStreak })
          if (r.toShow) setActiveMilestone(r.toShow)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce])

  const pickExam = async (k) => {
    if (k === examType) return
    if (!window.confirm(`切换到「${k === 'kaoyan' ? '考研' : k}」会清空目标总分和单科目标（倒计时、阶段目标、自测保留）。继续？`)) return
    await setExamType(k)
    setExamTypeState(k)
    setBump((b) => b + 1)
  }

  const tabs = [
    { id: 'today', icon: 'today', label: '今日' },
    { id: 'focus', icon: 'focus', label: '专注' },
    { id: 'plan', icon: 'plan', label: '备考' },
    { id: 'selftest', icon: 'doc', label: '自测' },
    { id: 'progress', icon: 'progress', label: '进度' },
    { id: 'chat', icon: 'chat', label: '悄悄话' }
  ]
  const switchTab = (id) => {
    if (examLock && id !== 'selftest') {
      window.alert('考试进行中——先交卷才能离开')
      return
    }
    setTab(id)
  }

  const label = examType === 'kaoyan' ? '考研' : examType === 'zhuanshengben' ? '专升本' : examType === 'gaokao' ? '高考' : examType === 'gongkao' ? '考公考编' : examType

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>督学</h1>
          <div className="sub">{greeting()}，{user.name}</div>
        </div>
        <div className="row">
          {code && (
            <button className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }} onClick={() => setShowCode(true)}>邀请码</button>
          )}
          <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>{user.name?.slice(0, 2) || '你'}</span>
          <button className="badge" style={{ background: 'var(--line)', color: 'var(--ink-soft)' }} onClick={onSignOut}>退出</button>
        </div>
      </div>

      {cd && (
        <div className="dd-banner">
          <Icon name="calendar" size={18} />
          <span>距离 {cd.label} 还有 <b>{daysUntil(cd.targetDate)}</b> 天 · 我们一起陪你</span>
        </div>
      )}

      <ExamSwitcher current={examType} onPick={pickExam} busy={false} />

      <DailyWord dateStr={todayStr()} coupleId={user?.coupleId} historyWords={historyWords} />
      {echoData && <MemoryEcho focus={echoData.focus} checkins={echoData.checkins} words={echoData.words} today={todayStr()} />}

      {tab === 'today' && (
        <>
          <Tasks onChanged={changed} />
          <TodayWord />
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => setTreeOpen(true)}>
            <div className="row between" style={{ alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>树洞</div>
                <div className="tiny">想说就说，只有你能看到</div>
              </div>
              <Icon name="chevron" size={16} />
            </div>
          </div>
          <MoreTools onSignOut={onSignOut} />
        </>
      )}
      {tab === 'focus' && <Pomodoro onChanged={changed} />}
      {tab === 'plan' && <Plan nonce={n} />}
      {tab === 'selftest' && <Suspense fallback={<div className="card loading">题库加载中…</div>}><SelfTestModule nonce={n} onLockChange={setExamLock} /></Suspense>}
      {tab === 'progress' && <Progress nonce={n} onGoSelfTest={() => setTab('selftest')} />}
      {tab === 'chat' && <Chat nonce={n} />}

      {activeMilestone && (
        <MilestoneCelebrate milestone={activeMilestone} myRole="she" partnerRole="he" partnerName="他" onClose={closeMilestone} />
      )}
      {treeOpen && (
        <div className="code-mask" onClick={() => setTreeOpen(false)}>
          <div className="code-modal" onClick={(e) => e.stopPropagation()}>
            <Mood onClose={() => setTreeOpen(false)} />
          </div>
        </div>
      )}

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => switchTab(t.id)}>
            <span className="ic"><Icon name={t.icon} size={20} /></span>
            {t.label}
          </button>
        ))}
      </div>

      {showCode && (
        <div className="code-mask" onClick={() => { setShowCode(false); setCopied(false) }}>
          <div className="code-modal" onClick={(e) => e.stopPropagation()}>
            <h2><span className="dot" /> 邀请码</h2>
            <div className="tiny" style={{ marginBottom: 12 }}>把这 6 位码发给督学（你对象），他输入后就能和你连上。</div>
            <div className="code-display">{code}</div>
            <div className="form-row" style={{ marginTop: 14 }}>
              <button className="btn block" onClick={async () => {
                try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
              }}>{copied ? '已复制' : '复制邀请码'}</button>
              <button className="btn ghost" onClick={() => { setShowCode(false); setCopied(false) }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}