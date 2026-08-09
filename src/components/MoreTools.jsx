import { useState } from 'react'
import Icon from './Icon'
import { markWantPraise } from '../lib/db'
import Backup from './Backup'

export default function MoreTools({ onSignOut }) {
  const [open, setOpen] = useState(false)
  const [praised, setPraised] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [notifOn, setNotifOn] = useState(() => {
    try { return localStorage.getItem('dx_remind') === '1' } catch { return false }
  })
  const toggleNotif = async () => {
    try {
      if (!('Notification' in window)) { alert('当前浏览器不支持系统通知'); return }
      if (!notifOn) {
        const p = await Notification.requestPermission()
        if (p === 'granted') { localStorage.setItem('dx_remind', '1'); setNotifOn(true) }
        else alert('未授权系统通知，无法开启提醒')
      } else {
        localStorage.setItem('dx_remind', '0'); setNotifOn(false)
      }
    } catch { alert('开启提醒失败') }
  }
  return (
    <div className="card" style={{ padding: '6px 14px' }}>
      <div className="more-bar" onClick={() => setOpen(!open)}>
        <span>更多工具</span>
        <Icon name="chevron" size={15} style={{ transform: open ? 'rotate(90deg)' : 'none' }} />
      </div>
      {open && (
        <div className="more-grid">
          <div className="more-item" onClick={() => { markWantPraise().catch(() => {}); setPraised(true); setTimeout(() => setPraised(false), 1600) }}>
            <Icon name="heart" size={20} /> {praised ? '已点亮' : '想被夸'}
          </div>
          <div className="more-item" onClick={toggleNotif}><Icon name="bell" size={20} /> {notifOn ? '提醒已开' : '开启提醒'}</div>
          <div className="more-item" onClick={() => setShowBackup(true)}><Icon name="doc" size={20} /> 数据备份</div>
          <div className="more-item" onClick={onSignOut}><Icon name="exit" size={20} /> 退出登录</div>
          <div className="more-item" onClick={() => window.location.reload()}><Icon name="refresh" size={20} /> 刷新</div>
        </div>
      )}
      {showBackup && <Backup onClose={() => setShowBackup(false)} />}
    </div>
  )
}