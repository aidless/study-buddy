import puppeteer from 'puppeteer-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (s) => { process.stdout.write(s + '\n') }
let browser
try {
  browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (m.type() === 'error') log('[err] ' + m.text().slice(0, 250)) })
  page.on('dialog', async (d) => { log('[dialog] ' + d.message()); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2', timeout: 25000 })
  log('page loaded')
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  await click('注册'); await sleep(300)
  await type('起个名字', '直进5')
  await type('you@example.com', `direct5-${ts}@example.com`)
  await type('至少 6 位', 'Test123456')
  await click('创建账号')
  log('clicked create')
  let loggedIn = false
  for (let i = 0; i < 15; i++) {
    await sleep(2000)
    const t = await page.evaluate(() => document.body.innerText)
    if (t.includes('今日打卡')) { loggedIn = true; log('logged in at t+' + ((i + 1) * 2) + 's'); break }
  }
  if (!loggedIn) { log('NOT logged in'); process.exit(1) }
  await page.evaluate(() => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === '进度'); el && el.click() })
  log('clicked 进度')
  for (let i = 0; i < 10; i++) {
    await sleep(2000)
    const t = await page.evaluate(() => document.body.innerText)
    const has = ['学习进度', '连续天数', '进度加载'].filter((k) => t.includes(k))
    log(`t+${(i + 1) * 2}s: ${has.length ? has.join(',') : '(骨架)'}`)
    if (has.includes('连续天数')) break
  }
  const t2 = await page.evaluate(() => document.body.innerText)
  log('进度内容: ' + t2.slice(0, 500).replace(/\n/g, ' | '))
} catch (e) {
  log('ERR: ' + e.message.slice(0, 200))
} finally {
  if (browser) await browser.close()
}
process.exit(0)