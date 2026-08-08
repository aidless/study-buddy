// ProgressStats.jsx —— 督学工作台：5 张只读数据卡（重建版）
import { fmtDur } from '../lib/db'

export default function ProgressStats({ stat, plan, showStats, onToggle }) {
  if (!stat) return null
  const sm = plan?.selfSummary
  return (
    <>
      <div className="section-h" style={{ marginTop: 18 }}>
        她的学习状态
        <button className="mini-toggle" style={{ marginLeft: 'auto' }} onClick={onToggle}>{showStats ? '收起' : '展开'}</button>
      </div>
      {showStats && (
        <div className="card">
          <div className="stat-grid">
            <div className="stat"><b>{stat.streak}</b><span>连续天数</span></div>
            <div className="stat"><b style={{ fontSize: 15 }}>{fmtDur(stat.week[stat.week.length - 1]?.focus || 0)}</b><span>今日专注</span></div>
            <div className="stat"><b style={{ fontSize: 15 }}>{fmtDur(stat.totalFocusSec)}</b><span>累计专注</span></div>
          </div>
          {sm && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ marginBottom: 4 }}>真题自测正确率（练习不计入）</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                {sm.overallRealAcc == null ? '—' : Math.round(sm.overallRealAcc * 100) + '%'}
              </div>
              <div className="tiny" style={{ marginTop: 4 }}>共 {sm.total} 次自测，其中 {sm.realCount} 次含真题</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}