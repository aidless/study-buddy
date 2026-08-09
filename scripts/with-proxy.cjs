// with-proxy.cjs —— 让 Node 全局 fetch 走本地代理（Capgo CLI 直连被墙时用）
// 用法：set NODE_OPTIONS=--require <本文件绝对路径> && npx capgo ...
const { ProxyAgent } = require('undici')
const agent = new ProxyAgent('http://127.0.0.1:7897')
const originalFetch = globalThis.fetch
globalThis.fetch = (input, init = {}) => originalFetch(input, { ...init, dispatcher: agent })
