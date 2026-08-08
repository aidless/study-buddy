import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/aitutor_verify.log'
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
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '名师测'); await type('you@example.com', `tutor-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('自测'); await sleep(4000)
  let t = await page.evaluate(() => document.body.innerText)
  log('AI 名师卡片: ' + (t.includes('AI 名师') ? 'OK' : 'FAIL') + '\n')
  // 输入问题
  const inp = await page.evaluateHandle(() => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes('向老师提问')) || null)
  const el = inp.asElement()
  if (el) { await el.click(); await el.type('帮我讲一下 LRU 页面置换算法', { delay: 15 }) }
  await sleep(300)
  await click('发送')
  await sleep(12000)
  t = await page.evaluate(() => document.body.innerText)
  log('AI 回复到达: ' + (t.includes('LRU') || t.includes('页面') || t.includes('淘汰') ? 'OK' : 'CHECK') + '\n')
  const ai = t.match(/AI 名师[\s\S]{0,600}/)
  log('片段: ' + (ai ? ai[0].slice(0, 400).replace(/\n/g, ' | ') : '(none)') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
