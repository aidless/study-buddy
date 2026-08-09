// 线上站点考试全遍历验证（含图题 + 60 秒稳定性）
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const issues = []
let browser
try {
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  page.on('console', (m) => { if (m.type() === 'error') issues.push('[console.error] ' + m.text().slice(0, 260)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + String(e.message).slice(0, 260)))
  page.on('requestfailed', (r) => issues.push('[reqfail] ' + r.url().slice(0, 180) + ' :: ' + (r.failure()?.errorText || '')))
  page.on('dialog', async (d) => { try { await d.accept() } catch {} })
  const clickInc = async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1800) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 25000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await page.goto('https://study-buddy.surge.sh', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(3000)
  await clickInc('注册')
  await typeByPh('起个名字', '线上终测')
  await typeByPh('you@example.com', `live-e2e-${Date.now()}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  if (!(await waitText('今日打卡', 30000))) { console.log('注册失败'); process.exit(1) }
  await tapTab('自测')
  await waitText('正式考试', 20000)
  await clickInc('按年份')
  await page.evaluate(() => { const sel = document.querySelector('select'); if (sel) { sel.value = '2009'; sel.dispatchEvent(new Event('change', { bubbles: true })) } })
  await sleep(500)
  await clickInc('开始该年考试', 3000)
  let alive = true, fig = 0, qs = 0
  const start = Date.now()
  for (let i = 1; i <= 47 && alive; i++) {
    const info = await page.evaluate(() => { const f = document.querySelector('.quiz-body .qfig'); const svg = f && f.querySelector('svg'); const r = svg && svg.getBoundingClientRect(); return { fig: !!f, w: r ? Math.round(r.width) : 0, alive: !!document.querySelector('.quiz-overlay') } })
    alive = info.alive
    if (!alive) break
    if (info.fig) { fig++; if (info.w < 300) issues.push('[fig-small] Q' + i + ' w=' + info.w) }
    qs++
    await page.evaluate(() => { const opt = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on')); if (opt) opt.click(); else { const ok = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做对了')); if (ok) ok.click() } })
    await sleep(200)
    const last = await page.evaluate(() => { const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '下一题'); if (n) { n.click(); return false } return true })
    await sleep(280)
    if (last) break
  }
  console.log('线上考试: qs=' + qs + ' fig=' + fig + ' alive=' + alive + ' 用时=' + Math.round((Date.now() - start) / 1000) + 's')
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷'); if (s) s.click() })
  await sleep(5000)
  const t = await bodyText()
  console.log('交卷判分:', t.includes('考试结果') ? 'OK' : 'CHECK', '|', t.slice(0, 100).replace(/\n/g, '|'))
  const unique = [...new Set(issues)]
  console.log('问题总数:', unique.length)
  unique.slice(0, 10).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync('F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/live_exam_result.json', JSON.stringify({ qs, fig, alive, issues: unique.slice(0, 20) }, null, 2))
} catch (e) {
  console.log('FATAL:', e.message)
} finally {
  if (browser) await browser.close()
}
process.exit(0)
