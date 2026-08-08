// wrongItemsCloud.js —— 错题档案上云（wrong_items 表，同组可读 / 本人可写）
import { supabase, USE_SUPABASE } from './_util.js'
import { loadProfile } from './auth.js'

// 把 'wq_xxx' 文本 id 稳定映射成 UUID（表主键是 uuid）
function stableUuid(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0 }
  const hex = h.toString(16).padStart(8, '0') + '00000000-0000-4000-8000-000000000000'
  return (hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20, 32))
}

export async function putWrongItemCloud(item) {
  const me = await loadProfile()
  const qid = item.id
  const uuid = stableUuid('wq_' + qid)
  const payload = {
    id: uuid, couple_id: me.coupleId, owner_id: me.id,
    subject: item.subject || '',
    topic: item.topic || null,
    question_text: JSON.stringify({ qid, stem: item.stemText || '', options: item.options || [], answer: item.answer || '', analysis: item.analysis || '', note: item.note || '', reason: item.reason || null }),
    image_url: item.image || null,
    source: 'auto',
    redo_count: item.redoCount || 0,
    last_redo_at: item.lastRedoAt || null,
    mastered: !!item.mastered,
    created_at: item.at || new Date().toISOString()
  }
  const { error } = await supabase.from('wrong_items').upsert(payload, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  return { ...item, id: qid }
}

export async function listWrongItemsCloud() {
  const me = await loadProfile()
  const { data } = await supabase.from('wrong_items').select('*').eq('couple_id', me.coupleId).order('created_at', { ascending: false })
  return (data || []).map((r) => {
    let q = {}
    try { q = JSON.parse(r.question_text || '{}') } catch {}
    return {
      id: q.qid || r.id,
      image: r.image_url,
      subject: r.subject,
      topic: r.topic,
      reason: q.reason || null,
      note: q.note || '',
      stemText: q.stem || '',
      options: q.options || [],
      answer: q.answer || '',
      analysis: q.analysis || '',
      at: r.created_at,
      mastered: r.mastered,
      redoCount: r.redo_count,
      lastRedoAt: r.last_redo_at
    }
  })
}

export async function removeWrongItemCloud(id) {
  await supabase.from('wrong_items').delete().eq('id', stableUuid('wq_' + id))
}
export async function setWrongMasteredCloud(id, val) {
  await supabase.from('wrong_items').update({ mastered: !!val, updated_at: new Date().toISOString() }).eq('id', stableUuid('wq_' + id))
}
export async function redoWrongItemCloud(id) {
  const { data: cur } = await supabase.from('wrong_items').select('redo_count').eq('id', stableUuid('wq_' + id)).single()
  const n = (cur && cur.redo_count || 0) + 1
  await supabase.from('wrong_items').update({ redo_count: n, last_redo_at: new Date().toISOString(), mastered: false, updated_at: new Date().toISOString() }).eq('id', stableUuid('wq_' + id))
}