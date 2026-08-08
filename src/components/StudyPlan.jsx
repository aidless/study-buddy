// StudyPlan.jsx —— 开箱即用完整计划（重建版：课纲总览）
import { CURRICULUM, WEIGHTS } from '../lib/curriculum'
import Icon from './Icon'

export default function StudyPlan({ onClose }) {
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 11408 完整总计划</h2>
        {Object.keys(CURRICULUM).map((sub) => (
          <div key={sub} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{sub}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(CURRICULUM[sub] || []).map((t) => (
                <span key={t} className="chip" style={{ fontSize: 11.5 }}>{t} · {WEIGHTS[`${sub}|${t}`] || 0}分</span>
              ))}
            </div>
          </div>
        ))}
        <button className="btn block" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}