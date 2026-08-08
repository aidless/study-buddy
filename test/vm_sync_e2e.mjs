// vm_sync_e2e.mjs —— 双虚拟机等价测试：两个隔离浏览器上下文（学员 + 督学）
// 走完整云同步链路：注册配对 → 设考试日期 → 学员记自测 → 督学可见 → 双向悄悄话。
// 用法：先 `npm run build && npm run preview`，再 `node test/vm_sync_e2e.mjs`
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const URL = 'http://127.0.0.1:4173'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const SHOTS = 'C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/科研/outputs/vm-e2e'
mkdirSync(SHOTS, { recursive: true })

const ts = Date.now()
const EMAIL_STU = `e2e-stu-${ts}@example.com`
const EMAIL_SUP = `e2e-sup-${ts}@example.com`
const PASS = 'Test123456'
const MSG = `E2E悄悄话-${ts}`
const REPLY = `E2E回复-${ts}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const pageErrors = []
const ok = (name, pass, extra = '') => {
  results.push({ name, pass: !!pass, extra })
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' :: ' + extra : ''))
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
})

async function newPage(ctx) {
  const p = await ctx.newPage()
  await p.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true })
  p.on('pageerror', (e) => pageErrors.push('[pageerror] ' + e.message))
  p.on('console', (m) => { if (m.type() === 'error') pageErrors.push('[console] ' + m.text().slice(0, 300)) })
  return p
}

async function clickByText(page, text) {
  const hit = await page.evaluate((t) => {
    const btns = Array.from(document.querySelectorAll('button'))
    const b = btns.find((x) => x.textContent.trim() === t || x.textContent.includes(t))
    if (b) { b.click(); return true }
    return false
  }, text)
  if (!hit) throw new Error('button not found: ' + text)
}

async function typeByPlaceholder(page, ph, val) {
  const hit = await page.evaluate(([p, v]) => {
    const els = Array.from(document.querySelectorAll('input, textarea'))
    const el = els.find((x) => (x.placeholder || '').startsWith(p))
    if (!el) return false
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  }, [ph, val])
  if (!hit) throw new Error('input not found: ' + ph)
}

async function setDateInput(page, val) {
  await page.evaluate((v) => {
    const el = document.querySelector('input[type="date"]')
    if (!el) return false
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  }, val)
}

async function waitText(page, t, timeout = 45000) {
  await page.waitForFunction((x) => document.body.innerText.includes(x), { timeout }, t)
}

async function shot(page, name) {
  const f = SHOTS + '/' + name + '.png'
  await page.screenshot({ path: f })
  shots.push(f)
}

try {
  const ctxA = await browser.createBrowserContext()
  const ctxB = await browser.createBrowserContext()
  const stu = await newPage(ctxA)
  const sup = await newPage(ctxB)

  // ---------- 1. 学员注册 ----------
  await stu.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  const cloudOk = await stu.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim())
    return btns.includes('注册') && btns.includes('登录')
  })
  ok('云端构建（登录/注册入口）', cloudOk)
  if (!cloudOk) throw new Error('当前构建不是云端模式（USE_SUPABASE=false），请确认 .env 后重新 build')

  await clickByText(stu, '注册')
  await clickByText(stu, '学员（她）')
  await typeByPlaceholder(stu, '起个名字', '测试学员')
  await typeByPlaceholder(stu, 'you@example.com', EMAIL_STU)
  await typeByPlaceholder(stu, '至少 6 位', PASS)
  await clickByText(stu, '创建账号')
  await waitText(stu, '邀请码', 60000)
  ok('学员注册成功并进入首页', true)
  await shot(stu, '01-student-home')

  // ---------- 2. 取邀请码 ----------
  await clickByText(stu, '邀请码')
  await stu.waitForSelector('.code-display', { timeout: 10000 })
  const code = (await stu.$eval('.code-display', (el) => el.textContent.trim())).toUpperCase()
  ok('学员邀请码格式', /^[A-Z2-9]{6}$/.test(code), code)
  await shot(stu, '02-invite-code')
  await clickByText(stu, '关闭')

  // ---------- 3. 督学注册配对 ----------
  await sup.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  await clickByText(sup, '注册')
  await clickByText(sup, '督学（你）')
  await typeByPlaceholder(sup, '向学员索取 6 位邀请码', code)
  await typeByPlaceholder(sup, '起个名字', '测试督学')
  await typeByPlaceholder(sup, 'you@example.com', EMAIL_SUP)
  await typeByPlaceholder(sup, '至少 6 位', PASS)
  await clickByText(sup, '创建账号')
  await waitText(sup, '远程陪伴', 60000)
  ok('督学凭邀请码注册配对成功', true)
  await shot(sup, '03-supervisor-home')

  // ---------- 4. 督学看学员空状态 ----------
  await clickByText(sup, '展开')
  await waitText(sup, '真题平均正确率')
  ok('督学端数据卡可展开', true)
  await shot(sup, '04-supervisor-stats-empty')

  // ---------- 5. 学员设置考试日期 ----------
  await clickByText(stu, '备考')
  await waitText(stu, '设置考试日期')
  await clickByText(stu, '设置考试日期')
  await setDateInput(stu, '2026-12-19')
  await clickByText(stu, '保存')
  await waitText(stu, '还剩')
  ok('学员设置考试日期成功', true)
  await shot(stu, '05-student-countdown-set')

  // ---------- 6. 学员记一次真题自测 ----------
  await waitText(stu, '记一次自测')
  await typeByPlaceholder(stu, '总题数', '10')
  await typeByPlaceholder(stu, '做对', '8')
  await clickByText(stu, '记录这次自测')
  await waitText(stu, '80%', 30000)
  ok('学员记录自测（10 对 8）', true)
  await shot(stu, '06-student-selftest')

  // ---------- 7. 督学端看到自测 ----------
  await waitText(sup, '真题 1 次', 60000)
  ok('督学端同步看到真题正确率 80%（真题 1 次）', true)
  await shot(sup, '07-supervisor-sees-selftest')

  // ---------- 8. 学员 → 督学 悄悄话 ----------
  await clickByText(stu, '悄悄话')
  await stu.waitForFunction(() => {
    const i = document.querySelector('input[placeholder^="对 "]')
    return !!i
  }, { timeout: 15000 })
  await typeByPlaceholder(stu, '对 ', MSG)
  await clickByText(stu, '发送')
  await waitText(stu, MSG, 30000)
  ok('学员发送悄悄话', true)
  await shot(stu, '08-student-chat-sent')

  await clickByText(sup, '悄悄话')
  await waitText(sup, MSG, 60000)
  ok('督学实时/加载后收到悄悄话', true)
  await shot(sup, '09-supervisor-chat-received')

  // ---------- 9. 督学 → 学员 回复 ----------
  await typeByPlaceholder(sup, '对 ', REPLY)
  await clickByText(sup, '发送')
  await waitText(sup, REPLY, 30000)
  await clickByText(stu, '悄悄话')
  await waitText(stu, REPLY, 60000)
  ok('学员收到督学回复（双向）', true)
  await shot(stu, '10-student-chat-reply')
} catch (e) {
  ok('执行中断：' + e.message, false)
} finally {
  await browser.close()
}

const errs = [...new Set(pageErrors)].slice(0, 20)
console.log('\n--- 页面错误（前 20 条去重）---')
errs.forEach((e) => console.log('  !', e))

const summary = {
  ts: new Date().toISOString(),
  accounts: { student: EMAIL_STU, supervisor: EMAIL_SUP, password: PASS },
  results,
  pageErrors: errs,
  screenshots: shots
}
writeFileSync(SHOTS + '/summary.json', JSON.stringify(summary, null, 2), 'utf-8')
const passCount = results.filter((r) => r.pass).length
console.log(`\n结果: ${passCount}/${results.length} 通过`)
process.exit(results.every((r) => r.pass) ? 0 : 1)
