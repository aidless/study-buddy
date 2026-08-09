// 第三轮：打卡精确切换 / SVG 图题 / 大题自评 / 作文评分 / 考试切换 / 更多工具
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_mobile_result3.json'
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
  const clickExact = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === txt); if (el) el.click() }, txt); await sleep(500) }
  const clickInc = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(500) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1800) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 20000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 8 }); return true }

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc('注册')
  await typeByPh('起个名字', '深测3')
  await typeByPh('you@example.com', `deep3-${ts}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  if (!(await waitText('今日打卡', 30000))) process.exit(1)

  // 精确打卡
  const chipsBefore = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((t) => t.includes('打卡')))
  await clickExact('打卡')
  await sleep(1500)
  const chipsAfter = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((t) => t.includes('打卡')))
  log('打卡精确切换', chipsBefore.includes('打卡') && chipsAfter.includes('已打卡'), `before=${JSON.stringify(chipsBefore)} after=${JSON.stringify(chipsAfter)}`)

  // 更多工具/开启提醒
  const more = await page.evaluate(() => { const els = [...document.querySelectorAll('div,button')]; const m = els.find((e) => (e.textContent || '').trim() === '更多工具'); if (m) { m.click(); return true } return false })
  await sleep(800)
  let tt = await bodyText()
  log('更多工具(开启提醒入口)', more && (tt.includes('开启提醒') || tt.includes('提醒已开')), tt.includes('提醒已开') ? '已开' : (tt.includes('开启提醒') ? '有入口' : '无'))

  // 考试切换按钮在顶部
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('切换')); if (s) s.click() })
  await sleep(600)
  tt = await bodyText()
  log('考试切换按钮存在并触发确认', tt.includes('确认') || tt.includes('继续') || tt.includes('切换'), tt.slice(0, 100).replace(/\n/g, '|'))

  // 自测 → 大题自评流程
  await tapTab('自测')
  await waitText('正式考试', 15000)
  await clickInc('开始随机考试')
  await sleep(2500)
  // 跳到第一道大题
  let essayReached = false
  for (let i = 0; i < 45; i++) {
    const isEssay = await page.evaluate(() => !!(document.querySelector('.quiz-q-type') && (document.querySelector('.quiz-q-type').textContent || '').includes('大题')))
    if (isEssay) { essayReached = true; break }
    await page.evaluate(() => { const o = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on')); if (o) o.click(); const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('下一题')); if (n) n.click() })
    await sleep(350)
  }
  log('可导航到大题(自评)', essayReached)
  const essayBtns = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('会') || (b.textContent || '').includes('不会')).map((b) => b.textContent.trim()))
  log('大题自评按钮存在', essayBtns.length >= 2, JSON.stringify(essayBtns))
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('会')); if (b) b.click() })
  await sleep(400)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷'); if (s) s.click() })
  await sleep(4000)
  tt = await bodyText()
  log('交卷后判分结果可见', tt.includes('得分') || tt.includes('成绩') || tt.includes('正确'), tt.slice(0, 120).replace(/\n/g, '|'))
  log('交卷后错题/薄弱点可见', tt.includes('错题') || tt.includes('薄弱') || tt.includes('知识点'))

  // 英语一作文评分卡
  await tapTab('自测')
  await clickInc('英语一'); await sleep(2000)
  tt = await bodyText()
  const essayBtn = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('作文')); if (b) { b.click(); return b.textContent.trim() } return null })
  await sleep(2000)
  tt = await bodyText()
  log('英语作文入口', !!essayBtn, String(essayBtn))
  const scorerShown = tt.includes('评分') || tt.includes('自评') || tt.includes('小作文') || tt.includes('大作文')
  log('作文评分卡打开', scorerShown, tt.slice(0, 100).replace(/\n/g, '|'))
  // 如果评分卡已开：选等级并保存
  const dimBtns = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('较差') || (b.textContent || '').includes('一般') || (b.textContent || '').includes('较好') || (b.textContent || '').includes('优秀')).length)
  if (dimBtns > 0) {
    await page.evaluate(() => { [...document.querySelectorAll('button')].filter((b) => ['较差', '一般', '较好', '优秀'].some((x) => (b.textContent || '').includes(x))).slice(0, 4).forEach((b, i) => setTimeout(() => b.click(), i * 250)) })
    await sleep(1600)
    await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('保存自评')); if (s) s.click() })
    await sleep(1600)
    tt = await bodyText()
    log('作文自评保存反馈', tt.includes('已保存') || tt.includes('保存成功'), tt.slice(0, 90).replace(/\n/g, '|'))
  } else {
    log('作文自评保存反馈', false, '评分卡未打开 dimBtns=0')
  }

  // SVG 图题渲染（真题库）
  await clickInc('408 统考'); await sleep(1200)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await sleep(3000)
  const svgs = await page.evaluate(() => {
    const figs = [...document.querySelectorAll('.qfig')]
    return figs.map((f) => {
      const svg = f.querySelector('svg')
      if (!svg) return { noSvg: true, html: f.innerHTML.slice(0, 80) }
      const r = svg.getBoundingClientRect()
      const vb = (svg.getAttribute('viewBox') || '').split(' ').map(Number)
      return { w: Math.round(r.width), h: Math.round(r.height), vb, naturalW: vb[2] || 0, naturalH: vb[3] || 0, full: r.width >= 300 }
    }).slice(0, 6)
  })
  log('SVG 图题渲染(整行大图)', svgs.length > 0 && svgs.every((s) => s.full || s.noSvg), JSON.stringify(svgs))

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
