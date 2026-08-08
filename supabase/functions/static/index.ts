// static Edge Function —— 用 Supabase 免费托管静态站（路径鲁棒版）
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
const STORAGE = 'https://cfxsyvbxnmvmspklebfa.supabase.co/storage/v1/object/public/study-buddy'
const NO_CACHE = ['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg']
serve(async (req) => {
  const url = new URL(req.url)
  let rawPath = url.pathname
  // 剥掉函数名前缀与多余斜杠
  let path = rawPath.replace(/^\/+/, '').replace(/^static\/?/, '').replace(/^\/+/, '')
  if (!path || path === '/' || path.endsWith('/')) path = 'index.html'
  const storageUrl = STORAGE + '/' + path
  const up = await fetch(storageUrl)
  if (!up.ok) return new Response('Not Found: ' + path, { status: 404, headers: { 'Content-Type': 'text/plain' } })
  const body = await up.arrayBuffer()
  const ct = path.endsWith('.html')
    ? 'text/html; charset=utf-8'
    : (up.headers.get('content-type') || 'application/octet-stream')
  const cc = NO_CACHE.includes(path) ? 'no-cache' : 'public, max-age=31536000, immutable'
  return new Response(body, {
    headers: {
      'Content-Type': ct,
      'Cache-Control': cc,
      'Access-Control-Allow-Origin': '*',
      'X-Static-Path': path
    }
  })
})