// EssayScorer.jsx —— 英语作文结构化评分卡（2026-08-08）
// 参照考研英语作文评分标准简化为 4 维：内容切题 / 结构衔接 / 语言语法 / 字数格式。
// 大作文满分 20（8/4/6/2），小作文满分 10（4/2/3/1）；每维 4 档（差/一般/较好/优秀）。
// 自评结果按「模拟练习」记入自测（不计入真题估分，练习不计入 408 雷达）。
import { useState } from 'react'
import { addSelfTest } from '../lib/db'
import Icon from './Icon'

const BIG = { content: 8, structure: 4, language: 6, format: 2, total: 20 }
const SMALL = { content: 4, structure: 2, language: 3, format: 1, total: 10 }
const LEVELS = [
  { label: '差', pct: 0.25, desc: '基本没做到' },
  { label: '一般', pct: 0.5, desc: '部分做到，有明显不足' },
  { label: '较好', pct: 0.75, desc: '基本做到，有小瑕疵' },
  { label: '优秀', pct: 1, desc: '做到且表现突出' }
]
const DIMS = [
  { key: 'content', label: '内容切题', hint: '是否覆盖题目要点、主题是否明确、有无离题或遗漏' },
  { key: 'structure', label: '结构衔接', hint: '段落层次是否清晰、过渡衔接是否自然、有无明显逻辑断层' },
  { key: 'language', label: '语言语法', hint: '语法是否正确、词汇是否多样准确、有无低级拼写错误' },
  { key: 'format', label: '字数格式', hint: '大作文是否 160-200 词、小作文是否约 100 词、书信格式是否正确' }
]

export default function EssayScorer({ q, onClose }) {
  const isSmall = (q.tags || []).includes('小作文')
  const MAX = isSmall ? SMALL : BIG
  const [picks, setPicks] = useState({})
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const allPicked = DIMS.every((d) => picks[d.key] != null)
  const score = DIMS.reduce((a, d) => a + Math.round(MAX[d.key] * (LEVELS[picks[d.key]] ? LEVELS[picks[d.key]].pct : 0)), 0)
  const pct = score / MAX.total
  const verdict = pct >= 0.8 ? '优秀 — 保持这个水平，注意保持卷面整洁' : pct >= 0.65 ? '良好 — 结构语言都不错，抓细节再提分' : pct >= 0.5 ? '中等 — 主攻最弱的一维，进步空间很大' : '需加强 — 先按范文结构重写一遍，再对照评分卡找差距'
  const weakest = DIMS.map((d) => ({ ...d, pct: picks[d.key] != null ? LEVELS[picks[d.key]].pct : 0 })).sort((a, b) => a.pct - b.pct)[0]

  const save = async () => {
    if (!allPicked) { setErr('请先完成 4 个维度的自评'); return }
    setErr('')
    try {
      await addSelfTest({
        subject: '英语一', kind: '作文自评', name: isSmall ? '小作文自评' : '大作文自评',
        total: MAX.total, correct: score, sec: null,
        topic: (q.tags || [])[1] || '英语作文', mode: 'essaySelf',
        practice: MAX.total, practiceCorrect: score
      })
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose && onClose() }, 1400)
    } catch (e) {
      setErr('保存失败：' + (e?.message || ''))
    }
  }

  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 作文评分卡 {isSmall ? '（小作文 · 满分 10）' : '（大作文 · 满分 20）'}</h2>
        <div className="quiz-ref" style={{ marginTop: 0, marginBottom: 10, maxHeight: 140, overflowY: 'auto' }}>
          {q.stem}
        </div>
        {DIMS.map((d) => (
          <div key={d.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{d.label} <span className="tiny" style={{ fontWeight: 400 }}>（{MAX[d.key]} 分）</span></div>
            <div className="tiny" style={{ marginBottom: 6, color: 'var(--ink-soft)' }}>{d.hint}</div>
            <div className="chips">
              {LEVELS.map((lv, i) => (
                <button key={lv.label} className={`chip ${picks[d.key] === i ? 'on' : ''}`} onClick={() => setPicks((p) => ({ ...p, [d.key]: i }))}>
                  {lv.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {allPicked && (
          <div className="est-hero" style={{ padding: 12 }}>
            <div className="est-num">{score}<span className="est-unit">/ {MAX.total}</span></div>
            <div className="tiny">{verdict}</div>
            {weakest && <div className="tiny" style={{ marginTop: 4, color: 'var(--tomato)' }}>最该补：{weakest.label}（{weakest.hint}）</div>}
          </div>
        )}
        {err && <div className="err">{err}</div>}
        <div className="form-row" style={{ marginTop: 10 }}>
          <button className="btn block" onClick={save}>{saved ? '已保存 ✓' : '保存评分'}</button>
          <button className="btn ghost" onClick={onClose}>取消</button>
        </div>
        <div className="tiny" style={{ marginTop: 8, opacity: 0.65 }}>
          评分标准参照考研英语大纲简化版，自评结果仅作训练参考，不计入真题估分。
        </div>
      </div>
    </div>
  )
}