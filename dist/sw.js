// Service Worker —— 离线缓存（重建版）
const CACHE = "study-buddy-v1"
self.addEventListener("install", (e) => {
  self.skipWaiting()
})
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim())
})
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return
  e.respondWith(
    fetch(e.request).then((r) => {
      try {
        const clone = r.clone()
        caches.open(CACHE).then((c) => c.put(e.request, clone))
      } catch {}
      return r
    }).catch(() => caches.match(e.request).then((r) => r || new Response("offline", { status: 503 })))
  )
})
