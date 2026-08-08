// quizWrong.js —— 测试错题自动收集 → 错题档案（云端同步）
import { listWrongItems, putWrongItem } from './db.js'

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
      note: `测试答错自动收集：${q.source === 'practice' ? '模拟练习' : (q.year + ' 年真题')}`,
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