// Backup.jsx —— 数据备份（导出/导入 JSON）
import { LS } from '../lib/db'

export default function Backup({ onClose }) {
  const doExport = () => {
    const keys = ['dx_tasks', 'dx_focus', 'dx_checkins', 'dx_selftests', 'dx_goals', 'dx_countdown', 'dx_word', 'dx_treehole', 'dx_wrong_items', 'dx_chat']
    const out = {}
    for (const k of keys) out[k] = LS.get(k, null)
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'study-buddy-backup.json'
    a.click()
  }
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 数据备份</h2>
        <div className="tiny" style={{ marginBottom: 12 }}>云端模式下数据自动同步；本地模式建议定期导出备份。</div>
        <button className="btn block" onClick={doExport}>导出 JSON 备份</button>
        <button className="btn ghost block" style={{ marginTop: 8 }} onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}