// PlanTopicDetail.jsx —— 知识点详情 + 测一测（重建版）
import { useState, lazy, Suspense } from 'react'
import { CURRICULUM, weightOf, tipOf } from '../lib/curriculum'

const QuizTest = lazy(() => import('./QuizTest'))

export default function PlanTopicDetail({ subject, topic, onClose }) {
  const [quiz, setQuiz] = useState(false)
  const tip = tipOf(subject, topic)
  return (
    <div className="code-mask" onClick={onClose}>
      <div className="code-modal" onClick={(e) => e.stopPropagation()}>
        <h2><span className="dot" /> {subject} · {topic}</h2>
        <div className="tiny" style={{ marginBottom: 8 }}>真题分值权重：{weightOf(subject, topic)} 分</div>
        <div className="tip-box" style={{ marginBottom: 12 }}>{tip.how}</div>
        <button className="btn block" onClick={() => setQuiz(true)}>测一测本章</button>
        <button className="btn ghost block" style={{ marginTop: 8 }} onClick={onClose}>关闭</button>
        {quiz && <Suspense fallback={null}><QuizTest subject={subject} topic={topic} onClose={() => setQuiz(false)} /></Suspense>}
      </div>
    </div>
  )
}