import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/audit.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  const issues = []
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) issues.push('[' + m.type() + '] ' + m.text().slice(0, 300)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + e.message.slice(0, 300)))
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', (e) => { console.error('UNHANDLED: ' + (e.reason && (e.reason.message || e.reason) || e.reason || '').toString().slice(0, 200)) })
  })
  page.on('dialog', async (d) => { log('[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  log('loaded\n')
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '审阅员')
  await type('you@example.com', `audit-${ts}@example.com`)
  await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 12; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; log('registered t+' + ((i+1)*2) + 's\n'); break } }
  if (!ok) { log('REGISTER FAILED\n'); process.exit(1) }

  // 今日一句话写读闭环
  await page.evaluate(() => { const el = [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')); el && (el.value = '今天也要加油呀'); const ev = new Event('input', { bubbles: true }); el && el.dispatchEvent(ev) })
  await sleep(300)
  await click('写下来')
  await sleep(2000)
  const todayText = await page.evaluate(() => document.body.innerText)
  log('today word readback: ' + (todayText.includes('今天也要加油呀') ? 'OK' : 'FAIL') + '\n')

  // 走查各 Tab
  for (const tab of ['专注', '备考', '自测', '进度', '悄悄话']) {
    await tapTab(tab)
    await sleep(2500)
    const t = await page.evaluate(() => document.body.innerText)
    log(`tab ${tab}: ${t.length} chars, sample=${t.slice(0, 60).replace(/\n/g, ' ')}\n`)
  }
  // 自测开考试：答 1 选择 + 评 1 大题
  await tapTab('自测')
  await sleep(2000)
  await click('开始随机考试')
  await sleep(1500)
  // 走到大题（最多点 40 次下一题）
  let essaySeen = false
  for (let i = 0; i < 42; i++) {
    const isEssay = await page.evaluate(() => (document.body.innerText || '').includes('大题 · ') || (document.body.innerText || '').includes('大题（自评'))
    if (isEssay) { essaySeen = true; break }
    await page.evaluate(() => { const n = [...document.querySelectorAll('.quiz-nav button')].find((b) => (b.textContent || '').includes('下一题')); n && n.click() })
    await sleep(150)
  }
  log('exam essay reached: ' + essaySeen + '\n')
  if (essaySeen) {
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').includes('做对了')); b && b.click() })
  } else {
    await page.evaluate(() => { const o = document.querySelector('.quiz-opt'); o && o.click() })
  }
  await click('交卷')
  await sleep(3000)
  const res = await page.evaluate(() => document.body.innerText)
  log('exam result ok: ' + (res.includes('考试结果') ? 'OK' : 'FAIL') + '\n')

  log('=== issues found: ' + issues.length + ' ===\n')
  issues.forEach((i) => log('  ' + i + '\n'))
  log('done\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
