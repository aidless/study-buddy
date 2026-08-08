// shot_preview.mjs —— 本地 preview 走查截图（注册测试学员 → 今日 / 进度 / 备考）
// 用法：npm run preview（127.0.0.1:4173）后 node .workbuddy/shot_preview.mjs
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const URL = 'http://127.0.0.1:4173'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = 'C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy-preview'
mkdirSync(OUT, { recursive: true })

const ts = Date.now()
const EMAIL = `u-pv-${ts}@example.com`
const PASS = 'Test123456'
const NAME = '测试学员'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })

const clickByText = async (txt, tag = 'button') => {
  const el = await page.$x(`//${tag}[contains(text(),'${txt}')]`)
  if (!el.length) throw new Error('element not found: ' + txt)
  await el[0].click()
}
const typeByPlaceholder = async (txt, val) => {
  const el = await page.$x(`//input[contains(@placeholder,'${txt}')]`)
  if (!el.length) throw new Error('input not found: ' + txt)
  await el[0].click()
  await el[0].type(val)
}

// 1) 登录页（默认登录 tab）
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1200)
await page.screenshot({ path: path.join(OUT, '01-login.png') })

// 2) 切到注册并填写（学员角色为默认）
await clickByText('注册')
await sleep(400)
await typeByPlaceholder('起个名字', NAME)
await typeByPlaceholder('you@example.com', EMAIL)
await typeByPlaceholder('至少 6 位', PASS)
await sleep(300)
await page.screenshot({ path: path.join(OUT, '02-register-filled.png') })

// 3) 创建账号 → 今日页
await clickByText('创建账号')
await page.waitForFunction(() => document.body.innerText.includes('今天还没打卡'), { timeout: 30000 })
await sleep(2500)
await page.screenshot({ path: path.join(OUT, '03-today.png') })

// 4) 进度页：先立刻截（可能是骨架屏），再等主卡渲染后截最终
await clickByText('进度')
await sleep(180)
await page.screenshot({ path: path.join(OUT, '04-progress-early.png') })
await page.waitForFunction(() => document.body.innerText.includes('连续天数'), { timeout: 15000 })
await sleep(2500)
await page.screenshot({ path: path.join(OUT, '05-progress.png') })

// 5) 备考页
await clickByText('备考')
await sleep(2200)
await page.screenshot({ path: path.join(OUT, '06-plan.png') })

console.log('OK email=' + EMAIL)
console.log('screenshots -> ' + OUT)
if (errs.length) { console.log('PAGE ERRORS:'); errs.slice(0, 12).forEach((e) => console.log(e)) } else { console.log('no page errors') }
await browser.close()
