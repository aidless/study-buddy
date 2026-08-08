import { useState } from 'react'
import Icon from './Icon'
import { markWantPraise } from '../lib/db'

export default function MoreTools({ onSignOut }) {
  const [open, setOpen] = useState(false)
  const [praised, setPraised] = useState(false)
  return (
    <div className="card" style={{ padding: '6px 14px' }}>
      <div className="more-bar" onClick={() => setOpen(!open)}>
        <span>更多工具</span>
        <Icon name="chevron" size={15} style={{ transform: open ? 'rotate(90deg)' : 'none' }} />
      </div>
      {open && (
        <div className="more-grid">
          <div className="more-item" onClick={() => { markWantPraise(); setPraised(true); setTimeout(() => setPraised(false), 1600) }}>
            <Icon name="heart" size={20} /> {praised ? '已点亮' : '想被夸'}
          </div>
          <div className="more-item" onClick={onSignOut}><Icon name="exit" size={20} /> 退出登录</div>
          <div className="more-item" onClick={() => window.location.reload()}><Icon name="refresh" size={20} /> 刷新</div>
        </div>
      )}
    </div>
  )
}