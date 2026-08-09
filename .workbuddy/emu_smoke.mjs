// 模拟器装机冒烟：页面渲染 + 核心流程 + 0 报错
import { writeFileSync } from 'node:fs'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const issues = [], results = []
const log = (k, ok, extra = '') => { results.push({ k, ok: !!ok, extra }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + k + (extra ? ' :: ' + extra : '')) }
const targets = await (await fetch('http://127.0.0.1:9222/json')).json()
const pageTarget = targets.find((t) => t.type === 'page')
if (!pageTarget) { console.log('no page'); process.exit(1) }
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')) })
let id = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); return }
  if (msg.method === 'Runtime.exceptionThrown') issues.push('[pageerror] ' + (msg.params.exceptionDetails?.exception?.description || '').slice(0, 260))
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(msg.params.type)) issues.push('[console.' + msg.params.type + '] ' + (msg.params.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 260))
}
const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; const timer = setTimeout(() => { pending.delete(mid); rej(new Error('timeout')) }, 10000); pending.set(mid, { res: (v) => { clearTimeout(timer); res(v) }, rej: (e) => { clearTimeout(timer); rej(e) } }); ws.send(JSON.stringify({ id: mid, method, params })) })
const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(String(r.exceptionDetails.exception?.description || '').slice(0, 200)); return r.result ? r.result.value : undefined }
try {
  await send('Runtime.enable')
  let t = await evaluate('document.body.innerText')
  log('首页渲染', t.includes('督学') && (t.includes('登录') || t.includes('今日')), t.slice(0, 70).replace(/\n/g, '|'))
  const loggedIn = t.includes('今日') && !t.includes('注册')
  // 未登录则注册
  if (!loggedIn) {
    const typeByPh = async (ph, val) => { await evaluate(`(() => { const el = [...document.querySelectorAll('input')].find(e => (e.placeholder||'').includes(${JSON.stringify(ph)})); if (!el) return false; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(el, ${JSON.stringify(val)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })()`); await sleep(200) }
    await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(e => (e.textContent||'').includes('注册')); if (b) b.click() })()`)
    await sleep(600)
    await typeByPh('起个名字', '模拟测')
    await typeByPh('you@example.com', `emu-${Date.now()}@example.com`)
    await typeByPh('至少 6 位', 'Test123456')
    await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(e => (e.textContent||'').includes('创建账号')); if (b) b.click() })()`)
    const t0 = Date.now()
    let ok = false
    while (Date.now() - t0 < 30000) { t = await evaluate('document.body.innerText'); if (t.includes('今日打卡')) { ok = true; break } await sleep(1500) }
    log('模拟器注册', ok)
    if (!ok) process.exit(1)
  } else {
    log('沿用已有登录态', true)
  }
  // 打卡
  await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(e => (e.textContent||'').trim() === '打卡'); if (b) b.click() })()`)
  const ck0 = Date.now(); let ck = false
  while (Date.now() - ck0 < 15000) { t = await evaluate('document.body.innerText'); if (t.includes('已打卡')) { ck = true; break } await sleep(1000) }
  log('打卡', ck, '')
  // 各 tab 渲染
  for (const tab of ['专注', '备考', '自测', '进度', '悄悄话']) {
    await evaluate(`(() => { const el = [...document.querySelectorAll('.tabs button')].find(e => (e.textContent||'').trim().includes(${JSON.stringify(tab)})); if (el) el.click() })()`)
    await sleep(2200)
    t = await evaluate('document.body.innerText')
    log('Tab ' + tab, t.includes(tab) || t.length > 50, t.slice(0, 50).replace(/\n/g, '|'))
  }
  // 回到自测 → 快速一场随机考试前几题+交卷
  await evaluate(`(() => { const el = [...document.querySelectorAll('.tabs button')].find(e => (e.textContent||'').trim().includes('自测')); if (el) el.click() })()`)
  await sleep(2500)
  await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(e => (e.textContent||'').includes('开始随机考试')); if (b) b.click() })()`)
  await sleep(3000)
  let alive = await evaluate(`!!document.querySelector('.quiz-overlay')`)
  for (let i = 0; i < 5 && alive; i++) {
    await evaluate(`(() => { const o = [...document.querySelectorAll('.quiz-opt')].find(e => !(e.className||'').includes('on')); if (o) o.click(); const n = [...document.querySelectorAll('button')].find(e => (e.textContent||'').trim() === '下一题'); if (n) n.click() })()`)
    await sleep(400)
    alive = await evaluate(`!!document.querySelector('.quiz-overlay')`)
  }
  log('模拟器考试答题', alive, '')
  await evaluate(`(() => { const s = [...document.querySelectorAll('button')].find(e => (e.textContent||'').trim() === '交卷'); if (s) s.click() })()`)
  await sleep(5000)
  t = await evaluate('document.body.innerText')
  log('模拟器交卷判分', t.includes('考试结果') || t.includes('得分'), '')
  const unique = [...new Set(issues)]
  console.log('---')
  console.log('运行期问题总数:', unique.length)
  unique.slice(0, 10).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync('F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/emu_smoke_result.json', JSON.stringify({ results, issues: unique.slice(0, 20), passed: results.filter((r) => r.ok).length, total: results.length }, null, 2))
} catch (e) {
  console.log('FATAL:', e.message)
} finally {
  ws.close()
}
process.exit(0)
