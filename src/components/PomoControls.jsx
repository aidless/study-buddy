import Icon from './Icon'

export default function PomoControls({ running, mode, lock, onStart, onReset, onPause, onGiveUp }) {
  if (!running) {
    return (
      <div className="pomo-ctl">
        <button className="btn block" onClick={onStart}><Icon name="play" size={16} /> 开始专注</button>
      </div>
    )
  }
  return (
    <div className="pomo-ctl">
      <button className="btn ghost" onClick={onPause}><Icon name="pause" size={16} /> {mode === 'work' ? '暂停' : '结束休息'}</button>
      {mode === 'work' && <button className="btn ghost" onClick={onGiveUp}><Icon name="stop" size={16} /> 提前结束</button>}
      <button className="btn ghost" onClick={onReset}><Icon name="refresh" size={16} /> 重置</button>
    </div>
  )
}