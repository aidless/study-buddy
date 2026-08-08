import { useState, useEffect } from 'react'
import Icon from './Icon'
import Chat from './Chat'
import ProgressStats from './ProgressStats'
import TutorAdvice from './TutorAdvice'
import { getPlan, getStats, getWords, setWord, sendEncouragement, loadProfile, getPartner, todayStr, getLiveStatus, getMoodLevel, sendRevive, sheWantsPraise, listFocusSession, listCheckin } from '../lib/db'
import WeeklyReport from './WeeklyReport'

const QUICK_WORDS = ['今天也辛苦啦', '慢慢来，我一直在', '累了就歇会儿', '离目标又近一点']

export default function SupervisorView({ user, nonce, onSignOut }) {
  const [tab, setTab] = useState('together')
  const [plan, setPlan] = useState(null)
  const [stat, setStat] = useState(null)
  const [live, setLive] = useState(null)
  const [code, setCode] = useState('')
  const [partnerName, setPartnerName] = useState('她')
  const [sheWord, setSheWord] = useState('')
  const [heWord, setHeWord] = useState('')
  const [showStats, setShowStats] = useState(true)
  const [sent, setSent] = useState(false)
  const [moodHint, setMoodHint] = useState('')

  const today = todayStr()

  useEffect(() => {
    getPlan().then(setPlan)
    getStats().then(setStat)
    loadProfile().then((p) => setCode(p?.coupleCode || ''))
  }, [nonce, today])

  useEffect(() => { getLiveStatus().then(setLive).catch(() => {}) }, [nonce])
  useEffect(() => { getMoodLevel(today).then((level) => {
    if (level === 'low') setMoodHint('她今天可能有点累，送句鼓励吧（只提示，不看她写了什么）')
    else if (level === 'mid') setMoodHint('她今天树洞里有些情绪，也有积极的话——她在自己调节')
    else setMoodHint('')
  }).catch(() => {}) }, [today, nonce])
  useEffect(() => { getPartner().then((p) => p && setPartnerName(p.name)) }, [])
  useEffect(() => { getWords(today).then((w) => { setSheWord(w.she || ''); setHeWord(w.he || '') }) }, [today, nonce])

  const onHeWord = (v) => { setHeWord(v); setWord(today, 'he', v) }
  const encourage = async (msg) => {
    const p = await getPartner()
    if (!p) return
    await sendEncouragement({ message: msg, toId: p.id })
    setSent(true)
    setTimeout(() => setSent(false), 1600)
  }

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>督学</h1>
          <div className="sub">远程陪伴 · {partnerName}</div>
        </div>
        <div className="row">
          <span className="badge sv" style={{ background: 'var(--sv-bg)', color: 'var(--sv-ink)' }}>督学</span>
          <button className="badge" style={{ background: 'var(--line)', color: 'var(--ink-soft)' }} onClick={onSignOut}>退出</button>
        </div>
      </div>

      {tab === 'together' && (
        <>
          {live && (
            <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent' }}>
              <h2><span className="dot" /> {partnerName}此刻</h2>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                {live.partner.running.length > 0 ? `正在专注 · 还剩 ${Math.max(1, Math.round(live.partner.running[0].leftSec / 60))} 分钟` : '此刻都在休息，不打扰'}
              </div>
              <div className="tiny">今天已专注 <b>{Math.round((live.partner.doneTodaySec || 0) / 60)} 分钟</b> · 你已专注 <b>{Math.round((live.my.doneTodaySec || 0) / 60)} 分钟</b></div>
            </div>
          )}
          {moodHint && (
            <div className="tiny" style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--bg-soft, #f0f3ef)', borderRadius: 10, marginBottom: 10 }}>
              {moodHint}
            </div>
          )}

          <div className="card">
            <h2><span className="dot" /> 今日一句话</h2>
            <div className="tiny" style={{ marginBottom: 8 }}>
              {sheWord ? `${partnerName}今天写了：` : `还没看到${partnerName}今天写的话，先写一句给她吧`}
            </div>
            {sheWord && <div className="word-echo">{sheWord.replace(/^[^:]*:/, '')}</div>}
            <textarea className="input area" placeholder="给她写句话——不催、不评，就陪着" value={heWord} onChange={(e) => onHeWord(e.target.value)} maxLength={60} style={{ marginTop: sheWord ? 10 : 0 }} />
            <div className="tiny" style={{ marginTop: 6 }}>{heWord.length}/60</div>
          </div>

          <div className="card">
            <h2><span className="dot" /> 送她一句</h2>
            <div className="chips">
              {QUICK_WORDS.map((q) => <button key={q} className="chip" onClick={() => encourage(q)}>{q}</button>)}
            </div>
            {sent && <div className="tiny" style={{ color: 'var(--primary)', marginTop: 8 }}>已送达，她打开就能看到</div>}
          </div>

          {/* 名师诊断（基于她愿意记录的数据） */}
          <TutorAdvice compact />

          {code && (
            <div className="tiny" style={{ textAlign: 'center', padding: '4px 0 8px' }}>
              你们的小组码：<b>{code}</b>（学员用此码邀请你）
            </div>
          )}
          <div className="tip">
            你看到她今天专注 <b>{stat ? Math.round((stat.week[stat.week.length - 1]?.focus || 0) / 60) : 0}</b> 分钟 · 连续 <b>{stat?.streak || 0}</b> 天打卡。
            数字是她**自己记录**的——只反映她**愿意告诉你**的部分。
          </div>

          {/* 学习进度放最下面 */}
          <ProgressStats stat={stat} plan={plan} showStats={showStats} onToggle={() => setShowStats((s) => !s)} />
        </>
      )}
      {tab === 'chat' && <Chat nonce={nonce} />}

      <div className="tabs">
        {[{ id: 'together', icon: 'heart', label: '陪你' }, { id: 'chat', icon: 'chat', label: '悄悄话' }].map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="ic"><Icon name={t.icon} size={20} /></span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}