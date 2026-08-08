import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/couple_check.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (m.type() === 'error') log('[c] ' + m.text().slice(0, 250) + '\n') })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (sel, txt, val) => { const h = await page.evaluateHandle((sel, txt) => [...document.querySelectorAll(sel)].find((e) => (e.placeholder || '').includes(txt)) || null, sel, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  // 1) 学员注册 + 写今日一句话
  await click('注册'); await sleep(300)
  await type('input', '起个名字', '她'); await type('input', 'you@example.com', `she-${ts}@example.com`); await type('input', '至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 12; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  if (!ok) { log('she register FAIL\n'); process.exit(1) }
  log('she registered\n')
  // 拿邀请码
  await click('邀请码'); await sleep(800)
  let code = await page.evaluate(() => { const d = document.querySelector('.code-display'); return d ? d.textContent.trim() : '' })
  await page.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('关闭')); el && el.click() })
  log('invite code: ' + code + '\n')
  // 写一句话
  const th = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')) || null)
  const ta = th.asElement()
  await ta.click(); await ta.type('今天数学卡住了，但没放弃', { delay: 25 })
  await sleep(300); await click('写下来'); await sleep(2000)
  log('she saved word\n')
  // 2) 督学注册（用邀请码）
  await click('退出'); await sleep(1200)
  await click('注册'); await sleep(300)
  await page.evaluate(() => { const els = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('督学（你）')); els && els.click() })
  await sleep(300)
  await type('input', '向学员索要', code)
  await type('input', '起个名字', '他'); await type('input', 'you@example.com', `he-${ts}@example.com`); await type('input', '至少 6 位', 'Test123456')
  await click('创建账号')
  ok = false
  for (let i = 0; i < 12; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日一句话') && t.includes('远程陪伴')) { ok = true; break } }
  if (!ok) { log('he register FAIL\n'); const t = await page.evaluate(() => document.body.innerText); log('he page: ' + t.slice(0, 200).replace(/\n/g, ' ') + '\n'); process.exit(1) }
  log('he registered (supervisor)\n')
  await sleep(2500)
  const t = await page.evaluate(() => document.body.innerText)
  log('supervisor sees her word: ' + t.includes('今天数学卡住了，但没放弃') + '\n')
  log('sv page sample: ' + t.slice(0, 400).replace(/\n/g, ' | ') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
