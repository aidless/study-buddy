// capgo-prepare.mjs —— 构建 APK 前注入 Capgo API Key
// 用法：set CAPGO_API_KEY=你的Key && node scripts/capgo-prepare.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const key = process.env.CAPGO_API_KEY
if (!key) { console.error('缺少 CAPGO_API_KEY'); process.exit(1) }
const file = path.join(root, 'capacitor.config.json')
const cfg = JSON.parse(readFileSync(file, 'utf-8'))
cfg.plugins.CapacitorUpdater.apiKey = key
writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n')
console.log('API Key 已写入 capacitor.config.json（请勿提交到 git）')
