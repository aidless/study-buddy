export default function OwnerHelpModal({ onClose }) {
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> 关于专注锁</h2>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          安卓安装包（APK）里，专注锁和考试模式会自动调用系统「屏幕固定」，锁住后按返回键也退不出去。
首次使用如果提示「系统未开启屏幕固定」，请到手机 设置 → 安全/隐私 → 屏幕固定（固定屏幕），开启后重新开始专注即可。退出固定：完成专注会自动解锁，或按系统提示操作（返回 + 最近任务）。
网页版只能使用「回到 App 才解锁」的软锁，无法钉住屏幕。
        </div>
        <button className="btn block" style={{ marginTop: 14 }} onClick={onClose}>知道了</button>
      </div>
    </div>
  )
}