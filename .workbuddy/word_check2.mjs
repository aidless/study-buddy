import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/word_check2.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  await click('注册'); await sleep(300)
  await type('起个名字', '字检2'); await type('you@example.com', `word2-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 12; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  if (!ok) { log('REG FAIL\n'); process.exit(1) }
  await sleep(1000)
  const th = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')) || null)
  const ta = th.asElement()
  await ta.click()
  await page.keyboard.type('今天数学卡住了，但没放弃', { delay: 20 })
  await sleep(400)
  // 读输入框值和字数计数
  const before = await page.evaluate(() => {
    const ta = [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句'))
    const counter = [...document.querySelectorAll('span.tiny')].map((s) => s.textContent).find((t) => t.includes('/60'))
    return { value: ta ? ta.value : null, counter: counter || '' }
  })
  log('before save: value=' + JSON.stringify(before.value) + ' counter=' + before.counter + '\n')
  await click('写下来')
  await sleep(2500)
  const t1 = await page.evaluate(() => document.body.innerText)
  log('after save button state: ' + (t1.includes('已写好啦') || t1.includes('写下来')) + '\n')
  // 拿邀请码，查库
  await click('邀请码'); await sleep(600)
  const code = await page.evaluate(() => { const d = document.querySelector('.code-display'); return d ? d.textContent.trim() : '' })
  log('code: ' + code + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
