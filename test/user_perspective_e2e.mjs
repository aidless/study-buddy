// user_perspective_e2e.mjs 鈥斺€?鐢ㄦ埛瑙嗚鍏ㄥ姩绾挎祴璇曪紙濂?+ 浠栵級
// 涓嶆祴鎺ュ彛锛屽彧璧扮湡瀹?UI锛氶寮€绌烘€?鈫?浠婃棩涓€鍙ヨ瘽 鈫?鏍戞礊 鈫?鎵撳崱 鈫?杩涘害绌烘€?鈫?// 棰樺簱鐪嬮 鈫?璇曞嵎妯″紡浜ゅ嵎 鈫?璁拌嚜娴?鈫?鎮勬倓璇濓紱鐫ｅ绔叏绋嬫梺瑙傞獙璇侀櫔浼撮摼璺€?import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const URL = 'http://127.0.0.1:4173'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const SHOTS = 'C:/Users/Administrator/AppData/Roaming/haolo_desktop/thread-groups/default/绉戠爺/outputs/user-e2e'
mkdirSync(SHOTS, { recursive: true })

const ts = Date.now()
const EMAIL_STU = `u-stu-${ts}@example.com`
const EMAIL_SUP = `u-sup-${ts}@example.com`
const PASS = 'Test123456'
const WORD = '浠婂ぉ鏁板鍗′綇浜嗭紝浣嗘病鏀惧純'
const TREE = '濂界疮锛屼絾杩樿兘鍐嶅鍗婂皬鏃?
const MSG = `鐢ㄦ埛瑙嗚娑堟伅-${ts}`
const REPLY = `鐢ㄦ埛瑙嗚鍥炲-${ts}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const pageErrors = []
const shots = []
const ok = (name, pass, extra = '') => {
  results.push({ name, pass: !!pass, extra })
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' :: ' + extra : ''))
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',