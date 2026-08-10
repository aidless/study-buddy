// publish-update.mjs —— 发布新版本到自建更新服务（Supabase Storage）
// 用法：set SB_SERVICE_ROLE=<service_role> && node scripts/publish-update.mjs [版本号]
// 缺省版本号在 package.json 基础上 +0.0.1
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync, createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const key = process.env.SB_SERVICE_ROLE
if (!key) { console.error('缺少 SB_SERVICE_ROLE 环境变量'); process.exit(1) }
const URL = process.env.SB_URL || 'https://cfxsyvbxnmvmspklebfa.supabase.co'
const BUCKET = 'updates'

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8'))
let [maj, min, pat] = (pkg.version || '0.1.0').split('.').map(Number)
const version = (process.argv[2] || `${maj}.${min}.${pat + 1}`).replace(/--rollout.*$/, '')
const rolloutArg = process.argv.find((a) => a.startsWith('--rollout'))
const rollout = rolloutArg ? Number(rolloutArg.split('=')[1] || 100) : 100

console.log('1/4 构建 dist …')
execSync('npm run build', { cwd: root, stdio: 'inherit' })

console.log('2/4 打包 dist → study-buddy-' + version + '.zip')
const dist = path.join(root, 'dist')
const zipPath = path.join(root, 'deploy', `study-buddy-${version}.zip`)
const py = os.platform() === 'win32' ? 'python' : 'python3'
execSync(`${py} ${JSON.stringify(path.join(root, 'scripts', 'make_zip.py'))} ${JSON.stringify(dist)} ${JSON.stringify(zipPath)}`, { stdio: 'inherit' })
execSync(`${py} ${JSON.stringify(path.join(root, 'scripts', 'check_zip.py'))} ${JSON.stringify(zipPath)}`, { stdio: 'inherit' })
const checksum = createHash('sha256').update(readFileSync(zipPath)).digest('hex')
const zipName = `study-buddy-${version}.zip`
const zipUrl = `${URL}/storage/v1/object/public/${BUCKET}/${zipName}`
console.log('   checksum:', checksum)

const api = async (method, url, body, headers = {}) => {
  const res = await fetch(url, { method, headers: { Authorization: 'Bearer ' + key, ...headers }, body })
  const text = await res.text()
  if (!res.ok) throw new Error(method + ' ' + url.split('/').slice(-2).join('/') + ' -> ' + res.status + ' ' + text.slice(0, 200))
  return text
}

console.log('3/4 上传到 Supabase Storage …')
// 确保桶存在且公开
await api('POST', `${URL}/storage/v1/bucket`, JSON.stringify({ id: BUCKET, name: BUCKET, public: true }), { 'Content-Type': 'application/json' }).catch(() => {})
await api('PUT', `${URL}/storage/v1/bucket/${BUCKET}`, JSON.stringify({ public: true }), { 'Content-Type': 'application/json' }).catch(() => {})
// 上传 zip
await api('POST', `${URL}/storage/v1/object/${BUCKET}/${zipName}`, readFileSync(zipPath), { 'Content-Type': 'application/zip', 'x-upsert': 'true' })
// 上传 latest.json
const manifest = { version, url: zipUrl, checksum, note: '', rollout, publishedAt: new Date().toISOString() }
await api('POST', `${URL}/storage/v1/object/${BUCKET}/latest.json`, JSON.stringify(manifest, null, 2), { 'Content-Type': 'application/json', 'x-upsert': 'true' })

console.log('4/4 发布完成: v' + version + ' → ' + zipUrl)
console.log('manifest:', JSON.stringify(manifest))
