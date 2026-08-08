// UpdateBanner.jsx —— 新版本提示（2026-08-08）
// 远程升级链路：重新部署 dist → 她下次打开时 SW 检测到新版本 → 顶部提示一键刷新。
import { useEffect, useState } from 'react'

export default function UpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing
          if (!nw) return
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              setShow(true)
            }
          })
        })
      })
      .catch(() => {})
  }, [])

  if (!show) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: 'var(--primary)', color: '#fff', padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <span>发现新版本，点一下立即更新</span>
      <button
        style={{ background: '#fff', color: 'var(--primary)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}
        onClick={async () => {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' })
          } else {
            window.location.reload()
          }
        }}
      >
        更新
      </button>
    </div>
  )
}