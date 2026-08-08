// chat.js —— 悄悄话（kind='chat'）
import { supabase, USE_SUPABASE, LS, uid } from './_util.js'
import { loadProfile } from './auth.js'

export async function listMessages() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('encouragements').select('*').eq('couple_id', me.coupleId).eq('kind', 'chat').order('at', { ascending: true }).limit(200)
    return (data || []).map((r) => ({
      id: r.id, fromId: r.from_id, fromName: r.from_name, text: r.message, at: r.at, mine: r.from_id === me.id
    }))
  }
  return LS.get('dx_chat', []).filter((c) => c.coupleId === me.coupleId)
    .map((c) => ({ id: c.id, fromId: c.fromId, fromName: c.fromName, text: c.text, at: c.at, mine: c.fromId === me.id }))
    .sort((a, b) => (a.at || '').localeCompare(b.at || ''))
}
export async function sendMessage(text) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('encouragements').insert({
      couple_id: me.coupleId, from_id: me.id, from_name: me.name, to_id: me.id, message: text, kind: 'chat'
    })
    return
  }
  const all = LS.get('dx_chat', [])
  all.push({ id: uid(), coupleId: me.coupleId, fromId: me.id, fromName: me.name, text, at: new Date().toISOString() })
  LS.set('dx_chat', all)
}
export async function sendEncouragement({ message, toId }) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('encouragements').insert({
      couple_id: me.coupleId, from_id: me.id, from_name: me.name, to_id: toId || me.id, message, kind: 'cheer'
    })
    return
  }
  const all = LS.get('dx_cheers', [])
  all.push({ id: uid(), coupleId: me.coupleId, fromId: me.id, message, at: new Date().toISOString() })
  LS.set('dx_cheers', all)
}