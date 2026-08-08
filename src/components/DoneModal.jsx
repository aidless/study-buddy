import Icon from './Icon'

export default function DoneModal({ value, onChange, onSave, onSkip }) {
  return (
    <div className="code-mask">
      <div className="code-modal">
        <h2><span className="dot" /> 完成一轮</h2>
        <div style={{ fontSize: 14, marginBottom: 10 }}>这轮专注做完啦。写一句感受？（只给自己看）</div>
        <textarea className="input area" value={value} onChange={(e) => onChange(e.target.value)} maxLength={120} placeholder="这轮状态怎么样？" />
        <div className="form-row" style={{ marginTop: 12 }}>
          <button className="btn block" onClick={onSave}><Icon name="check" size={15} /> 保存</button>
          <button className="btn ghost" onClick={onSkip}>跳过</button>
        </div>
      </div>
    </div>
  )
}