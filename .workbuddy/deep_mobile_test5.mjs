// 第五轮：2009 全年真题卷逐题遍历（含图题），验证 Fig 修复 + 交卷
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_mobile_result5.json'
const BASE = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const issues = []
let browser
try {
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  page.on('console', (m) => { if (m.type() === 'error') issues.push('[console.error] ' + m.text().slice(0, 260)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + String(e.message).slice(0, 260)))
  page.on('requestfailed', (r) => issues.push('[reqfail] ' + r.url().slice(0, 180) + ' :: ' + (r.failure()?.errorText || '')))
  page.on('dialog', async (d) => { try { await d.accept() } catch {} })
  const clickInc = async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1800) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 20000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc('注册')
  await typeByPh('起个名字', '深测5')
  await typeByPh('you@example.com', `deep5-${Date.now()}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  if (!(await waitText('今日打卡', 30000))) { console.log('注册失败'); process.exit(1) }

  await tapTab('自测')
  await waitText('正式考试', 15000)
  // 按年份 → 2009
  await clickInc('按年份')
  await page.evaluate(() => { const sel = document.querySelector('select'); if (sel) { sel.value = '2009'; sel.dispatchEvent(new Event('change', { bubbles: true })) } })
  await sleep(500)
  await clickInc('开始该年考试', 2500)

  // 逐题遍历
  let q = 0, figSeen = 0, essaySeen = 0
  for (let i = 0; i < 60; i++) {
    const info = await page.evaluate(() => {
      const qtype = document.querySelector('.quiz-q-type')
      const fig = document.querySelector('.quiz-body .qfig')
      const svg = fig ? fig.querySelector('svg') : null
      const rect = svg ? svg.getBoundingClientRect() : null
      const title = document.querySelector('.quiz-title')?.textContent || ''
      return { qtype: qtype?.textContent || '', hasFig: !!fig, svgW: rect ? Math.round(rect.width) : 0, title, alive: !!document.querySelector('.quiz-overlay') }
    })
    if (!info.alive) { console.log('考试 overlay 消失 @q' + q); break }
    if (info.qtype.includes('大题')) { essaySeen++; if (info.hasFig) figSeen++ } else { q++; if (info.hasFig) figSeen++ }
    if (info.hasFig && info.svgW < 300) { issues.push('[fig-size] q' + q + ' svgW=' + info.svgW) }
    // 答/评当前题
    await page.evaluate(() => {
      const opt = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on'))
      if (opt) opt.click()
      else { const ok = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做对了')); if (ok) ok.click() }
    })
    await sleep(250)
    const isLast = await page.evaluate(() => { const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '下一题'); if (n) { n.click(); return false } return true })
    await sleep(350)
    if (isLast) break
  }
  console.log('遍历完成: 选择题=' + q + ' 大题=' + essaySeen + ' 图题出现=' + figSeen)
  // 交卷
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷'); if (s) s.click() })
  await sleep(5000)
  const tt = await bodyText()
  const okResult = tt.includes('考试结果') && tt.includes('/') && (tt.includes('各科表现') || tt.includes('错题'))
  console.log('交卷判分结果: ' + (okResult ? 'OK' : 'CHECK') + ' :: ' + tt.slice(0, 150).replace(/\n/g, '|'))
  const unique = [...new Set(issues)]
  console.log('---')
  console.log('运行期问题总数:', unique.length)
  unique.slice(0, 20).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync(OUT, JSON.stringify({ okResult, q, essaySeen, figSeen, issues: unique.slice(0, 30) }, null, 2))
} catch (e) {
  console.log('FATAL:', e.message)
  writeFileSync(OUT, JSON.stringify({ fatal: e.message, issues }, null, 2))
} finally {
  if (browser) await browser.close()
}
process.exit(0)
