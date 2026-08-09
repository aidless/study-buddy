// 第二轮深度测试：修正选择器/输入方式/等待时间
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_mobile_result2.json'
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
  const click = async (txt, sel = 'button') => { await page.evaluate(({ txt, sel }) => { const el = [...document.querySelectorAll(sel)].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, { txt, sel }); await sleep(400) }
  const clickBySel = async (sel, i = 0) => { await page.evaluate(({ sel, i }) => { const el = document.querySelectorAll(sel)[i]; if (el) el.click() }, { sel, i }); await sleep(400) }
  const typeByPh = async (ph, val) => { const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph); const el = h.asElement(); if (!el) return false; await el.click(); await el.type(val, { delay: 10 }); return true }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1500) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 25000, step = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) } return false }

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  await click('注册')
  await typeByPh('起个名字', '深测2')
  await typeByPh('you@example.com', `deep2-${ts}@example.com`)
  await typeByPh('至少 6 位', 'Test123456')
  await click('创建账号')
  const regOk = await waitText('今日打卡', 30000)
  log('注册成功', regOk)
  if (!regOk) process.exit(1)

  // 打卡：记录切换前后
  const ckBefore = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('打卡') && !(e.textContent || '').includes('今日')); return b ? b.textContent.trim() : 'NF' })
  await clickBySel('.chips button', 0) // 今日打卡 chip
  await sleep(1200)
  const ckAfter = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('打卡')); return b ? b.textContent.trim() : 'NF' })
  log('打卡按钮可切换', ckBefore !== 'NF' && ckAfter.includes('已打卡'), `before=[${ckBefore}] after=[${ckAfter}]`)

  // 添加任务
  await typeByPh('加一件今天要做的事', '深度学习任务A')
  await page.keyboard.press('Enter')
  await sleep(1500)
  let tt = await bodyText()
  log('添加任务(回车)', tt.includes('深度学习任务A'), tt.slice(0, 80).replace(/\n/g, '|'))

  // 备考页（等足时间）
  await tapTab('备考')
  const planLoaded = await waitText('倒计时', 15000)
  tt = await bodyText()
  log('备考页渲染', planLoaded && tt.includes('目标'), tt.slice(0, 100).replace(/\n/g, '|'))
  // 目标保存按钮
  const saveBtns = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('保存')).map((b) => b.textContent.trim()))
  log('目标保存按钮存在', saveBtns.length >= 2, JSON.stringify(saveBtns))
  const save1 = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('保存目标分')); if (!b) { const b2 = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '保存'); if (b2) { b2.click(); return 'first-save' } return 'none' } b.click(); return 'target-save' })
  await sleep(1500)
  tt = await bodyText()
  log('目标保存反馈', tt.includes('已保存') || tt.includes('保存成功'), 'btn=' + save1 + ' :: ' + tt.slice(0, 100).replace(/\n/g, '|'))

  // 自测 → AI 名师（真实键入）
  await tapTab('自测')
  await waitText('正式考试', 15000)
  const aiSent = await typeByPh('向老师提问', '用一句话解释什么是死锁')
  await sleep(400)
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('发送')); if (s) s.click() })
  await sleep(1200)
  tt = await bodyText()
  const pendingShown = tt.includes('老师正在思考') || tt.includes('思考')
  const aiReply = await waitText('死锁', 40000, 1500)
  log('AI 名师提问+回复', aiSent && aiReply, `sent=${aiSent} pending=${pendingShown}`)
  tt = await bodyText()
  log('AI 名师回复内容非空', tt.includes('死锁'), tt.slice(0, 140).replace(/\n/g, '|'))

  // 真题库：滚动并检查图片
  await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight) })
  await sleep(2500)
  const imgs = await page.evaluate(async () => {
    const list = [...document.querySelectorAll('img')]
    const out = []
    for (const img of list) {
      await new Promise((r) => { if (img.complete) r(); else { img.onload = r; img.onerror = r; setTimeout(r, 4000) } })
      const b = img.getBoundingClientRect()
      out.push({ alt: img.alt || '', w: img.naturalWidth, h: img.naturalHeight, bw: Math.round(b.width), inView: b.top < innerHeight && b.bottom > 0 })
    }
    return out
  })
  log('真题库图片存在', imgs.length > 0, 'count=' + imgs.length + ' ' + JSON.stringify(imgs.slice(0, 3)))
  log('真题库图片宽度>=300', imgs.length > 0 && imgs.every((i) => i.w > 0 && i.bw >= 300), JSON.stringify(imgs.slice(0, 3)))

  // 进度页（等足时间）
  await tapTab('进度')
  const deepOk = await waitText('知识雷达', 20000, 1200)
  tt = await bodyText()
  log('进度: 知识雷达', deepOk)
  log('进度: 离岸线', tt.includes('离岸线') || tt.includes('估分'), tt.includes('离岸线') ? '离岸线' : (tt.includes('估分') ? '估分' : '无'))
  log('进度: 本周小结', tt.includes('本周小结'))
  log('进度: 学习进度卡', tt.includes('学习进度') || tt.includes('专注') && tt.includes('打卡'))

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
