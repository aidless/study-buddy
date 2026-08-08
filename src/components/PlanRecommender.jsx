// PlanRecommender.jsx 鈥斺€?浠婃棩鎺ㄨ崘鍗＄墖锛?026-08-05 杩涘害 Tab 娣卞害鍒嗘瀽锛?// 鏁版嵁婧愰┍鍔細姣忔潯鎺ㄨ崘閮芥湁鐪熷疄鏁版嵁 + 鍏蜂綋鍔ㄤ綔锛屼笉鍫嗙爩"鍔犳补"绛夌┖璇?import Icon from './Icon'

export default function PlanRecommender({ recs }) {
  if (!recs || recs.length === 0) return null
  return (
    <div className="card" style={{ background: 'var(--tip-bg)', borderColor: 'var(--tip-line)' }}>
      <h2>
        <Icon name="bulb" size={18} /> 浠婃棩鎺ㄨ崘
        <span className="tiny" style={{ marginLeft: 8, color: 'var(--ink-soft)' }}>鍩轰簬鏈€杩戠殑瀛︿範鏁版嵁</span>
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
              <div className="tiny" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>鏉ユ簮锛歿r.source}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="tiny" style={{ marginTop: 10, color: 'var(--ink-soft)', opacity: 0.8 }}>
        鎺ㄨ崘鍙槸鍙傝€冣€斺€斾綘鑷繁鏈€浜嗚В鐘舵€侊紝鍚嚜宸辩殑銆?      </div>
    </div>
  )
}
// KnowledgeRadar.jsx 鈥斺€?鐭ヨ瘑闆疯揪鍥撅紙鑷祴姝ｇ‘鐜囧彲瑙嗗寲锛?// 2026-08-02 瀵规爣绮夌瑪"鐭ヨ瘑鐐规帉鎻″害"鐨勮交閲忓疄鐜帮細鍚勭姝ｇ‘鐜囩敾澶氳竟褰€?// 鏁版嵁鏉ヨ嚜 radarData(tests, examType) 鈫?[{ key, label, acc: 0-1|null }]
// acc 涓?null锛堣绉戣繕娌¤褰曪級鏃惰杞翠笉鐢绘暟鎹偣銆佹爣绛剧疆鐏般€?// 2026-08-02 宸ュ叿鍋氭繁锛氳杽寮辩锛?60%锛変粠璇剧翰 CURRICULUM 鎶介珮鍒嗙煡璇嗙偣缁欏涔犲缓璁€?import Icon from './Icon'
import { CURRICULUM, WEIGHTS } from '../lib/curriculum'

// 钖勫急绉?鈫?璇剧翰鐭ヨ瘑鐐瑰涔犲缓璁紙鎸?WEIGHTS 鍒嗗€奸檷搴忓彇 top 3锛?08 澶х被鏄犲皠鍥涢棬瀛愮鐩級
function reviewSuggestions(weakLabels) {
  const out = []
  for (const lb of weakLabels) {
    const keys = lb === '408锛堢粺鑰冿級' ? ['鏁版嵁缁撴瀯', '璁＄畻鏈虹粍鎴?, '鎿嶄綔绯荤粺', '璁＄畻鏈虹綉缁?] : [lb]
    for (const k of keys) {
      const list = CURRICULUM[k]
      if (!list) continue
      const sorted = [...list].sort((a, b) => (WEIGHTS[`${k}|${b}`] || 0) - (WEIGHTS[`${k}|${a}`] || 0))
      out.push({ subject: k, tops: sorted.slice(0, 3) })
    }
  }
  return out
}

export default function KnowledgeRadar({ data, nonce }) {
  const items = (data || []).filter((d) => d && d.label)
  if (items.length < 3) return null // 灏戜簬 3 绉戜笉鐢婚浄杈撅紙澶氳竟褰㈡棤鎰忎箟锛夛紝鏀规潯褰㈠厹搴?  const n = items.length
  const cx = 92, cy = 86, R = 62
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]
  const grids = [1, 0.75, 0.5, 0.25].map((g) =>
    items.map((_, i) => pt(i, R * g).join(',')).join(' ')
  )
  const poly = items.map((d, i) => pt(i, R * (d.acc ?? 0)).join(',')).join(' ')
  const hasData = items.some((d) => d.acc != null)
  const weak = items.filter((d) => d.acc != null && d.acc < 0.6)
  const tips = weak.length > 0 ? reviewSuggestions(weak.map((d) => d.label)) : []

  return (
    <div className="card">
      <h2><span className="dot" /> 鐭ヨ瘑鎺屾彙搴?/h2>
      <div className="tiny" style={{ marginBottom: 6 }}>
        鎸夊悇绉戠湡棰樿嚜娴嬫纭巼缁樺埗锛堟ā鎷熺粌涔犱笉璁″叆锛夆€斺€旇寰楄秺澶氳秺鍑嗭紙瀵规爣绮夌瑪"鏅鸿兘璇勪及"鐨勮交閲忕増锛夈€?      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <svg viewBox="0 0 184 172" width="150" height="140" role="img" aria-label="鐭ヨ瘑鎺屾彙搴﹂浄杈惧浘">
          <title>鐭ヨ瘑鎺屾彙搴﹂浄杈惧浘</title>
          {grids.map((g, gi) => (
            <polygon key={gi} points={g} fill={gi === 0 ? 'var(--primary-soft)' : 'none'} stroke="var(--line)" strokeWidth="1" />
          ))}
          {items.map((_, i) => {