// Progress.jsx —— 进度 Tab：学习进度 + 今日推荐 + 深度分析（雷达/同步/离岸线/周报，2026-08-05 不折叠）
import { useState, useEffect } from 'react'
import { getStats, fmtDur, getExamType, listSelfTests, radarData, weeklyCompare, listFocusSession, listCheckin, computeSyncDays, loadProfile, getTargetScore, getSchoolProfile, getCheckin, getPlanChecks, getCountdown, getPlanAnchor, todayStr } from '../lib/db'
import { buildPlan } from '../lib/curriculum'
import { EXAM_TYPES } from '../lib/examTypes'
import KnowledgeRadar from './KnowledgeRadar'
import PlanRecommender from './PlanRecommender'
import { buildRecommendations } from '../lib/planRecommender'

/* 骨架屏（2026-08-08）：进度页两段渐进加载——
   第一段 getStats 一到就亮「学习进度」主卡；第二段深度分析（雷达/周报/离岸线/今日推荐）
   就绪前显示与真实卡片同构的骨架，低端机不再整页白转圈。 */
function Skel({ h = 12, w, style = {}, r = 8 }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />
}

function MainSkeleton() {
  return (
    <div className="card" aria-busy="true">
      <Skel h={18} w={92} style={{ marginBottom: 14 }} />
      <div className="stat-grid">
        {[0, 1, 2].map((i) => (
          <div className="stat" key={i}>
            <Skel h={22} w={46} style={{ marginBottom: 6 }} />
            <Skel h={12} w={58} />
          </div>
        ))}
      </div>
      <Skel h={12} w={136} style={{ marginTop: 16, marginBottom: 10 }} />
      <div className="heat" aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => <Skel key={i} h={12} w={12} r={3} />)}
      </div>
      <Skel h={12} w={120} style={{ marginTop: 16, marginBottom: 8 }} />
      <div className="bars" aria-hidden="true" style={{ marginBottom: 4 }}>
        {[0.35, 0.6, 0.45, 0.8, 0.5, 0.9, 0.3].map((f, i) => (
          <div className="bar" key={i}>
            <Skel h={Math.round(84 * f)} w="100%" r={6} style={{ minHeight: 4 }} />
            <Skel h={10} w={14} />
          </div>
        ))}
      </div>
      <Skel h={12} w="72%" />
    </div>
  )
}

function DeepSkeleton() {
  return (
    <>
      <div className="card" aria-busy="true">
        <Skel h={18} w={92} style={{ marginBottom: 12 }} />
        {[0, 1].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <Skel h={28} w={28} r={8} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skel h={12} w="92%" style={{ marginBottom: 6 }} />
              <Skel h={12} w="58%" />
            </div>
          </div>
        ))}
      </div>
      <div className="card" aria-busy="true">
        <Skel h={18} w={92} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skel h={140} w={150} r={75} />
        </div>
      </div>
      <div className="card" aria-busy="true">
        <Skel h={18} w={92} style={{ marginBottom: 12 }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Skel h={12} w={56} />
            <Skel h={10} w="100%" r={6} />
            <Skel h={13} w={44} />
          </div>
        ))}
        <Skel h={12} w="86%" style={{ marginTop: 8 }} />
      </div>
    </>
  )
}

export default function Progress({ nonce }) {
  const [s, setS] = useState(null)
  const [radar, setRadar] = useState(null)
  const [weekly, setWeekly] = useState(null)
  const [sync, setSync] = useState(null)
  const [scoreLine, setScoreLine] = useState(null)
  const [recs, setRecs] = useState([])  // 今日推荐（2026-08-05 新增）
  const [deep, setDeep] = useState(false) // 深度分析是否就绪（2026-08-08 渐进加载）
  const [err, setErr] = useState(false)

  useEffect(() => {
    let alive = true
    let stats = null      // 第一段：getStats
    let deepData = null   // 第二段：深度分析原始结果
    setS(null)
    setRadar(null)
    setWeekly(null)
    setSync(null)
    setRecs([])
    setDeep(false)
    setErr(false)
    // 次要查询失败降级为 null（页面仍能显示统计），只有 getStats 失败才整页报错。
    const safe = (p, name) => Promise.resolve(p).catch((e) => { console.error(name + ' failed', e); return null })
    // 今日推荐同时依赖两段数据（连续天数来自 stats，其余来自深度分析），两段到齐才生成。
    const finalizeRecs = () => {
      if (!alive || !stats || !deepData) return
      const { plan, planDone, totalFocusSecWeek, items, est, targetN, ck, syncDays } = deepData
      setRecs(buildRecommendations({
        streak: stats.streak || 0,
        checkinToday: !!ck,
        planTotal: plan.todayTasks.length,
        planDone,
        nowHour: new Date().getHours(),
        radarItems: items,
        scoreEst: est,
        scoreTarget: targetN,
        syncDays,
        weekFocusSec: totalFocusSecWeek
      }))
      setDeep(true)
    }
    // 第一段：主统计（任务/专注/打卡 + 聚合）——一到就渲染「学习进度」主卡，低端机不用等深度分析。
    safe(getStats(), 'getStats').then((st) => {
      if (!alive) return
      if (st == null) { setErr(true); return }
      stats = st
      setS(st)
      finalizeRecs()
    })
    // 第二段：深度分析数据（自测/雷达/周报/离岸线/目标分）并行拉齐。
    Promise.all([
      safe(getExamType(), 'getExamType'), safe(listSelfTests(), 'listSelfTests'),
      safe(listFocusSession(), 'listFocusSession'), safe(listCheckin(), 'listCheckin'),
      safe(loadProfile(), 'loadProfile'), safe(getCheckin(), 'getCheckin'),
      safe(getCountdown(), 'getCountdown'), safe(getPlanAnchor(), 'getPlanAnchor'),
      safe(getTargetScore(), 'getTargetScore'), safe(getSchoolProfile(), 'getSchoolProfile')
    ])
      .then(([et, tests, focus, checkins, me, ck, cd, anchor, target, sp]) => {
        if (!alive) return
        const items = radarData(tests || [], et)
        setRadar({ items })
        setWeekly({ focus: focus || [], selftests: tests || [], checkins: checkins || [] })
        setSync(computeSyncDays(focus || [], me?.id))
        const plan = buildPlan(cd?.targetDate, anchor)
        const type = EXAM_TYPES[et] || EXAM_TYPES.kaoyan
        const est = Math.round(items.reduce((a, d) => {
          const max = (type.subjects.find((x) => x.key === d.key) || {}).max || 100
          return a + (d.acc != null ? d.acc * max : 0)
        }, 0))
        const targetN = target ?? null
        // 诚实边界：无真题自测时 est 恒为 0，显示"未测"而非 0 分，避免误导。
        const hasReal = items.some((d) => d.acc != null)
        setScoreLine({ est: hasReal ? est : null, target: targetN, line: sp?.lineScore ?? null })

        // 今日推荐数据：根据真实数据（来源标注）。
        const planChecks = getPlanChecks(todayStr())
        const planDone = plan.todayTasks.filter((t) => planChecks[`${t.subject}|${t.topic}`]).length
        const totalFocusSecWeek = (focus || []).reduce((a, f) => a + (f.durationSec || f.duration_sec || 0), 0)
        deepData = { plan, planDone, totalFocusSecWeek, items, est, targetN, ck, syncDays: computeSyncDays(focus, me?.id)?.total || 0 }
        finalizeRecs()
      })
      .catch((e) => { console.error('progress subload failed', e) })
    return () => { alive = false }
  }, [nonce])

  if (err) return <div className="card"><div className="note">进度加载出了点问题，刷新一下就好。</div></div>

  const wk = weekly ? weeklyCompare(weekly) : null
  // 正向措辞：提升说"多/涨"，下降只说"稳住"（调研：断/降后指责破坏回流）。
  const trend = (now, last, unit = '') => {
    if (!last) return last === 0 && now === 0 ? '从 0 开始，慢慢来' : ''
    const d = now - last
    if (d > 0) return `比上周多 ${fmtDur(d)}${unit}`
    return '和上周差不多，稳住'
  }

  return (
    <>
      {/* ===== 学习进度总览（第一段先亮，深度分析期间显示骨架） ===== */}
      {!s ? (
        <MainSkeleton />
      ) : (
        <div className="card">
          <h2>
            <span className="dot" /> 学习进度
          </h2>
          <div className="stat-grid">
            <div className="stat">
              <b>{s.streak}</b>
              <span>连续天数</span>
            </div>
            <div className="stat">
              <b style={{ fontSize: 16 }}>{fmtDur(s.week[s.week.length - 1].focus)}</b>
              <span>今日专注</span>
            </div>
            <div className="stat">
              <b style={{ fontSize: 16 }}>{fmtDur(s.totalFocusSec)}</b>
              <span>累计专注</span>
            </div>
          </div>

          <div className="muted" style={{ marginTop: 14, marginBottom: 6 }}>
            近 30 天专注热力图
          </div>
          <div className="heat">
            {s.heat.map((c) => (
              <div
                key={c.date}
                className={`cell ${c.level ? 'l' + c.level : ''} ${c.today ? 'today' : ''}`}
                title={`${c.date} · ${fmtDur(c.focus)}${c.checkin ? ' · 已打卡' : ''}`}
              />
            ))}
          </div>

          <div className="muted" style={{ marginTop: 16, marginBottom: 4 }}>
            近 7 天专注时长
          </div>
          <div className="bars">
            {s.week.map((w) => (
              <div className="bar" key={w.date}>
                <div
                  className="col"
                  style={{ height: `${Math.round((w.focus / Math.max(1, ...s.week.map((x) => x.focus))) * 84)}px`, background: w.focus > 0 ? 'var(--primary)' : 'var(--line)' }}
                />
                <div className="lab">{w.label}</div>
              </div>
            ))}
          </div>

          <div className="tip" style={{ marginTop: 14 }}>
            今日任务 {s.tasksToday.done}/{s.tasksToday.total}
            {s.checkinToday ? ' · 已打卡' : ' · 还没打卡'}
          </div>
        </div>
      )}

      {/* ===== 今日推荐（2026-08-05 新增：基于真实数据） ===== */}
      {deep ? <PlanRecommender recs={recs} /> : null}

      {/* ===== 深度分析（不折叠：雷达/同步/离岸线/周报） ===== */}
      {!deep ? (
        <DeepSkeleton />
      ) : (
        <>
          <div className="card">
            <h2>
              <span className="dot" /> 知识雷达
              <span className="tiny" style={{ marginLeft: 'auto', color: 'var(--ink-soft)' }}>自测正确率 · 越大越熟</span>
            </h2>
            <KnowledgeRadar data={radar ? radar.items : null} nonce={nonce} />
          </div>

          {/* 同步日徽章（创新⑥） */}
          {sync && sync.total > 0 && (
            <div className="card" style={{ background: 'var(--primary-soft)', borderColor: 'transparent' }}>
              <h2><span className="dot" /> 同步日徽章</h2>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                你们已 <b>{sync.total}</b> 天同步专注（同天都 ≥1 小时）
                {sync.streak >= 2 && <> · 当前连 <b>{sync.streak}</b> 天</>}
                {sync.streak >= 3 && <span style={{ color: 'var(--primary)' }}> —— 同步 {sync.streak} 天，徽章升级</span>}
                {sync.today && <div style={{ marginTop: 4, color: 'var(--primary)' }}>今天你们也在同步，继续保持</div>}
              </div>
            </div>
          )}

          {/* 离岸线（创新⑦） */}
          {scoreLine && (
            <div className="card">
              <h2><span className="dot" /> 离岸线</h2>
              {[['当前估分', scoreLine.est, 'var(--primary)'], ['目标', scoreLine.target, 'var(--amber)'], ['往年校线', scoreLine.line, 'var(--tomato)']].map(([lab, v, color]) => (
                <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 56, fontSize: 12, color: 'var(--ink-soft)' }}>{lab}</span>
                  <div style={{ flex: 1, height: 10, borderRadius: 6, background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(2, (v / (scoreLine.target || 400)) * 100))}%`, height: '100%', background: color, borderRadius: 6 }} />
                  </div>
                  <span style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{v ?? '—'}</span>
                </div>
              ))}
              <div className="tiny" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
                {scoreLine.est == null
                  ? '还没用真题自测过，估分暂不可信——先去做几套真题，离岸线才会亮起来'
                  : scoreLine.target && scoreLine.est < scoreLine.target
                    ? `离目标还差 ${scoreLine.target - scoreLine.est} 分——按现在的正确率趋势，每多记一次真题自测就更接近一点`
                    : scoreLine.target
                      ? '估分已到目标线，稳住节奏，冲刺期再往上够'
                      : '先设一个目标分，离岸线才有对比基准'}
              </div>
            </div>
          )}

          {/* 本周小结 */}
          {wk && (
            <div className="card">
              <h2><span className="dot" /> 本周小结</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div>专注 <b>{fmtDur(wk.focusThis)}</b> · <span className="tiny">{trend(wk.focusThis, wk.focusLast)}</span></div>
                <div>番茄 <b>{wk.pomoThis}</b> 个 · <span className="tiny">{trend(wk.pomoThis, wk.pomoLast, ' 个')}</span></div>
                <div>打卡 <b>{wk.checkinThis}</b> 天 · <span className="tiny">{trend(wk.checkinThis, wk.checkinLast, ' 天')}</span></div>
                <div>
                  自测正确率 <b>{wk.accThis == null ? '—' : Math.round(wk.accThis * 100) + '%'}</b>
                  {wk.accThis != null && wk.accLast != null && (
                    <span className="tiny" style={{ marginLeft: 4 }}>
                      {wk.accThis >= wk.accLast ? `比上周高 ${Math.round((wk.accThis - wk.accLast) * 100)}%` : '和上周差不多，稳住'}
                    </span>
                  )}
                </div>
              </div>
              <div className="tiny" style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
                只看趋势不评判——某天少了可能是状态问题，不是退步。
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
