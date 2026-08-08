// ai-tutor-relay.mjs —— 本地 AI 名师中继（仅开发/预览用；生产请用 supabase/functions/ai-tutor）
// 密钥只从环境变量读取，不写入任何文件。
// 启动： $env:AI_TUTOR_API_KEY=... ; node scripts/ai-tutor-relay.mjs
import http from 'node:http'
import { buildMessages } from '../src/lib/aiTutorPrompt.js'

const PORT = process.env.AI_TUTOR_PORT || 8790
const API_KEY = process.env.AI_TUTOR_API_KEY || process.env.HAOLO_DEEPSEEK_EXECUTION_TOKEN || process.env.DEEPSEEK_API_KEY || ''
const BASE = process.env.AI_TUTOR_BASE_URL || 'https://aiapi.youleai.top/v1'
const MODEL = process.env.AI_TUTOR_MODEL || 'deepseek-v4-flash'
const MAX_TOKENS = Number(process.env.AI_TUTOR_MAX_TOKENS || 900)

if (!API_KEY) {
  console.error('缺少 AI_TUTOR_API_KEY（或 HAOLO_DEEPSEEK_EXECUTION_TOKEN）。请先设置环境变量。')
  process.exit(1)
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method !== 'POST' || !req.url.startsWith('/chat')) {
    res.writeHead(404); res.end(JSON.stringify({ error: 'not found' })); return
  }
  let raw = ''
  req.on('data', (d) => { raw += d })
  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}')
      const messages = buildMessages({ mode: body.mode, question: body.question, context: body.context })
      const upstream = await fetch(BASE + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: MAX_TOKENS, stream: false })
      })
      const data = await upstream.json()
      const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ reply: text, model: MODEL }))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: String(e && e.message || e).slice(0, 300) }))
    }
  })
})

server.listen(PORT, () => console.log('AI 名师中继已启动: http://127.0.0.1:' + PORT + '/chat · model=' + MODEL))