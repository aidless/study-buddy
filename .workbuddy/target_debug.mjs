import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/target_debug.log'
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
  page.on('dialog', async (d) => { log('[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '目标测'); await type('you@example.com', `tgtui-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('备考')
  await sleep(3500)
  // 目标总分：按 placeholder 填
  const t1 = await type('满分 500', '350')
  log('目标总分 input: ' + t1 + '\n')
  // 单科目标：输入框 placeholder 是 满分 100 / 满分 150
  const inputs = await page.evaluate(() => [...document.querySelectorAll('input')].map((e) => ({ ph: e.placeholder || '', val: e.value })).filter((x) => x.ph.includes('满分')))
  log('single-subject inputs: ' + JSON.stringify(inputs) + '\n')
  for (const inp of inputs) {
    if (inp.ph === '满分 100' && inp.val === '') {
      const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '') === ph) || null, inp.ph)
      const el = h.asElement(); await el.click(); await el.type('65'); await sleep(100)
    }
  }
  // 直接点击两个保存按钮
  await click('保存单科目标')
  await sleep(2500)
  const after = await page.evaluate(() => [...document.querySelectorAll('input')].map((e) => ({ ph: e.placeholder || '', val: e.value })).filter((x) => x.ph.includes('满分')))
  log('after 保存单科目标: ' + JSON.stringify(after) + '\n')
  const btns = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.textContent || '').trim()).filter(Boolean).slice(0, 40))
  log('buttons: ' + JSON.stringify(btns) + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
