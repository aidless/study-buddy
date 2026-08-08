export default function ChatMessage({ m }) {
  return (
    <div className={`msg ${m.mine ? 'mine' : 'them'}`}>
      <div className="tiny" style={{ opacity: 0.7, marginBottom: 2 }}>{m.mine ? '我' : m.fromName}</div>
      {m.text}
    </div>
  )
}