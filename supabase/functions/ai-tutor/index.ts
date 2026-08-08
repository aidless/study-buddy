// AI 名师 Edge Function（Supabase 生产部署）
// 部署：supabase functions deploy ai-tutor --no-verify-jwt
// 密钥：AI_TUTOR_API_KEY（必填，网关密钥） / AI_TUTOR_BASE_URL（默认 https://aiapi.youleai.top/v1） / AI_TUTOR_MODEL（默认 deepseek-v4-flash）
// 与 src/lib/aiTutorPrompt.js 保持同一套提示词（本函数自包含，便于独立部署）。
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const SYSTEM = `你是「督学」App 里的私人考研名师，为学员（一位备考 408/数一/英一/政治的考生）提供答疑、讲题、作文批改与学习规划。
规则：
1. 只回答考研相关内容（408 四科：数据结构/计算机组成/操作系统/计算机网络；数学一；英语一；政治）。
2. 语气：专业、耐心、鼓励，像一位认真负责的陪读老师；不评判、不催促；不懂或没有数据时不编造，直接说明。
3. 数据诚实：结合她提供的自测与错题数据回答；没有数据就明确说"目前还没有相关记录"。
4. 输出格式：
   - 讲题：先给思路（一两句话），再分步讲解，最后列出易错点。
   - 作文批改：先给总分与分档（按内容/结构/语言/格式四维），再给每个维度一句点评，最后给 2-3 条最值得改的具体建议。
   - 答疑：直接、准确、简洁，必要时配一个小例子。
   - 学习规划：结合她的薄弱点给出具体可执行动作（做什么、做多少、大概多久），不空谈。
5. 用中文回答；关键专业术语保留英文（AVL、B+ 树、LRU、DMA、TCP 等）。
6. 篇幅控制：答疑 150 字以内；讲题 300 字以内；作文批改 250 字以内；规划 200 字以内。`

const MODE_HINT = { ask: '答疑', explain: '讲题', essay: '作文批改', plan: '学习规划' }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST' } })
  }
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 })
  try {
    const body = await req.json()
    const { mode = 'ask', question = '', context = '' } = body
    if (!question.trim()) return new Response(JSON.stringify({ error: 'question empty' }), { status: 400 })
    const hint = MODE_HINT[mode] || '答疑'
    const userMsg = `【${hint}】${context ? '学员数据：\n' + context + '\n' : ''}学员问题/内容：${question}`
    const key = Deno.env.get('AI_TUTOR_API_KEY')
    if (!key) return new Response(JSON.stringify({ error: 'server not configured' }), { status: 500 })
    const base = Deno.env.get('AI_TUTOR_BASE_URL') || 'https://aiapi.youleai.top/v1'
    const model = Deno.env.get('AI_TUTOR_MODEL') || 'deepseek-v4-flash'
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userMsg }], max_tokens: 900 })
    })
    const data = await r.json()
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
    return new Response(JSON.stringify({ reply, model }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e).slice(0, 300) }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})