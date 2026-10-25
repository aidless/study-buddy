import { useState } from 'react'
import { setExamType, setTargetScore } from '../lib/db'
import { track } from '../lib/analytics'

const EXAMS = [
  { key: 'kaoyan', label: '考研' },
  { key: 'zhuanshengben', label: '专升本' },
  { key: 'gaokao', label: '高考' },
  { key: 'gongkao', label: '考公考编' },
]
const SCORES = [350, 380, 400]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [exam, setExam] = useState('kaoyan')
  const [score, setScore] = useState(350)
  const [busy, setBusy] = useState(false)

  const finish = async () => {
    setBusy(true)
    try {
      await setExamType(exam)
      if (exam === 'kaoyan') await setTargetScore(score)
      localStorage.setItem('dx_onboarded', '1')
      track('onboarding_complete', { exam, score })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  const skip = () => {
    localStorage.setItem('dx_onboarded', '1')
    track('onboarding_skip', { step })
    onDone()
  }

  return (
    <div className="code-mask">
      <div className="code-modal" role="dialog" aria-modal="true" aria-label="开始使用">
        <div className="onboard-dots" aria-hidden="true">
          {[0, 1, 2].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}
        </div>

        {step === 0 && (
          <>
            <h2><span className="dot" /> 你今年考什么？</h2>
            <div className="tiny" style={{ marginBottom: 12 }}>先选一个，之后可以在顶部随时切换。</div>
            <div className="chips" style={{ marginBottom: 16 }}>
              {EXAMS.map((e) => (
                <button key={e.key} className={`chip ${exam === e.key ? 'on' : ''}`} onClick={() => setExam(e.key)}>{e.label}</button>
              ))}
            </div>
            <button className="btn block" onClick={() => setStep(1)}>下一步</button>
          </>
        )}

        {step === 1 && (
          <>
            <h2><span className="dot" /> 目标总分大概多少？</h2>
            <div className="tiny" style={{ marginBottom: 12 }}>
              {exam === 'kaoyan' ? '先给一个大概目标，之后可以改。它会用来算“最亏分”的科目。' : '这个考试类型暂不需要总分目标，直接下一步即可。'}
            </div>
            {exam === 'kaoyan' && (
              <div className="chips" style={{ marginBottom: 16 }}>
                {SCORES.map((s) => (
                  <button key={s} className={`chip ${score === s ? 'on' : ''}`} onClick={() => setScore(s)}>{s} 分</button>
                ))}
              </div>
            )}
            <div className="form-row">
              <button className="btn block" onClick={() => setStep(2)}>下一步</button>
              <button className="btn ghost" onClick={() => setStep(0)}>返回</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2><span className="dot" /> 今天先做 3 件事</h2>
            <div className="note" style={{ marginBottom: 12 }}>
              打开就有按课纲排好的今日建议。完成一件勾一件；25 分钟番茄钟和晚上的打卡都在下面。
            </div>
            <ul className="ticks" style={{ marginBottom: 16 }}>
              <li>先看今日建议，挑一件开始</li>
              <li>专注 25 分钟，休息 5 分钟</li>
              <li>晚上打卡，想说话就写今日一句话</li>
            </ul>
            <div className="form-row">
              <button className="btn block" onClick={finish} disabled={busy}>{busy ? '准备中…' : '开始今天'}</button>
              <button className="btn ghost" onClick={() => setStep(1)}>返回</button>
            </div>
          </>
        )}

        <button className="btn ghost block" style={{ marginTop: 8 }} onClick={skip} disabled={busy}>先跳过</button>
      </div>
    </div>
  )
}
