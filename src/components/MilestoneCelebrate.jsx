import Icon from './Icon'

export default function MilestoneCelebrate({ milestone, onClose }) {
  if (!milestone) return null
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, color: 'var(--amber)', marginBottom: 8 }}><Icon name="trophy" size={42} /></div>
        <h2 style={{ justifyContent: 'center' }}>{milestone.title}</h2>
        <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{milestone.text}</div>
        <button className="btn block" onClick={onClose}>收下这份庆祝</button>
      </div>
    </div>
  )
}