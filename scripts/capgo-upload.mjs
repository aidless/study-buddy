// capgo-upload.mjs —— 构建并上传新版到 Capgo（手机自动热更新）
// 用法：set CAPGO_API_KEY=你的Key && node scripts/capgo-upload.mjs [版本号]
// 版本号缺省自动 +0.0.1（基于 package.json）
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiKey = process.env.CAPGO_API_KEY || process.env.CAPGO_TOKEN
if (!apiKey) {
  console.error('缺少 CAPGO_API_KEY 环境变量（Capgo 控制台 App → API Key）')
  process.exit(1)
}
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8'))
let [maj, min, pat] = (pkg.version || '0.1.0').split('.').map(Number)
const next = process.argv[2] || `${maj}.${min}.${pat + 1}`
pkg.version = next
writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

console.log('1/3 构建 dist（版本 ' + next + '）…')
execSync('npm run build', { cwd: root, stdio: 'inherit' })

console.log('2/3 写入 capacitor 版本…')
const cfg = JSON.parse(readFileSync(path.join(root, 'capacitor.config.json'), 'utf-8'))
cfg.plugins.CapacitorUpdater.version = next
writeFileSync(path.join(root, 'capacitor.config.json'), JSON.stringify(cfg, null, 2) + '\n')

console.log('3/3 上传到 Capgo production 渠道…')
execSync(`npx capgo bundle upload com.haolo.studybuddy -a ${apiKey} -p dist -c production`, { cwd: root, stdio: 'inherit' })
console.log('上传完成，手机下次打开 App 会自动更新到 ' + next)
