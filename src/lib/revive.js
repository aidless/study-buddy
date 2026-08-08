// revive.js —— 复活卡：她断卡那天，他送一张"续命"（创新②）
import { supabase, USE_SUPABASE, LS } from './_util.js'
import { loadProfile } from './auth.js'

export async function sendRevive({ forDate }) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('encouragements').insert({
      couple_id: me.coupleId, from_id: me.id, from_name: me.name, to_id: me.id,
      message: 'revive:' + forDate, kind: 'revive'
    })
    return
  }
  const m = LS.get('dx_revives', {})
  m[forDate] = true
  LS.set('dx_revives', m)
}

export async function getReviveDates() {
  const me = await loadProfile()
  if (!me) return []
  if (USE_SUPABASE) {
    const { data } = await supabase.from('encouragements').select('from_id,message').eq('couple_id', me.coupleId).eq('kind', 'revive')
    return (data || []).map((r) => (r.message || '').replace('revive:', '')).filter(Boolean)
  }
  const m = LS.get('dx_revives', {})
  return Object.keys(m)
}