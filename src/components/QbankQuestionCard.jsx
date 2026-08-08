// QbankQuestionCard.jsx —— 题库题目卡（供 ExamQBank 复用，重建版）
export default function QbankQuestionCard({ q }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="tiny" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>{q.no}. {q.subject} · {q.year}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>{q.stem}</div>
    </div>
  )
}