import { useState, useEffect } from 'react'
import Login from './components/Login'
import UpdateBanner from './components/UpdateBanner'
import StudentView from './components/StudentView'
import SupervisorView from './components/SupervisorView'
import { loadProfile, signOut, subscribe, USE_SUPABASE } from './lib/db'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    loadProfile().then((u) => setUser(u))
  }, [])

  useEffect(() => {
    if (!user || !USE_SUPABASE) return
    let pending = false
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

  if (user === undefined) return <div className="app"><div className="empty loading">加载中…</div></div>
  if (!user) return <Login onAuth={(u) => setUser(u)} />

  return (
    <>
      <UpdateBanner />
      {user.role === 'supervisor' ? (
        <SupervisorView user={user} nonce={nonce} onSignOut={handleSignOut} />
      ) : (
        <StudentView user={user} nonce={nonce} onSignOut={handleSignOut} />
      )}
    </>
  )
}