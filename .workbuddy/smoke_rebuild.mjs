import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const URL = 'http://127.0.0.1:4173'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = 'C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy-preview'
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
const results = []
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text().slice(0, 200)) })
page.on('dialog', async (d) => { console.log('[dialog] ' + d.message()); await d.accept() })

const ok = (name, pass, extra = '') => { results.push({ name, pass: !!pass }); console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' :: ' + extra : '')) }
const bodyText = () => page.evaluate(() => document.body.innerText)
const clickByText = async (txt, tag = 'button') => {
  const r = await page.evaluate(({ txt, tag }) => { const el = [...document.querySelectorAll(tag)].find((e) => (e.textContent || '').includes(txt)); if (!el) return false; el.click(); return true }, { txt, tag })
  if (!r) throw new Error('not found: ' + txt)
}
const typeByPlaceholder = async (txt, val) => {
  const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt)
  const el = h.asElement()
  if (!el) throw new Error('input not found: ' + txt)
  await el.click(); await el.type(val)
}
const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }

// 注册新学员
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1000)
const ts = Date.now()
await clickByText('注册')
await sleep(300)
await typeByPlaceholder('起个名字', '冒烟学员')
await typeByPlaceholder('you@example.com', `smoke-${ts}@example.com`)
await typeByPlaceholder('至少 6 位', 'Test123456')
await clickByText('创建账号')
await page.waitForFunction(() => document.body.innerText.includes('今天还没打卡') || document.body.innerText.includes('今日打卡'), { timeout: 30000 })
await sleep(2500)

let t = await bodyText()
ok('注册并进入今日页', t.includes('今日打卡') || t.includes('还没打卡'), '')
ok('考研倒计时已预填', t.includes('考研初试'), '')
ok('顶部考试切换', t.includes('当前考试'), '')
await page.screenshot({ path: path.join(OUT, 'r1-today.png') })

// 深呼吸默认展开
await tapTab('专注')
await sleep(1200)
t = await bodyText()
ok('深呼吸默认展开', t.includes('深呼吸') && t.includes('开始 60 秒呼吸'), '')
await page.screenshot({ path: path.join(OUT, 'r2-focus.png') })

// 自测：随机考试
await tapTab('自测')
await sleep(2200)
t = await bodyText()
ok('自测模块（正式考试+真题库）', t.includes('正式考试') && t.includes('真题库'), '')
ok('名师诊断卡片', t.includes('名师诊断'), '')
await clickByText('开始随机考试')
await sleep(1500)
t = await bodyText()
ok('考试开始（限时+逐题）', t.includes('第 1/'), '')
const full = await page.evaluate(() => {
  const sh = document.querySelector('.exam-sheet')
  return { sh: !!sh, w: sh ? sh.getBoundingClientRect().width : 0, vw: window.innerWidth }
})
ok('考试全屏铺满', full.sh && full.w >= full.vw - 2, JSON.stringify(full))
await page.screenshot({ path: path.join(OUT, 'r3-exam.png') })

// 答 6 题（全选 A）交卷
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => { const opt = document.querySelector('.quiz-opt'); opt && opt.click(); const next = [...document.querySelectorAll('.quiz-nav button')].find((b) => (b.textContent || '').includes('下一题')); next && next.click() })
  await sleep(120)
}
await clickByText('交卷')
await sleep(3000)
t = await bodyText()
ok('交卷自动判分', t.includes('考试结果') && t.includes('选择题'), '')
ok('错题回顾+解析+知识点', t.includes('错题回顾') && t.includes('解析：'), '')
ok('各科表现', t.includes('各科表现'), '')
await page.screenshot({ path: path.join(OUT, 'r4-result.png') })

// 完成 → 进度页估分
await clickByText('完成')
await sleep(800)
await tapTab('进度')
await page.waitForFunction(() => document.body.innerText.includes('连续天数'), { timeout: 20000 })
await page.waitForFunction(() => document.body.innerText.includes('当前估分'), { timeout: 20000 })
await sleep(500)
t = await bodyText()
ok('离岸线估分可用', t.includes('当前估分') && /\d+/.test((t.match(/当前估分\s*\d+/) || [''])[0]), '')
await page.screenshot({ path: path.join(OUT, 'r5-progress.png') })

console.log(`\n结果: ${results.filter((r) => r.pass).length}/${results.length} 通过`)
if (errs.length) { console.log('页面错误:'); errs.slice(0, 6).forEach((e) => console.log('  ' + e)) } else console.log('无页面错误')
await browser.close()
process.exit(results.some((r) => !r.pass) ? 1 : 0)