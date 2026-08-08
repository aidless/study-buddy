import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/subject_verify.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) log('[c] ' + m.text().slice(0, 250) + '\n') })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(800)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (txt, val) => { const h = await page.evaluateHandle((txt) => [...document.querySelectorAll('input')].find((e) => (e.placeholder || '').includes(txt)) || null, txt); const el = h.asElement(); if (!el) return; await el.click(); await el.type(val) }
  const tapTab = async (label) => { await page.evaluate((label) => { const el = [...document.querySelectorAll('.tabs button')].find((e) => (e.textContent || '').trim() === label); el && el.click() }, label) }
  await click('注册'); await sleep(300)
  await type('起个名字', '科测'); await type('you@example.com', `subj-${ts}@example.com`); await type('至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('今日打卡')) { ok = true; break } }
  log('registered: ' + ok + '\n')
  await tapTab('自测')
  await sleep(4000)
  let t = await page.evaluate(() => document.body.innerText)
  log('自测页科目 chips: ' + (t.includes('408 统考') && t.includes('英语一') && t.includes('数学一') ? 'OK' : 'FAIL') + '\n')
  // 英语一
  await click('英语一')
  await sleep(2500)
  t = await page.evaluate(() => document.body.innerText)
  log('英语一自测: ' + (t.includes('英语一自测') && t.includes('作文') ? 'OK' : 'FAIL') + '\n')
  await click('浏览全部题目')
  await sleep(1200)
  t = await page.evaluate(() => document.body.innerText)
  log('英语作文列表: ' + (t.includes('小作文') && t.includes('大作文') ? 'OK' : 'FAIL') + '\n')
  await click('看参考答案')
  await sleep(600)
  t = await page.evaluate(() => document.body.innerText)
  log('作文范文显示: ' + (t.includes('Dear') ? 'OK' : 'FAIL') + '\n')
  await click('写/做得不错')
  await sleep(1200)
  t = await page.evaluate(() => document.body.innerText)
  log('自评已记入: ' + (t.includes('已记入自测') ? 'OK' : 'FAIL') + '\n')
  // 数学一
  await click('数学一')
  await sleep(2000)
  t = await page.evaluate(() => document.body.innerText)
  log('数学一自测: ' + (t.includes('数学一自测') && t.includes('解答题') ? 'OK' : 'FAIL') + '\n')
  await click('浏览全部题目')
  await sleep(1200)
  t = await page.evaluate(() => document.body.innerText)
  log('数学解答列表: ' + (t.includes('高数') || t.includes('线代') || t.includes('概率') ? 'OK' : 'FAIL') + '\n')
  // 随机抽测（英语一）
  await click('英语一')
  await sleep(2000)
  await click('随机抽测')
  await sleep(2000)
  t = await page.evaluate(() => document.body.innerText)
  log('随机抽测打开: ' + (t.includes('章节测试') || t.includes('第 1/') ? 'OK' : 'FAIL') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
