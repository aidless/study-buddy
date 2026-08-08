// KnowledgeRadar.jsx —— 知识雷达（按科目真题正确率）
export default function KnowledgeRadar({ data }) {
  const items = (data || []).filter((d) => d && d.label)
  if (items.length < 3) return null
  const n = items.length
  const cx = 92, cy = 86, R = 62
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]
  const grids = [1, 0.75, 0.5, 0.25].map((g) => items.map((_, i) => pt(i, R * g).join(',')).join(' '))
  const poly = items.map((d, i) => pt(i, R * (d.acc ?? 0)).join(',')).join(' ')
  const hasData = items.some((d) => d.acc != null)
  return (
    <div>
      <div className="tiny" style={{ marginBottom: 6 }}>按各科真题自测正确率绘制（模拟练习不计入）</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <svg viewBox="0 0 184 172" width="150" height="140" role="img" aria-label="知识掌握度雷达图">
          {grids.map((g, gi) => (
            <polygon key={gi} points={g} fill={gi === 0 ? 'var(--primary-soft)' : 'none'} stroke="var(--line)" strokeWidth="1" />
          ))}
          {hasData && <polygon points={poly} fill="rgba(47,158,110,0.18)" stroke="var(--primary)" strokeWidth="1.5" />}
          {items.map((d, i) => {
            const [x, y] = pt(i, R)
            return <circle key={i} cx={x} cy={y} r="2.5" fill={d.acc != null ? 'var(--primary)' : 'var(--line)'} />
          })}
        </svg>
        <div style={{ flex: 1 }}>
          {items.map((d) => (
            <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 64, fontSize: 12, color: d.acc == null ? 'var(--ink-soft)' : 'var(--ink)' }}>{d.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 5, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((d.acc ?? 0) * 100)}%`, height: '100%', background: d.acc != null && d.acc < 0.6 ? 'var(--tomato)' : 'var(--primary)' }} />
              </div>
              <span style={{ width: 36, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{d.acc == null ? '—' : `${Math.round(d.acc * 100)}%`}</span>
            </div>
          ))}
        </div>
      </div>
      {!hasData && <div className="tiny" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>还没用真题自测过——去「自测」做一套，雷达会亮起来。</div>}
    </div>
  )
}