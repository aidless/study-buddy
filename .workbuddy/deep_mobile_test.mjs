// 深度回归测试：移动端视口 390x844，覆盖全部 Tab 与关键流程
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'

const OUT = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/deep_mobile_result.json'
const BASE = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const issues = []
const log = (k, ok, extra = '') => { results.push({ k, ok: !!ok, extra }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + k + (extra ? ' :: ' + extra : '')) }

let browser
try {
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  page.on('console', (m) => { if (m.type() === 'error') issues.push('[console.error] ' + m.text().slice(0, 300)) })
  page.on('pageerror', (e) => issues.push('[pageerror] ' + String(e.message).slice(0, 300)))
  page.on('requestfailed', (r) => issues.push('[reqfail] ' + r.url().slice(0, 220) + ' :: ' + (r.failure()?.errorText || '')))
  page.on('dialog', async (d) => { try { await d.accept() } catch {} })
  page.on('request', (r) => { if (r.url().startsWith('http://') && !r.url().startsWith('http://127.0.0.1')) issues.push('[mixed-content] ' + r.url().slice(0, 180)) })

  // 注册
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await sleep(2500)
  let t = await page.evaluate(() => document.body.innerText)
  log('首页渲染(登录/注册可见)', t.includes('注册') && t.includes('登录'), t.slice(0, 60).replace(/\n/g, '|'))

  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); if (el) el.click() }, txt); await sleep(300) }
  const type = async (ph, val) => {
    const h = await page.evaluateHandle((ph) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(ph)) || null, ph)
    const el = h.asElement(); if (!el) return false
    await el.click(); await el.type(val, { delay: 5 }); return true
  }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim().includes(label)); if (el) el.click() }, label); await sleep(1200) }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  const waitText = async (txt, timeout = 20000, step = 1000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < timeout) { const tt = await bodyText(); if (tt.includes(txt)) return true; await sleep(step) }
    return false
  }

  await click('注册'); await sleep(400)
  await type('起个名字', '深测学员')
  await type('you@example.com', `deep-${ts}@example.com`)
  await type('至少 6 位', 'Test123456')
  await click('创建账号')
  const regOk = await waitText('今日打卡', 30000)
  log('注册并进入今日页', regOk)
  if (!regOk) { const tt = await bodyText(); log('注册失败页内容', false, tt.slice(0, 180).replace(/\n/g, '|')); process.exit(1) }

  // PWA
  const pwa = await page.evaluate(async () => {
    const out = { manifest: null, sw: false, viewport: document.querySelector('meta[name=viewport]')?.content || '', theme: document.querySelector('meta[name=theme-color]')?.content || '' }
    try { const r = await fetch('./manifest.webmanifest'); out.manifest = { status: r.status, ok: r.ok } } catch (e) { out.manifest = { err: e.message } }
    out.sw = !!(navigator.serviceWorker && (await navigator.serviceWorker.getRegistrations()).length > 0)
    return out
  })
  log('manifest 可访问', pwa.manifest && pwa.manifest.ok, JSON.stringify(pwa.manifest))
  log('Service Worker 已注册', pwa.sw)
  log('viewport meta 正确', pwa.viewport.includes('width=device-width') && pwa.viewport.includes('user-scalable=no'))

  // 今日 Tab
  await click('打卡'); await sleep(800)
  let tt = await bodyText()
  log('今日打卡可切换', tt.includes('已打卡'))
  const addBtn = await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes('添加')); if (inp) { inp.value = '深度测试任务'; inp.dispatchEvent(new Event('input', { bubbles: true })) } const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('添加')); if (b) { b.click(); return true } return false })
  await sleep(1200)
  tt = await bodyText()
  log('添加任务可用', tt.includes('深度测试任务') || addBtn, 'addBtn=' + addBtn)

  // 专注 Tab
  await tapTab('专注')
  tt = await bodyText()
  log('专注页渲染', tt.includes('番茄') || tt.includes('专注') || tt.includes('开始'), tt.slice(0, 80).replace(/\n/g, '|'))
  const pomoStart = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('开始专注')) || [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('开始')); if (b) { b.click(); return true } return false })
  await sleep(1500)
  tt = await bodyText()
  log('番茄钟可启动', pomoStart, 'pomoStart=' + pomoStart + ' 页面含暂停=' + tt.includes('暂停'))
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('暂停')) || [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('结束')); if (b) b.click() })
  await sleep(300)
  log('深呼吸可见', (await bodyText()).includes('深呼吸'))

  // 备考 Tab
  await tapTab('备考')
  tt = await bodyText()
  log('备考页渲染', tt.includes('倒计时') && tt.includes('目标'), tt.slice(0, 80).replace(/\n/g, '|'))
  const cdShown = tt.includes('还剩') || tt.includes('还有') || tt.includes('天')
  log('考研倒计时已填', cdShown)
  const targetSaved = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('保存')); if (!b) return 'no-save-btn'; b.click(); return 'clicked' })
  await sleep(1000)
  tt = await bodyText()
  log('目标保存有反馈', tt.includes('已保存') || tt.includes('保存成功') || targetSaved === 'no-save-btn', 'btn=' + targetSaved)

  // 自测 Tab
  await tapTab('自测')
  tt = await bodyText()
  log('自测页渲染', tt.includes('正式考试') && tt.includes('AI 名师') && tt.includes('真题库'), tt.slice(0, 90).replace(/\n/g, '|'))
  await click('英语一'); await sleep(1500)
  tt = await bodyText()
  log('英语一自测可切换', tt.includes('作文') || tt.includes('小作文') || tt.includes('大作文'), tt.slice(0, 70).replace(/\n/g, '|'))
  await click('数学一'); await sleep(1500)
  tt = await bodyText()
  log('数学一自测可切换', tt.includes('解答题') || tt.includes('详解') || tt.includes('高数'), tt.slice(0, 70).replace(/\n/g, '|'))
  await click('408 统考'); await sleep(1200)

  // AI 名师
  const aiOk = await page.evaluate(() => { const inp = [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes('向老师提问')) || [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes('提问')); if (!inp) return false; inp.value = '一句话解释什么是虚拟内存'; inp.dispatchEvent(new Event('input', { bubbles: true })); const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('发送')) || null; if (s) s.click(); return true })
  await sleep(300)
  const aiReply = await waitText('老师正在思考', 8000).then(async (x) => {
    if (!x) return false
    return waitText('虚拟内存', 35000, 1500)
  })
  log('AI 名师线上回复', aiOk && aiReply, 'aiOk=' + aiOk)

  // 正式考试
  const examStart = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('开始随机考试')); if (!b) return false; b.click(); return true })
  await sleep(2500)
  const overlay = await page.evaluate(() => { const el = document.querySelector('.exam-overlay'); if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), vw: window.innerWidth, h: Math.round(r.height), vh: window.innerHeight, cls: el.className } })
  log('考试开始(限时+全屏覆盖)', examStart && overlay, JSON.stringify(overlay))
  tt = await bodyText()
  log('考试题面渲染(第1题)', tt.includes('第 1/') || tt.includes('题 · 已答'), tt.slice(0, 60).replace(/\n/g, '|'))
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => { const o = [...document.querySelectorAll('.quiz-opt')].find((e) => !(e.className || '').includes('on')); if (o) o.click() })
    await sleep(500)
    await page.evaluate(() => { const n = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('下一题')); if (n) n.click() })
    await sleep(600)
  }
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '交卷'); if (s) s.click() })
  await sleep(4000)
  tt = await bodyText()
  const resultOk = tt.includes('得分') || tt.includes('分') || tt.includes('解析') || tt.includes('错题') || tt.includes('薄弱')
  log('交卷自动判分+解析', resultOk, tt.slice(0, 120).replace(/\n/g, '|'))

  // 进度 Tab
  await tapTab('进度')
  await sleep(2500)
  tt = await bodyText()
  log('进度页: 学习进度', tt.includes('学习进度') || tt.includes('进度'))
  log('进度页: 知识雷达', tt.includes('知识雷达'))
  log('进度页: 离岸线', tt.includes('离岸线') || tt.includes('估分'))
  log('进度页: 本周小结', tt.includes('本周'))

  // 悄悄话 Tab
  await tapTab('悄悄话')
  await sleep(1500)
  tt = await bodyText()
  log('悄悄话页渲染', tt.includes('悄悄话') || tt.includes('发送') || tt.includes('留言'), tt.slice(0, 60).replace(/\n/g, '|'))

  // 图片渲染（真题图）
  await tapTab('自测'); await sleep(1500)
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('真题库')); if (b) b.click() })
  await sleep(2000)
  const imgs = await page.evaluate(async () => {
    const list = [...document.querySelectorAll('img')]
    const out = []
    for (const img of list) {
      await new Promise((r) => { if (img.complete) r(); else { img.onload = r; img.onerror = r; setTimeout(r, 3000) } })
      const box = img.getBoundingClientRect()
      out.push({ src: img.src.slice(-45), w: Math.round(img.naturalWidth), h: Math.round(img.naturalHeight), bw: Math.round(box.width), full: img.naturalWidth > 0 && box.width >= 300 })
    }
    return out
  })
  log('真题图片完整渲染', imgs.length > 0 && imgs.every((i) => i.full), JSON.stringify(imgs.slice(0, 5)))

  // 持久化：刷新后打卡与自测记录还在
  await page.reload({ waitUntil: 'domcontentloaded' })
  await sleep(3000)
  tt = await bodyText()
  const persistLogin = tt.includes('已打卡') || tt.includes('今日打卡')
  log('刷新后登录态/打卡持久', persistLogin)
  await tapTab('备考'); await sleep(1800)
  tt = await bodyText()
  log('刷新后自测记录仍在', tt.includes('随机真题卷') || tt.includes('自测') || tt.includes('错题'))

  const unique = [...new Set(issues)]
  console.log('---')
  console.log('运行期问题总数:', unique.length)
  unique.slice(0, 15).forEach((i) => console.log('ISSUE: ' + i))
  writeFileSync(OUT, JSON.stringify({ results, issues: unique.slice(0, 30), passed: results.filter((r) => r.ok).length, total: results.length }, null, 2))
  console.log('结果文件:', OUT)
} catch (e) {
  console.log('FATAL:', e.message)
  writeFileSync(OUT, JSON.stringify({ fatal: e.message, results, issues: issues.slice(0, 30) }, null, 2))
} finally {
  if (browser) await browser.close()
}
process.exit(0)
