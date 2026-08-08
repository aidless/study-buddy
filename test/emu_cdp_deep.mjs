// emu_cdp_deep.mjs —— 模拟机（Android WebView）深测：CDP 驱动真实 APK 页面
// 前置：debug APK 已装并启动；`adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`
import { writeFileSync, mkdirSync } from 'node:fs'

const CDP = 'http://127.0.0.1:9222'
const OUT = 'C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/科研/outputs/emu-deep-test'
mkdirSync(OUT, { recursive: true })

const ts = Date.now()
const EMAIL_STU = `emu-stu-${ts}@example.com`
const EMAIL_SUP = `emu-sup-${ts}@example.com`
const PASS = 'Test123456'
const WORD = '模拟机上的今日一句话'
const MSG = `EmuMsg-${ts}`
const REPLY = `EmuReply-${ts}`

const results = []
const ok = (name, pass, extra = '') => {
  results.push({ name, pass: !!pass, extra })
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' :: ' + extra : ''))
}

const list = await (await fetch(CDP + '/json')).json()
const target = list.find((t) => t.type === 'page') || list[0]
if (!target) throw new Error('no CDP target')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let msgId = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result) }
}
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++msgId
  pending.set(id, { res, rej })
  ws.send(JSON.stringify({ id, method, params }))
})
await send('Page.enable')
await send('Runtime.enable')

const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
  return r.result.value
}
const waitText = async (t, timeout = 60000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evalJs(`document.body.innerText.includes(${JSON.stringify(t)})`)) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('waitText timeout: ' + t)
}
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  const f = OUT + '/' + name + '.png'
  writeFileSync(f, Buffer.from(r.data, 'base64'))
  console.log('  shot ' + name)
}
const clickByText = async (text, partial = false) => {
  const hit = await evalJs(`(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const b = btns.find(x => ${partial ? 'x.textContent.includes(' + JSON.stringify(text) + ')' : 'x.textContent.trim() === ' + JSON.stringify(text)})
    if (b) { b.click(); return true }
    return false
  })()`)
  if (!hit) throw new Error('button not found: ' + text)
}
const typeByPlaceholder = async (ph, val) => {
  const hit = await evalJs(`(() => {
    const els = Array.from(document.querySelectorAll('input, textarea'))
    const el = els.find(x => (x.placeholder || '').startsWith(${JSON.stringify(ph)}))
    if (!el) return false
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(val)})
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)
  if (!hit) throw new Error('input not found: ' + ph)
}

try {
  await waitText('考研长线陪伴', 60000)
  await shot('01-登录页')
  ok('登录页加载', true)

  // ===== 学员注册 =====
  await clickByText('注册')
  await clickByText('学员（她）')
  await typeByPlaceholder('起个名字', 'EmuStu')
  await typeByPlaceholder('you@example.com', EMAIL_STU)
  await typeByPlaceholder('至少 6 位', PASS)
  await clickByText('创建账号')
  await waitText('邀请码', 90000)
  await shot('02-今日页-首开')
  ok('学员注册进入首页', true)

  // 邀请码
  await clickByText('邀请码')
  await evalJs(`(() => { const el = document.querySelector('.code-display'); if (el) el.scrollIntoView(); return !!el })()`)
  await new Promise((r) => setTimeout(r, 500))
  const code = await evalJs(`document.querySelector('.code-display') ? document.querySelector('.code-display').textContent.trim().toUpperCase() : ''`)
  ok('邀请码格式', /^[A-Z2-9]{6}$/.test(code), code)
  await shot('03-邀请码弹窗')
  await clickByText('关闭')

  // 今日页空态 + 一句话 + 树洞 + 打卡
  await waitText('今天还没打卡')
  await shot('04-今日页-空态')
  await typeByPlaceholder('比如：今天数学卡住了', WORD)
  await shot('05-今日一句话')
  await evalJs(`(() => { const els = Array.from(document.querySelectorAll('*')); const el = els.find(x => x.textContent.trim() === '树洞'); const card = el && el.closest('.card'); if (card) card.click(); return !!card })()`)
  await waitText('只有你能看到')
  await typeByPlaceholder('烦了、累了、想吐槽', '模拟机树洞测试')
  await shot('06-树洞')
  await clickByText('收起')
  await typeByPlaceholder('今天想对自己说的一句话', '模拟机打卡')
  await clickByText('一键打卡')
  await waitText('已打卡')
  await shot('07-打卡成功')
  ok('今日页：一句话/树洞/打卡', true)

  // 专注页
  await clickByText('专注')
  await waitText('番茄钟', 30000)
  await shot('08-专注页')
  ok('专注页', true)

  // 进度页空态
  await clickByText('进度')
  await waitText('还没有真题自测记录')
  await shot('09-进度页-空态')
  ok('进度页空态', true)

  // 备考页 + 题库 + 试卷
  await clickByText('备考')
  await waitText('展开 408 题库')
  await shot('10-备考页-总览')
  await clickByText('展开 408 题库')
  await waitText('真题库', 60000)
  await clickByText('真题库')
  await waitText('真题库共', 60000)
  await shot('11-题库-真题库')
  await clickByText('显示答案', true)
  await waitText('答案：', 15000)
  await shot('12-题库-答案解析')
  await clickByText('试卷模式')
  await evalJs(`(() => {
    const sel = Array.from(document.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.textContent.includes('选择年份')))
    if (!sel) return false
    const opts = Array.from(sel.options).map(o => o.value).filter(Boolean)
    if (opts.length === 0) return false
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, opts[0])
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  await waitText('得分', 30000) // 先等标题出现（选年份后）
  await evalJs(`(() => { const btns = Array.from(document.querySelectorAll('button')); const b = btns.find(x => x.textContent.trim().startsWith('A.')); if (b) b.click(); return !!b })()`)
  await clickByText('交卷')
  await waitText('已记入自测', 30000)
  await shot('13-试卷模式-交卷')
  ok('题库/试卷模式', true)

  // 手动记自测
  await clickByText('返回题库')
  await evalJs('window.scrollTo(0,0)')
  await waitText('记一次自测')
  await typeByPlaceholder('总题数', '10')
  await typeByPlaceholder('做对', '8')
  await clickByText('记录这次自测')
  await waitText('80%', 30000)
  await shot('14-自测记录')
  ok('记自测 10 对 8', true)

  // 进度页有数据
  await clickByText('进度')
  await waitText('80%', 60000)
  await shot('15-进度页-有数据')
  ok('进度页真题口径 80%', true)

  // 悄悄话（学员发）
  await clickByText('悄悄话')
  await evalJs(`(() => !!document.querySelector('input[placeholder^="对 "]'))()`)
  await new Promise((r) => setTimeout(r, 2000))
  await typeByPlaceholder('对 ', MSG)
  await clickByText('发送')
  await waitText(MSG)
  await shot('16-悄悄话-已发送')
  ok('学员发悄悄话', true)

  // ===== 切换督学 =====
  await clickByText('退出')
  await waitText('考研长线陪伴')
  await shot('17-退出回到登录')
  await clickByText('注册')
  await clickByText('督学（你）')
  await typeByPlaceholder('向学员索取 6 位邀请码', code)
  await typeByPlaceholder('起个名字', 'EmuSup')
  await typeByPlaceholder('you@example.com', EMAIL_SUP)
  await typeByPlaceholder('至少 6 位', PASS)
  await clickByText('创建账号')
  await waitText('远程陪伴', 90000)
  await shot('18-督学-陪你页')
  ok('督学配对成功', true)

  await waitText(WORD, 60000)
  await shot('19-督学-看到她写的话')
  ok('督学看到她的今日一句话', true)

  await clickByText('展开')
  await waitText('真题平均正确率', 20000)
  await waitText('真题 2 次', 60000)
  await shot('20-督学-她的数据')
  ok('督学看到 2 次真题记录', true)

  await clickByText('悄悄话')
  await waitText(MSG, 60000)
  await shot('21-督学-收到悄悄话')
  ok('督学收到悄悄话', true)
  await evalJs(`(() => !!document.querySelector('input[placeholder^="对 "]'))()`)
  await new Promise((r) => setTimeout(r, 2000))
  await typeByPlaceholder('对 ', REPLY)
  await clickByText('发送')
  await waitText(REPLY)
  await shot('22-督学-回复成功')
  ok('督学回复成功', true)
} catch (e) {
  ok('执行中断：' + e.message, false)
} finally {
  ws.close()
}

writeFileSync(OUT + '/summary.json', JSON.stringify({ ts: new Date().toISOString(), accounts: { student: EMAIL_STU, supervisor: EMAIL_SUP, password: PASS }, results }, null, 2), 'utf-8')
const passCount = results.filter((r) => r.pass).length
console.log(`\n结果: ${passCount}/${results.length} 通过`)
process.exit(results.every((r) => r.pass) ? 0 : 1)
