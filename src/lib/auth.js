// 认证与会话：register / signIn / signOut / loadProfile / getPartner
import { supabase, USE_SUPABASE, uid, genCode, LS } from './_util.js'

export async function register({ email, password, name, role, coupleCode }) {
  if (USE_SUPABASE) {
    profileCache = null; profileCacheAt = 0
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) {
      throw new Error('账号已创建，但 Supabase 开着「邮箱确认」导致无法登录。请在后台关闭：Authentication → Providers → Email → 关掉 Confirm email，然后重试')
    }
    const userId = data.user?.id
    if (!userId) throw new Error('注册失败，请重试')
    let coupleId, code
    if (role === 'student') {
      coupleId = uid()
      code = genCode()
      await supabase.from('couples').insert({ id: coupleId, code })
      await supabase.from('profiles').insert({ id: userId, name, role, couple_id: coupleId, couple_code: code })
    } else {
      const { data: c, error: ce } = await supabase.rpc('lookup_couple_by_code', { p_code: (coupleCode || '').toUpperCase() })
      if (ce || !c || c.length === 0) throw new Error('邀请码无效，请向学员索要')
      coupleId = c[0].id
      code = c[0].code
      await supabase.from('profiles').insert({ id: userId, name, role, couple_id: coupleId, couple_code: code })
    }
    return await loadProfile()
  }
  // 本地模式
  let couple = LS.get('dx_couple', null)
  if (role === 'supervisor') {
    if (coupleCode && couple && couple.code.toUpperCase() === coupleCode.toUpperCase()) {
      // 加入已有
    } else if (coupleCode) {
      throw new Error('邀请码无效，请向学员索要')
    } else {
      couple = { id: uid(), code: genCode() }
      LS.set('dx_couple', couple)
    }
  } else if (!couple) {
    couple = { id: uid(), code: genCode() }
    LS.set('dx_couple', couple)
  }
  const user = { id: uid(), name, role, coupleId: couple.id, coupleCode: couple.code }
  LS.set('dx_user', user)
  return user
}

export async function signIn({ email, password }) {
  if (USE_SUPABASE) {
    profileCache = null; profileCacheAt = 0
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return await loadProfile()
  }
  const u = LS.get('dx_user', null)
  if (!u) throw new Error('本机还没有账号，请先注册')
  return u
}

export async function signOut() {
  profileCache = null; profileCacheAt = 0
  try {
    if (USE_SUPABASE) {
      await supabase.auth.signOut()
    } else {
      LS.set('dx_user', null)
    }
  } catch {
    // 网络异常也要确保本地会话清掉，避免卡在登录态
    LS.set('dx_user', null)
    try { supabase.auth.setSession({ access_token: '', refresh_token: '' }) } catch {}
  }
}


// 轻量缓存：并发查询各自调用 loadProfile 时会重复打 auth/user + profiles，
// 短 TTL 共享同一份身份数据，冷启动不再被冗余请求拖慢/挂起（2026-08-08）。
let profileCache = null
let profileCacheAt = 0
const PROFILE_TTL = 3000

export async function loadProfile() {
  if (typeof window !== 'undefined') {
    const g = new URLSearchParams(window.location.search).get('guest')
    if (g) {
      const role = g === 'supervisor' ? 'supervisor' : 'student'
      return { id: 'guest-' + role, name: role === 'supervisor' ? '体验督学' : '体验学员', role, coupleId: 'guest-couple', coupleCode: 'GUEST1', guest: true }
    }
  }
  if (USE_SUPABASE) {
    if (profileCache && Date.now() - profileCacheAt < PROFILE_TTL) return profileCache
    const { data } = await supabase.auth.getUser()
    const userId = data?.user?.id
    if (!userId) return null
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!p) return null
    profileCache = { id: p.id, name: p.name, role: p.role, coupleId: p.couple_id, coupleCode: p.couple_code, email: data.user.email }
    profileCacheAt = Date.now()
    return profileCache
  }
  return LS.get('dx_user', null)
}

export async function getPartner() {
  const me = await loadProfile()
  if (!me) return null
  if (USE_SUPABASE) {
    const { data } = await supabase.from('profiles').select('*').eq('couple_id', me.coupleId).neq('id', me.id).limit(1).maybeSingle()
    return data ? { id: data.id, name: data.name, role: data.role } : null
  }
  return { id: 'partner', name: me.role === 'student' ? '督学' : me.name, role: me.role === 'student' ? 'supervisor' : 'student' }
}