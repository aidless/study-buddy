import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/net_debug.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('request', (r) => { const u = r.url(); if (u.includes('supabase') && !u.includes('/auth/')) log('REQ ' + r.method() + ' ' + u.replace('https://cfxsyvbxnmvmspklebfa.supabase.co', '') + '\n') })
  page.on('response', (r) => { const u = r.url(); if (u.includes('supabase') && !u.includes('/auth/')) log('RES ' + r.status() + ' ' + u.replace('https://cfxsyvbxnmvmspklebfa.supabase.co', '').slice(0, 90) + '\n') })
  page.on('console', (m) => { if (m.type() === 'error') log('[c] ' + m.text().slice(0, 250) + '\n') })
  await page.evaluateOnNewDocument(() => { window.addEventListener('unhandledrejection', (e) => console.error('UNH: ' + (e.reason && (e.reason.message || e.reason) || e.reason || '').toString().slice(0, 200))) })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '网络测'); await type('you@example.com', `net-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('备考')
  await sleep(3500)
  await type('满分 500', '350')
  log('--- 点击 保存单科目标 ---\n')
  await click('保存单科目标')
  await sleep(3000)
  log('--- 点击 保存(目标总分) ---\n')
  await click('保存')
  await sleep(3000)
  log('done\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
