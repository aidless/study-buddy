import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/word_check.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) log('[c] ' + m.text().slice(0, 250) + '\n') })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  await click('注册'); await sleep(300)
  await type('起个名字', '字检')
  await type('you@example.com', `word-${ts}@example.com`)
  await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 12; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  if (!ok) { log('REGISTER FAIL\n'); process.exit(1) }
  log('registered\n')
  // 用真实输入键入今日一句话
  const th = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')) || null)
  const ta = th.asElement()
  await ta.click()
  await ta.type('今天也要加油呀', { delay: 30 })
  await sleep(400)
  await click('写下来')
  await sleep(2500)
  const t1 = await page.evaluate(() => document.body.innerText)
  log('readback contains: ' + t1.includes('今天也要加油呀') + '\n')
  log('today section: ' + (t1.match(/今日一句话[\s\S]{0,120}/) || [''])[0].replace(/\n/g, ' ') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
