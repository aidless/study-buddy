// rollback-update.mjs —— 一键回滚 OTA 版本
// 用法：set SB_SERVICE_ROLE=<service_role> && node scripts/rollback-update.mjs 0.1.1
// 把 latest.json 指回已存在的旧版本 zip（不删除任何包）
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const key = process.env.SB_SERVICE_ROLE
const URL = process.env.SB_URL || 'https://cfxsyvbxnmvmspklebfa.supabase.co'
const BUCKET = 'updates'
const version = process.argv[2]
if (!key || !version) { console.error('用法: set SB_SERVICE_ROLE=... && node scripts/rollback-update.mjs 0.1.1'); process.exit(1) }
const zipName = `study-buddy-${version}.zip`
const zipUrl = `${URL}/storage/v1/object/public/${BUCKET}/${zipName}`
const manifest = { version, url: zipUrl, checksum: '', note: 'rolled back', rollout: 100, publishedAt: new Date().toISOString() }
const api = async (method, url, body, headers = {}) => {
  const res = await fetch(url, { method, headers: { Authorization: 'Bearer ' + key, ...headers }, body })
  const text = await res.text()
  if (!res.ok) throw new Error(method + ' -> ' + res.status + ' ' + text.slice(0, 200))
  return text
}
await api('POST', `${URL}/storage/v1/object/${BUCKET}/latest.json`, JSON.stringify(manifest, null, 2), { 'Content-Type': 'application/json', 'x-upsert': 'true' })
console.log('已回滚到 v' + version + '，手机下次检查将退回该版本')
