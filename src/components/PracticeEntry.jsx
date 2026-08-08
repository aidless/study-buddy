// PracticeEntry.jsx —— 专项练习入口（英语一 / 数学一）
import { useState, lazy, Suspense } from 'react'
import Icon from './Icon'

const QuizTest = lazy(() => import('./QuizTest'))

export default function PracticeEntry() {
  const [open, setOpen] = useState(null)
  return (
    <>
      <button className="chip" onClick={() => setOpen('英语一')}><Icon name="doc" size={14} /> 英语一专项</button>
      <button className="chip" onClick={() => setOpen('数学一')}><Icon name="doc" size={14} /> 数学一专项</button>
      {open && (
        <Suspense fallback={null}>
          <QuizTest subject={open} topic={null} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </>
  )
}