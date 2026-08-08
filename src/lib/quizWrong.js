// quizWrong.js 鈥斺€?娴嬭瘯閿欓鑷姩鏀堕泦锛?026-08-06 鏂板锛?// QuizTest 浜ゅ嵎鍚庤皟鐢細鎶婂仛閿欑殑棰樺啓鍏ラ敊棰樻。妗堬紙鏂囨湰閿欓锛宨mage 绌?+ 棰樺共/閫夐」/绛旀/瑙ｆ瀽锛夈€?// 鍒ゅ畾锛氳嚜鍔ㄥ垽锛堥€夋嫨/濉┖锛夌瓟閿?+ 鑷瘎锛堝ぇ棰?浠ｇ爜锛夋病鍋氬 鈫?杩涢敊棰樻湰锛涘悓 id 鍘婚噸銆?import { listWrongItems, putWrongItem } from './db.js'

export async function collectWrongToBook(qs, grades, subject, topic) {
  const wrongs = qs
    .map((q, i) => ({ q, g: grades[i] }))
    .filter(({ q, g }) => (g.auto && !g.correct) || (!g.auto && g.self === false))
  if (wrongs.length === 0) return 0
  const existing = await listWrongItems()
  const has = new Set(existing.map((x) => x.id))
  let added = 0
  for (const { q } of wrongs) {
    const qid = 'wq_' + (q.id || (q.year + '_' + q.no))
    if (has.has(qid)) continue
    await putWrongItem({
      id: qid,
      image: '',
      subject: q.subject || subject,
      topic: topic || (q.tags && q.tags[0]) || null,
      reason: 'know',
      note: `娴嬭瘯绛旈敊鑷姩鏀堕泦锛?{q.source === 'practice' ? '妯℃嫙缁冧範' : (q.year + ' 骞寸湡棰?)}锛塦,
      stemText: q.stem || '',
      options: q.options || [],
      answer: q.answer || '',
      analysis: q.analysis || '',
      at: new Date().toISOString(),
      mastered: false, redoCount: 0, lastRedoAt: null
    })
    has.add(qid)
    added++
  }
  return added
}
1:// wrongItemsCloud.js 错题上云 (2026-08-03 D-1 真接入)
101:// 取错题图片临时 URL：入参可以是 storage path（couple_id/item.jpg）或旧数据里的 public URL
134:  const { data, error } = await supabaseClient.from('wrong_items').upsert(row, { onConflict: 'id' }).select()
141:  const { data, error } = await supabaseClient.from('wrong_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
149:  const { error } = await supabaseClient.from('wrong_items').update({ mastered: !!val }).eq('id', id)
157:  const { data: cur, error: e1 } = await supabaseClient.from('wrong_items').select('redo_count').eq('id', id).single()
161:    const { error } = await supabaseClient.from('wrong_items').update({ mastered: true, mastered_at: now, last_redo_at: now }).eq('id', id)
165:    const { error } = await supabaseClient.from('wrong_items').update({ redo_count: (cur && cur.redo_count || 0) + 1, last_redo_at: now, mastered: false }).eq('id', id)
178:  const { error } = await supabaseClient.from('wrong_items').delete().eq('id', id)