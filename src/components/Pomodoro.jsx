import { useRef, useEffect } from 'react'
import PomoSettings from './PomoSettings'
import ExitGate from './ExitGate'
import StartSheet from './StartSheet'
import DoneModal from './DoneModal'
import OwnerHelpModal from './OwnerHelpModal'
import LockHints from './LockHints'
import PomoControls from './PomoControls'
import Breathing from './Breathing'
import { usePomodoro } from '../lib/usePomodoro'

export default function Pomodoro({ onChanged }) {
  const {
    workMin, breakMin, pomoMode, workSec, breakSec, mode, left, running,
    lock, lockMode, hardAvailable, noLimit, tick,
    showOwnerHelp, showStartSheet, showSettings, showDone, doneReflection, pendingExit, showExitGate, lockStatus, partnerFocus,
    setWorkMin, setBreakMin, setPomoMode, setShowSettings, setShowStartSheet,
    setShowOwnerHelp, setShowDone, setDoneReflection,
    reallyStart, doPause, reset, doGiveUp, requestExit, exitGateDone, saveReflection,
    hasNativeLock, openLockSettings
  } = usePomodoro(onChanged)

  const pomodoroStartRef = useRef(0)
  useEffect(() => {
    if (running && pomodoroStartRef.current === 0) pomodoroStartRef.current = Date.now()
    if (!running) pomodoroStartRef.current = 0
  }, [running])
  // eslint-disable-next-line no-unused-vars
  const _tick = tick
  const displaySec = noLimit && mode === 'work' && running && pomodoroStartRef.current
    ? Math.floor((Date.now() - pomodoroStartRef.current) / 1000)
    : left
  const mm = String(Math.floor(displaySec / 60)).padStart(2, '0')
  const ss = String(displaySec % 60).padStart(2, '0')
  const dialPct = noLimit && mode === 'work'
    ? Math.min(100, Math.round(((displaySec % (25 * 60)) / (25 * 60)) * 100))
    : Math.min(100, Math.round(((workSec - left) / workSec) * 100))

  return (
    <>
      <div className="card pomo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2><span className="dot" /> 专注番茄钟</h2>
          <button className="btn ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setShowSettings(true)}>时长</button>
        </div>
        <div className="mode">
          {mode === 'work' ? (noLimit ? '专注中 · 不计时（完成任务才结束）' : '专注中 · 保持专注') : '休息一下 · 喝口水'}
        </div>
        <div className="time-row" style={{ textAlign: 'center' }}>
          <div className="pomo-dial" style={{ background: `conic-gradient(var(--${mode === 'work' ? 'tomato' : 'primary'}) 0% ${dialPct}%, var(--line) ${dialPct}% 100%)` }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 700 }}>{mm}:{ss}</div>
          </div>
          {noLimit && mode === 'work' && <div className="tiny" style={{ opacity: 0.7 }}>不计时 · 转一圈 25 分钟</div>}
        </div>
        <LockHints lock={lock} running={running} mode={mode} lockMode={lockMode} lockStatus={lockStatus} hasNativeLock={hasNativeLock} onOpenSettings={openLockSettings} onUseHardLock={() => { setLockMode('soft'); reallyStart(false, false, noLimit) }} />
        {running && partnerFocus && <div className="together-badge">他也在专注 · 你们在一起学</div>}
        <PomoControls running={running} mode={mode} lock={lock} lockMode={lockMode} lockStatus={lockStatus} hasNativeLock={hasNativeLock} onStart={() => setShowStartSheet(true)} onReset={reset} onPause={doPause} onGiveUp={() => requestExit('giveUp')} />
      </div>

      <Breathing />

      {showStartSheet && (
        <StartSheet workMin={workMin} hasNativeLock={hasNativeLock} lockStatus={lockStatus} hardAvailable={hardAvailable} onStart={reallyStart} onClose={() => setShowStartSheet(false)} />
      )}
      {showDone && (
        <DoneModal workMin={workMin} breakMin={breakMin} value={doneReflection} onChange={setDoneReflection} onSave={saveReflection} onSkip={() => { setShowDone(false); setDoneReflection('') }} />
      )}
      {showSettings && (
        <PomoSettings workMin={workMin} breakMin={breakMin} mode={pomoMode} onModeChange={(m) => { setPomoMode(m); localStorage.setItem('dx_pomo_mode', m) }} onSave={(w, b) => { setWorkMin(w); setBreakMin(b); localStorage.setItem('dx_pomo_work', String(w)); localStorage.setItem('dx_pomo_break', String(b)); setShowSettings(false) }} onClose={() => setShowSettings(false)} />
      )}
      {showOwnerHelp && <OwnerHelpModal onClose={() => setShowOwnerHelp(false)} />}
      {showExitGate && <ExitGate onDone={exitGateDone} onForce={exitGateDone} strict={pomoMode === 'strict'} />}
      {!hasNativeLock && lock && running && mode === 'work' && lockMode !== 'hard' && (
        <div className="focus-lock-mask" onClick={() => document.body.classList.remove('focus-locked')}>
          <div className="focus-lock-content">
            <div className="focus-lock-icon">专注中</div>
            <div className="focus-lock-time">{mm}:{ss}</div>
            <div className="focus-lock-tip">你开了专注锁，回到督学 App 继续</div>
            <div className="focus-lock-sub">这是你自己选的——完成会很有成就感</div>
            <button className="btn" style={{ marginTop: 20 }} onClick={() => document.body.classList.remove('focus-locked')}>我回来了</button>
          </div>
        </div>
      )}
    </>
  )
}