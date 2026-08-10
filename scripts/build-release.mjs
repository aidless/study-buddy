// build-release.mjs —— 企业级发布构建（多环境 + 正式签名 + OTA 版本）
// 用法：node scripts/build-release.mjs [env]   env=production|staging，默认 production
// 前置：android/keystore.properties 存在（正式签名），否则退化为 debug 签名构建
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = process.argv[2] || 'production'
const envFile = path.join(root, `.env.${env}`)
if (!existsSync(envFile)) { console.error(`缺少环境文件 ${envFile}（参考 .env.example）`); process.exit(1) }
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8'))
const v = pkg.version

console.log(`[build-release] env=${env} version=${v}`)
// 载入环境变量（VITE_* 注入前端构建）
const envVars = {}
for (const line of readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (m) envVars[m[1]] = m[2].replace(/^"|"$/g, '')
}
Object.assign(process.env, envVars)

console.log('1/4 vite build (web)')
execSync('npm run build', { cwd: root, stdio: 'inherit', env: process.env })
console.log('2/4 cap sync android')
execSync('npx cap sync android', { cwd: root, stdio: 'inherit' })
console.log('3/4 gradle assembleRelease')
execSync('./gradlew.bat assembleRelease --console=plain', { cwd: path.join(root, 'android'), stdio: 'inherit', env: process.env })
const apk = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
if (!existsSync(apk)) { console.error('release APK 未生成'); process.exit(1) }
console.log('4/4 完成: ' + apk)
