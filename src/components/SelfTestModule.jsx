// SelfTestModule.jsx —— 自测模块（2026-08-08 按用户要求：真题库单独成模块）
// 从手机上直接刷真题：随机组卷（限时正式考试）→ 自动判分 + 解析 + 知识点反馈 → 写回自测，
// 未来计划 / 薄弱点 / 估分自动用上（进度页离岸线、备考页补漏计划）。
import { lazy, Suspense } from 'react'
import Icon from './Icon'
import PaperMode from './PaperMode'

const ExamQBank = lazy(() => import('./ExamQBank'))
const LazyFallback = () => <div className="tiny" style={{ padding: 16, opacity: 0.6, textAlign: 'center' }}>题库加载中…</div>

export default function SelfTestModule({ nonce, onLockChange }) {
  return (
    <div key={nonce}>
      <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent' }}>
        <h2><span className="dot" /> 真题自测</h2>
        <div className="tiny" style={{ lineHeight: 1.7 }}>
          在手机上直接做真题：<b>随机组卷</b>会从 2009–2026 全部真题里抽出一份正式考卷（限时 180 分钟），
          交卷自动判分、给出正确答案 + 详细解析 + 对应知识点，错题按科目拆出薄弱点。
          成绩会自动进入<b>估分 / 薄弱分析 / 未来计划</b>。
        </div>
      </div>

      <PaperMode onBack={() => {}} onLockChange={onLockChange} />

      <div className="section-h" style={{ marginTop: 4 }}>真题库</div>
      <Suspense fallback={<LazyFallback />}>
        <ExamQBank />
      </Suspense>

      <div className="tiny" style={{ textAlign: 'center', padding: '10px 0 4px', opacity: 0.7 }}>
        刷完记得去「备考」记自测，或直接在考卷里交卷——计划与薄弱点会自动更新。
      </div>
    </div>
  )
}
