import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/timing.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (m.type() === 'error') log('[c] ' + m.text().slice(0, 250) + '\n') })
  page.on('dialog', async (d) => { log('[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(1000)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  await click('注册'); await sleep(300)
  await type('起个名字', '时检'); await type('you@example.com', `time-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  const t0 = Date.now()
  await click('创建账号')
  for (let i = 0; i < 12; i++) {
    await sleep(1000)
    const st = await page.evaluate(() => {
      const tas = [...document.querySelectorAll('textarea')].map((e) => (e.placeholder || '').slice(0, 12))
      const hasToday = (document.body.innerText || '').includes('今日打卡')
      const hasWord = (document.body.innerText || '').includes('今日一句话')
      return { tas, hasToday, hasWord }
    })
    log(`t+${Math.round((Date.now() - t0) / 1000)}s: textareas=${JSON.stringify(st.tas)} today=${st.hasToday} word=${st.hasWord}\n`)
    if (st.hasWord && st.tas.length) break
  }
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
