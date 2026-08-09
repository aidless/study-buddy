// 审计C2：想被夸 / 备份入口 / 悄悄话回读（修正点击 div）
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/audit_c2_result.json'
const BASE = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = [], issues = []
const log = (k, ok, extra = '') => { results.push({ k, ok: !!ok, extra }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + k + (extra ? ' :: ' + extra : '')) }
let browser
try {
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const ctxA = await browser.createBrowserContext()
  const ctxB = await browser.createBrowserContext()
  const pageA = await ctxA.newPage()
  const pageB = await ctxB.newPage()
  await pageA.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await pageB.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  const watch = (page, tag) => {
    page.on('console', (m) => { if (m.type() === 'error') issues.push(`[${tag}.console.error] ` + m.text().slice(0, 220)) })
    page.on('pageerror', (e) => issues.push(`[${tag}.pageerror] ` + String(e.message).slice(0, 220)))
    page.on('dialog', async (d) => { try { await d.accept() } catch {} })
  }
  watch(pageA, 'A'); watch(pageB, 'B')
  const clickBtn = (page) => async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const clickDiv = (page) => async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('div')].find((e) => (e.textContent || '').trim() === txt); if (el) el.click() }, txt); await sleep(wait) }
  const bodyText = (page) => page.evaluate(() => document.body.innerText)
  const waitText = (page) => async (txt, timeout = 25000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(page); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = (page) => async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await pageA.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickBtn(pageA)('注册')
  await typeByPh(pageA)('起个名字', '学员小花')
  await typeByPh(pageA)('you@example.com', `st2-${Date.now()}@example.com`)
  await typeByPh(pageA)('至少 6 位', 'Test123456')
  await clickBtn(pageA)('创建账号')
  await waitText(pageA)('今日打卡', 30000)
  await clickBtn(pageA)('邀请码')
  await sleep(800)
  const code = await pageA.evaluate(() => { const el = document.querySelector('.code-display'); return el ? el.textContent.trim() : '' })
  await pageA.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('关闭')); if (b) b.click() })
  log('邀请码', /^[A-Z0-9]{6}$/.test(code), code)

  await pageB.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickBtn(pageB)('注册')
  await clickBtn(pageB)('督学（你）')
  await typeByPh(pageB)('向学员索要 6 位邀请码', code)
  await typeByPh(pageB)('起个名字', '督学小强')
  await typeByPh(pageB)('you@example.com', `sv2-${Date.now()}@example.com`)
  await typeByPh(pageB)('至少 6 位', 'Test123456')
  await clickBtn(pageB)('创建账号')
  log('配对', await waitText(pageB)('远程陪伴', 30000))

  // A 想被夸（点 div）
  await pageA.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(800)
  await clickDiv(pageA)('想被夸')
  await sleep(3000)
  // B 刷新后应看到
  await pageB.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3500)
  const tB = await bodyText(pageB)
  log('督学看到想被夸', tB.includes('想被夸'), tB.includes('想被夸') ? 'OK' : tB.slice(-120).replace(/\n/g, '|'))

  // B 送一句 → A 刷新看到
  await clickBtn(pageB)('今天也辛苦啦')
  await sleep(2500)
  await pageA.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3500)
  const tA = await bodyText(pageA)
  log('学员看到鼓励', tA.includes('送你的鼓励') && tA.includes('今天也辛苦啦'), '')

  // 悄悄话双向（各自刷新验证）
  await pageA.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('悄悄话')); if (el) el.click() })
  await sleep(1800)
  await typeByPh(pageA)('写一句悄悄话', '第2轮测试消息A')
  await pageA.keyboard.press('Enter')
  await sleep(2500)
  await pageB.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('悄悄话')); if (el) el.click() })
  await sleep(2000)
  log('督学收到A消息', (await bodyText(pageB)).includes('第2轮测试消息A'), '')
  await typeByPh(pageB)('写一句悄悄话', '第2轮测试消息B')
  await pageB.keyboard.press('Enter')
  await sleep(2500)
  await pageA.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3500)
  await pageA.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('悄悄话')); if (el) el.click() })
  await sleep(1800)
  log('学员刷新后看到B回复', (await bodyText(pageA)).includes('第2轮测试消息B'), '')

  // 数据备份入口
  await pageA.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(800)
  await clickDiv(pageA)('数据备份')
  await sleep(1000)
  log('数据备份弹窗(导出JSON)', (await bodyText(pageA)).includes('导出 JSON 备份'), '')

  const unique = [...new Set(issues)]
  console.log('---')
  console.log('运行期问题总数:', unique.length)
  unique.slice(0, 12).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync(OUT, JSON.stringify({ results, issues: unique.slice(0, 25), passed: results.filter((r) => r.ok).length, total: results.length }, null, 2))
} catch (e) {
  console.log('FATAL:', e.message)
  writeFileSync(OUT, JSON.stringify({ fatal: e.message, results, issues: issues.slice(0, 25) }, null, 2))
} finally {
  if (browser) await browser.close()
}
process.exit(0)
