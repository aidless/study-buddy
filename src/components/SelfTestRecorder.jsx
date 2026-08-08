import { useState } from 'react'
import { addSelfTest, removeSelfTest } from '../lib/db'
import Icon from './Icon'

const KINDS = ['章节练习', '套卷', '真题']

export default function SelfTestRecorder({ type, sm, reload }) {
  const [tSubject, setTSubject] = useState(type.subjects[0]?.label || '')
  const [tKind, setTKind] = useState(KINDS[0])
  const [tTotal, setTTotal] = useState('')
  const [tCorrect, setTCorrect] = useState('')
  const [tSec, setTSec] = useState('')
  const [topic, setTopic] = useState('')
  const [wrongReason, setWrongReason] = useState('')
  const [tPractice, setTPractice] = useState(false)
  const [err, setErr] = useState('')

  const addT = async () => {
    const total = parseInt(tTotal, 10)
    const correct = parseInt(tCorrect, 10)
    if (!total || total <= 0) { setErr('总题数须为正整数'); return }
    if (isNaN(correct) || correct < 0 || correct > total) { setErr('正确题数需在 0~总题数之间'); return }
    setErr('')
    await addSelfTest({
      subject: tSubject, kind: tKind, name: '', total, correct,
      sec: tSec ? parseInt(tSec, 10) : null, topic: topic.trim() || null,
      wrongReason: wrongReason || null, mode: 'manual',
      practice: tPractice ? total : 0, practiceCorrect: tPractice ? correct : 0
    })
    setTTotal(''); setTCorrect(''); setTSec(''); setTopic(''); setWrongReason('')
    reload()
  }

  const acc = (t) => Math.round((t.correct / Math.max(1, t.total)) * 100)

  return (
    <div className="card">
      <div className="section-h" style={{ marginTop: 0 }}>记一次自测</div>
      <div className="form-row" style={{ marginBottom: 8 }}>
        <select className="input" value={tSubject} onChange={(e) => setTSubject(e.target.value)}>
          {type.subjects.map((s) => <option key={s.key} value={s.label}>{s.label}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 130 }} value={tKind} onChange={(e) => setTKind(e.target.value)}>
          {KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>
      <div className="chips" style={{ marginBottom: 8 }}>
        {[['real', '真题'], ['practice', '模拟练习']].map(([v, l]) => (
          <button key={v} className={`chip ${tPractice === (v === 'practice') ? 'on' : ''}`} onClick={() => setTPractice(v === 'practice')}>{l}</button>
        ))}
      </div>
      {tPractice && <div className="tiny" style={{ marginBottom: 6, color: 'var(--amber)' }}>模拟练习仅作训练，不计入估分 / 雷达 / 薄弱分析。</div>}
      <div className="form-row" style={{ marginBottom: 8 }}>
        <input className="input" type="number" placeholder="总题数" value={tTotal} onChange={(e) => setTTotal(e.target.value)} />
        <input className="input" type="number" placeholder="做对" value={tCorrect} onChange={(e) => setTCorrect(e.target.value)} />
        <input className="input" type="number" style={{ maxWidth: 90 }} placeholder="用时秒" value={tSec} onChange={(e) => setTSec(e.target.value)} />
      </div>
      <input className="input" style={{ marginBottom: 8 }} placeholder="薄弱知识点（选填），如 数据结构·图" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <div className="chips" style={{ marginBottom: 8 }}>
        {[['', '不选错因'], ['know', '知识点不会'], ['careless', '粗心'], ['time', '时间不够']].map(([v, l]) => (
          <button key={v} className={`chip ${wrongReason === v ? 'on' : ''}`} onClick={() => setWrongReason(v)}>{l}</button>
        ))}
      </div>
      <button className="btn block" onClick={addT}>记录这次自测</button>
      {err && <div className="err">{err}</div>}

      {sm.recent.length > 0 && (
        <>
          <div className="section-h">最近记录</div>
          {sm.recent.map((t) => (
            <div className="test-item" key={t.id}>
              <span className="t-sub">{t.subject}</span>
              <span className="muted">{t.kind}{t.practice > 0 ? ' · 模拟练习' : ''}</span>
              <span className="t-acc">{acc(t)}%</span>
              <button className="g-del" onClick={async () => { await removeSelfTest(t.id); reload() }}><Icon name="close" size={14} /></button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}