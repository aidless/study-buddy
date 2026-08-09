// usePomodoro.js —— 番茄钟状态机：计时 / 锁 / 退出关卡 / 完成记录
import { useState, useEffect, useRef, useCallback } from 'react'
import { LS } from './_util.js'
import { hasNativeLockSupport, enableNativeLock, disableNativeLock } from './nativeLock.js'
import { addFocusSession, getPartnerLive } from './db.js'

const readNum = (k, d) => { const v = parseInt(LS.get(k, String(d)), 10); return Number.isFinite(v) && v > 0 ? v : d }

export function usePomodoro(onChanged) {
  const [workMin, setWorkMin] = useState(() => readNum('dx_pomo_work', 25))
  const [breakMin, setBreakMin] = useState(() => readNum('dx_pomo_break', 5))
  const [pomoMode, setPomoMode] = useState(() => LS.get('dx_pomo_mode', 'strict'))
  const [mode, setMode] = useState('work')        // work | break
  const [left, setLeft] = useState(() => readNum('dx_pomo_work', 25) * 60)
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const [noLimit, setNoLimit] = useState(false)
  const [lock, setLock] = useState(false)
  const [lockMode, setLockMode] = useState('soft')
  const [lockStatus, setLockStatus] = useState('')
  const [hardAvailable] = useState(() => hasNativeLockSupport())
  const [hasNativeLock] = useState(() => hasNativeLockSupport())
  const [partnerFocus, setPartnerFocus] = useState(false)
  const [showStartSheet, setShowStartSheet] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOwnerHelp, setShowOwnerHelp] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [doneReflection, setDoneReflection] = useState('')
  const [pendingExit, setPendingExit] = useState(null) // 'pause' | 'giveUp'
  const [showExitGate, setShowExitGate] = useState(false)

  const sessionRef = useRef(null)
  const workSec = workMin * 60
  const breakSec = breakMin * 60

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(id); complete(); return 0 }
        return l - 1
      })
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode])

  // 同伴也在专注？（真实数据：对方 running 中的 focus）
  useEffect(() => {
    if (!running) return
    let alive = true
    const check = () => getPartnerLive().then((p) => { if (alive) setPartnerFocus(!!p && p.running) }).catch(() => {})
    check()
    const t = setInterval(check, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [running])

  const persist = useCallback(async (sec, taskId, status) => {
    try { await addFocusSession({ durationSec: sec, taskId, status }) } catch {}
  }, [])

  const complete = async () => {
    const sec = workSec - Math.max(0, left - 1) > 0 ? Math.min(workSec, sessionRef.current?.elapsed || workSec) : workSec
    await persist(sec, null, 'done')
    await unlock()
    setRunning(false)
    setLock(false)
    setMode('break')
    setLeft(breakSec)
    setShowDone(true)
    onChanged && onChanged()
  }

  const reallyStart = async (useLock, isHard, unlimited) => {
    setLock(!!useLock)
    setLockMode(isHard ? 'hard' : 'soft')
    if (useLock && hasNativeLockSupport()) {
      const ok = await enableNativeLock()
      setLockStatus(ok ? '系统已锁定屏幕' : '系统未开启屏幕固定，已退回软锁：设置→安全→屏幕固定')
    } else {
      setLockStatus('')
    }
    setNoLimit(!!unlimited)
    setRunning(true)
    setMode('work')
    setLeft(unlimited ? workSec : workSec)
    sessionRef.current = { startedAt: Date.now(), elapsed: 0 }
    setShowStartSheet(false)
    setTick((t) => t + 1)
  }

  const reset = () => {
    unlock()
    setRunning(false); setLock(false); setMode('work'); setLeft(workSec); setPendingExit(null); setShowExitGate(false)
  }

  const doGiveUp = async () => {
    const sec = sessionRef.current ? Math.round((Date.now() - sessionRef.current.startedAt) / 1000) : 0
    if (sec > 0) await persist(Math.min(sec, workSec), null, 'done')
    reset()
    onChanged && onChanged()
  }

  const requestExit = (kind) => {
    if (!running) return
    if (lock) {
      setPendingExit(kind)
      setShowExitGate(true)
    } else if (kind === 'pause') {
      setRunning(false)
    } else {
      doGiveUp()
    }
  }

  const exitGateDone = async () => {
    setShowExitGate(false)
    const kind = pendingExit
    setPendingExit(null)
    if (kind === 'giveUp') { await doGiveUp() } else { await unlock(); setRunning(false); setLock(false) }
  }

  const saveReflection = async (text) => {
    await unlock()
    if (text && text.trim()) {
      try { await addFocusSession({ durationSec: 0, taskId: null, status: 'done', note: text.trim() }) } catch {}
    }
    setShowDone(false)
    setDoneReflection('')
    setMode('work'); setLeft(workSec)
  }


  const unlock = async () => {
    if (hasNativeLockSupport()) await disableNativeLock()
  }
  const openLockSettings = () => setShowOwnerHelp(true)

  return {
    workMin, breakMin, pomoMode, workSec, breakSec, mode, left, running,
    lock, lockMode, hardAvailable, noLimit, tick,
    showOwnerHelp, showStartSheet, showSettings, showDone, doneReflection, pendingExit, showExitGate, lockStatus, partnerFocus,
    setWorkMin, setBreakMin, setPomoMode, setShowSettings, setShowStartSheet,
    setShowOwnerHelp, setShowDone, setDoneReflection,
    reallyStart, doPause: () => requestExit('pause'), reset, doGiveUp, requestExit, exitGateDone, saveReflection,
    hasNativeLock, openLockSettings
  }
}