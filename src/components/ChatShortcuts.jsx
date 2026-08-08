// ChatShortcuts.jsx —— 悄悄话快捷语
export default function ChatShortcuts({ onSend }) {
  const words = ['今天也辛苦啦', '慢慢来，我一直在', '累了就歇会儿', '离目标又近一点']
  return (
    <div className="chips" style={{ marginBottom: 8 }}>
      {words.map((w) => <button key={w} className="chip" onClick={() => onSend(w)}>{w}</button>)}
    </div>
  )
}