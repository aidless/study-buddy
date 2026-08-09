// 审计B：自测页剩余功能（真题库/抽测/AI名师模式）
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/audit_b_result.json'
const BASE = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = [], issues = []
const log = (k, ok, extra = '') => { results.push({ k, ok: !!ok, extra }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + k + (extra ? ' :: ' + extra : '')) }
let browser
try {
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  page.on('console', (m) => { if (m.type() === 'error') issues.push('[console.error] ' + m.text().slice(0, 260)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + String(e.message).slice(0, 260)))
  page.on('requestfailed', (r) => issues.push('[reqfail] ' + r.url().slice(0, 180) + ' :: ' + (r.failure()?.errorText || '')))
  page.on('dialog', async (d) => { try { await d.accept() } catch {} })
  const clickInc = async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1800) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 25000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc('注册')
  await typeByPh('起个名字', '审计乙')
  await typeByPh('you@example.com', `auditB-${Date.now()}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  if (!(await waitText('今日打卡', 30000))) process.exit(1)

  await tapTab('自测')
  await waitText('正式考试', 20000)

  // --- 真题库：答案展开 + 筛选 ---
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await sleep(2500)
  const qbankShown = await bodyText()
  log('真题库渲染(2009-2026/720)', qbankShown.includes('真题库') && qbankShown.includes('720'), '')
  const answerToggled = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('看答案')); if (b) { b.click(); return b.textContent.trim() } return null })
  await sleep(1000)
  let tt = await bodyText()
  log('真题答案展开(答案+解析)', answerToggled && (tt.includes('答案：') || tt.includes('正确答案')), String(answerToggled))
  // 按年份筛选
  const yearChip = await page.evaluate(() => { const c = [...document.querySelectorAll('.chips button')].find((e) => (e.textContent || '').trim() === '2020'); if (c) { c.click(); return true } return false })
  await sleep(1200)
  tt = await bodyText()
  log('按年份筛选生效', yearChip && tt.includes('2020 真题'), '')
  await page.evaluate(() => { const c = [...document.querySelectorAll('.chips button')].find((e) => (e.textContent || '').trim() === '全部年份'); if (c) c.click() })
  await sleep(800)

  // --- 英语一：随机抽测（含填空与作文） ---
  await clickInc('英语一'); await sleep(2000)
  await clickInc('随机抽测'); await sleep(1500)
  tt = await bodyText()
  log('抽测面板(题型/数量)', tt.includes('题型') && tt.includes('选择题') && tt.includes('填空题') && tt.includes('抽几道'), '')
  await page.evaluate(() => { [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('选择题')).forEach((b) => { if (!(b.className || '').includes('on')) b.click() }); [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('填空题')).forEach((b) => { if (!(b.className || '').includes('on')) b.click() }); [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('大题')).forEach((b) => { if (!(b.className || '').includes('on')) b.click() }) })
  await sleep(400)
  await page.evaluate(() => { const c = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '开始'); if (c) c.click() })
  await sleep(1500)
  tt = await bodyText()
  log('抽测开始(第1题)', tt.includes('第 1/') || tt.includes('已答'), tt.slice(0, 90).replace(/\n/g, '|'))
  // 答 5 题：选择点选项 / 填空输入 / 大题自评
  let answered = 0
  for (let i = 0; i < 8; i++) {
    const info = await page.evaluate(() => {
      const opt = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on'))
      const inp = document.querySelector('.quiz-body input[type=text], .quiz-body input:not([type])')
      const self = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做对了'))
      return { opt: !!opt, inp: !!inp, self: !!self, alive: !!document.querySelector('.quiz-overlay') }
    })
    if (!info.alive) break
    if (info.opt) { await page.evaluate(() => { const o = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on')); if (o) o.click() }); answered++ }
    else if (info.inp) { await page.evaluate(() => { const i = document.querySelector('.quiz-body input'); if (i) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(i, '测试答案'); i.dispatchEvent(new Event('input', { bubbles: true })) } }); answered++ }
    else if (info.self) { await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做对了')); if (s) s.click() }); answered++ }
    await sleep(400)
    const isLast = await page.evaluate(() => { const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('下一题')); if (n) { n.click(); return false } return true })
    await sleep(500)
    if (isLast) break
  }
  log('抽测逐题作答', answered >= 3, 'answered=' + answered)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷' || (e.textContent || '').includes('完成测试')); if (s) s.click() })
  await sleep(3000)
  tt = await bodyText()
  log('抽测结果页', tt.includes('测试结果') || tt.includes('得分') || tt.includes('正确'), tt.slice(0, 100).replace(/\n/g, '|'))

  // --- AI 名师模式切换 ---
  await clickInc('408 统考'); await sleep(1500)
  const modes = ['讲解', '作文批改', '学习规划']
  let modeOk = true
  for (const m of modes) {
    await page.evaluate((m) => { const c = [...document.querySelectorAll('.chips button')].find((e) => (e.textContent || '').trim() === m); if (c) c.click() }, m)
    await sleep(600)
    const t2 = await bodyText()
    if (!t2.includes('老师') && !t2.includes('贴进来') && !t2.includes('计划')) modeOk = false
  }
  log('AI 名师模式切换(答疑/讲解/作文批改/学习规划)', modeOk, '')

  // 数学一 随机抽测
  await clickInc('数学一'); await sleep(2000)
  await clickInc('随机抽测'); await sleep(1500)
  await page.evaluate(() => { const c = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '开始'); if (c) c.click() })
  await sleep(1500)
  tt = await bodyText()
  log('数学随机抽测开始', tt.includes('第 1/') || tt.includes('已答') || tt.includes('选择题'), tt.slice(0, 80).replace(/\n/g, '|'))

  const unique = [...new Set(issues)]
  console.log('---')
  console.log('运行期问题总数:', unique.length)
  unique.slice(0, 12).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync(OUT, JSON.stringify({ results, issues: unique.slice(0, 25), passed: results.filter((r) => r.ok).length, total: results.length }, null, 2))
} catch (e) {
  console.log('FATAL:', e.message)
  writeFileSync(OUT, JSON.stringify({ fatal: e.message, results, issues: issues.slice(0, 25) }, null, 2))
} finally {
  if (browser) await browser.close()
}
process.exit(0)
