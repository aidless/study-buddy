import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/mark_dbg.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) log('[c] ' + m.text().slice(0, 300) + '\n') })
  page.on('pageerror', (e) => log('[pageerror] ' + e.message.slice(0, 300) + '\n'))
  await page.evaluateOnNewDocument(() => { window.addEventListener('unhandledrejection', (e) => console.error('UNH: ' + String(e.reason && (e.reason.message || e.reason) || e.reason).slice(0, 250))) })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '评测'); await type('you@example.com', `mark-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('自测'); await sleep(4000)
  await click('英语一'); await sleep(2500)
  await click('浏览全部题目'); await sleep(1200)
  await click('写/做得不错')
  for (let i = 0; i < 8; i++) { await sleep(500); const t = await page.evaluate(() => document.body.innerText); if (t.includes('已记入自测')) { log('已记入自测 OK at +' + ((i+1)*0.5) + 's\n'); break } }
  const t = await page.evaluate(() => document.body.innerText)
  log('final contains 已记入: ' + t.includes('已记入自测') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
