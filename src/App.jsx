import { useState, useEffect } from 'react'
import Login from './components/Login'
import StudentView from './components/StudentView'
import SupervisorView from './components/SupervisorView'
import { loadProfile, signOut, subscribe, USE_SUPABASE } from './lib/db'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = 鍔犺浇涓?  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    loadProfile().then((u) => setUser(u))
  }, [])

  useEffect(() => {
    if (!user || !USE_SUPABASE) return
    // 鎬ц兘浼樺寲锛氳疆璇粠 15s 闄嶅埌 60s锛屼笖鍙湪椤甸潰鍙鏃惰窇锛?    // Realtime 浜嬩欢鐢?rAF 鍚堝苟锛堝悓涓€甯у娆′簨浠跺彧鍒锋柊涓€娆★級锛屽垏鍥炲墠鍙版椂绔嬪埢琛ヤ竴娆″埛鏂般€?    let pending = false
    const bump = () => {
      if (document.hidden || pending) return
      pending = true
      requestAnimationFrame(() => { pending = false; setNonce((n) => n + 1) })
    }
    const unsub = subscribe(user.coupleId, bump, 'app')
    const t = setInterval(bump, 60000)
    const onVisible = () => { if (!document.hidden) bump() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      unsub()
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  if (user === undefined) return <div className="app"><div className="empty loading">鍔犺浇涓€?/div></div>
  if (!user) return <Login onAuth={(u) => setUser(u)} />

  return user.role === 'supervisor' ? (
    <SupervisorView user={user} nonce={nonce} onSignOut={handleSignOut} />
  ) : (
    <StudentView user={user} nonce={nonce} onSignOut={handleSignOut} />
  )
}