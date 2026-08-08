// words.js —— 今日一句话（kind='word'，两端可见；树洞仅本机）
import { supabase, USE_SUPABASE, LS } from './_util.js'
import { loadProfile } from './auth.js'
import { todayStr } from './_util.js'

export async function getWords(date) {
  const me = await loadProfile()
  const d = date || todayStr()
  if (USE_SUPABASE) {
    const dayStart = new Date(d + 'T00:00:00').toISOString()
    const dayEnd = new Date(new Date(d + 'T00:00:00').getTime() + 86400000).toISOString()
    const { data } = await supabase.from('encouragements').select('*').eq('couple_id', me.coupleId).eq('kind', 'word').gte('at', dayStart).lt('at', dayEnd).limit(4)
    const out = { she: '', he: '' }
    for (const r of data || []) {
      const role = r.from_id === me.id ? (me.role === 'student' ? 'she' : 'he') : (me.role === 'student' ? 'he' : 'she')
      out[role] = r.message
    }
    return out
  }
  const m = LS.get('dx_word', {})
  return m[d] || {}
}
export async function setWord(date, role, text) {
  const me = await loadProfile()
  const d = date || todayStr()
  if (USE_SUPABASE) {
    // 存储：kind='word', message=正文, at=日期当天零点（用 date 参数拼 ISO）
    const dayIso = new Date(d + 'T00:00:00').toISOString()
    // 先删旧再插，保证一天一条（按 role 去重）
    const { data } = await supabase.from('encouragements').select('id,from_name').eq('couple_id', me.coupleId).eq('kind', 'word').gte('at', dayIso).lt('at', new Date(new Date(d + 'T00:00:00').getTime() + 86400000).toISOString())
    for (const r of data || []) {
      if (r.from_id === me.id) { const { error: de } = await supabase.from('encouragements').delete().eq('id', r.id); if (de) throw new Error(de.message) }
    }
    if (text && text.trim()) {
      const { error } = await supabase.from('encouragements').insert({
        couple_id: me.coupleId, from_id: me.id, from_name: me.name, to_id: me.id,
        message: text.trim(), at: dayIso, kind: 'word'
      })
      if (error) throw new Error('今日一句话保存失败：' + error.message)
    }
    return
  }
  const m = LS.get('dx_word', {})
  if (!m[d]) m[d] = {}
  m[d][role] = text
  LS.set('dx_word', m)
}