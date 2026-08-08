import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/probe3.log'
const log = (s) => { appendFileSync(LOG, s + '\n') }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (m.type() === 'error') log('[err] ' + m.text().slice(0, 200) + '\n') })
  page.on('dialog', async (d) => { log('[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 20000 })
  log('loaded\n')
  await sleep(1000)
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NOTFOUND'; await el.click(); await el.type(val); return 'ok' }
  await type('you@example.com', 'u-pv-1786159490551@example.com')
  await type('至少 6 位', 'Test123456')
  await page.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('进入')); el && el.click() })
  let loggedIn = false
  for (let i = 0; i < 10; i++) {
    await sleep(2000)
    const t = await page.evaluate(() => document.body.innerText)
    if (t.includes('今日打卡')) { loggedIn = true; log('logged in t+' + ((i + 1) * 2) + 's\n'); break }
  }
  if (!loggedIn) { log('NOT LOGGED\n'); process.exit(1) }
  await page.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === '进度'); el && el.click() })
  for (let i = 0; i < 8; i++) {
    await sleep(2000)
    const t = await page.evaluate(() => document.body.innerText)
    const has = ['学习进度', '连续天数', '进度加载'].filter((k) => t.includes(k))
    log(`t+${(i + 1) * 2}s: ${has.length ? has.join(',') : '(骨架/空)'}\n`)
    if (has.includes('连续天数')) break
  }
  const t2 = await page.evaluate(() => document.body.innerText)
  log('进度内容: ' + t2.slice(0, 700).replace(/\n/g, ' | ') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
  log('done\n')
}
process.exit(0)
