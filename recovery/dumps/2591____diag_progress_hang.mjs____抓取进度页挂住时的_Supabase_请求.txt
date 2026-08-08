// diag_progress_hang.mjs —— 抓取进度页挂住时的 Supabase 请求/响应与页面报错
import puppeteer from 'puppeteer-core'

const URL = 'http://127.0.0.1:4173'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const EMAIL = process.env.PV_EMAIL || 'u-pv-1786159490551@example.com'
const PASS = 'Test123456'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

const log = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`[console.${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => log.push('[pageerror] ' + e.message))
page.on('request', (r) => {
  const u = r.url()
  if (u.includes('supabase')) log.push(`[req] ${r.method()} ${u.replace(/\/\/[^@]*@/, '//')}`)
})
page.on('requestfailed', (r) => {
  const u = r.url()
  if (u.includes('supabase')) log.push(`[reqfailed] ${u} :: ${r.failure()?.errorText}`)
})
page.on('response', (r) => {
  const u = r.url()
  if (u.includes('supabase')) log.push(`[res] ${r.status()} ${u.replace(/\/\/[^@]*@/, '//')}`)
})

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1000)
const type = async (txt, val) => {
  const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt)
  const el = h.asElement()
  if (!el) throw new Error('input not found: ' + txt)
  await el.click(); await el.type(val)
}
await type('you@example.com', EMAIL)
await type('至少 6 位', PASS)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('进入'))
  el && el.click()
})
await page.waitForFunction(() => document.body.innerText.includes('今天还没打卡'), { timeout: 30000 })
await sleep(2000)

log.push('--- 进入进度页 ---')
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '进度')
  el && el.click()
})
await sleep(25000)

const state = await page.evaluate(() => ({
  skel: document.querySelectorAll('.skel').length,
  hasMain: document.body.innerText.includes('连续天数'),
  hasDeep: document.body.innerText.includes('知识雷达'),
  hasErr: document.body.innerText.includes('进度加载出了点问题'),
  ready: document.readyState
}))
console.log('25s 后状态: ' + JSON.stringify(state))
console.log('--- 日志 ---')
for (const l of log.slice(-60)) console.log(l)
await browser.close()
