// updates —— 自建更新服务（Plan B）：实现 Capgo 插件约定的 /updates 协议
// 版本清单与 zip 包都放在 Supabase Storage 的 updates 桶（public，国内可达）
import { corsHeaders } from '../_shared/cors.ts'

const STORAGE_BASE = 'https://cfxsyvbxnmvmspklebfa.supabase.co/storage/v1/object/public/updates'
const MANIFEST_URL = STORAGE_BASE + '/latest.json'

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json', ...corsHeaders }
})

function hashPercent(seed) {
  let h = 0
  const s = String(seed || '')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 100
}

function isNewer(a, b) {
  const pa = String(a || '0').split('.').map((x) => parseInt(x, 10) || 0)
  const pb = String(b || '0').split('.').map((x) => parseInt(x, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const path = new URL(req.url).pathname
  // stats / channel_self：仅需返回无害 JSON（统计失败日志不刷屏）
  if (path.endsWith('/stats')) return json({ status: 'ok' })
  if (path.endsWith('/channel_self')) return json({ message: 'no channel', version: '' })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  let body = {}
  try { body = await req.json() } catch {}
  const current = String(body.version_name || '0.0.0')
  try {
    const m = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' })
    if (!m.ok) throw new Error('manifest http ' + m.status)
    const latest = await m.json()
    const latestV = String(latest.version || '')
    if (!latestV || !isNewer(latestV, current)) {
      return json({ kind: 'up_to_date', message: 'no update available', version: current })
    }
    // 灰度：rollout 0-100，按 device_id 稳定哈希决定是否下发；100 = 全量
    const rollout = Math.max(0, Math.min(100, Number(latest.rollout) || 100))
    if (rollout < 100 && hashPercent(body.device_id + ':' + body.app_id) >= rollout) {
      return json({ kind: 'up_to_date', message: 'no update available (rollout)', version: current })
    }
    return json({
      version: latestV,
      url: String(latest.url || ''),
      checksum: String(latest.checksum || ''),
      sessionKey: ''
    })
  } catch (e) {
    return json({ kind: 'failed', error: 'manifest_error', message: String((e && e.message) || e), version: current })
  }
})
