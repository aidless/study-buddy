// PaperMode.jsx —— 真题试卷模式（2026-08-08 重写）
// 按用户要求升级为"正式考试"：
//   - 随机组卷：从 2009-2026 全部真题随机抽 40 选择（保持 1-11 数据结构 / 12-22 计组 / 23-32 OS / 33-40 网络结构）+ 7 大题
//   - 限时 180 分钟，到点自动交卷；考试中全屏 + 禁止离开 App（onLockChange）
//   - 交卷自动判分（选择每题 2 分 / 大题自评每题 10 分，总分 150）
//   - 结果给出正确答案、详细解析、知识点 tags、按科目拆出的薄弱点
//   - 成绩按科目写回自测（只记真题），估分 / 未来计划 / 薄弱分析自动用上
import { useState, useMemo, useEffect } from 'react'
import Icon from './Icon'
import { SEED_QUESTIONS } from '../lib/qbankSeed.js'
import { ESSAY } from '../lib/qbankEssay.js'
import { addSelfTest } from '../lib/db'
import { Fig } from './qbankRichText'
import { enableNativeLock, disableNativeLock } from '../lib/nativeLock'

// 套卷选择题按题号归科（408 统考固定区间）
const PAPER_SUBJECT = (no) =>
  no <= 11 ? '数据结构' : no <= 22 ? '计算机组成' : no <= 32 ? '操作系统' : '计算机网络'
const SUBJECT_NAMES = ['数据结构', '计算机组成', '操作系统', '计算机网络']
const SUBJECT_SLOTS = [11, 11, 10, 8]   // 随机卷保持真实结构
const EXAM_MIN = 180                     // 408 统考 3 小时
const CHOICE_PTS = 2
const ESSAY_PTS = 10

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomChoices() {
  const bySub = {}
  for (const q of SEED_QUESTIONS) {
    if (q.type !== 'choice') continue
    const s = PAPER_SUBJECT(q.no)
    if (!bySub[s]) bySub[s] = []
    bySub[s].push(q)
  }
  const out = []
  SUBJECT_NAMES.forEach((s, i) => {
    const pool = shuffle(bySub[s] || [])
    for (let k = 0; k < Math.min(SUBJECT_SLOTS[i], pool.length); k++) out.push(pool[k])
  })
  return out
}

const fmtT = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export default function PaperMode({ onBack, onLockChange }) {
  // mode: 'setup' 配置 | 'exam' 考试中 | 'result' 结果
  const [mode, setMode] = useState('setup')
  const [source, setSource] = useState('random') // 'random' 随机组卷 | 'year' 按年份
  const [year, setYear] = useState('')
  const [items, setItems] = useState([])         // 试卷条目（选择题 + 大题）
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})     // q.id -> 'A'..'D'
  const [essayMarks, setEssayMarks] = useState({}) // e.id -> 'right' | 'wrong'
  const [left, setLeft] = useState(EXAM_MIN * 60)
  const [result, setResult] = useState(null)
  const [savedMsg, setSavedMsg] = useState('')
  const [err, setErr] = useState('')

  const papers = useMemo(() => {
    const byYear = {}
    for (const q of SEED_QUESTIONS) {
      if (!byYear[q.year]) byYear[q.year] = []
      byYear[q.year].push(q)
    }
    return Object.keys(byYear).sort((a, b) => b - a)
  }, [])

  // 计时：考试中每秒递减，到点自动交卷
  useEffect(() => {
    if (mode !== 'exam') return
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(id); submit(true); return 0 }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const buildItems = (src) => {
    let choices, essays
    if (src === 'year') {
      const y = Number(year)
      choices = SEED_QUESTIONS.filter((q) => q.year === y && q.type === 'choice').sort((a, b) => a.no - b.no)
      essays = ESSAY.filter((e) => e.year === y).sort((a, b) => a.no - b.no)
    } else {
      choices = randomChoices()
      essays = shuffle(ESSAY).slice(0, 7)
    }
    return [...choices.map((q) => ({ ...q, kind: 'choice' })), ...essays.map((e) => ({ ...e, kind: 'essay' }))]
  }

  const start = (src) => {
    if (src === 'year' && !year) { setErr('先选年份'); return }
    setErr('')
    const list = buildItems(src)
    setItems(list)
    setAnswers({}); setEssayMarks({}); setIdx(0); setLeft(EXAM_MIN * 60); setResult(null); setSavedMsg('')
    setMode('exam')
    onLockChange && onLockChange(true)
    enableNativeLock() // 考试模式：原生屏幕固定（安卓 APK 生效）
    // 考试模式锁 App：全屏沉浸（PWA/浏览器），原生壳走系统钉屏
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  const finish = (auto) => {
    setMode('result')
    onLockChange && onLockChange(false)
    disableNativeLock() // 交卷/超时结束考试后解除屏幕固定
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
    return auto
  }

  const submit = async (byTimeout = false) => {
    // 判分：选择题自动（每题 2 分，未答算错）；大题自评（每题 10 分，未评不算）
    const choices = items.filter((x) => x.kind === 'choice')
    const essays = items.filter((x) => x.kind === 'essay')
    const bySub = {}
    const wrongList = []
    let choiceCorrect = 0
    for (const q of choices) {
      const u = answers[q.id]
      const ok = !!u && u === q.answer
      if (ok) choiceCorrect++
      const s = PAPER_SUBJECT(q.no)
      if (!bySub[s]) bySub[s] = { total: 0, correct: 0 }
      bySub[s].total++
      if (ok) bySub[s].correct++
      if (u && u !== q.answer) wrongList.push({ q, u })
    }
    let essayRight = 0
    const essayWrong = []
    for (const e of essays) {
      const m = essayMarks[e.id]
      if (!m) continue
      const s = e.subject || '计算机组成'
      if (!bySub[s]) bySub[s] = { total: 0, correct: 0 }
      bySub[s].total++
      if (m === 'right') { bySub[s].correct++; essayRight++ } else essayWrong.push(e)
    }
    const score = choiceCorrect * CHOICE_PTS + essayRight * ESSAY_PTS
    setResult({
      byTimeout,
      score,
      total: choices.length * CHOICE_PTS + essays.length * ESSAY_PTS,
      choiceCorrect, choiceTotal: choices.length,
      essayRight, essayTotal: essays.length,
      wrongList, essayWrong, bySub
    })
    finish(byTimeout)

    // 写回自测（按科目拆分，只记真题；大题仅记自评过的）
    try {
      const rows = Object.entries(bySub).map(([s, v]) => ({ s, v }))
      for (const { s, v } of rows) {
        if (v.total === 0) continue
        await addSelfTest({
          subject: s, kind: '套卷',
          name: source === 'random' ? '随机真题卷' : `[${year} 真题卷]`,
          total: v.total, correct: v.correct, sec: (EXAM_MIN * 60 - left) || null,
          topic: null, mode: 'paper'
        })
      }
      setSavedMsg(`已记入自测（${rows.length} 科）`)
    } catch { /* 本地优先，失败不影响评分展示 */ }
  }

  const answeredCount = items.filter((x) => x.kind === 'choice' ? answers[x.id] : essayMarks[x.id]).length
  const cur = items[idx]

  return (
    <div>
      {/* ============ 配置页 ============ */}
      {mode === 'setup' && (
        <div className="card">
          <h2><span className="dot" /> 正式考试</h2>
          <div className="chips" style={{ marginBottom: 10 }}>
            <button className={`chip ${source === 'random' ? 'on' : ''}`} onClick={() => { setSource('random'); setErr('') }}>随机组卷</button>
            <button className={`chip ${source === 'year' ? 'on' : ''}`} onClick={() => { setSource('year'); setErr('') }}>按年份</button>
          </div>
          {source === 'year' && (
            <select value={year} onChange={(e) => setYear(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', fontSize: 14, marginBottom: 10 }}>
              <option value="">选择年份（共 {papers.length} 套）</option>
              {papers.map((y) => <option key={y} value={y}>{y} 年真题卷</option>)}
            </select>
          )}
          <div className="tiny" style={{ lineHeight: 1.7, marginBottom: 12 }}>
            随机组卷：从全部真题抽 40 道选择（数据结构 11 / 计组 11 / OS 10 / 计网 8）+ 7 道大题，
            限时 {EXAM_MIN} 分钟，到点自动交卷。考试中不能离开本页，交卷自动判分并给出解析与薄弱点。
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn block" onClick={() => start(source)}>
            {source === 'random' ? '开始随机考试' : '开始该年考试'}
          </button>
        </div>
      )}

      {/* ============ 考试中（全屏） ============ */}
      {mode === 'exam' && cur && (
        <div className="quiz-overlay exam-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="quiz-sheet exam-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-head">
              <div>
                <div className="quiz-title">{source === 'random' ? '随机真题卷' : `${year} 年真题卷`}</div>
                <div className="quiz-sub">
                  第 {idx + 1}/{items.length} 题 · 已答 {answeredCount}/{items.length}
                  {cur.kind === 'essay' && ' · 大题（自评）'}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="pomo-dial" style={{ width: 'auto', padding: '5px 10px', fontSize: 13, color: left < 600 ? 'var(--danger)' : 'var(--ink)' }}>
                  ⏱ {fmtT(left)}
                </span>
                <button className="quiz-close" style={{ position: 'static' }} onClick={() => submit(false)} aria-label="交卷">交卷</button>
              </div>
            </div>

            <div className="quiz-body">
              {cur.kind === 'choice' ? (
                <div>
                  <div className="quiz-q-type">
                    {cur.no}. {PAPER_SUBJECT(cur.no)} · {cur.year} 真题
                  </div>
                  <div className="quiz-stem">{cur.stem}</div>
                  {cur.options && cur.options[0] && cur.options[0].startsWith('（图') && <Fig id={cur.id} style={{ marginTop: 8 }} />}
                  <div className="quiz-options">
                    {cur.options.map((o, i) => {
                      const L = String.fromCharCode(65 + i)
                      const sel = answers[cur.id] === L
                      return (
                        <button key={i} className={`quiz-opt ${sel ? 'on' : ''}`} onClick={() => setAnswers((a) => ({ ...a, [cur.id]: L }))}>
                          <span className="quiz-opt-l">{L}.</span> {o}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="quiz-q-type">大题 · {cur.subject} · {cur.year} 真题</div>
                  <div className="quiz-stem">{cur.stem}</div>
                  {cur.options && cur.options[0] && cur.options[0].startsWith('（图') && <Fig id={cur.id} style={{ marginTop: 8 }} />}
                  {(cur.parts || []).map((p, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div className="tiny" style={{ fontWeight: 600 }}>{p.prompt}</div>
                      <div className="quiz-ref" style={{ maxHeight: 180, overflowY: 'auto', marginTop: 4 }}>{p.answer || '暂无参考答案'}</div>
                    </div>
                  ))}
                  <div className="quiz-self" style={{ marginTop: 10 }}>
                    <div className="quiz-self-q">对照答案，这题我：</div>
                    <button className={`chip ${essayMarks[cur.id] === 'right' ? 'on' : ''}`} style={{ borderColor: essayMarks[cur.id] === 'right' ? 'var(--primary)' : undefined }}
                      onClick={() => setEssayMarks((m) => ({ ...m, [cur.id]: 'right' }))}>做对了</button>
                    <button className={`chip ${essayMarks[cur.id] === 'wrong' ? 'on' : ''}`} style={{ borderColor: essayMarks[cur.id] === 'wrong' ? 'var(--tomato)' : undefined }}
                      onClick={() => setEssayMarks((m) => ({ ...m, [cur.id]: 'wrong' }))}>没做对</button>
                  </div>
                </div>
              )}

              <div className="quiz-nav">
                <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>上一题</button>
                {idx < items.length - 1 ? (
                  <button className="btn" onClick={() => setIdx(idx + 1)}>下一题</button>
                ) : (
                  <button className="btn" onClick={() => submit(false)}>交卷</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ 结果页 ============ */}
      {mode === 'result' && result && (
        <div className="card">
          <h2><span className="dot" /> 考试结果</h2>
          {result.byTimeout && <div className="note" style={{ color: 'var(--tomato)', marginBottom: 10 }}>时间到，已自动交卷。</div>}
          <div className="est-hero">
            <div className="est-num">{result.score}<span className="est-unit">/ {result.total}</span></div>
            <div className="tiny">
              选择题 {result.choiceCorrect}/{result.choiceTotal}（每题 {CHOICE_PTS} 分）· 大题自评 {result.essayRight}/{result.essayTotal}（每题 {ESSAY_PTS} 分）
            </div>
          </div>

          {/* 薄弱点：按科目正确率排序 */}
          <div className="muted" style={{ marginTop: 12, marginBottom: 4 }}>各科表现（薄弱点靠前）</div>
          {Object.entries(result.bySub)
            .map(([s, v]) => ({ s, ...v, acc: v.total ? v.correct / v.total : 0 }))
            .sort((a, b) => a.acc - b.acc)
            .map((r) => (
              <div className="subj-row" key={r.s} style={{ marginBottom: 6 }}>
                <div className="s-name" style={{ width: 92 }}>{r.s}</div>
                <div className="s-bar"><i style={{ width: `${Math.round(r.acc * 100)}%`, background: r.acc < 0.6 ? 'var(--tomato)' : 'var(--primary)' }} /></div>
                <div className="s-pct">{r.correct}/{r.total}</div>
              </div>
            ))}

          {result.wrongList.length > 0 && (
            <>
              <div className="section-h" style={{ marginTop: 14 }}>错题回顾（正确答案 + 解析 + 知识点）</div>
              {result.wrongList.map(({ q, u }) => (
                <div key={q.id} style={{ border: '1px solid rgba(255,122,138,0.35)', borderRadius: 10, padding: 12, marginBottom: 8, background: 'rgba(255,122,138,0.05)' }}>
                  <div className="tiny" style={{ color: 'var(--tomato)', fontWeight: 700, marginBottom: 4 }}>
                    {q.no}. {PAPER_SUBJECT(q.no)} · 你的答案 {u || '未作答'}，正确答案 {q.answer}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{q.stem}</div>
                  <div className="tiny" style={{ marginTop: 6, color: 'var(--ink-soft)' }}>
                    {(q.tags || []).length > 0 && <span style={{ color: 'var(--primary)', marginRight: 6 }}>知识点：{q.tags.join('、')}</span>}
                  </div>
                  <div className="tiny" style={{ marginTop: 4, color: 'var(--ink-soft)', lineHeight: 1.65, background: 'var(--tip-bg)', borderRadius: 8, padding: 8 }}>
                    <b>解析：</b>{q.analysis || '暂无解析'}
                  </div>
                </div>
              ))}
            </>
          )}

          {result.essayWrong.length > 0 && (
            <>
              <div className="section-h" style={{ marginTop: 14 }}>大题自评未过</div>
              {result.essayWrong.map((e) => (
                <div key={e.id} style={{ border: '1px solid var(--bg-soft)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div className="tiny" style={{ fontWeight: 700, color: 'var(--tomato)', marginBottom: 4 }}>{e.no}. {e.subject} · 自评未做对</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>{e.stem}</div>
                  {(e.parts || []).map((p, i) => (
                    <div className="tiny" key={i} style={{ color: 'var(--ink-soft)', background: 'var(--tip-bg)', borderRadius: 8, padding: 8, marginBottom: 4 }}>
                      <b>{p.prompt}</b> {p.answer}
                    </div>
                  ))}
                  {(e.tags || []).length > 0 && (
                    <div className="tiny" style={{ marginTop: 4, color: 'var(--primary)' }}>知识点：{e.tags.join('、')}</div>
                  )}
                </div>
              ))}
            </>
          )}

          <div className="tiny" style={{ marginTop: 10, color: 'var(--ink-soft)' }}>
            {savedMsg || '成绩写回中…'} · 选择题自动判分；大题按你自评统计（对照参考答案判对/错）。
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <button className="btn block" onClick={() => setMode('setup')}>再来一套</button>
            <button className="btn ghost" onClick={() => { setMode('setup'); onBack && onBack() }}>完成</button>
          </div>
        </div>
      )}
    </div>
  )
}
