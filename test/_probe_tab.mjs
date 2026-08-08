const list = await (await fetch('http://127.0.0.1:9222/json', { signal: AbortSignal.timeout(8000) })).json()
const t = list.find((x) => x.type === 'page') || list[0]
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const send = (m, p) => new Promise((res) => {
  const i = ++id
  const h = (ev) => { const d = JSON.parse(ev.data); if (d.id === i) { ws.removeEventListener('message', h); res(d.result) } }
  ws.addEventListener('message', h)
  ws.send(JSON.stringify({ id: i, method: m, params: p }))
})
await send('Runtime.enable')
const r = await send('Runtime.evaluate', {
  expression: `(() => {
    const bodyBefore = document.body.innerText.includes('进度')
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === '进度')
    if (b) b.click()
    return { bodyBefore, clicked: !!b }
  })()`,
  returnByValue: true
})
console.log(JSON.stringify(r.result.value))
ws.close()
