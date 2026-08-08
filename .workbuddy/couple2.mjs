import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/couple2.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (m.type() === 'error') log('[c] ' + m.text().slice(0, 300) + '\n') })
  page.on('dialog', async (d) => { log('[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(1000)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (sel, txt, val) => { const h = await page.evaluateHandle((sel, txt) => [...document.querySelectorAll(sel)].find((e) => (e.placeholder || '').includes(txt)) || null, sel, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  // 学员
  await click('注册'); await sleep(400)
  await type('input', '起个名字', '她2'); await type('input', 'you@example.com', `she2-${ts}@example.com`); await type('input', '至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  if (!ok) { log('SHE REG FAIL\n'); process.exit(1) }
  await sleep(2000)
  log('she registered\n')
  const ta = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')) || null)
  const tel = ta.asElement()
  await tel.click()
  await page.keyboard.type('今天数学卡住了，但没放弃', { delay: 20 })
  await sleep(500)
  const before = await page.evaluate(() => {
    const ta = [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句'))
    const counter = [...document.querySelectorAll('.tiny')].map((s) => s.textContent).find((t) => t && t.includes('/60'))
    return { v: ta ? ta.value : null, c: counter || '' }
  })
  log('before save: ' + JSON.stringify(before) + '\n')
  await click('写下来')
  await sleep(3000)
  const t1 = await page.evaluate(() => document.body.innerText)
  log('after save: hasErr=' + t1.includes('保存失败') + ' btn=' + (t1.includes('已写好啦') ? 'saved' : 'normal') + '\n')
  await click('邀请码'); await sleep(700)
  const code = await page.evaluate(() => { const d = document.querySelector('.code-display'); return d ? d.textContent.trim() : '' })
  await page.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('关闭')); el && el.click() })
  log('code: ' + code + '\n')
  // 督学
  await click('退出'); await sleep(1500)
  await click('注册'); await sleep(400)
  await page.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('督学（你）')); el && el.click() })
  await sleep(400)
  await type('input', '向学员索要', code)
  await type('input', '起个名字', '他2'); await type('input', 'you@example.com', `he2-${ts}@example.com`); await type('input', '至少 6 位', 'Test123456')
  await click('创建账号')
  ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日一句话')) { ok = true; break } }
  if (!ok) { log('HE REG FAIL\n'); process.exit(1) }
  await sleep(3500)
  const t2 = await page.evaluate(() => document.body.innerText)
  log('supervisor sees word: ' + t2.includes('今天数学卡住了，但没放弃') + '\n')
  log('sv snippet: ' + (t2.match(/今日一句话[\s\S]{0,100}/) || [''])[0].replace(/\n/g, ' | ') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
