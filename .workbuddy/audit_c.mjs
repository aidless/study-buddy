// 审计C：学员-督学配对 + 双向功能（鼓励/想被夸/复活卡/悄悄话/今日一句话/学习进度/备份）
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/audit_c_result.json'
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
  const clickInc = (page) => async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const bodyText = (page) => page.evaluate(() => document.body.innerText)
  const waitText = (page) => async (txt, timeout = 25000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(page); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = (page) => async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  // A: 学员注册
  await pageA.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc(pageA)('注册')
  await typeByPh(pageA)('起个名字', '学员阿花')
  await typeByPh(pageA)('you@example.com', `st-${Date.now()}@example.com`)
  await typeByPh(pageA)('至少 6 位', 'Test123456')
  await clickInc(pageA)('创建账号')
  log('学员注册', await waitText(pageA)('今日打卡', 30000))
  // 取邀请码
  await clickInc(pageA)('邀请码')
  await sleep(1000)
  const code = await pageA.evaluate(() => { const el = document.querySelector('.code-display'); return el ? el.textContent.trim() : '' })
  await pageA.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('关闭')); if (b) b.click() })
  log('邀请码生成', /^[A-Z0-9]{6}$/.test(code), code)

  // B: 督学注册配对
  await pageB.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc(pageB)('注册')
  await clickInc(pageB)('督学（你）')
  await typeByPh(pageB)('向学员索要 6 位邀请码', code)
  await typeByPh(pageB)('起个名字', '督学阿强')
  await typeByPh(pageB)('you@example.com', `sv-${Date.now()}@example.com`)
  await typeByPh(pageB)('至少 6 位', 'Test123456')
  await clickInc(pageB)('创建账号')
  log('督学用邀请码配对', await waitText(pageB)('远程陪伴', 30000))

  // B: 今日一句话
  await pageB.evaluate(() => { const ta = document.querySelector('textarea[placeholder*="给她写句"]'); if (ta) { const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; set.call(ta, '今天也辛苦啦'); ta.dispatchEvent(new Event('input', { bubbles: true })) } })
  await sleep(600)
  // A 刷新看到
  await pageA.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3500)
  log('学员看到督学今日一句话', (await bodyText(pageA)).includes('今天也辛苦啦'), '')

  // B: 送她一句
  await clickInc(pageB)('今天也辛苦啦')
  await sleep(2000)
  await pageA.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3500)
  let tA = await bodyText(pageA)
  log('学员看到鼓励卡片', tA.includes('送你的鼓励') && tA.includes('今天也辛苦啦'), tA.includes('送你的鼓励') ? '有卡片' : '无')

  // A: 想被夸 → B 看到
  await pageA.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(800)
  await clickInc(pageA)('想被夸')
  await sleep(2500)
  await pageB.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3500)
  const tB = await bodyText(pageB)
  log('督学看到想被夸提示', tB.includes('想被夸'), '')

  // B: 送复活卡（新学员最近7天肯定有断卡日）
  await clickInc(pageB)('送张复活卡')
  await sleep(3000)
  const tB2 = await bodyText(pageB)
  log('复活卡发送', tB2.includes('已为她补上') || tB2.includes('补上'), tB2.includes('已为她补上') ? 'OK' : tB2.slice(0, 60).replace(/\n/g, '|'))

  // A: 悄悄话 → B 看到；B 回 → A 看到
  await pageA.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('悄悄话')); if (el) el.click() })
  await sleep(1800)
  await typeByPh(pageA)('写一句悄悄话', '我今天刷完了一套真题')
  await pageA.keyboard.press('Enter')
  await sleep(2500)
  await pageB.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('悄悄话')); if (el) el.click() })
  await sleep(2000)
  log('督学收到悄悄话', (await bodyText(pageB)).includes('我今天刷完了一套真题'), '')
  await typeByPh(pageB)('写一句悄悄话', '很棒，继续保持')
  await pageB.keyboard.press('Enter')
  await sleep(2500)
  await pageA.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('悄悄话')); if (el) el.click() })
  await sleep(2000)
  log('学员收到回复', (await bodyText(pageA)).includes('很棒，继续保持'), '')

  // B: 学习进度置底 + 实时状态
  await pageB.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes('陪你')); if (el) el.click() })
  await sleep(2500)
  const tB3 = await bodyText(pageB)
  log('督学端学习进度可见', tB3.includes('学习进度') || tB3.includes('连续'), '')

  // A: 更多工具 → 数据备份入口
  await pageA.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(800)
  await clickInc(pageA)('数据备份')
  await sleep(1000)
  tA = await bodyText(pageA)
  log('数据备份入口(导出JSON)', tA.includes('导出 JSON 备份'), '')

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
