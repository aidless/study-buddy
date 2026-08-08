export default function LockHints({ lock, running, mode, lockStatus, hasNativeLock, onOpenSettings, onUseHardLock }) {
  if (!(lock && running && mode === 'work')) return null
  return (
    <div className="tiny" style={{ textAlign: 'center', marginTop: 10, color: 'var(--primary)' }}>
      专注锁已开启 · 提前退出要先完成任务
      {!hasNativeLock && <button className="mini-toggle" style={{ marginLeft: 8 }} onClick={onOpenSettings}>锁怎么开？</button>}
    </div>
  )
}