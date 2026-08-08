// Service Worker —— 离线缓存 + 提醒脚手架（2026-08-08 优化版）
const VERSION = 'study-buddy-v2'
const ASSET_CACHE = VERSION + '-assets'
const SHELL_CACHE = VERSION + '-shell'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(['/', '/index.html', '/manifest.webmanifest'])).then(() => self.skipWaiting())
  )
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return
  const url = new URL(req.url)
  // 带 hash 的静态资源：缓存优先（不可变）
  if (/\/assets\/.+\.(js|css|svg|png|webmanifest|wasm)(\?|$)/.test(url.pathname) || url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const clone = res.clone()
        caches.open(ASSET_CACHE).then((c) => c.put(req, clone)).catch(() => {})
        return res
      }))
    )
    return
  }
  // 文档：网络优先，离线回退缓存
  e.respondWith(
    fetch(req).then((res) => {
      const clone = res.clone()
      caches.open(SHELL_CACHE).then((c) => c.put(req, clone)).catch(() => {})
      return res
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html')))
  )
})
// 提醒（脚手架）：真正 Web Push 需推送服务器；先支持本地通知触发
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    if (list.length) return list[0].focus()
    return self.clients.openWindow('/')
  }))
})
self.addEventListener('push', (e) => {
  let data = { title: '督学', body: '该回来看一眼了' }
  try { data = e.data ? e.data.json() : data } catch {}
  e.waitUntil(self.registration.showNotification(data.title || '督学', { body: data.body || '', icon: './icon.svg' }))
})