import { useState } from 'react'
import { register, signIn, USE_SUPABASE, hasLocalData, migrateLocalToCloud, LS } from '../lib/db'
import Icon from './Icon'

// 鏈湴妯″紡鏃ф暟鎹?鈫?浜戠璐﹀彿 涓€閿縼绉伙紙鏄惧紡纭锛屽彧鎻愮ず涓€娆★級
async function maybeMigrate(user) {
  if (!USE_SUPABASE || !user) return
  try {
    if (LS.get('dx_cloud_migrated_v1', false)) return
    const h = hasLocalData()
    if (!h || h.total === 0) return
    if (!window.confirm(`妫€娴嬪埌鏈満杩樻湁 ${h.total} 鏉℃棫鏁版嵁锛堜换鍔?涓撴敞/鎵撳崱/鑷祴/闃舵鐩爣/鍊掕鏃?浠婃棩涓€鍙ヨ瘽锛夈€傝鎼埌杩欎釜浜戠璐﹀彿鍚楋紵`)) return
    const r = await migrateLocalToCloud(user)
    if (r.ok) {
      const parts = Object.entries(r.results)
        .filter(([, v]) => v.inserted > 0)
        .map(([k, v]) => `${k} ${v.inserted} 鏉)
      window.alert(parts.length > 0 ? '杩佺Щ瀹屾垚锛? + parts.join('銆?) : '娌℃湁鍙縼绉荤殑鏁版嵁锛堜簯绔凡鏈夊悓绫诲瀷鏁版嵁浼氳嚜鍔ㄨ烦杩囷紝閬垮厤閲嶅锛?)
    } else {
      window.alert('杩佺Щ澶辫触锛? + (r.reason || '鏈煡閿欒'))
    }
  } catch (e) {
    window.alert('杩佺Щ澶辫触锛? + (e?.message || e))
  }
}

export default function Login({ onAuth }) {
  const [tab, setTab] = useState(USE_SUPABASE ? 'login' : 'register')
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
      if (tab === 'register') {
        user = await register({
          email,
          password,
          name: name || (role === 'student' ? '瀛﹀憳' : '鐫ｅ'),
          role,
          coupleCode: code
        })
      } else {
        user = await signIn({ email, password })
      }
      await maybeMigrate(user)
      onAuth(user)
    } catch (e) {
      setErr(e.message || '鍑洪敊浜嗭紝璇烽噸璇?)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="logo">
        <div className="mark"><Icon name="check" size={30} /></div>
        <h1>鐫ｅ</h1>
        <div className="lead">鑰冪爺闀跨嚎闄即 路 鍙屽悜鐫ｅ</div>
        <div className="slogan">绮夌瑪鏁欎綘瀛︼紝鐫ｅ闄綘浠</div>
      </div>

      {!USE_SUPABASE && (
        <div className="note">
          褰撳墠涓恒€屾湰鍦版ā寮忋€嶏細鏁版嵁浠呭瓨鏈満娴忚鍣紝閫傚悎鍏堜綋楠屻€傞厤缃?Supabase 鍚庡彲鍙屽悜浜戠鍚屾锛堣瑙?README锛夈€?        </div>
      )}

      {USE_SUPABASE && (
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>
            鐧诲綍
          </button>
          <button className={tab === 'register' ? 'on' : ''} onClick={() => setTab('register')}>
            娉ㄥ唽
          </button>
        </div>
      )}

      {tab === 'register' && (
        <>
          <div className="field">
            <label>鎴戞槸</label>
            <div className="seg">
              <button className={role === 'student' ? 'on' : ''} onClick={() => setRole('student')}>
                瀛﹀憳锛堝ス锛?              </button>
              <button className={role === 'supervisor' ? 'on' : ''} onClick={() => setRole('supervisor')}>
                鐫ｅ锛堜綘锛?              </button>
            </div>
          </div>
          {role === 'supervisor' && (
            <div className="field">
              <label>瀛﹀憳閭€璇风爜</label>
              <input
                className="input"
                placeholder="鍚戝鍛樼储鍙?6 浣嶉個璇风爜"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
          )}
        </>
      )}

      <div className="field">
        <label>{USE_SUPABASE ? (tab === 'register' ? '鏄电О' : '閭') : '鏄电О'}</label>
        {USE_SUPABASE && tab === 'login' ? (
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        ) : (
          <input
            className="input"
            placeholder="璧蜂釜鍚嶅瓧"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </div>

      {USE_SUPABASE && (
        <div className="field">
          <label>{tab === 'register' ? '閭' : '瀵嗙爜'}</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={tab === 'login'}
            style={{ display: tab === 'login' ? 'none' : 'block' }}
          />
          <input
            className="input"
            type="password"
            placeholder="鑷冲皯 6 浣?
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      )}

      <div className="err">{err}</div>
      <button className="btn block" onClick={submit} disabled={busy}>
        {busy ? '澶勭悊涓€? : tab === 'login' ? '杩涘叆' : '鍒涘缓璐﹀彿'}
      </button>
      {!USE_SUPABASE && (
        <div className="tiny" style={{ textAlign: 'center', marginTop: 12 }}>
          鏈湴妯″紡鏃犻渶瀵嗙爜锛岀洿鎺ュ垱寤哄嵆鍙綋楠?        </div>
      )}
    </div>
  )
}