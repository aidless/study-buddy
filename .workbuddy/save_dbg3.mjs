import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/save_dbg3.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) log('[c] ' + m.text().slice(0, 250) + '\n') })
  await page.evaluateOnNewDocument(() => { window.addEventListener('unhandledrejection', (e) => console.error('UNH: ' + String(e.reason && (e.reason.message || e.reason) || e.reason).slice(0, 200))) })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '存测3'); await type('you@example.com', `sv3-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('备考')
  await sleep(4500)
  await type('满分 500', '350')
  await sleep(300)
  // 精准点击：包含 满分 500 输入框的卡片里的"保存"按钮
  const clicked = await page.evaluate(() => {
    const inp = [...document.querySelectorAll('input')].find((e) => (e.placeholder || '') === '满分 500')
    if (!inp) return 'no-input'
    const card = inp.closest('.card')
    const btn = card && [...card.querySelectorAll('button')].find((b) => (b.textContent || '').includes('保存'))
    if (!btn) return 'no-btn'
    btn.click()
    return 'ok'
  })
  log('click target card 保存: ' + clicked + '\n')
  await sleep(2000)
  const t = await page.evaluate(() => document.body.innerText)
  log('反馈: ' + (t.includes('目标总分已保存') || t.includes('已保存') ? 'OK' : 'FAIL') + '\n')
  // 单科目标同理
  const clicked2 = await page.evaluate(() => {
    const inp = [...document.querySelectorAll('input')].filter((e) => (e.placeholder || '') === '满分 100')[0]
    const card = inp.closest('.card')
    const btn = [...card.querySelectorAll('button')].find((b) => (b.textContent || '').includes('保存单科目标'))
    if (!btn) return 'no-btn'
    btn.click()
    return 'ok'
  })
  log('click 保存单科目标: ' + clicked2 + '\n')
  await sleep(1500)
  const t2 = await page.evaluate(() => document.body.innerText)
  log('单科反馈: ' + (t2.includes('单科目标已保存') ? 'OK' : 'FAIL') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
