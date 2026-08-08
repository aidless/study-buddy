import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deepeval.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  const issues = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) issues.push('[' + m.type() + '] ' + m.text().slice(0, 250)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + e.message.slice(0, 250)))
  page.on('dialog', async (d) => { await d.accept() })
  // 性能：记录资源加载时间
  const t0 = Date.now()
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 30000 })
  const t1 = Date.now()
  await sleep(1500)
  const t2 = Date.now()
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    return { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), jsHeap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null }
  })
  log(`性能: domcontentloaded=${t1 - t0}ms 首屏稳定=${t2 - t0}ms nav=${JSON.stringify(perf)}\n`)
  // 注册 + 全 Tab 走查
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '深测'); await type('you@example.com', `deep-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('注册: ' + (ok ? 'OK' : 'FAIL') + '\n')
  for (const tab of ['专注', '备考', '自测', '进度', '悄悄话']) {
    const s0 = Date.now()
    await tapTab(tab)
    await sleep(3000)
    const s1 = Date.now()
    const t = await page.evaluate(() => document.body.innerText)
    log(`Tab ${tab}: 渲染${s1 - s0}ms 内容${t.length}字\n`)
  }
  // 考试 + 大题
  await tapTab('自测'); await sleep(2500)
  await click('开始随机考试'); await sleep(2000)
  const examInfo = await page.evaluate(() => {
    const t = document.body.innerText
    const sh = document.querySelector('.exam-sheet')
    const opts = document.querySelectorAll('.quiz-opt').length
    return { fullscreen: !!sh, choicesPerPage: opts, hasTimer: /\\d{2}:\\d{2}/.test(t) }
  })
  log('考试: ' + JSON.stringify(examInfo) + '\n')
  // 走到大题
  let essay = false
  for (let i = 0; i < 42; i++) {
    const isE = await page.evaluate(() => (document.body.innerText || '').includes('大题'))
    if (isE) { essay = true; break }
    await page.evaluate(() => { const n = [...document.querySelectorAll('.quiz-nav button')].find((b) => (b.textContent || '').includes('下一题')); n && n.click() })
    await sleep(120)
  }
  log('大题可达: ' + essay + '\n')
  log('运行时问题数: ' + issues.length + '\n')
  issues.forEach((i) => log('  ' + i + '\n'))
  log('done\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
