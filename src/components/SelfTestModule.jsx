// SelfTestModule.jsx —— 自测模块（2026-08-08 按用户要求：真题库单独成模块）
// 从手机上直接刷真题：随机组卷（限时正式考试）→ 自动判分 + 解析 + 知识点反馈 → 写回自测，
// 未来计划 / 薄弱点 / 估分自动用上（进度页离岸线、备考页补漏计划）。
import { useState, lazy, Suspense } from 'react'
import Icon from './Icon'
import PaperMode from './PaperMode'
import TutorAdvice from './TutorAdvice'
import SubjectSelfTest from './SubjectSelfTest'
import AiTutor from './AiTutor'
import { ENGLISH_WRITING } from '../lib/qbankEnglish.js'
import { MATH_PROBLEMS } from '../lib/qbankMath.js'

const ExamQBank = lazy(() => import('./ExamQBank'))
const LazyFallback = () => <div className="tiny" style={{ padding: 16, opacity: 0.6, textAlign: 'center' }}>题库加载中…</div>

export default function SelfTestModule({ nonce, onLockChange }) {
  const [mode, setMode] = useState('408') // 408 | 英语一 | 数学一

  return (
    <div key={nonce}>
      <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent' }}>
        <h2><span className="dot" /> 自测</h2>
        <div className="tiny" style={{ lineHeight: 1.7 }}>
          选择要自测的科目：<b>408</b> 随机组卷正式考试（限时 180 分钟自动判分）；<b>英语一</b> 作文专项 + 词汇/阅读/语法抽测；<b>数学一</b> 解答题专项 + 选择抽测。
          成绩都会进入估分 / 薄弱分析 / 未来计划。
        </div>
        <div className="chips" style={{ marginTop: 10 }}>
          {[['408', '408 统考'], ['英语一', '英语一'], ['数学一', '数学一']].map(([v, l]) => (
            <button key={v} className={`chip ${mode === v ? 'on' : ''}`} onClick={() => setMode(v)}>{l}</button>
          ))}
        </div>
      </div>

      <AiTutor />

      {mode === '408' && (
        <>
          <TutorAdvice />
          <PaperMode onBack={() => {}} onLockChange={onLockChange} />
          <div className="section-h" style={{ marginTop: 4 }}>真题库</div>
          <Suspense fallback={<LazyFallback />}>
            <ExamQBank />
          </Suspense>
        </>
      )}

      {mode === '英语一' && (
        <SubjectSelfTest
          subject="英语一"
          bank={ENGLISH_WRITING}
          intro={'重点练作文：小作文（书信/通知）和大作文（图画作文）。先自己写，再对照参考范文，按要点自评。词汇/阅读/语法用「随机抽测」混排。'}
        />
      )}

      {mode === '数学一' && (
        <SubjectSelfTest
          subject="数学一"
          bank={MATH_PROBLEMS}
          intro={'重点练解答题：高数计算 / 线代 / 概率，先独立做再对照详细解答自评。选择题用「随机抽测」。'}
        />
      )}

      <div className="tiny" style={{ textAlign: 'center', padding: '10px 0 4px', opacity: 0.7 }}>
        每次自测都会更新计划与薄弱点——政治自测后续再加。
      </div>
    </div>
  )
}
