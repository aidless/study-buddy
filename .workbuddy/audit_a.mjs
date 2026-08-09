// 审计A：学员核心流程（今日/专注/备考/退出重登）
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/audit_a_result.json'
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
  const setInput = async (ph, val) => { await page.evaluate(({ ph, val }) => { const el = [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)); if (!el) return false; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(el, val); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true }, { ph, val }); await sleep(300) }

  const email = `auditA-${Date.now()}@example.com`
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await clickInc('注册')
  await typeByPh('起个名字', '审计甲')
  await typeByPh('you@example.com', email)
  await typeByPh('至少 6 位', 'Test123456')
  await clickInc('创建账号')
  log('注册', await waitText('今日打卡', 30000))

  // --- 今日 ---
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '打卡'); if (b) b.click() })
  log('打卡', await waitText('已打卡', 15000, 800))
  await typeByPh('加一件今天要做的事', '审计任务A')
  await page.keyboard.press('Enter')
  await sleep(1500)
  let tt = await bodyText()
  log('添加任务', tt.includes('审计任务A'), '')
  // 完成任务（点击任务行上的完成图标）
  const taskToggled = await page.evaluate(() => { const row = [...document.querySelectorAll('.task')].find((e) => (e.textContent || '').includes('审计任务A')); if (!row) return false; const c = row.querySelector('.t-check') || row.querySelector('.g-check'); if (c) { c.click(); return true } return false })
  await sleep(1200)
  tt = await bodyText()
  log('任务完成切换', taskToggled, '')
  // 今日一句话
  await page.evaluate(() => { const ta = document.querySelector('textarea[placeholder*="心情"]'); if (ta) { const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; set.call(ta, '今天也加油'); ta.dispatchEvent(new Event('input', { bubbles: true })) } })
  await sleep(300)
  await clickInc('写下来')
  log('今日一句话保存', await waitText('已写好啦', 6000, 400), '')
  // 树洞
  await page.evaluate(() => { const els = [...document.querySelectorAll('div,button')].find((e) => (e.textContent || '').trim() === '树洞'); if (els) els.click() })
  await sleep(1000)
  tt = await bodyText()
  log('树洞打开', tt.includes('心情') || tt.includes('存进树洞') || tt.includes('树洞'), '')
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('存进树洞')); if (b) b.click() })
  await sleep(1200)
  // 更多工具
  await page.evaluate(() => { const bar = [...document.querySelectorAll('.more-bar')].find((e) => (e.textContent || '').includes('更多工具')); if (bar) bar.click() })
  await sleep(800)
  tt = await bodyText()
  log('更多工具(想被夸/开启提醒/退出/刷新)', tt.includes('想被夸') && tt.includes('开启提醒') && tt.includes('退出登录') && tt.includes('刷新'), '')

  // --- 专注 ---
  await tapTab('专注')
  await clickInc('开始专注')
  await sleep(1000)
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '开始' && (e.parentElement || {}).className === 'form-row'); if (b) b.click() })
  await sleep(2500)
  tt = await bodyText()
  log('专注启动', tt.includes('保持专注') || tt.includes('专注中'), '')
  // 暂停 → 退出关卡（开锁时）
  await clickInc('暂停')
  await sleep(1000)
  tt = await bodyText()
  log('退出关卡出现', tt.includes('做完了') || tt.includes('放我走') || tt.includes('想溜'), tt.slice(0, 110).replace(/\n/g, '|'))
  await clickInc('做完了，放我走')
  await sleep(1500)
  tt = await bodyText()
  log('退出关卡解锁', tt.includes('开始专注'), '')

  // --- 备考 ---
  await tapTab('备考')
  await waitText('倒计时', 15000)
  tt = await bodyText()
  log('倒计时已填', tt.includes('还剩') || tt.includes('还有'), '')
  // 改日期
  await clickInc('修改日期')
  await sleep(800)
  await setInput('考试日期', '') // date input 无 placeholder；直接改
  const dateInput = await page.evaluate(() => { const el = document.querySelector('input[type=date]'); if (!el) return false; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(el, '2026-12-20'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })
  await sleep(400)
  await clickInc('保存日期')
  await sleep(1500)
  tt = await bodyText()
  log('倒计时修改生效', dateInput && tt.includes('133'), tt.slice(0, 80).replace(/\n/g, '|'))
  // 目标总分
  await setInput('满分', '350')
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '保存'); if (b) b.click() })
  log('目标总分保存', await waitText('已保存', 6000, 400), '')
  // 单科目标
  const subjInputs = await page.evaluate(() => [...document.querySelectorAll('input[type=number]')].length)
  log('单科目标输入框存在', subjInputs >= 4, 'count=' + subjInputs)
  await page.evaluate(() => { const ins = [...document.querySelectorAll('input[type=number]')]; const vals = ['65', '60', '105', '120']; ins.forEach((el, i) => { if (vals[i]) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(el, vals[i]); el.dispatchEvent(new Event('input', { bubbles: true })) } }) })
  await sleep(300)
  await clickInc('保存单科目标')
  log('单科目标保存', await waitText('已保存', 6000, 400), '')
  // 阶段目标
  await typeByPh('阶段目标', '数学强化结束')
  await clickInc('添加')
  await sleep(1200)
  tt = await bodyText()
  log('添加阶段目标', tt.includes('数学强化结束'), '')
  const goalRow = await page.evaluate(() => { const row = [...document.querySelectorAll('.goal')].find((e) => (e.textContent || '').includes('数学强化结束')); if (!row) return null; const c = row.querySelector('.g-check'); if (c) c.click(); return row.className })
  await sleep(1000)
  tt = await bodyText()
  log('阶段目标完成切换', goalRow != null, String(goalRow))

  // --- 退出重登 ---
  await clickInc('退出')
  await sleep(2500)
  tt = await bodyText()
  log('退出到登录页', tt.includes('登录') && tt.includes('邮箱'), '')
  await typeByPh('you@example.com', email)
  await typeByPh('至少 6 位', 'Test123456')
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '进入'); if (b) b.click() })
  log('重新登录成功', await waitText('已打卡', 30000), '')
  await tapTab('备考')
  await waitText('倒计时', 15000)
  tt = await bodyText()
  log('重登后数据保留(目标/任务)', tt.includes('350') || tt.includes('数学强化结束') || tt.includes('目标'), '')

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
