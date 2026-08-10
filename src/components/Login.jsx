import { useState } from 'react'
import { register, signIn, USE_SUPABASE, hasLocalData, migrateLocalToCloud, LS, sendPhoneCode, signInWithPhone } from '../lib/db'
import Icon from './Icon'

async function maybeMigrate(user) {
  if (!USE_SUPABASE || !user) return
  try {
    if (LS.get('dx_cloud_migrated_v1', false)) return
    const h = hasLocalData()
    if (!h || h.total === 0) return
    if (!window.confirm(`检测到本机还有 ${h.total} 条旧数据（任务/专注/打卡/自测/阶段目标/倒计时/今日一句话）。要搬到这个云端账号吗？`)) return
    const r = await migrateLocalToCloud(user)
    if (r.ok) {
      const parts = Object.entries(r.results).filter(([, v]) => v.inserted > 0).map(([k, v]) => `${k} ${v.inserted} 条`)
      window.alert(parts.length > 0 ? '迁移完成：' + parts.join('、') : '没有可迁移的数据')
    } else {
      window.alert('迁移失败：' + (r.reason || '未知错误'))
    }
  } catch (e) {
    window.alert('迁移失败：' + (e?.message || e))
  }
}

export default function Login({ onAuth }) {
  const [tab, setTab] = useState(USE_SUPABASE ? 'login' : 'register')
  const [authWay, setAuthWay] = useState('email') // email | phone
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setErr('')
    setBusy(true)
    try {
      let user
      if (authWay === 'phone') {
        if (!codeSent) throw new Error('请先获取验证码')
        user = await signInWithPhone(phone, phoneCode, { name: name || (role === 'student' ? '学员' : '督学'), role, coupleCode: code })
      } else if (tab === 'register') {
        user = await register({ email, password, name: name || (role === 'student' ? '学员' : '督学'), role, coupleCode: code })
      } else {
        user = await signIn({ email, password })
      }
      await maybeMigrate(user)
      onAuth(user)
    } catch (e) {
      setErr(e.message || '出错了，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="logo">
        <div className="mark"><Icon name="check" size={30} /></div>
        <h1>督学</h1>
        <div className="lead">考研长线陪伴 · 双向督学</div>
        <div className="slogan">粉笔教你学，督学陪你们学</div>
      </div>

      {!USE_SUPABASE && (
        <div className="note" style={{ marginBottom: 14 }}>
          当前为「本地模式」：数据仅存本机浏览器，适合先体验。配置 Supabase 后可双向云端同步。
        </div>
      )}

      {USE_SUPABASE && (
        <>
          <div className="seg" style={{ marginBottom: 8 }}>
            <button className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>登录</button>
            <button className={tab === 'register' ? 'on' : ''} onClick={() => setTab('register')}>注册</button>
          </div>
          <div className="seg" style={{ marginBottom: 14 }}>
            <button className={authWay === 'email' ? 'on' : ''} onClick={() => setAuthWay('email')}>邮箱</button>
            <button className={authWay === 'phone' ? 'on' : ''} onClick={() => setAuthWay('phone')}>手机号</button>
          </div>
        </>
      )}

      {USE_SUPABASE && authWay === 'phone' && (
        <div className="field">
          <label>手机号</label>
          <div className="row" style={{ gap: 8 }}>
            <input className="input" type="tel" placeholder="+86 13800000000" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ flex: 1 }} />
            <button className="btn ghost" style={{ flexShrink: 0 }} disabled={busy || codeSent} onClick={async () => {
              setErr('')
              if (!phone || phone.length < 7) { setErr('请输入正确的手机号（含国家码，如 +8613800000000）'); return }
              setBusy(true)
              try { await sendPhoneCode(phone); setCodeSent(true); setErr('验证码已发送，请查收') }
              catch (e) { setErr(e.message || '发送失败') }
              finally { setBusy(false) }
            }}>{codeSent ? '已发送' : '获取验证码'}</button>
          </div>
          {codeSent && (
            <input className="input" type="text" inputMode="numeric" placeholder="输入 6 位验证码" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} style={{ marginTop: 8 }} />
          )}
          {tab === 'register' && (
            <div className="tiny" style={{ marginTop: 6, opacity: 0.7 }}>手机号注册会自动建档；督学仍需填写下方邀请码</div>
          )}
        </div>
      )}

      {tab === 'register' && (
        <>
          <div className="field">
            <label>我是</label>
            <div className="seg">
              <button className={role === 'student' ? 'on' : ''} onClick={() => setRole('student')}>学员（她）</button>
              <button className={role === 'supervisor' ? 'on' : ''} onClick={() => setRole('supervisor')}>督学（你）</button>
            </div>
          </div>
          {role === 'supervisor' && (
            <div className="field">
              <label>学员邀请码</label>
              <input className="input" placeholder="向学员索要 6 位邀请码" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
            </div>
          )}
        </>
      )}

      <div className="field">
        <label>{USE_SUPABASE ? (tab === 'register' ? '昵称' : '邮箱') : '昵称'}</label>
        {USE_SUPABASE && tab === 'login' ? (
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        ) : (
          <input className="input" placeholder="起个名字" value={name} onChange={(e) => setName(e.target.value)} />
        )}
      </div>

      {USE_SUPABASE && (
        <div className="field">
          <label>{tab === 'register' ? '邮箱' : '密码'}</label>
          {tab === 'register' && (
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 8 }} />
          )}
          <input className="input" type="password" placeholder="至少 6 位" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      )}

      <div className="err">{err}</div>
      <button className="btn block" onClick={submit} disabled={busy}>
        {busy ? '处理中…' : tab === 'login' ? '进入' : '创建账号'}
      </button>
      {!USE_SUPABASE && (
        <div className="tiny" style={{ textAlign: 'center', marginTop: 12 }}>
          本地模式无需密码，直接创建即可体验
        </div>
      )}
    </div>
  )
}