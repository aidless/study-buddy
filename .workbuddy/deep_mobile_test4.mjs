// 第四轮：更多工具 / 大题自评(做对了) / 作文评分卡保存 / 数学一自评
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_mobile_result4.json'
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

  const ts = Date.now()
  const clickInc = async (txt, wait = 500) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(wait) }
  const clickSel = async (sel) => { await page.evaluate((sel) => { const el = document.querySelector(sel); if (el) el.click() }, sel); await sleep(500) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1800) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 20000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc('注册')
  await typeByPh('起个名字', '深测4')
  await typeByPh('you@example.com', `deep4-${ts}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  if (!(await waitText('今日打卡', 30000))) process.exit(1)

  // 更多工具展开
  await page.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(800)
  let tt = await bodyText()
  log('更多工具展开(提醒/退出/刷新)', tt.includes('开启提醒') && tt.includes('退出登录') && tt.includes('刷新'), tt.slice(-160).replace(/\n/g, '|'))
  await page.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(300)

  // 大题自评（做对了）
  await tapTab('自测')
  await waitText('正式考试', 15000)
  await clickInc('开始随机考试')
  await sleep(2500)
  let essayReached = false
  for (let i = 0; i < 45; i++) {
    const isEssay = await page.evaluate(() => !!(document.querySelector('.quiz-q-type') && (document.querySelector('.quiz-q-type').textContent || '').includes('大题')))
    if (isEssay) { essayReached = true; break }
    await page.evaluate(() => { const o = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on')); if (o) o.click(); const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('下一题')); if (n) n.click() })
    await sleep(300)
  }
  const selfBtns = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('做对') || (b.textContent || '').includes('没做对')).map((b) => b.textContent.trim()))
  log('大题自评按钮(做对了/没做对)', selfBtns.length >= 2, JSON.stringify(selfBtns))
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做对了')); if (b) b.click() })
  await sleep(400)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷'); if (s) s.click() })
  await sleep(4500)
  tt = await bodyText()
  log('交卷结果含大题自评统计', tt.includes('大题自评') && tt.includes('0/1') ? true : tt.includes('考试结果'), tt.slice(0, 200).replace(/\n/g, '|'))
  const result = tt.includes('考试结果') && (tt.includes('得分') || tt.includes('分'))
  log('考试结果页渲染', result)

  // 英语一 作文评分卡
  await tapTab('自测')
  await clickInc('英语一'); await sleep(2000)
  await clickInc('浏览全部题目', 1200)
  tt = await bodyText()
  log('英语作文题目列表', tt.includes('小作文') || tt.includes('大作文') || tt.includes('开始评分'), tt.slice(-150).replace(/\n/g, '|'))
  const scorerClicked = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('开始评分')); if (b) { b.click(); return true } return false })
  await sleep(1500)
  tt = await bodyText()
  log('作文评分卡打开(四维)', scorerClicked && tt.includes('内容切题') && tt.includes('结构衔接'), tt.slice(0, 120).replace(/\n/g, '|'))
  await page.evaluate(() => { [...document.querySelectorAll('button')].filter((b) => ['较差', '一般', '较好', '优秀'].some((x) => (b.textContent || '').includes(x))).slice(0, 4).forEach((b, i) => setTimeout(() => b.click(), i * 200)) })
  await sleep(1400)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('保存自评')); if (s) s.click() })
  await sleep(1800)
  tt = await bodyText()
  log('作文自评保存(已保存)', tt.includes('已保存') || tt.includes('保存成功'), tt.slice(0, 120).replace(/\n/g, '|'))

  // 数学一 解答题自评
  await clickInc('数学一'); await sleep(2000)
  await clickInc('浏览全部题目', 1200)
  const mathBtns = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('做得不错') || (b.textContent || '').includes('还需练习')).map((b) => b.textContent.trim()).slice(0, 4))
  log('数学解答题自评按钮', mathBtns.length >= 2, JSON.stringify(mathBtns))
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('做得不错')); if (b) b.click() })
  await sleep(1200)
  tt = await bodyText()
  log('数学自评已记录', tt.includes('已记录自测') || tt.includes('已保存'), tt.slice(0, 100).replace(/\n/g, '|'))

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
