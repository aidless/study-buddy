// aiTutor.js —— AI 名师客户端：组装她的学习上下文并调用中继/Edge Function
import { getPlan, listWrongItems, getCountdown, getExamType, getPlanChecks, getPlanAnchor } from './db.js'
import { wrongBookStats, weeklyCompare } from './planStats.js'
import { EXAM_TYPES } from './examTypes.js'
import { buildContext } from './aiTutorPrompt.js'

// 中继地址：优先 localStorage 覆盖（本地演示），否则用构建时 VITE_AI_TUTOR_URL，最后回退到 Supabase Edge Function
export function tutorUrl() {
  try {
    const ov = localStorage.getItem('ai_tutor_url')
    if (ov) return ov
  } catch {}
  return (import.meta.env && import.meta.env.VITE_AI_TUTOR_URL) || '/functions/v1/ai-tutor'
}

export async function askAiTutor({ mode = 'ask', question }) {
  if (!question || !question.trim()) throw new Error('问题不能为空')
  // 组装她的真实学习上下文（错题/自测/倒计时/考试类型）
  let summary, wrongItems = [], countdownDays = null, examLabel = '', recentTests = []
  try {
    const [plan, wi, cd, et] = await Promise.all([getPlan(), listWrongItems(), getCountdown(), getExamType()])
    summary = plan && plan.selfSummary
    recentTests = (plan && plan.selfTests || []).slice(0, 3)
    wrongItems = wi || []
    if (cd && cd.targetDate) countdownDays = Math.max(0, Math.round((new Date(cd.targetDate + 'T00:00:00') - new Date()) / 86400000))
    examLabel = (EXAM_TYPES[et] || {}).label || ''
  } catch {}
  const context = buildContext({ summary, wrongStats: summary ? wrongBookStats(recentTests) : [], wrongItems, countdownDays, examLabel, recentTests })

  const headers = { 'Content-Type': 'application/json' }
  // 云端模式携带 anon key 鉴权（Edge Function verify_jwt，防外部滥用）
  const anon = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || ''
  if (anon) {
    headers['apikey'] = anon
    headers['Authorization'] = 'Bearer ' + anon
  }
  const res = await fetch(tutorUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode, question, context })
  })
  if (!res.ok) throw new Error('AI 服务暂不可用（' + res.status + '）')
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.reply || ''
}