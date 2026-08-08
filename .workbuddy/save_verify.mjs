import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/save_verify.log'
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
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '保存验'); await type('you@example.com', `sv-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('备考')
  await sleep(4000)
  await type('满分 500', '350')
  const fillNth = async (ph, nth, val) => {
    const h = await page.evaluateHandle(({ ph, nth }) => [...document.querySelectorAll('input')].filter((e) => (e.placeholder || '') === ph)[nth] || null, { ph, nth })
    const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok'
  }
  await fillNth('满分 100', 0, '65'); await fillNth('满分 100', 1, '60'); await fillNth('满分 150', 0, '105'); await fillNth('满分 150', 1, '120')
  await sleep(400)
  await click('保存单科目标')
  await sleep(1200)
  const t1 = await page.evaluate(() => document.body.innerText)
  log('保存反馈出现: ' + (t1.includes('已保存') ? 'OK' : 'FAIL') + '\n')
  await click('保存')
  await sleep(1200)
  const t2 = await page.evaluate(() => document.body.innerText)
  log('目标总分反馈: ' + (t2.includes('目标总分已保存') || t2.includes('已保存') ? 'OK' : 'FAIL') + '\n')
  // 切走再回，验证持久化
  await tapTab('今日'); await sleep(1200)
  await tapTab('备考'); await sleep(4000)
  const vals = await page.evaluate(() => [...document.querySelectorAll('input')].map((e) => ({ ph: e.placeholder || '', val: e.value })).filter((x) => x.ph.includes('满分')))
  log('切回后值: ' + JSON.stringify(vals) + '\n')
  const allOk = vals.find((v) => v.ph === '满分 500')?.val === '350' && vals.filter((v) => v.ph === '满分 100').map((v) => v.val).join() === '65,60'
  log('持久化: ' + (allOk ? 'OK' : 'FAIL') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
