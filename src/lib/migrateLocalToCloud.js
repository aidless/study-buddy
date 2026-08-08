// migrateLocalToCloud.js —— 本地模式 → 云端账号 一键迁移（2026-08-07）
// 范围：任务 / 专注 / 打卡 / 自测 / 阶段目标 / 倒计时 / 今日一句话（本人角色那半）。
// 不迁移：树洞（隐私，绝不上云）、今日计划勾选（设计上只存本机）、悄悄话历史（归属复杂）、语音/错题图片（已有独立迁移）。
// 安全：迁移前逐类型检查云端是否已有该 couple 的数据，已有则跳过该类型，避免重复；
//       完成后写 dx_cloud_migrated_v1 标记，只提示一次。
import { supabase, USE_SUPABASE, uid, LS } from './_util.js'

function lsGet(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def }
}

// 纯函数：把本机数据映射成云端行（可单测，不碰网络）
// localUser = 本机旧账号（dx_user），cloudUser = 当前云端账号
export function buildMigrationPlan(local, localUser, cloudUser) {
  const plan = { tasks: [], focus: [], checkins: [], selftests: [], goals: [], countdown: null, words: [] }
  const taskMap = {}
  if (!localUser || !cloudUser) return plan

  const scopeId = localUser.id
  const scopeCouple = localUser.coupleId
  const cid = cloudUser.coupleId

  // 任务：旧 id → 新 uuid 映射（focus 的 task_id 跟着换）
  for (const t of (local.tasks || [])) {
    if (t.coupleId !== scopeCouple || t.owner_id !== scopeId) continue
    const newId = uid()
    taskMap[t.id] = newId
    plan.tasks.push({
      id: newId, couple_id: cid, owner_id: cloudUser.id,
      title: String(t.title || ''), date: String(t.date || ''), time: t.time || null,
      done: !!t.done, act: t.act || null, target: t.target ?? null, min_dur_ms: t.minDurMs ?? null
    })
  }

  // 专注：running 一律收成 done（迁移不带进行中状态）
  for (const f of (local.focus || [])) {
    if (f.coupleId !== scopeCouple || f.userId !== scopeId) continue
    const started = f.startedAt || f.started_at || f.endAt || new Date().toISOString()
    const ended = f.endAt || f.end_at || started
    plan.focus.push({
      couple_id: cid, user_id: cloudUser.id,
      duration_sec: f.durationSec || f.duration_sec || 0,
      task_id: taskMap[f.taskId] || null,
      started_at: started, status: 'done', end_at: ended
    })
  }

  // 打卡：按日期去重（同一用户同一天云端唯一）
  const seenDates = new Set()
  for (const c of (local.checkins || [])) {
    if (c.coupleId !== scopeCouple || c.userId !== scopeId || !c.date || seenDates.has(c.date)) continue
    seenDates.add(c.date)
    plan.checkins.push({
      couple_id: cid, user_id: cloudUser.id,
      date: c.date, note: c.note || '', at: c.at || new Date().toISOString()
    })
  }

  // 自测
  for (const t of (local.selftests || [])) {
    if (t.coupleId !== scopeCouple || t.owner_id !== scopeId) continue
    plan.selftests.push({
      couple_id: cid, owner_id: cloudUser.id,
      subject: String(t.subject || ''), kind: t.kind || '章节练习', name: t.name || '',
      total: t.total || 0, correct: t.correct || 0, sec: t.sec ?? null,
      at: t.at || new Date().toISOString(),
      topic: t.topic || null, wrong_reason: t.wrongReason || null, mode: t.mode || 'manual',
      practice: t.practice || 0, practice_correct: t.practiceCorrect || 0
    })
  }

  // 阶段目标
  for (const g of (local.goals || [])) {
    if (g.coupleId !== scopeCouple || g.owner_id !== scopeId) continue
    plan.goals.push({
      couple_id: cid, owner_id: cloudUser.id,
      title: String(g.title || ''), due_date: g.dueDate || null, done: !!g.done
    })
  }

  // 倒计时（每 couple 一行）
  const cd = local.countdown
  if (cd && cd.coupleId === scopeCouple && cd.targetDate) {
    plan.countdown = { couple_id: cid, target_date: cd.targetDate, label: cd.label || '考研初试' }
  }

  // 今日一句话：只搬本人角色那半（她搬 she，他搬 he），云端 from_id 是当前账号
  const who = cloudUser.role === 'supervisor' ? 'he' : 'she'
  for (const [date, w] of Object.entries(local.words || {})) {
    const text = w && w[who] && w[who].trim()
    if (!text) continue
    plan.words.push({
      couple_id: cid, from_id: cloudUser.id, from_name: cloudUser.name || '',
      to_id: null, message: text, at: date + 'T08:00:00', read: false, kind: 'word'
    })
  }

  return plan
}

// 本机还有多少可迁移的旧数据（需要本机旧账号 dx_user 作为筛选范围）
export function hasLocalData() {
  const localUser = lsGet('dx_user', null)
  if (!localUser) return { total: 0, byType: {} }
  const count = (key, pred) => (lsGet(key, []) || []).filter(pred).length
  const byType = {
    tasks: count('dx_tasks', (t) => t.coupleId === localUser.coupleId && t.owner_id === localUser.id),
    focus: count('dx_focus', (f) => f.coupleId === localUser.coupleId && f.userId === localUser.id),
    checkins: count('dx_checkins', (c) => c.coupleId === localUser.coupleId && c.userId === localUser.id),
    selftests: count('dx_selftests', (t) => t.coupleId === localUser.coupleId && t.owner_id === localUser.id),
    goals: count('dx_goals', (g) => g.coupleId === localUser.coupleId && g.owner_id === localUser.id),
    countdown: (() => { const cd = lsGet('dx_countdown', null); return cd && cd.coupleId === localUser.coupleId && cd.targetDate ? 1 : 0 })(),
    words: (() => {
      const m = lsGet('dx_word', {}) || {}
      return Object.values(m).filter((w) => w && (w.she || w.he)).length
    })()
  }
  return { total: Object.values(byType).reduce((a, b) => a + b, 0), byType }
}

async function tableHasRows(table, coupleId) {
  const { data } = await supabase.from(table).select('id').eq('couple_id', coupleId).limit(1)
  return !!(data && data.length > 0)
}

async function insertRows(table, rows) {
  if (!rows || rows.length === 0) return { attempted: 0, inserted: 0 }
  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const { error } = await supabase.from(table).insert(chunk)
    if (error) throw new Error(table + ': ' + error.message)
    inserted += chunk.length
  }
  return { attempted: rows.length, inserted }
}

// 执行迁移（云端模式 + 明确用户同意后调用）
export async function migrateLocalToCloud(cloudUser) {
  if (!USE_SUPABASE || !supabase) return { ok: false, reason: 'no_cloud' }
  if (!cloudUser || !cloudUser.id || !cloudUser.coupleId) return { ok: false, reason: 'no_user' }
  const localUser = lsGet('dx_user', null)
  if (!localUser) return { ok: false, reason: 'no_local_profile' }
  const local = {
    tasks: lsGet('dx_tasks', []), focus: lsGet('dx_focus', []), checkins: lsGet('dx_checkins', []),
    selftests: lsGet('dx_selftests', []), goals: lsGet('dx_goals', []),
    countdown: lsGet('dx_countdown', null), words: lsGet('dx_word', {})
  }
  const plan = buildMigrationPlan(local, localUser, cloudUser)
  const results = {}

  const types = [
    ['tasks', 'tasks', plan.tasks],
    ['focus', 'focus_sessions', plan.focus],
    ['checkins', 'checkins', plan.checkins],
    ['selftests', 'self_tests', plan.selftests],
    ['goals', 'phase_goals', plan.goals],
    ['countdown', 'countdown', plan.countdown ? [plan.countdown] : []],
    ['words', 'encouragements', plan.words]
  ]
  for (const [name, table, rows] of types) {
    try {
      if (rows.length === 0) { results[name] = { attempted: 0, inserted: 0, skipped: 'empty' }; continue }
      if (await tableHasRows(table, cloudUser.coupleId)) { results[name] = { attempted: rows.length, inserted: 0, skipped: 'exists' }; continue }
      results[name] = await insertRows(table, rows)
    } catch (e) {
      results[name] = { attempted: rows.length, inserted: 0, error: e.message }
    }
  }
  LS.set('dx_cloud_migrated_v1', { at: new Date().toISOString(), results })
  return { ok: true, results }
}
