// bump-version.mjs —— 统一版本号（web 包 / OTA / Android native 三处联动）
// 用法：node scripts/bump-version.mjs 0.2.0
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const next = process.argv[2]
if (!next || !/^\d+\.\d+\.\d+$/.test(next)) { console.error('用法: node scripts/bump-version.mjs 0.2.0'); process.exit(1) }

// package.json
const pkgPath = path.join(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
pkg.version = next
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// capacitor.config.json（OTA 版本）
const cfgPath = path.join(root, 'capacitor.config.json')
const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
cfg.plugins.CapacitorUpdater.version = next
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n')

// android/app/build.gradle（versionCode +1, versionName）
const gPath = path.join(root, 'android', 'app', 'build.gradle')
let g = readFileSync(gPath, 'utf-8')
const vc = g.match(/versionCode\s+(\d+)/)
const nextCode = vc ? Number(vc[1]) + 1 : 2
g = g.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`)
g = g.replace(/versionName\s+"[^"]+"/, `versionName "${next}"`)
writeFileSync(gPath, g)

console.log(`版本已统一为 ${next}（versionCode ${nextCode}）`)
