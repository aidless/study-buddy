// 云函数：考研督学 Supabase 代理（可选，用于云端同步）
// 用法：
//   1. 微信开发者工具开通云开发，创建环境后右键本目录「上传并部署：云端安装依赖」
//   2. 在云开发控制台 → 云函数 → proxy → 配置环境变量：
//      SUPABASE_URL=https://xxx.supabase.co
//      SUPABASE_ANON_KEY=eyJ...
//   3. 小程序端将 utils/db.js 的云开关 USE_CLOUD 置为 true
// 说明：小程序 request 域名必须备案，Supabase 是国外域名无法直接连；
//       通过云函数转发可绕过（云函数由微信侧发起请求，不受小程序域名白名单限制）。
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

exports.main = async (event) => {
  const { path = '', method = 'GET', body = null } = event
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { error: 'cloud_not_configured', message: '请在云函数环境变量配置 SUPABASE_URL / SUPABASE_ANON_KEY' }
  }
  const url = SUPABASE_URL + '/rest/v1/' + path
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
  // 若小程序端传了用户 JWT（微信登录后换发），优先使用它做行级权限
  if (event.accessToken) headers.Authorization = 'Bearer ' + event.accessToken
  const res = await new Promise((resolve) => {
    const req = require('https').request(url, { method, headers }, (r) => {
      let data = ''
      r.on('data', (c) => (data += c))
      r.on('end', () => resolve({ status: r.statusCode, data }))
    })
    req.on('error', (e) => resolve({ status: 0, data: String(e) }))
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
  return { status: res.status, body: res.data }
}
