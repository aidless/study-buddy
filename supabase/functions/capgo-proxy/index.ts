// capgo-proxy —— Capgo 更新接口中转（解决 plugin.capgo.app 在某些网络不可达）
// 手机端 CapacitorUpdater 配置 updateUrl 指向本函数；本函数把请求转发到
// https://plugin.capgo.app 对应路径并原样回传响应（含下载地址 files.capgo.app，直连可达）。
// 注意：不转发敏感业务数据；Capgo 的 apikey 头原样透传（APK 内置）。
import { corsHeaders } from '../_shared/cors.ts'

const UPSTREAM = 'https://plugin.capgo.app'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  const url = new URL(req.url)
  // /capgo-proxy/updates -> /updates
  const path = url.pathname.replace(/^\/capgo-proxy/, '') || '/'
  const target = UPSTREAM + path + url.search
  try {
    const headers = new Headers()
    // Host 由 fetch 按 URL 自动设置（必须是 plugin.capgo.app，否则 Capgo 判定为 on-premise）
    // Capgo 靠 CapacitorUpdater UA 识别 App 请求；Deno fetch 会吞自定义 UA，必须显式设置
    headers.set('user-agent', 'CapacitorUpdater/6.50.2 (com.haolo.studybuddy) android/13')
    headers.set('accept', 'application/json')
    headers.set('content-type', req.headers.get('content-type') || 'application/json; charset=utf-8')
    // 若调用方带了 Authorization（管理员接口场景），透传；App 更新请求不需要
    const auth = req.headers.get('authorization')
    if (auth) headers.set('authorization', auth)
    const up = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      redirect: 'follow'
    })
    const body = await up.arrayBuffer()
    const res = new Response(body, { status: up.status, headers: up.headers })
    for (const [k, v] of Object.entries(corsHeaders)) res.headers.set(k, v)
    return res
  } catch (e) {
    return new Response(JSON.stringify({ error: 'proxy_failed', message: String(e && e.message || e) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
