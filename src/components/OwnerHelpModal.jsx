export default function OwnerHelpModal({ onClose }) {
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 关于专注锁</h2>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          网页版专注锁用"回到 App 才解锁"的软锁。要真正钉住屏幕（App 完全退不出去），需要在安卓设备上开启「屏幕固定」并把督学设为允许的应用——这类系统级设置无法在 App 内完成。
        </div>
        <button className="btn block" style={{ marginTop: 14 }} onClick={onClose}>知道了</button>
      </div>
    </div>
  )
}