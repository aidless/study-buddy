// PlanRecommender.jsx —— 今日推荐卡片（基于真实数据，来源标注）
import Icon from './Icon'

export default function PlanRecommender({ recs }) {
  if (!recs || recs.length === 0) return null
  return (
    <div className="card" style={{ background: 'var(--tip-bg)', borderColor: 'var(--tip-line)' }}>
      <h2>
        <Icon name="bulb" size={18} /> 今日推荐
        <span className="tiny" style={{ marginLeft: 8, color: 'var(--ink-soft)' }}>基于最近的学习数据</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--card)', border: '1px solid var(--tip-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: 'var(--primary)'
            }}>
              <Icon name={r.icon} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)' }}>{r.text}</div>
              <div className="tiny" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>来源：{r.source}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="tiny" style={{ marginTop: 10, color: 'var(--ink-soft)', opacity: 0.8 }}>
        推荐只是参考——你自己最了解状态，听自己的。
      </div>
    </div>
  )
}