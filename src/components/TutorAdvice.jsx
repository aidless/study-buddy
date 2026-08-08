// TutorAdvice.jsx —— 名师诊断卡（2026-08-08 重建）
// 数据全部来自云端/本地自测记录：getPlan（真题正确率）+ 错题档案 + 周报趋势。
import { useEffect, useState } from 'react'
import { getPlan, listSelfTests, listFocusSession, listCheckin } from '../lib/db'
import { wrongBookStats, weeklyCompare } from '../lib/planStats'
import { buildTutorAdvice } from '../lib/tutorAdvice'
import Icon from './Icon'

export default function TutorAdvice({ compact = false }) {
  const [adv, setAdv] = useState(null)
  useEffect(() => {
    let alive = true
    Promise.all([getPlan(), listSelfTests(), listFocusSession(), listCheckin()])
      .then(([plan, tests, focus, checkins]) => {
        if (!alive) return
        const weekly = weeklyCompare({ focus: focus || [], selftests: tests || [], checkins: checkins || [] })
        setAdv(buildTutorAdvice({ summary: plan?.selfSummary, wrongStats: wrongBookStats(tests || []), weekly, focusThisSec: weekly.focusThis }))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (!adv) return <div className="card"><div className="tiny" style={{ opacity: 0.6 }}>名师诊断加载中…</div></div>

  return (
    <div className="card" style={{ background: 'var(--gap-bg)', borderColor: 'transparent' }}>
      <h2>
        <Icon name="bulb" size={18} /> 名师诊断
        <span className="tiny" style={{ marginLeft: 6, color: 'var(--ink-soft)' }}>基于你记录的真实数据</span>
      </h2>
      <div style={{ fontSize: 13.5, lineHeight: 1.75 }}>
        {adv.tips.map((t, i) => <div key={i} style={{ marginBottom: 7 }}>{t.text}</div>)}
      </div>
      {adv.actions.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>下一步行动</div>
          {adv.actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{i + 1}.</span><span>{a}</span>
            </div>
          ))}
        </div>
      )}
      <div className="tiny" style={{ marginTop: 10, opacity: 0.65 }}>
        {compact ? '基于她愿意记录的数据生成，只反映她告诉你的部分。' : '这是数据分析，不是真人判卷——但你每做一套，它会越来越懂你。'}
      </div>
    </div>
  )
}