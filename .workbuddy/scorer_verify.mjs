import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/scorer_verify.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) log('[c] ' + m.text().slice(0, 250) + '\n') })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '评分测'); await type('you@example.com', `score-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('自测'); await sleep(4000)
  await click('英语一'); await sleep(2500)
  await click('浏览全部题目'); await sleep(1200)
  await click('开始评分')
  await sleep(1200)
  let t = await page.evaluate(() => document.body.innerText)
  log('评分卡打开: ' + (t.includes('作文评分卡') && t.includes('内容切题') && t.includes('语言语法') ? 'OK' : 'FAIL') + '\n')
  // 逐维选择「较好」(第 3 档 = index 2)
  const chips = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.code-modal .chips')]
    for (const g of groups) {
      const btns = [...g.querySelectorAll('button')]
      const target = btns.find((b) => (b.textContent || '').trim().startsWith('较好'))
      if (target) target.click()
    }
    return groups.length
  })
  log('已选维度组: ' + chips + '\n')
  await sleep(500)
  t = await page.evaluate(() => document.body.innerText)
  log('得分出现: ' + (/\/ 20|\/ 10/.test(t) && /优秀|良好|中等|需加强/.test(t) ? 'OK' : 'FAIL') + '\n')
  await click('保存评分')
  await sleep(2000)
  t = await page.evaluate(() => document.body.innerText)
  log('保存反馈: ' + (t.includes('已保存') ? 'OK' : 'FAIL') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
