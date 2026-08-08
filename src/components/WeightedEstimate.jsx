// WeightedEstimate.jsx —— 408 加权折算（重建版）
import { CURRICULUM, subjectWeight, weightOf } from '../lib/curriculum'
import { tipOf } from '../lib/tips'
import Icon from './Icon'

const SUB408 = ['数据结构', '计算机组成', '操作系统', '计算机网络']

export default function WeightedEstimate({ summary }) {
  const rows = SUB408.map((s) => {
    const hit = (summary?.subjects || []).find((x) => x.subject === s)
    const acc = hit && hit.realAcc != null ? hit.realAcc : null
    return { subject: s, weight: subjectWeight(s), acc }
  })
  const covered = rows.filter((x) => x.acc != null)
  if (covered.length === 0) return null
  const coveredW = covered.reduce((a, x) => a + x.weight, 0)
  const estScore = Math.round(covered.reduce((a, x) => a + x.acc * x.weight, 0))
  const missing = rows.filter((x) => x.acc == null)
  const gaps = covered.map((x) => ({ ...x, lose: x.weight * (1 - x.acc) })).sort((a, b) => b.lose - a.lose).filter((x) => x.lose >= 0.5)
  const top = gaps[0]
  const topTopic = top ? [...(CURRICULUM[top.subject] || [])].sort((a, b) => (weightOf(top.subject, b) || 0) - (weightOf(top.subject, a) || 0))[0] : null
  const topTip = topTopic ? tipOf(top.subject, topTopic) : null

  return (
    <>
      <div className="section-h">408 加权折算</div>
      <div className="est-hero">
        <div className="est-num">{estScore}<span className="est-unit">/ {coveredW}</span></div>
        <div className="tiny">
          已用真题自测 {covered.length} 门、共 {coveredW} 分，按各章真题分值加权后估算拿 {estScore} 分
          {missing.length > 0 && `；还没测：${missing.map((m) => `${m.subject}（${m.weight}分）`).join('、')}`}
        </div>
      </div>
      {gaps.length > 0 && (
        <>
          <div className="muted" style={{ marginTop: 12, marginBottom: 4 }}>最该补的分（按能捞回多少分排）</div>
          {gaps.map((g) => (
            <div className="subj-row gap-row" key={g.subject} style={{ marginBottom: 6 }}>
              <div className="s-name">{g.subject}</div>
              <div className="s-bar"><i style={{ width: `${Math.round((1 - g.acc) * 100)}%`, background: 'var(--tomato)' }} /></div>
              <div className="s-pct">+{g.lose.toFixed(1)}</div>
            </div>
          ))}
        </>
      )}
      {topTip && (
        <div className="tip-box" style={{ marginTop: 10 }}>
          <div className="tip-row">
            <span className="tip-ic how"><Icon name="bulb" size={14} /></span>
            <div style={{ fontSize: 12.5 }}>
              <b>先补 {top.subject} 的话，从「{topTopic}」开始（约 {weightOf(top.subject, topTopic)} 分）</b>
              <div className="tiny" style={{ marginTop: 4 }}>{topTip.how}</div>
            </div>
          </div>
        </div>
      )}
      <div className="tiny" style={{ marginTop: 8 }}>只统计真题自测，模拟练习不计入；这是粗略折算，不等于真实考分。</div>
    </>
  )
}