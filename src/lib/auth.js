// 璁よ瘉涓庝細璇濓細register / signIn / signOut / loadProfile / getPartner
import { supabase, USE_SUPABASE, uid, genCode, LS } from './_util.js'

export async function register({ email, password, name, role, coupleCode }) {
  if (USE_SUPABASE) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    // Supabase 榛樿寮€鍚€岄偖绠辩‘璁ゃ€嶏細姝ゆ椂 data.session 涓?null锛岃处鍙峰浜庢湭婵€娲绘€侊紝
    // 鏃?session 鏃?auth.uid() 涓?null锛屽悗缁?profiles 鎻掑叆浼氳 RLS 鎷掔粷锛岀櫥褰曚篃浼氳鎷掋€?    // 鏃犳硶浠庝唬鐮佷晶缁曡繃锛屽彧鑳芥槑纭彁绀虹敤鎴峰幓鍚庡彴鍏抽棴銆?    if (!data.session) {
      throw new Error('璐﹀彿宸插垱寤猴紝浣?Supabase 寮€鐫€銆岄偖绠辩‘璁ゃ€嶅鑷存棤娉曠櫥褰曘€傝鍦ㄥ悗鍙板叧闂細Authentication 鈫?Providers 鈫?Email 鈫?鍏虫帀 Confirm email锛岀劧鍚庨噸璇?)
    }
    const userId = data.user?.id
    if (!userId) throw new Error('娉ㄥ唽澶辫触锛岃閲嶈瘯')
    let coupleId, code
    if (role === 'student') {
      coupleId = uid()
      code = genCode()
      await supabase.from('couples').insert({ id: coupleId, code })
      await supabase.from('profiles').insert({ id: userId, name, role, couple_id: coupleId, couple_code: code })
    } else {
      // 鏈敞鍐岀敤鎴峰皻鏃?profile锛宑ouples_select 绛栫暐锛坕d = my_couple_id()锛変細璁╁ス鐪嬩笉鍒颁换浣曞皬缁勶紝
      // 鐩存帴 .from('couples').select() 姘歌繙鏌ヤ笉鍒般€傛敼鐢?SECURITY DEFINER 鐨?RPC 缁曡繃 RLS 鍋氶個璇风爜鏌ユ壘銆?      const { data: c, error: ce } = await supabase.rpc('lookup_couple_by_code', {
        p_code: (coupleCode || '').toUpperCase()
      })
      if (ce || !c || c.length === 0) throw new Error('閭€璇风爜鏃犳晥锛岃鍚戝鍛樼储鍙?)
      coupleId = c[0].id
      code = c[0].code
      await supabase.from('profiles').insert({ id: userId, name, role, couple_id: coupleId, couple_code: code })
    }
    return await loadProfile()
  }
  // 鏈湴妯″紡
  let couple = LS.get('dx_couple', null)
  if (role === 'supervisor') {
    if (coupleCode && couple && couple.code.toUpperCase() === coupleCode.toUpperCase()) {
      // 鍔犲叆宸叉湁
    } else if (coupleCode) {
      // 閭€璇风爜缁欎簡涓€涓诧紝浣嗗拰鏈満宸插瓨鐨勫鍛樼爜瀵逛笉涓婏細鏄庣‘鎶ラ敊锛岀粷涓嶅伔鍋锋柊寤轰竴瀵?      throw new Error('閭€璇风爜鏃犳晥锛岃鍚戝鍛樼储鍙?)
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return await loadProfile()
  }
  // 鏈湴妯″紡锛氱洿鎺ヨ鍙栧凡瀛樺湪鐢ㄦ埛锛堟棤瀵嗙爜鏍￠獙锛屼粎涓哄崟鏈轰綋楠岋級
  const u = LS.get('dx_user', null)
  if (!u) throw new Error('鏈満杩樻病鏈夎处鍙凤紝璇峰厛娉ㄥ唽')
  return u
}

export async function signOut() {
  if (USE_SUPABASE) {
    await supabase.auth.signOut()
  } else {
    LS.set('dx_user', null)
  }
}

export async function loadProfile() {
  if (typeof window !== 'undefined') {
    const g = new URLSearchParams(window.location.search).get('guest')
    if (g) {
      const role = g === 'supervisor' ? 'supervisor' : 'student'
      return {
        id: 'guest-' + role,
        name: role === 'supervisor' ? '浣撻獙鐫ｅ' : '浣撻獙瀛﹀憳',
        role,
        coupleId: 'guest-couple',
        coupleCode: 'GUEST1',
        guest: true
      }
    }
  }
  if (USE_SUPABASE) {
    const { data } = await supabase.auth.getUser()
    const userId = data?.user?.id
    if (!userId) return null