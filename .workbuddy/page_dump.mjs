import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/page_dump.log'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, '')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) appendFileSync(LOG, '[c] ' + m.text().slice(0, 300) + '\n') })
  page.on('dialog', async (d) => { appendFileSync(LOG, '[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  await click('注册'); await sleep(300)
  await type('起个名字', 'dump'); await type('you@example.com', `dump-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  await sleep(7000)
  const t = await page.evaluate(() => document.body.innerText)
  appendFileSync(LOG, 'PAGE:\n' + t + '\n')
  const areas = await page.evaluate(() => [...document.querySelectorAll('textarea')].map((e) => e.placeholder || ''))
  appendFileSync(LOG, 'TEXTAREAS: ' + JSON.stringify(areas) + '\n')
} catch (e) {
  appendFileSync(LOG, 'ERR ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
