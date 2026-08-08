// 考试目标设置：报考类型 / 考试类型 / 目标总分 / 单科目标 / 自定义考试（含 Supabase 同步）
import { supabase, USE_SUPABASE, LS } from './_util.js'
import { loadProfile } from './auth.js'
import { EXAM_TYPES, DEFAULT_EXAM } from './examTypes.js'

export async function getDegreeType() {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data } = await supabase.from('couples').select('degree_type').eq('id', me.coupleId).maybeSingle()
    return data?.degree_type || 'undecided'
  }
  const m = LS.get('dx_degree_type', {})
  return me?.coupleId ? (m[me.coupleId] || 'undecided') : 'undecided'
}
export async function setDegreeType(type) {
  if (!['professional', 'academic', 'undecided'].includes(type)) return
  if (USE_SUPABASE) {
    await supabase.from('couples').update({ degree_type: type }).eq('id', (await loadProfile()).coupleId)
    return
  }
  const cid = (await loadProfile())?.coupleId
  if (!cid) return
  const m = LS.get('dx_degree_type', {})
  m[cid] = type
  LS.set('dx_degree_type', m)
}

export async function getExamType() {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data } = await supabase.from('couples').select('exam_type').eq('id', me.coupleId).maybeSingle()
    return data?.exam_type && EXAM_TYPES[data.exam_type] ? data.exam_type : DEFAULT_EXAM
  }
  const m = LS.get('dx_exam_type', {})
  return me?.coupleId && EXAM_TYPES[m[me.coupleId]] ? m[me.coupleId] : DEFAULT_EXAM
}
export async function setExamType(type) {
  if (!EXAM_TYPES[type]) return
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('couples').update({ exam_type: type, target_score: null, subj_target: {} }).eq('id', me.coupleId)
    return
  }
  const cid = me?.coupleId
  if (!cid) return
  const m = LS.get('dx_exam_type', {})
  m[cid] = type
  LS.set('dx_exam_type', m)
  const ts = LS.get('dx_target_score', {})
  delete ts[cid]
  LS.set('dx_target_score', ts)
  const st = LS.get('dx_subj_target', {})
  delete st[cid]
  LS.set('dx_subj_target', st)
}

export async function getTargetScore() {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data } = await supabase.from('couples').select('target_score').eq('id', me.coupleId).maybeSingle()
    return data?.target_score ?? null
  }
  const m = LS.get('dx_target_score', {})
  return me?.coupleId ? (m[me.coupleId] ?? null) : null
}
export async function setTargetScore(score) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('couples').update({ target_score: score == null || isNaN(score) ? null : score }).eq('id', me.coupleId)
    return
  }
  const cid = me?.coupleId
  if (!cid) return
  const m = LS.get('dx_target_score', {})
  if (score == null || isNaN(score)) delete m[cid]
  else m[cid] = score
  LS.set('dx_target_score', m)
}

export async function getSubjTargets() {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data } = await supabase.from('couples').select('subj_target').eq('id', me.coupleId).maybeSingle()
    return data?.subj_target || {}
  }
  const m = LS.get('dx_subj_target', {})
  return me?.coupleId ? (m[me.coupleId] || {}) : {}
}
export async function setSubjTargets(targets) {
  const clean = {}
  for (const [k, v] of Object.entries(targets || {})) {
    clean[k] = (v == null || v === '' || isNaN(Number(v))) ? null : Number(v)
  }
  if (USE_SUPABASE) {
    await supabase.from('couples').update({ subj_target: clean }).eq('id', (await loadProfile()).coupleId)
    return clean
  }
  const cid = (await loadProfile())?.coupleId
  if (!cid) return clean
  const m = LS.get('dx_subj_target', {})
  m[cid] = clean
  LS.set('dx_subj_target', m)
  return clean
}

export async function getSchoolProfile() {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    const { data } = await supabase.from('couples').select('school_profile').eq('id', me.coupleId).maybeSingle()
    return data?.school_profile || null
  }
  const m = LS.get('dx_school_profile', {})
  return me?.coupleId ? (m[me.coupleId] || null) : null
}
export async function setSchoolProfile(profile) {
  const me = await loadProfile()
  if (USE_SUPABASE) {
    await supabase.from('couples').update({ school_profile: profile || null }).eq('id', me.coupleId)
    return
  }
  const cid = me?.coupleId
  if (!cid) return
  const m = LS.get('dx_school_profile', {})
  if (profile) m[cid] = profile
  else delete m[cid]
  LS.set('dx_school_profile', m)
}

/* ---------------- 自定义考试 + 多考试 ---------------- */
function getCustomExams() { return LS.get('dx_custom_exams', []) }
function saveCustomExams(arr) { LS.set('dx_custom_exams', arr) }

export function getAllExams() {
  const customs = getCustomExams()
  const presets = Object.values(EXAM_TYPES).map(t => ({
    id: 'preset:' + t.key, baseType: t.key, label: t.label,
    isPreset: true, targetDate: null, subjects: t.subjects.map(s => s.label),
    hasPlan: t.hasPlan, hasWeighted: t.hasWeighted
  }))
  const customItems = customs.map(c => ({
    id: 'custom:' + c.id, baseType: c.baseType || 'kaoyan',
    label: c.label, isPreset: false, targetDate: c.targetDate,
    subjects: c.subjects || [], createdAt: c.createdAt
  }))
  return [...presets, ...customItems]
}

export function addCustomExam({ label, targetDate, baseType, subjects }) {
  const id = 'ce_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const customs = getCustomExams()
  customs.push({ id, label, targetDate, baseType, subjects, createdAt: new Date().toISOString() })
  saveCustomExams(customs)
  return id
}
export function removeCustomExam(id) {
  saveCustomExams(getCustomExams().filter(c => c.id !== id))
}
export function getActiveExamId() { return LS.get('dx_active_exam_id', null) }
export function setActiveExamId(id) { LS.set('dx_active_exam_id', id) }

export function getActiveExam() {
  const all = getAllExams()
  const id = getActiveExamId()
  let cur = all.find(e => e.id === id)
  if (!cur) {
    const presetKey = getExamType()
    cur = all.find(e => e.id === 'preset:' + presetKey)
  }
  return cur || all[0]
}