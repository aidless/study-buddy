import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/couple3.log'
const log = (s) => appendFileSync(LOG, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  page.on('console', (m) => { if (m.type() === 'error') log('[c] ' + m.text().slice(0, 300) + '\n') })
  page.on('dialog', async (d) => { log('[dialog] ' + d.message() + '\n'); await d.accept() })
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await sleep(1000)
  const ts = Date.now()
  const click = async (txt) => { await page.evaluate((txt) => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(txt)); el && el.click() }, txt) }
  const type = async (sel, txt, val) => { const h = await page.evaluateHandle((sel, txt) => [...document.querySelectorAll(sel)].find((e) => (e.placeholder || '').includes(txt)) || null, sel, txt); const el = h.asElement(); if (!el) return 'NF'; await el.click(); await el.type(val); return 'ok' }
  const waitTextarea = async (timeoutMs) => {
    const t0 = Date.now()
    while (Date.now() - t0 < timeoutMs) {
      const el = await page.evaluate(() => [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')) || null)
      if (el) return true
      await sleep(500)
    }
    return false
  }
  // 学员
  await click('注册'); await sleep(400)
  await type('input', '起个名字', '她3'); await type('input', 'you@example.com', `she3-${ts}@example.com`); await type('input', '至少 6 位', 'Test123456')
  await click('创建账号')
  const taReady = await waitTextarea(25000)
  log('student textarea ready: ' + taReady + '\n')
  if (!taReady) process.exit(1)
  const tel = await page.evaluateHandle(() => [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')))
  const te = tel.asElement()
  await te.click()
  await page.keyboard.type('今天数学卡住了，但没放弃', { delay: 20 })
  await sleep(400)
  const before = await page.evaluate(() => { const ta = [...document.querySelectorAll('textarea')].find((e) => (e.placeholder || '').includes('写一句')); return ta ? ta.value : null })
  log('before save value: ' + JSON.stringify(before) + '\n')
  await click('写下来')
  await sleep(2500)
  const t1 = await page.evaluate(() => document.body.innerText)
  log('after save err: ' + t1.includes('保存失败') + ' savedBtn: ' + t1.includes('已写好啦') + '\n')
  await click('邀请码'); await sleep(700)
  const code = await page.evaluate(() => { const d = document.querySelector('.code-display'); return d ? d.textContent.trim() : '' })
  await page.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('关闭')); el && el.click() })
  log('code: ' + code + '\n')
  // 督学
  await click('退出'); await sleep(1500)
  await click('注册'); await sleep(400)
  await page.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes('督学（你）')); el && el.click() })
  await sleep(400)
  await type('input', '向学员索要', code)
  await type('input', '起个名字', '他3'); await type('input', 'you@example.com', `he3-${ts}@example.com`); await type('input', '至少 6 位', 'Test123456')
  await click('创建账号')
  let ok = false
  for (let i = 0; i < 15; i++) { await sleep(2000); const t = await page.evaluate(() => document.body.innerText); if (t.includes('远程陪伴')) { ok = true; break } }
  if (!ok) { log('HE REG FAIL\n'); process.exit(1) }
  await sleep(3500)
  const t2 = await page.evaluate(() => document.body.innerText)
  log('supervisor sees word: ' + t2.includes('今天数学卡住了，但没放弃') + '\n')
  log('sv: ' + (t2.match(/今日一句话[\s\S]{0,120}/) || [''])[0].replace(/\n/g, ' | ') + '\n')
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300) + '\n')
} finally {
  if (browser) await browser.close()
}
process.exit(0)
