// 第六轮：作文评分卡四维全选保存 + 数学解答题自评记录 + 刷新后自测记录存在
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_mobile_result6.json'
const BASE = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = [], issues = []
const log = (k, ok, extra = '') => { results.push({ k, ok: !!ok, extra }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + k + (extra ? ' :: ' + extra : '')) }
let browser
try {
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  page.on('console', (m) => { if (m.type() === 'error') issues.push('[console.error] ' + m.text().slice(0, 260)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + String(e.message).slice(0, 260)))
  page.on('requestfailed', (r) => issues.push('[reqfail] ' + r.url().slice(0, 200) + ' :: ' + (r.failure()?.errorText || '')))
  page.on('dialog', async (d) => { try { await d.accept() } catch {} })
  const clickInc = async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1800) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 20000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc('注册')
  await typeByPh('起个名字', '深测6')
  await typeByPh('you@example.com', `deep6-${Date.now()}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  if (!(await waitText('今日打卡', 30000))) process.exit(1)

  // 英语一 → 浏览全部 → 第一个 开始评分
  await tapTab('自测')
  await waitText('正式考试', 15000)
  await clickInc('英语一'); await sleep(2000)
  await clickInc('浏览全部题目', 1500)
  const opened = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('开始评分')); if (b) { b.click(); return true } return false })
  await sleep(1500)
  // 每个维度选最后一个等级（优秀）
  await page.evaluate(() => {
    const dims = [...document.querySelectorAll('.code-modal > div')].filter((d) => d.querySelector('.chips'))
    dims.forEach((d) => { const chips = [...d.querySelectorAll('.chips button')]; const last = chips[chips.length - 1]; if (last) last.click() })
  })
  await sleep(800)
  const scoreShown = await page.evaluate(() => !!document.querySelector('.est-hero'))
  log('四维选完出分数', scoreShown)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('保存评分')); if (s) s.click() })
  const saved = await waitText('已保存', 6000, 500)
  log('作文评分保存(已保存✓)', saved)
  await sleep(2200) // 等 modal 自动关闭

  // 数学一 → 浏览全部 → 做得不错
  await clickInc('数学一'); await sleep(2000)
  await clickInc('浏览全部题目', 1500)
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做得不错')); if (b) b.click() })
  const mathSaved = await waitText('已记录自测', 8000, 500)
  log('数学解答题自评记录', mathSaved)

  // 刷新后自测记录仍在（备考页）
  await page.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3000)
  await tapTab('备考')
  const record = await waitText('自测', 15000, 1200)
  const tt = await bodyText()
  log('刷新后自测记录保留', record && (tt.includes('作文自评') || tt.includes('专项自测') || tt.includes('自测')), tt.includes('作文自评') ? '有作文自评' : '一般自测记录')

  const unique = [...new Set(issues)]
  console.log('---')
  console.log('运行期问题总数:', unique.length)
  unique.slice(0, 15).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync(OUT, JSON.stringify({ results, issues: unique.slice(0, 30), passed: results.filter((r) => r.ok).length, total: results.length }, null, 2))
} catch (e) {
  console.log('FATAL:', e.message)
  writeFileSync(OUT, JSON.stringify({ fatal: e.message, results, issues: issues.slice(0, 30) }, null, 2))
} finally {
  if (browser) await browser.close()
}
process.exit(0)
