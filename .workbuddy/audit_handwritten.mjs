// audit_handwritten.mjs —— 手写题库复核产物生成器（2026-08-07）
// 范围：qbankPractice_ds/co/os/net.js 的 143 道手写模拟题（非生成器变式）。
// 产出：结构一致性检查 + 逐题复核工作簿（outputs/qbank-handwritten-review-*.md），供 SME 人工逐题核答案。
import { PRACTICE_DS } from '../src/lib/qbankPractice_ds.js'
import { PRACTICE_CO } from '../src/lib/qbankPractice_co.js'
import { PRACTICE_OS } from '../src/lib/qbankPractice_os.js'
import { PRACTICE_NET } from '../src/lib/qbankPractice_net.js'
import { mkdirSync, writeFileSync } from 'node:fs'

const ALL = [...PRACTICE_DS, ...PRACTICE_CO, ...PRACTICE_OS, ...PRACTICE_NET]
const OUT = 'C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/科研/outputs/qbank-handwritten-review-20260807.md'
const errs = []
const ids = new Set()

for (const q of ALL) {
  if (ids.has(q.id)) errs.push('重复 id: ' + q.id)
  ids.add(q.id)
  if (q.source !== 'practice') errs.push(q.id + ' 缺 source:practice')
  if (!q.stem || q.stem.length < 10) errs.push(q.id + ' 题干过短')
  if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(q.id + ' 选项数 != 4')
  if (new Set(q.options || []).size !== 4) errs.push(q.id + ' 选项重复')
  if (!/^[A-D]$/.test(String(q.answer || ''))) errs.push(q.id + ' 答案非 A-D: ' + q.answer)
  else if (q.options && q.options['ABCD'.indexOf(q.answer)] == null) errs.push(q.id + ' 答案指向空选项')
  if (!q.analysis || q.analysis.length < 10) errs.push(q.id + ' 解析过短')
  if (!Array.isArray(q.tags) || q.tags.length < 2) errs.push(q.id + ' tags 不足')
}

const bySub = {}
for (const q of ALL) {
  bySub[q.subject] = (bySub[q.subject] || 0) + 1
}

const md = []
md.push('# 手写模拟题复核工作簿（2026-08-07）')
md.push('')
md.push(`共 ${ALL.length} 道（${Object.entries(bySub).map(([k, v]) => `${k} ${v}`).join(' / ')}），来源：qbankPractice_ds/co/os/net.js。`)
md.push('')
md.push('## 结构一致性检查')
md.push('')
md.push(errs.length === 0 ? '✅ 0 项结构问题（id 唯一 / source / 选项 / 答案映射 / 解析 / tags）' : `❌ ${errs.length} 项：`)
errs.forEach((e) => md.push(`- ${e}`))
md.push('')
md.push('## 逐题清单（SME 逐题核对：题干→答案→解析是否一致、考点是否准确）')
md.push('')
for (const q of ALL) {
  md.push(`### ${q.id} · ${q.subject} · ${(q.tags || []).join(' / ')}`)
  md.push('')
  md.push(`题干：${q.stem}`)
  md.push('')
  md.push(q.options.map((o, i) => `${'ABCD'[i]}. ${o}`).join('　'))
  md.push('')
  md.push(`**答案：${q.answer}**`)
  md.push('')
  md.push(`解析：${q.analysis}`)
  md.push('')
}
md.push('---')
md.push('复核说明：结构层已自动校验；答案正确性需人工逐题确认（本工作簿即核对底稿）。')

mkdirSync('C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/科研/outputs', { recursive: true })
writeFileSync(OUT, md.join('\n'), 'utf-8')
console.log(`手写题 ${ALL.length} 道 · 结构问题 ${errs.length} 项 · 工作簿已生成`)
errs.slice(0, 10).forEach((e) => console.log('  !', e))
process.exit(errs.length ? 1 : 0)
