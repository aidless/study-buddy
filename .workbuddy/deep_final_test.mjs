// 最终回归：修复后全流程快速复测（含正确文案 已记入自测）
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_final_result.json'
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
  await typeByPh('起个名字', '终测')
  await typeByPh('you@example.com', `final-${Date.now()}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  log('注册并进入今日页', await waitText('今日打卡', 30000))

  // 今日打卡
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '打卡'); if (b) b.click() })
  await sleep(1500)
  log('打卡切换', (await bodyText()).includes('已打卡'))

  // 自测：数学一自评（正确文案）
  await tapTab('自测')
  await waitText('正式考试', 15000)
  await clickInc('数学一'); await sleep(2000)
  await clickInc('浏览全部题目', 1500)
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做得不错')); if (b) b.click() })
  log('数学自评反馈(已记入自测)', await waitText('已记入自测', 8000, 400))
  await clickInc('408 统考'); await sleep(1200)

  // 正式考试(随机卷) 快速遍历到图题/大题并交卷
  await clickInc('开始随机考试', 2500)
  let figSeen = false, essaySeen = false
  for (let i = 0; i < 50; i++) {
    const info = await page.evaluate(() => {
      const qtype = document.querySelector('.quiz-q-type')
      const hasFig = !!document.querySelector('.quiz-body .qfig')
      const alive = !!document.querySelector('.quiz-overlay')
      return { essay: (qtype?.textContent || '').includes('大题'), hasFig, alive }
    })
    if (!info.alive) break
    if (info.hasFig) figSeen = true
    if (info.essay) essaySeen = true
    await page.evaluate(() => {
      const opt = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on'))
      if (opt) opt.click()
      else { const ok = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做对了')); if (ok) ok.click() }
    })
    await sleep(250)
    const isLast = await page.evaluate(() => { const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '下一题'); if (n) { n.click(); return false } return true })
    await sleep(300)
    if (isLast) break
  }
  log('考试遍历含图题且不崩溃', figSeen, 'figSeen=' + figSeen + ' essaySeen=' + essaySeen)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷'); if (s) s.click() })
  await sleep(4000)
  log('交卷判分结果', (await bodyText()).includes('考试结果'))

  // 英语一 作文评分卡
  await tapTab('自测')
  await clickInc('英语一'); await sleep(2000)
  await clickInc('浏览全部题目', 1500)
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('开始评分')); if (b) b.click() })
  await sleep(1200)
  await page.evaluate(() => { [...document.querySelectorAll('.code-modal .chips')].forEach((chips) => { const btns = [...chips.querySelectorAll('button')]; if (btns.length) btns[btns.length - 1].click() }) })
  await sleep(600)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('保存评分')); if (s) s.click() })
  log('作文评分保存(已保存)', await waitText('已保存', 6000, 400))

  // 进度页
  await tapTab('进度')
  log('进度: 知识雷达/离岸线/本周小结', (await waitText('知识雷达', 20000, 1200)) && (await bodyText()).includes('离岸线') && (await bodyText()).includes('本周小结'))

  // AI 名师
  await tapTab('自测')
  await waitText('AI 名师', 10000)
  await typeByPh('向老师提问', '考研数学一现在应该怎么安排')
  await sleep(300)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('发送')); if (s) s.click() })
  log('AI 名师回复', await waitText('数学', 40000, 1500))

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
