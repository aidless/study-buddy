// WeaknessDigest.jsx —— 薄弱知识点摘要（重建版）
import { wrongBookStats } from '../lib/db'

export default function WeaknessDigest({ tests = [] }) {
  const wb = wrongBookStats(tests)
  const totalQ = wb.reduce((a, b) => a + b.totalQ, 0)
  const totalW = wb.reduce((a, b) => a + b.wrongQ, 0)
  if (totalQ === 0) return null
  return (
    <div className="card">
      <h2><span className="dot" /> 薄弱章节</h2>
      <div className="tiny" style={{ marginBottom: 8 }}>基于 {totalQ} 道标注知识点的真题自测，其中错 {totalW} 道。优先刷高错题章节。</div>
      {wb.slice(0, 5).map((s) => (
        <div className="subj-row" key={s.subject + s.topic} style={{ marginBottom: 6 }}>
          <div className="s-name" style={{ width: 'auto', flex: 1 }}>{s.subject}·{s.topic}</div>
          <div className="s-bar"><i style={{ width: `${Math.round((1 - s.acc) * 100)}%`, background: 'var(--tomato)' }} /></div>
          <div className="s-pct">{s.wrongQ}/{s.totalQ}</div>
        </div>
      ))}
    </div>
  )
}