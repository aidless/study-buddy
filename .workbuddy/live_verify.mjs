import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/live_verify.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  const issues = []
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) issues.push('[' + m.type() + '] ' + m.text().slice(0, 250)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + e.message.slice(0, 250)))
  await page.evaluateOnNewDocument(() => { window.addEventListener('unhandledrejection', (e) => console.error('UNH: ' + String(e.reason && (e.reason.message || e.reason) || e.reason).slice(0, 200))) })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('https://study-buddy.surge.sh', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(3000)
  let t = await page.evaluate(() => document.body.innerText)
  log('线上首页: ' + (t.includes('督学') && (t.includes('登录') || t.includes('注册')) ? 'OK' : 'CHECK') + '\n')
  log('首屏片段: ' + t.slice(0, 120).replace(/\n/g, ' | ') + '\n')
  // 注册
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(500)
  await type('起个名字', '线上测'); await type('you@example.com', `live-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 20; i++) { await sleep(2000); const tt = await page.evaluate(() => document.body.innerText); if (tt.includes('今日打卡')) { ok = true; break } }
  log('线上注册成功: ' + ok + '\n')
  if (!ok) { const tt = await page.evaluate(() => document.body.innerText); log('注册失败页: ' + tt.slice(0, 200).replace(/\n/g, ' | ') + '\n'); process.exit(1) }
  await tapTab('自测'); await sleep(5000)
  t = await page.evaluate(() => document.body.innerText)
  log('自测页: ' + (t.includes('AI 名师') ? 'OK' : 'FAIL') + '\n')
  // AI 名师提问（线上函数）
  const inp = await page.evaluateHandle(() => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes('向老师提问')) || null)
  const el = inp.asElement()
  if (el) { await el.click(); await el.type('一句话解释 LRU 页面置换', { delay: 15 }) }
  await sleep(300)
  await click('发送')
  await sleep(20000)
  t = await page.evaluate(() => document.body.innerText)
  log('AI 名师线上回复: ' + (t.includes('LRU') || t.includes('最近') || t.includes('淘汰') ? 'OK' : 'CHECK') + '\n')
  log('运行时问题数: ' + issues.length + '\n')
  issues.forEach((i) => log('  ' + i + '\n'))
  log('done\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
