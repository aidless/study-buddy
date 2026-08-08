// WeeklyReport.jsx —— 陪伴周报弹窗（重建版）
export default function WeeklyReport({ report, onClose, partnerName }) {
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 本周小结 · {partnerName}</h2>
        {(report.lines || []).map((l, i) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.9 }}>{l}</div>)}
        <div className="tiny" style={{ marginTop: 10, opacity: 0.7 }}>只看趋势不评判——某天少了可能是状态问题，不是退步。</div>
        <button className="btn block" style={{ marginTop: 12 }} onClick={onClose}>收下</button>
      </div>
    </div>
  )
}
export function shouldShowWeeklyReport() { return false }