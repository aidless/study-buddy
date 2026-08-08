// verify_progress_load.mjs —— 实测进度页渐进加载：骨架是否出现、主卡/深度分析渲染耗时、profiles 请求数
import puppeteer from 'puppeteer-core'

const URL = 'http://127.0.0.1:4173'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const EMAIL = process.env.PV_EMAIL || 'u-pv-1786159490551@example.com'
const PASS = 'Test123456'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844 })

let profileReqs = 0
page.on('request', (r) => { if (r.url().includes('/profiles?')) profileReqs++ })

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1000)
const type = async (txt, val) => {
  const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt)
  const el = h.asElement()
  if (!el) throw new Error('input not found: ' + txt)
  await el.click(); await el.type(val)
}
await type('you@example.com', EMAIL)
await type('至少 6 位', PASS)
const clicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('进入'))
  if (!el) return false
  el.click(); return true
})
if (!clicked) throw new Error('login button not found')
await page.waitForFunction(() => document.body.innerText.includes('今天还没打卡'), { timeout: 30000 })
await sleep(2000)

// 切到进度页并计时骨架出现/主卡/深度分析
const t0 = Date.now()
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === '进度')
  el && el.click()
})
let sawSkeleton = false, skeletonMs = null, readyMs = null, deepMs = null
for (let i = 0; i < 120; i++) {
  const state = await page.evaluate(() => ({
    skel: document.querySelectorAll('.skel').length,
    main: document.body.innerText.includes('连续天数'),
    deep: document.body.innerText.includes('知识雷达')
  }))
  if (state.skel > 0 && !sawSkeleton) { sawSkeleton = true; skeletonMs = Date.now() - t0 }
  if (state.main && readyMs == null) readyMs = Date.now() - t0
  if (state.deep && deepMs == null) deepMs = Date.now() - t0
  if (state.main && state.deep) break
  await sleep(80)
}

const text = await page.evaluate(() => document.body.innerText)
const keys = ['学习进度', '连续天数', '今日专注', '累计专注', '知识雷达', '自测正确率', '离岸线', '本周小结', '今日推荐']
console.log('骨架屏出现: ' + (sawSkeleton ? `是（点击后 ${skeletonMs}ms）` : '未捕获（数据可能瞬间就绪）'))
console.log('主卡渲染: ' + (readyMs != null ? `是（点击后 ${readyMs}ms）` : '否（20s 内未完成）'))
console.log('深度分析渲染: ' + (deepMs != null ? `是（点击后 ${deepMs}ms）` : '否（20s 内未完成）'))
console.log('profiles 请求数: ' + profileReqs + '（此前 11 个查询各发 1 次）')
console.log('关键文本:')
for (const k of keys) console.log('  ' + (text.includes(k) ? '✓' : '✗') + ' ' + k)
const skelNow = await page.evaluate(() => document.querySelectorAll('.skel').length)
console.log('加载完成后残留骨架元素: ' + skelNow)
await browser.close()
