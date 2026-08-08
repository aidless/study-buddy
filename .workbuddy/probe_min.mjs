import puppeteer from 'puppeteer-core'
import { writeFileSync, appendFileSync } from 'node:fs'
const LOG = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/.workbuddy/probe.log'
const log = (s) => { appendFileSync(LOG, s + '\n'); process.stdout.write(s + '\n') }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let browser
try {
  writeFileSync(LOG, 'start\n')
  browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
  log('launched')
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  log('viewport set')
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 20000 })
  log('goto ok')
  await sleep(1500)
  const t = await page.evaluate(() => document.body.innerText.slice(0, 120))
  log('body: ' + t.replace(/\n/g, ' | '))
} catch (e) {
  log('ERR: ' + e.message.slice(0, 300))
} finally {
  if (browser) await browser.close()
  log('done')
}
process.exit(0)